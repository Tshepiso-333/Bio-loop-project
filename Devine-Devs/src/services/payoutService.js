import { supabase } from '../../supabase';
import { notifyUser } from './notificationService';

/**
 * Money model (team-final, 2026-09-17 — see docs/migrations/047):
 *
 *   pool  = everything the manufacturer pays for a pickup
 *           (litres x market_rates.rate_per_liter + manufacturer_markup_pct)
 *   split = payout_splits row for the oil grade (restaurant / driver / platform %)
 *             A 60/25/15 · B 50/30/20 · C 40/35/25 by default, admin-editable
 *
 *   restaurant share -> paid out automatically the instant the trip completes
 *   driver share     -> credited to the wallet; driver taps Withdraw, paid instantly
 *   platform share   -> stays in the platform account (money in - payouts)
 *
 * All of that is computed by DB triggers (pickups_auto_earnings,
 * earnings_auto_payout) and the request_driver_withdrawal() RPC — nothing in
 * this file does the arithmetic anymore, so the app can never disagree with
 * the database about who is owed what.
 */
export async function getPlatformSettings() {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? { manufacturer_markup_pct: 10 };
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

export async function getPayoutSplits() {
  const { data, error } = await supabase
    .from('payout_splits')
    .select('*')
    .order('grade', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * The DB enforces restaurant + driver + platform = 100 (check constraint),
 * so a bad split is rejected server-side rather than silently saved.
 */
export async function updatePayoutSplit(grade, { restaurant_pct, driver_pct, platform_pct }) {
  const { data, error } = await supabase
    .from('payout_splits')
    .update({ restaurant_pct, driver_pct, platform_pct, updated_at: new Date().toISOString() })
    .eq('grade', grade)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Earnings are created by the DB the instant pickups.status flips to
 * 'completed' (trg_pickups_auto_earnings). This just reads them back so
 * callers that used to depend on the return value still get the rows.
 * Kept for call-site compatibility (manufacturerService, adminService).
 */
export async function finalizePickupEarnings(pickup) {
  if (!pickup?.id) return null;

  const { data, error } = await supabase
    .from('earnings')
    .select('*')
    .eq('pickup_id', pickup.id);

  if (error) throw error;
  return data ?? [];
}

/**
 * Driver: server-side RPC sums the driver's unpaid earnings, creates an
 * instantly-approved withdrawal for the total and links the earnings to it
 * (balance drops to 0, history kept). The amount is never sent from the
 * client.
 *
 * Restaurant: restaurant earnings are auto-paid the moment they're created,
 * so there is normally nothing left to withdraw; this path only exists for
 * any pre-047 unpaid rows and mirrors the old behaviour (instant approved).
 */
export async function requestWithdrawal({ restaurantId, collectorId }) {
  if (collectorId) {
    const { data, error } = await supabase.rpc('request_driver_withdrawal');
    if (error) throw error;
    return data;
  }

  if (!restaurantId) {
    throw new Error('requestWithdrawal needs a restaurantId or collectorId.');
  }

  const { data: unpaidEarnings, error: earningsError } = await supabase
    .from('earnings')
    .select('id, amount')
    .eq('restaurant_id', restaurantId)
    .is('withdrawal_id', null);

  if (earningsError) throw earningsError;

  const total = (unpaidEarnings ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  if (total <= 0) {
    throw new Error('No unpaid earnings available to withdraw yet.');
  }

  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawals')
    .insert({
      restaurant_id: restaurantId,
      amount: total,
      status: 'approved',
      method: 'instant',
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
 * Marks a withdrawal paid/rejected and notifies the owner. Admin-only;
 * no longer reachable from the admin UI (payouts are automatic) but kept
 * for adminService.updateWithdrawalStatus.
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
