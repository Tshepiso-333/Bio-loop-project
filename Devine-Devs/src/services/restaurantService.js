import { supabase } from '../../supabase';
import { pickups as pickupsSchema, profiles, restaurants } from '../lib/dbColumns';
import { resolveManufacturerForPickup } from './manufacturerRoutingService';
import { notifyAllAdmins } from './notificationService';

const FILL_PERCENT_TRIGGER = 85;

export async function getRestaurantByOwnerId(ownerUserId) {
  const { data, error } = await supabase
    .from(restaurants.table)
    .select(restaurants.select)
    .eq('owner_user_id', ownerUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getTank(restaurantId) {
  const { data, error } = await supabase
    .from('tanks')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('last_updated', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateTankGrade(tankId, grade) {
  const { data, error } = await supabase
    .from('tanks')
    .update({ quality_grade: grade })
    .eq('id', tankId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateTankFillPercent(tankId, fillPercent) {
  const { data: previousTank, error: previousError } = await supabase
    .from('tanks')
    .select('fill_percent')
    .eq('id', tankId)
    .maybeSingle();

  if (previousError) throw previousError;

  const { data: tank, error } = await supabase
    .from('tanks')
    .update({ fill_percent: fillPercent, last_updated: new Date().toISOString() })
    .eq('id', tankId)
    .select('*')
    .single();

  if (error) throw error;

  const wasBelowTrigger = Number(previousTank?.fill_percent ?? 0) < FILL_PERCENT_TRIGGER;
  const isAtOrAboveTrigger = Number(fillPercent) >= FILL_PERCENT_TRIGGER;

  if (wasBelowTrigger && isAtOrAboveTrigger && tank.restaurant_id) {
    const { error: requestError } = await supabase
      .from('manual_pickup_requests')
      .insert({
        restaurant_id: tank.restaurant_id,
        tank_id: tank.id,
        urgency: 'urgent',
        reason: `Tank reached ${fillPercent}% capacity`,
        is_auto_generated: true,
      });

    if (requestError) throw requestError;

    await notifyAllAdmins({
      title: 'Tank auto-triggered a pickup request',
      message: `A tank crossed ${FILL_PERCENT_TRIGGER}% and automatically requested a pickup.`,
      category: 'delivery',
    });
  }

  return tank;
}

export async function cancelPickup(pickupId, cancelledByUserId, reason) {
  const { data, error } = await supabase
    .from(pickupsSchema.table)
    .update({
      status: 'cancelled',
      cancelled_by: cancelledByUserId ?? null,
      cancellation_reason: reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pickupId)
    .select(pickupsSchema.collectorJoin)
    .single();

  if (error) throw error;
  return data;
}

export async function getPickups(restaurantId) {
  const { data, error } = await supabase
    .from(pickupsSchema.table)
    .select(pickupsSchema.collectorJoin)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getTankReadings(tankId) {
  if (!tankId) return [];

  const { data, error } = await supabase
    .from('tank_readings')
    .select('*')
    .eq('tank_id', tankId)
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPickupSchedules(restaurantId) {
  const { data, error } = await supabase
    .from('pickup_schedules')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('next_pickup_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getWallet(restaurantId) {
  const { data, error } = await supabase
    .from('restaurant_balances')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getEarnings(restaurantId) {
  const { data, error } = await supabase
    .from('earnings')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getWithdrawals(restaurantId) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getQualityLogs(restaurantId) {
  const { data, error } = await supabase
    .from('quality_logs')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getActivityLogs(restaurantId) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAlerts(userId) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMarketRates() {
  const { data, error } = await supabase
    .from('market_rates')
    .select('*')
    .order('grade', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

function parseTimeWindow(timeWindow) {
  if (!timeWindow || typeof timeWindow !== 'string') {
    return { pickup_time_start: null, pickup_time_end: null };
  }

  const [startRaw, endRaw] = timeWindow.split('-').map((part) => part.trim());
  const normalize = (value) => {
    if (!value) return null;
    return value.length === 5 ? `${value}:00` : value;
  };

  return {
    pickup_time_start: normalize(startRaw),
    pickup_time_end: normalize(endRaw),
  };
}

export async function createPickupRequest(restaurantId, payload = {}) {
  const { time_window, pickup_date, notes, status, pickup_type, tank_id, ...rest } =
    payload;
  const timeFields = parseTimeWindow(time_window);

  let qualityGrade = null;
  if (tank_id) {
    const { data: tank, error: tankError } = await supabase
      .from('tanks')
      .select('quality_grade')
      .eq('id', tank_id)
      .maybeSingle();
    if (tankError) throw tankError;
    qualityGrade = tank?.quality_grade ?? null;
  }

  const manufacturerId = await resolveManufacturerForPickup(restaurantId, qualityGrade);

  const { data, error } = await supabase
    .from('pickups')
    .insert({
      restaurant_id: restaurantId,
      manufacturer_id: manufacturerId,
      quality_grade: qualityGrade,
      status: status ?? 'scheduled',
      pickup_type: pickup_type ?? 'scheduled',
      pickup_date: pickup_date ?? new Date().toISOString().slice(0, 10),
      notes: notes ?? null,
      tank_id: tank_id ?? null,
      ...timeFields,
      ...rest,
    })
    .select(pickupsSchema.collectorJoin)
    .single();

  if (error) throw error;
  return data;
}

export async function createManualPickupRequest(restaurantId, payload = {}) {
  const { tank_id, urgency, reason, notes, ...rest } = payload;

  const { data, error } = await supabase
    .from('manual_pickup_requests')
    .insert({
      restaurant_id: restaurantId,
      tank_id: tank_id ?? null,
      urgency,
      reason,
      notes: notes ?? null,
      ...rest,
    })
    .select('*')
    .single();

  if (error) throw error;

  await notifyAllAdmins({
    title: 'New manual pickup request',
    message: `A restaurant submitted an urgent pickup request: ${reason ?? 'no reason given'}.`,
    category: 'delivery',
  });

  return data;
}

const EMPTY_BUNDLE = {
  restaurant: null,
  tank: null,
  tankReadings: [],
  pickups: [],
  pickupSchedules: [],
  wallet: null,
  earnings: [],
  withdrawals: [],
  alerts: [],
  qualityLogs: [],
  activityLogs: [],
  marketRates: [],
};

export async function loadRestaurantBundle(ownerUserId) {
  const restaurant = await getRestaurantByOwnerId(ownerUserId);

  if (!restaurant) {
    return { ...EMPTY_BUNDLE };
  }

  const restaurantId = restaurant.id;

  const [
    tank,
    pickups,
    pickupSchedules,
    wallet,
    earnings,
    withdrawals,
    alerts,
    qualityLogs,
    activityLogs,
    marketRates,
  ] = await Promise.all([
    getTank(restaurantId),
    getPickups(restaurantId),
    getPickupSchedules(restaurantId),
    getWallet(restaurantId),
    getEarnings(restaurantId),
    getWithdrawals(restaurantId),
    getAlerts(ownerUserId),
    getQualityLogs(restaurantId),
    getActivityLogs(restaurantId),
    getMarketRates(),
  ]);

  const tankReadings = tank ? await getTankReadings(tank.id) : [];

  return {
    restaurant,
    tank,
    tankReadings,
    pickups,
    pickupSchedules,
    wallet,
    earnings,
    withdrawals,
    alerts,
    qualityLogs,
    activityLogs,
    marketRates,
  };
}
