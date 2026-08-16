import { supabase } from '../../supabase';
import { notifyUser } from './notificationService';

/**
 * commission_pct / driver_flat_rate_per_pickup default to 0 in the database
 * (see docs/migrations/005_dispatch_payments_and_polish.sql) — the team
 * never gave real numbers for these, so nothing here invents one. At 0,
 * restaurants get 100% of gross value and drivers get nothing, which is a
 * safe default, not silently wrong money.
 */
export async function getPlatformSettings() {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? { commission_pct: 0, driver_flat_rate_per_pickup: 0, manufacturer_markup_pct: 10 };
}

export async function updatePlatformSettings(settingsId, payload) {
  const { data, error } = await supabase
    .from('platform_settings')
    .update(payload)
    .eq('id', settingsId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function getRateForGrade(grade) {
  if (!grade) return 0;

  const { data, error } = await supabase
    .from('market_rates')
    .select('rate_per_liter')
    .eq('grade', grade)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return Number(data?.rate_per_liter ?? 0);
}

/**
 * The base "value of the oil" (volume x market rate for the grade) that the
 * restaurant/driver payout pool is drawn from. What the manufacturer actually
 * pays (that value + platform_settings.manufacturer_markup_pct) is computed
 * server-side in supabase/functions/payfast-checkout — never trust a
 * client-computed charge amount for a real payment. That Edge Function
 * necessarily duplicates this same calculation (Deno, not importable from
 * here); keep the two in sync if this changes.
 */
async function getGrossValue(pickup) {
  const volume = Number(pickup.actual_volume_liters ?? pickup.estimated_volume_liters ?? 0);
  const rate = await getRateForGrade(pickup.quality_grade);
  return { volume, rate, grossValue: volume * rate };
}

/**
 * Creates the earnings row(s) for a completed pickup: gross value = volume
 * x market rate for the grade, platform takes its cut, driver gets whatever
 * admin set for this specific pickup at dispatch time (pickups.driver_payout_amount)
 * — falling back to the old platform-wide flat rate if admin never set one —
 * restaurant gets the remainder. Grade/volume both came from the restaurant's
 * own sensor reading captured at pickup creation (Phase 1) — no
 * re-measurement happens here. `gatewayReference` (a payment_transactions.id)
 * is stamped onto both rows so they can be traced back to the manufacturer
 * payment that funded them.
 */
export async function finalizePickupEarnings(pickup, { gatewayReference } = {}) {
  const { volume, grossValue } = await getGrossValue(pickup);
  if (!volume || !pickup.restaurant_id) return null;

  const { data: existing, error: existingError } = await supabase
    .from('earnings')
    .select('id')
    .eq('pickup_id', pickup.id)
    .limit(1);

  if (existingError) throw existingError;
  if (existing?.length) return existing;

  const settings = await getPlatformSettings();
  const commissionPct = Number(settings.commission_pct ?? 0);
  const driverFlatRate = Number(settings.driver_flat_rate_per_pickup ?? 0);
  const adminSetDriverPay = pickup.driver_payout_amount;

  const platformCut = grossValue * (commissionPct / 100);
  const driverEarning = pickup.collector_id
    ? Number(adminSetDriverPay ?? driverFlatRate ?? 0)
    : 0;
  const restaurantEarning = Math.max(grossValue - platformCut - driverEarning, 0);

  const rows = [
    {
      restaurant_id: pickup.restaurant_id,
      pickup_id: pickup.id,
      amount: restaurantEarning,
      liters: volume,
      quality_grade: pickup.quality_grade ?? null,
      description: `Pickup ${pickup.id}`,
      gateway_reference: gatewayReference ?? null,
    },
  ];

  if (pickup.collector_id && driverEarning > 0) {
    rows.push({
      collector_id: pickup.collector_id,
      pickup_id: pickup.id,
      amount: driverEarning,
      liters: volume,
      quality_grade: pickup.quality_grade ?? null,
      description: `Collection fee for pickup ${pickup.id}`,
      gateway_reference: gatewayReference ?? null,
    });
  }

  const { data, error } = await supabase.from('earnings').insert(rows).select('*');
  if (error) throw error;
  return data;
}

/**
 * Sums unpaid earnings (withdrawal_id IS NULL) for a restaurant or
 * collector, creates one withdrawal request for the total, and links the
 * covered earnings rows to it so a future request never double-counts them.
 */
export async function requestWithdrawal({ restaurantId, collectorId }) {
  if (!restaurantId && !collectorId) {
    throw new Error('requestWithdrawal needs a restaurantId or collectorId.');
  }

  const ownerColumn = restaurantId ? 'restaurant_id' : 'collector_id';
  const ownerId = restaurantId ?? collectorId;

  const { data: unpaidEarnings, error: earningsError } = await supabase
    .from('earnings')
    .select('id, amount')
    .eq(ownerColumn, ownerId)
    .is('withdrawal_id', null);

  if (earningsError) throw earningsError;

  const total = (unpaidEarnings ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  if (total <= 0) {
    throw new Error('No unpaid earnings available to withdraw yet.');
  }

  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawals')
    .insert({
      [ownerColumn]: ownerId,
      amount: total,
      status: 'pending',
      method: 'manual',
    })
    .select('*')
    .single();

  if (withdrawalError) throw withdrawalError;

  const earningIds = unpaidEarnings.map((row) => row.id);
  const { error: linkError } = await supabase
    .from('earnings')
    .update({ withdrawal_id: withdrawal.id })
    .in('id', earningIds);

  if (linkError) throw linkError;

  return withdrawal;
}

/**
 * Marks a withdrawal paid/rejected and notifies the owner. Called from
 * admin only.
 */
export async function finalizeWithdrawal(withdrawal, status) {
  const ownerTable = withdrawal.restaurant_id ? 'restaurants' : 'collectors';
  const ownerId = withdrawal.restaurant_id ?? withdrawal.collector_id;

  const { data: owner, error: ownerError } = await supabase
    .from(ownerTable)
    .select('owner_user_id')
    .eq('id', ownerId)
    .maybeSingle();

  if (ownerError) throw ownerError;

  if (owner?.owner_user_id && status === 'approved') {
    await notifyUser(owner.owner_user_id, {
      title: 'Withdrawal paid',
      message: `Your withdrawal of ${withdrawal.amount} has been paid.`,
      category: 'info',
    });
  }
}
