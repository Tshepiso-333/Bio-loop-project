import { supabase } from '../../supabase';
import { pickups as pickupsSchema } from '../lib/dbColumns';

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
  // Include restaurant and manufacturer summary for UI
  const select = "*, restaurants(name, address), manufacturers(name)";

  const { data, error } = await supabase
    .from(pickupsSchema.table)
    .select(select)
    .eq('collector_id', collectorId)
    .order('pickup_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCollectorStats(collectorId) {
  const { data, error } = await supabase
    .from('collectors')
    .select('id, full_name, rating, total_liters, total_collections, reviews_count')
    .eq('id', collectorId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

const EMPTY_BUNDLE = {
  collector: null,
  pickups: [],
  stats: null,
  alerts: [],
};

export async function loadCollectorBundle(ownerUserId) {
  const collector = await getCollectorByOwnerId(ownerUserId);

  if (!collector) return { ...EMPTY_BUNDLE };

  const collectorId = collector.id;

  const [pickups, stats, alerts] = await Promise.all([
    getAssignedPickups(collectorId),
    getCollectorStats(collectorId),
    supabase.from('alerts').select('*').eq('user_id', ownerUserId).order('created_at', { ascending: false }).then(r => { if (r.error) throw r.error; return r.data ?? []; }),
  ]);

  return {
    collector,
    pickups,
    stats,
    alerts,
  };
}

export default {
  getCollectorByOwnerId,
  getAssignedPickups,
  getCollectorStats,
  loadCollectorBundle,
};
