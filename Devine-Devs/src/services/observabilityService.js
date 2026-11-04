// src/services/observabilityService.js
//
// Read side of the observability stack — what the admin Operations screen
// shows. Every query here is admin-only at the database level: system_events
// has a single SELECT policy gated on is_admin(), and the four views are
// security_invoker, so they inherit it. There is no client-side role check to
// forget, because the database will simply return nothing to anyone else.
//
// Views: migration 083. Table and RPCs: migration 080.
import { supabase } from '../../supabase';

const EVENT_PAGE = 200;

async function read(key, query) {
  const { data, error } = await query;
  return { key, data: error ? null : data, error: error?.message ?? null };
}

/**
 * One round trip for the whole screen. Returns partial data rather than
 * throwing if one view fails — a broken integrity check should not blank the
 * error log next to it.
 */
export async function loadOperationsBundle({ level = 'all', search = '' } = {}) {
  let eventsQuery = supabase
    .from('system_events')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(EVENT_PAGE);

  if (level === 'problems') {
    eventsQuery = eventsQuery.in('level', ['warn', 'error', 'critical']);
  } else if (level !== 'all') {
    eventsQuery = eventsQuery.eq('level', level);
  }

  const term = search.trim();
  if (term) {
    // Postgres `or` filter: match the slug or the human message.
    eventsQuery = eventsQuery.or(`event.ilike.%${term}%,message.ilike.%${term}%`);
  }

  const reads = await Promise.all([
    read('health', supabase.from('system_health').select('*').maybeSingle()),
    read('integrity', supabase.from('system_integrity').select('*')),
    read('errorGroups', supabase.from('system_error_groups').select('*').order('last_seen', { ascending: false })),
    read('latency', supabase.from('system_latency').select('*').order('p95_ms', { ascending: false })),
    read('events', eventsQuery),
  ]);

  const bundle = { errors: [] };
  for (const result of reads) {
    bundle[result.key] = result.data ?? (result.key === 'health' ? null : []);
    if (result.error) bundle.errors.push({ view: result.key, message: result.error });
  }

  // Sort the checks so what is on fire is at the top, and so a green run
  // still has a stable order.
  const weight = { critical: 0, error: 1, warn: 2, info: 3 };
  bundle.integrity = (bundle.integrity ?? []).slice().sort((a, b) => {
    const failingDiff = (b.failing > 0) - (a.failing > 0);
    if (failingDiff) return failingDiff;
    const severityDiff = (weight[a.severity] ?? 9) - (weight[b.severity] ?? 9);
    if (severityDiff) return severityDiff;
    return String(a.check_key).localeCompare(String(b.check_key));
  });

  return bundle;
}

/** All occurrences behind one error group, for the detail sheet. */
export async function loadErrorOccurrences(fingerprint, limit = 25) {
  const { data, error } = await supabase
    .from('system_events')
    .select('*')
    .eq('fingerprint', fingerprint)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Everything that ever happened to one row — the per-record audit trail. */
export async function loadSubjectTrail(subjectTable, subjectId, limit = 50) {
  const { data, error } = await supabase
    .from('system_events')
    .select('*')
    .eq('subject_table', subjectTable)
    .eq('subject_id', String(subjectId))
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/**
 * Retention sweep. Admin-gated inside the function too, and it is the only
 * sanctioned way rows ever leave system_events — a direct DELETE raises.
 */
export async function pruneEvents(keepDays = 30) {
  const { data, error } = await supabase.rpc('prune_system_events', { p_keep_days: keepDays });
  if (error) throw error;
  return data;
}
