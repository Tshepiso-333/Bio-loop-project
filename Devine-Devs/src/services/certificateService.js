// Data behind the Environmental Partner certificate.
//
// Everything here is a READ, scoped by RLS like the rest of the app. The
// numbers are the same rows the dashboards already count, so a certificate
// can never claim a litre the app does not show elsewhere.
//
// Nothing is invented. Litres come from completed pickups; CO2 is only
// reported where the database actually stores it (collectors.co2_saved_kg) —
// there is no agreed conversion factor for the other roles, so rather than
// print a made-up number the certificate simply omits the line.
import { supabase } from '../../supabase';

// Postgres: column does not exist. profiles.member_since arrives in
// migration 070, and the certificate has to work on a database where that
// has not been applied yet — on the demo laptop, say, or on a teammate's
// branch. We ask for the column, and fall back to created_at alone if the
// server says it isn't there.
const UNDEFINED_COLUMN = '42703';

/**
 * When this account is treated as having joined.
 * Returns an ISO string, or null if we genuinely cannot tell.
 */
async function fetchJoinedAt(userId) {
  const withMemberSince = await supabase
    .from('profiles')
    .select('member_since, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (!withMemberSince.error) {
    const row = withMemberSince.data ?? {};
    return row.member_since ?? row.created_at ?? null;
  }

  if (withMemberSince.error.code !== UNDEFINED_COLUMN) throw withMemberSince.error;

  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.created_at ?? null;
}

/**
 * Litres this account has actually put through BioLoop.
 *
 * Counts completed pickups only — a scheduled collection is a promise, and a
 * certificate should not count promises. Prefers the measured volume and
 * falls back to the estimate, which is what the earnings trigger does too.
 */
async function fetchLitres(role, roleId) {
  if (!roleId) return { litres: 0, collections: 0 };

  const column = role === 'manufacturer' ? 'manufacturer_id'
    : role === 'collector' ? 'collector_id'
    : 'restaurant_id';

  const { data, error } = await supabase
    .from('pickups')
    .select('actual_volume_liters, estimated_volume_liters')
    .eq(column, roleId)
    .eq('status', 'completed');
  if (error) throw error;

  const rows = data ?? [];
  const litres = rows.reduce(
    (sum, p) => sum + Number(p.actual_volume_liters ?? p.estimated_volume_liters ?? 0),
    0
  );
  return { litres, collections: rows.length };
}

/** Only collectors have a stored CO2 figure; everyone else gets null. */
async function fetchCo2(role, roleId) {
  if (role !== 'collector' || !roleId) return null;
  const { data, error } = await supabase
    .from('collectors')
    .select('co2_saved_kg')
    .eq('id', roleId)
    .maybeSingle();
  if (error) throw error;
  const value = Number(data?.co2_saved_kg ?? 0);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Everything the certificate needs.
 *
 * @param userId  profiles.id of the signed-in person
 * @param role    'restaurant' | 'collector' | 'manufacturer' | 'admin'
 * @param roleId  id of their restaurants/collectors/manufacturers row, if any
 * @returns { joinedAt, litres, collections, co2Kg }
 */
export async function getCertificateData({ userId, role, roleId }) {
  if (!userId) throw new Error('A certificate needs a signed-in account.');

  const [joinedAt, volume, co2Kg] = await Promise.all([
    fetchJoinedAt(userId),
    fetchLitres(role, roleId).catch(() => ({ litres: 0, collections: 0 })),
    fetchCo2(role, roleId).catch(() => null),
  ]);

  return { joinedAt, litres: volume.litres, collections: volume.collections, co2Kg };
}
