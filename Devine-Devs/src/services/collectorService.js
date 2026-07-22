import { supabase } from '../../supabase';
import { pickups as pickupsSchema } from '../lib/dbColumns';
import { finalizePickupEarnings } from './payoutService';
import { notifyAllAdmins } from './notificationService';

const assignedPickupSelect =
  '*, restaurants(name, address, latitude, longitude, phone), manufacturers(name)';

export async function getCollectorByOwnerId(ownerUserId) {
  const { data, error } = await supabase
    .from('collectors')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAssignedPickups(collectorId) {
  const { data, error } = await supabase
    .from(pickupsSchema.table)
    .select(assignedPickupSelect)
    .eq('collector_id', collectorId)
    .order('pickup_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updatePickupStatus(pickupId, status) {
  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(pickupsSchema.table)
    .update(updates)
    .eq('id', pickupId)
    .select(assignedPickupSelect)
    .single();

  if (error) throw error;

  if (status === 'completed') {
    await finalizePickupEarnings(data);
  }

  return data;
}

export async function updateCollectorLocation(collectorId, { latitude, longitude }) {
  const { error } = await supabase
    .from('collectors')
    .update({
      current_latitude: latitude,
      current_longitude: longitude,
      location_updated_at: new Date().toISOString(),
    })
    .eq('id', collectorId);

  if (error) throw error;
}

export async function toggleDutyStatus(collectorId, isOnDuty) {
  const { data, error } = await supabase
    .from('collectors')
    .update({ is_on_duty: isOnDuty })
    .eq('id', collectorId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function declinePickup(pickupId, reason) {
  const { data, error } = await supabase
    .from(pickupsSchema.table)
    .update({
      collector_id: null,
      status: 'pending',
      decline_reason: reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pickupId)
    .select(assignedPickupSelect)
    .single();

  if (error) throw error;

  await notifyAllAdmins({
    title: 'Pickup declined',
    message: `A driver declined a pickup at ${data.restaurants?.name ?? 'a restaurant'}. It's back on the Dispatch board.`,
    category: 'delivery',
  });

  return data;
}

export async function getCollectorStats(collectorId) {
  const { data, error } = await supabase
    .from('collectors')
    .select('id, full_name, district, route_name, rating, total_liters, total_collections, reviews_count')
    .eq('id', collectorId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCollectorWallet(collectorId) {
  const { data, error } = await supabase
    .from('collector_balances')
    .select('*')
    .eq('collector_id', collectorId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCollectorEarnings(collectorId) {
  const { data, error } = await supabase
    .from('earnings')
    .select('*')
    .eq('collector_id', collectorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCollectorWithdrawals(collectorId) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('collector_id', collectorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

const EMPTY_BUNDLE = {
  collector: null,
  pickups: [],
  stats: null,
  alerts: [],
  wallet: null,
  earnings: [],
  withdrawals: [],
};

export async function loadCollectorBundle(ownerUserId) {
  const collector = await getCollectorByOwnerId(ownerUserId);

  if (!collector) return { ...EMPTY_BUNDLE };

  const collectorId = collector.id;

  const [pickups, stats, alerts, wallet, earnings, withdrawals] = await Promise.all([
    getAssignedPickups(collectorId),
    getCollectorStats(collectorId),
    supabase.from('alerts').select('*').eq('user_id', ownerUserId).order('created_at', { ascending: false }).then(r => { if (r.error) throw r.error; return r.data ?? []; }),
    getCollectorWallet(collectorId),
    getCollectorEarnings(collectorId),
    getCollectorWithdrawals(collectorId),
  ]);

  return {
    collector,
    pickups,
    stats,
    alerts,
    wallet,
    earnings,
    withdrawals,
  };
}

export default {
  getCollectorByOwnerId,
  getAssignedPickups,
  updatePickupStatus,
  updateCollectorLocation,
  toggleDutyStatus,
  declinePickup,
  getCollectorStats,
  getCollectorWallet,
  getCollectorEarnings,
  getCollectorWithdrawals,
  loadCollectorBundle,
};
