import { supabase } from '../../supabase';
import { collectors, manufacturers, profiles, restaurants } from '../lib/dbColumns';
import { resolveManufacturerForPickup } from './manufacturerRoutingService';
import { finalizeWithdrawal, finalizePickupEarnings } from './payoutService';

const TABLES = {
  profiles: profiles.table,
  restaurants: restaurants.table,
  collectors: collectors.table,
  manufacturers: manufacturers.table,
  pickups: 'pickups',
  manualPickupRequests: 'manual_pickup_requests',
  tanks: 'tanks',
  qualityLogs: 'quality_logs',
  restaurantWallets: 'restaurant_balances',
  collectorWallets: 'collector_balances',
  earnings: 'earnings',
  withdrawals: 'withdrawals',
  alerts: 'alerts',
  tankReadings: 'tank_readings',
  activityLogs: 'activity_logs',
  pickupSchedules: 'pickup_schedules',
  marketRates: 'market_rates',
  manufacturerInventory: 'manufacturer_inventory',
  forecasts: 'forecasts',
  aiChatMessages: 'ai_chat_messages',
  platformSettings: 'platform_settings',
  paymentTransactions: 'payment_transactions',
};

async function readList(key, query) {
  const { data, error } = await query;
  return {
    key,
    data: error ? [] : data ?? [],
    error: error?.message ?? null,
  };
}

function indexByOwner(rows = []) {
  return rows.reduce((acc, row) => {
    if (row.owner_user_id) acc[row.owner_user_id] = row;
    return acc;
  }, {});
}

export async function loadAdminBundle() {
  const reads = await Promise.all([
    readList('profiles', supabase.from(TABLES.profiles).select(profiles.select).order('created_at', { ascending: false })),
    readList('restaurants', supabase.from(TABLES.restaurants).select(restaurants.select).order('created_at', { ascending: false })),
    readList('collectors', supabase.from(TABLES.collectors).select(collectors.select).order('created_at', { ascending: false })),
    readList('manufacturers', supabase.from(TABLES.manufacturers).select(manufacturers.select).order('created_at', { ascending: false })),
    readList('pickups', supabase.from(TABLES.pickups).select('*, restaurants(name, address), collectors(full_name), manufacturers(name)').order('created_at', { ascending: false })),
    readList('manualPickupRequests', supabase.from(TABLES.manualPickupRequests).select('*').order('created_at', { ascending: false })),
    readList('tanks', supabase.from(TABLES.tanks).select('*')),
    readList('qualityLogs', supabase.from(TABLES.qualityLogs).select('*').order('created_at', { ascending: false })),
    readList('restaurantWallets', supabase.from(TABLES.restaurantWallets).select('*')),
    readList('collectorWallets', supabase.from(TABLES.collectorWallets).select('*')),
    readList('earnings', supabase.from(TABLES.earnings).select('*').order('created_at', { ascending: false })),
    readList('withdrawals', supabase.from(TABLES.withdrawals).select('*').order('created_at', { ascending: false })),
    readList('alerts', supabase.from(TABLES.alerts).select('*').order('created_at', { ascending: false })),
    readList('tankReadings', supabase.from(TABLES.tankReadings).select('*').order('recorded_at', { ascending: false })),
    readList('activityLogs', supabase.from(TABLES.activityLogs).select('*').order('created_at', { ascending: false })),
    readList('pickupSchedules', supabase.from(TABLES.pickupSchedules).select('*').order('created_at', { ascending: false })),
    readList('marketRates', supabase.from(TABLES.marketRates).select('*').order('grade', { ascending: true })),
    readList('manufacturerInventory', supabase.from(TABLES.manufacturerInventory).select('*')),
    readList('forecasts', supabase.from(TABLES.forecasts).select('*').order('created_at', { ascending: false })),
    readList('aiChatMessages', supabase.from(TABLES.aiChatMessages).select('*').order('created_at', { ascending: false })),
    readList('platformSettings', supabase.from(TABLES.platformSettings).select('*').limit(1)),
    readList('paymentTransactions', supabase
      .from(TABLES.paymentTransactions)
      .select('*, manufacturers(name), pickups(restaurant_id, collector_id, restaurants(name), collectors(full_name))')
      .order('created_at', { ascending: false })),
  ]);

  const bundle = reads.reduce((acc, result) => {
    acc[result.key] = result.data;
    if (result.error) acc.errors.push({ table: result.key, message: result.error });
    return acc;
  }, { errors: [] });

  const restaurantByOwner = indexByOwner(bundle.restaurants);
  const collectorByOwner = indexByOwner(bundle.collectors);
  const manufacturerByOwner = indexByOwner(bundle.manufacturers);

  bundle.users = (bundle.profiles ?? []).map((profile) => {
    const business =
      restaurantByOwner[profile.id] ??
      collectorByOwner[profile.id] ??
      manufacturerByOwner[profile.id] ??
      null;

    return {
      ...profile,
      displayName:
        business?.name ??
        business?.full_name ??
        profile.full_name ??
        profile.email ??
        'Unnamed user',
      business,
      businessTable:
        restaurantByOwner[profile.id] ? 'restaurants' :
        collectorByOwner[profile.id] ? 'collectors' :
        manufacturerByOwner[profile.id] ? 'manufacturers' :
        null,
    };
  });

  bundle.tableOverview = Object.keys(TABLES).map((key) => ({
    key,
    label: key.replace(/([A-Z])/g, ' $1').toLowerCase(),
    count: bundle[key]?.length ?? 0,
    error: bundle.errors.find((item) => item.table === key)?.message ?? null,
  }));

  return bundle;
}

export async function updateProfileStatus(userId, status) {
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select(profiles.select)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBusinessStatus(table, id, status) {
  const { data, error } = await supabase
    .from(table)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateBusinessVerification(table, id, isVerified, notes) {
  const { data, error } = await supabase
    .from(table)
    .update({
      is_verified: isVerified,
      verified_at: isVerified ? new Date().toISOString() : null,
      verification_notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function assignPickup(pickupId, payload) {
  const updates = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLES.pickups)
    .update(updates)
    .eq('id', pickupId)
    .select('*, restaurants(name, address), collectors(full_name), manufacturers(name)')
    .single();

  if (error) throw error;
  return data;
}

export async function updatePickupStatus(pickupId, status) {
  const pickup = await assignPickup(pickupId, {
    status,
    completed_at: status === 'completed' ? new Date().toISOString() : undefined,
  });

  if (status === 'completed') {
    await finalizePickupEarnings(pickup);
  }

  return pickup;
}

export async function updateWithdrawalStatus(withdrawalId, status) {
  const { data, error } = await supabase
    .from(TABLES.withdrawals)
    .update({ status })
    .eq('id', withdrawalId)
    .select('*')
    .single();

  if (error) throw error;

  await finalizeWithdrawal(data, status);

  return data;
}

export async function createAdminAlert(payload) {
  const { data, error } = await supabase
    .from(TABLES.alerts)
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateAlertRead(alertId, isRead) {
  const { data, error } = await supabase
    .from(TABLES.alerts)
    .update({ is_read: isRead })
    .eq('id', alertId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAlert(alertId) {
  const { data, error } = await supabase
    .from(TABLES.alerts)
    .delete()
    .eq('id', alertId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function convertManualRequestToPickup(manualRequest) {
  const { data: existingPickup, error: existingError } = await supabase
    .from(TABLES.pickups)
    .select('id')
    .eq('manual_request_id', manualRequest.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingPickup) {
    throw new Error('This request was already converted to a pickup.');
  }

  let qualityGrade = null;
  if (manualRequest.tank_id) {
    const { data: tank, error: tankError } = await supabase
      .from(TABLES.tanks)
      .select('quality_grade')
      .eq('id', manualRequest.tank_id)
      .maybeSingle();
    if (tankError) throw tankError;
    qualityGrade = tank?.quality_grade ?? null;
  }

  const manufacturerId = await resolveManufacturerForPickup(manualRequest.restaurant_id, qualityGrade);

  const { data, error } = await supabase
    .from(TABLES.pickups)
    .insert({
      restaurant_id: manualRequest.restaurant_id,
      manufacturer_id: manufacturerId,
      quality_grade: qualityGrade,
      tank_id: manualRequest.tank_id ?? null,
      urgency: manualRequest.urgency ?? null,
      pickup_type: 'manual',
      status: 'pending',
      manual_request_id: manualRequest.id,
      notes: manualRequest.notes ?? manualRequest.reason ?? null,
      pickup_date: new Date().toISOString().slice(0, 10),
    })
    .select('*, restaurants(name, address), collectors(full_name), manufacturers(name)')
    .single();

  if (error) throw error;
  return data;
}

export async function notifyCollectorAssignment(collector, pickup) {
  if (!collector?.owner_user_id) return null;

  const { data, error } = await supabase
    .from(TABLES.alerts)
    .insert({
      user_id: collector.owner_user_id,
      title: 'New pickup assigned',
      message: `You've been assigned a pickup at ${pickup.restaurants?.name ?? 'a restaurant'} on ${pickup.pickup_date ?? 'the scheduled date'}.`,
      category: 'delivery',
      type: 'info',
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function assignCollectorToPickup(pickupId, collector, driverPayoutAmount) {
  const updates = { collector_id: collector.id, status: 'scheduled' };
  if (driverPayoutAmount !== undefined && driverPayoutAmount !== null && driverPayoutAmount !== '') {
    updates.driver_payout_amount = Number(driverPayoutAmount);
  }
  const pickup = await assignPickup(pickupId, updates);
  await notifyCollectorAssignment(collector, pickup);
  return pickup;
}

/**
 * Admin sets what the driver is owed for this specific pickup — replaces the
 * old platform-wide flat rate as the primary source (payoutService.
 * finalizePickupEarnings falls back to the flat rate only if this is unset).
 * Can be set at dispatch time or any time before the pickup completes.
 */
export async function setDriverPayoutAmount(pickupId, amount) {
  return assignPickup(pickupId, { driver_payout_amount: Number(amount) });
}

export async function updateRestaurantPrimaryManufacturer(restaurantId, manufacturerId) {
  const { data, error } = await supabase
    .from(TABLES.restaurants)
    .update({ primary_manufacturer_id: manufacturerId })
    .eq('id', restaurantId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function createManualPickupRequest(payload) {
  const { data, error } = await supabase
    .from(TABLES.manualPickupRequests)
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export { TABLES as ADMIN_TABLES };
