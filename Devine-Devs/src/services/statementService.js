// Account statements and receipts, per role.
//
// Everything here is a READ. Figures come from the same rows the app's
// balances come from (earnings, withdrawals, payment_transactions,
// platform_ledger), so a statement can never disagree with what the screen
// shows — there is no separate arithmetic to drift.
//
// RLS does the scoping: each role's own policies already restrict these
// tables to their own rows, so these queries return nothing extra even if
// called with someone else's id.
import { supabase } from '../../supabase';

/** ISO date (YYYY-MM-DD) n days back from today. */
function daysAgoIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const DEFAULT_RANGE_DAYS = 90;

/**
 * Restaurant: what they were paid for the oil they sold. Restaurant earnings
 * are auto-paid on creation (see payoutService), so every row here is money
 * already sent — the statement is a record of payouts, not of a balance.
 */
async function restaurantStatement(restaurantId, since) {
  const { data: earnings, error } = await supabase
    .from('earnings')
    .select('id, created_at, amount, liters, quality_grade, description, pickup_id, withdrawal_id')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (earnings ?? []).map((e) => ({
    date: e.created_at,
    reference: e.pickup_id ? String(e.pickup_id).slice(0, 8) : '—',
    description: `Oil collection · Grade ${e.quality_grade ?? '—'}`,
    liters: e.liters,
    amount: Number(e.amount ?? 0),
    settled: !!e.withdrawal_id,
  }));

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  return {
    columns: ['Date', 'Pickup', 'Detail', 'Litres', 'Paid'],
    rows,
    totals: [{ label: 'Total paid to you', value: total }],
  };
}

/**
 * Driver: earnings in, withdrawals out, and what is still available. Merged
 * into one chronological ledger so it reads like a bank statement.
 */
async function collectorStatement(collectorId, since) {
  const [{ data: earnings, error: eErr }, { data: withdrawals, error: wErr }, { data: bal }] =
    await Promise.all([
      supabase
        .from('earnings')
        .select('id, created_at, amount, liters, quality_grade, pickup_id, withdrawal_id')
        .eq('collector_id', collectorId)
        .gte('created_at', since)
        .order('created_at', { ascending: false }),
      supabase
        .from('withdrawals')
        .select('id, created_at, amount, method, status')
        .eq('collector_id', collectorId)
        .gte('created_at', since)
        .order('created_at', { ascending: false }),
      supabase.from('collector_balances').select('balance').eq('collector_id', collectorId).maybeSingle(),
    ]);
  if (eErr) throw eErr;
  if (wErr) throw wErr;

  const earned = (earnings ?? []).map((e) => ({
    date: e.created_at,
    reference: e.pickup_id ? String(e.pickup_id).slice(0, 8) : '—',
    description: `Collection fee · Grade ${e.quality_grade ?? '—'}`,
    liters: e.liters,
    amount: Number(e.amount ?? 0),
  }));

  const withdrawn = (withdrawals ?? []).map((w) => ({
    date: w.created_at,
    reference: String(w.id).slice(0, 8),
    description: `Withdrawal${w.method ? ` · ${w.method}` : ''}${
      w.status && w.status !== 'approved' ? ` (${w.status})` : ''
    }`,
    liters: null,
    amount: -Number(w.amount ?? 0),
  }));

  const rows = [...earned, ...withdrawn].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalEarned = earned.reduce((s, r) => s + r.amount, 0);
  const totalWithdrawn = withdrawn.reduce((s, r) => s + Math.abs(r.amount), 0);

  return {
    columns: ['Date', 'Reference', 'Detail', 'Litres', 'Amount'],
    rows,
    totals: [
      { label: 'Earned in this period', value: totalEarned },
      { label: 'Withdrawn in this period', value: -totalWithdrawn },
      { label: 'Available now', value: Number(bal?.balance ?? 0), strong: true },
    ],
  };
}

/** Manufacturer: what they paid the platform for oil received. */
async function manufacturerStatement(manufacturerId, since) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('id, created_at, amount, item_name, status, m_payment_id, pickup_id')
    .eq('manufacturer_id', manufacturerId)
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []).map((p) => ({
    date: p.created_at,
    reference: p.m_payment_id ?? String(p.id).slice(0, 8),
    description: p.item_name ?? 'Oil delivery',
    liters: null,
    amount: Number(p.amount ?? 0),
    pending: p.status !== 'complete',
  }));

  // Only settled payments count toward the total; a pending checkout is not
  // money that moved.
  const total = rows.filter((r) => !r.pending).reduce((s, r) => s + r.amount, 0);
  return {
    columns: ['Date', 'Reference', 'Detail', '', 'Amount'],
    rows,
    totals: [{ label: 'Total settled', value: total, strong: true }],
  };
}

/**
 * Admin: the platform's own books. platform_ledger is already shaped like a
 * bank statement (one row per completed trip, with the split out of it).
 */
async function adminStatement(since) {
  const { data, error } = await supabase
    .from('platform_ledger')
    .select('*')
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []).map((l) => ({
    date: l.occurred_at,
    reference: String(l.pickup_id).slice(0, 8),
    description: `${l.restaurant_name ?? '—'} → ${l.manufacturer_name ?? '—'} · ${l.driver_name ?? 'no driver'}`,
    liters: l.liters,
    amount: Number(l.received ?? 0),
    breakdown: {
      restaurant: Number(l.to_restaurant ?? 0),
      driver: Number(l.to_driver ?? 0),
      platform: Number(l.platform_kept ?? 0),
    },
  }));

  const received = rows.reduce((s, r) => s + r.amount, 0);
  const toRestaurants = rows.reduce((s, r) => s + r.breakdown.restaurant, 0);
  const toDrivers = rows.reduce((s, r) => s + r.breakdown.driver, 0);
  const kept = rows.reduce((s, r) => s + r.breakdown.platform, 0);

  return {
    columns: ['Date', 'Pickup', 'Detail', 'Litres', 'Received'],
    rows,
    totals: [
      { label: 'Received from manufacturers', value: received },
      { label: 'Paid to restaurants', value: -toRestaurants },
      { label: 'Paid to drivers', value: -toDrivers },
      { label: 'Platform kept', value: kept, strong: true },
    ],
  };
}

/**
 * Builds the statement for one role.
 *
 * @param role     'restaurant' | 'collector' | 'manufacturer' | 'admin'
 * @param ownerId  the restaurants/collectors/manufacturers row id (ignored for admin)
 * @param days     how far back to go (default 90)
 */
export async function getStatement({ role, ownerId, days = DEFAULT_RANGE_DAYS }) {
  const since = daysAgoIso(days);

  let body;
  if (role === 'restaurant') body = await restaurantStatement(ownerId, since);
  else if (role === 'collector') body = await collectorStatement(ownerId, since);
  else if (role === 'manufacturer') body = await manufacturerStatement(ownerId, since);
  else if (role === 'admin') body = await adminStatement(since);
  else throw new Error(`No statement defined for role "${role}".`);

  return {
    role,
    periodDays: days,
    from: since,
    to: new Date().toISOString(),
    ...body,
  };
}

/**
 * A single pickup's receipt — what the manufacturer paid and how it was
 * split. Readable by whoever RLS lets see that pickup's ledger row.
 */
export async function getReceipt(pickupId) {
  const { data, error } = await supabase
    .from('platform_ledger')
    .select('*')
    .eq('pickup_id', pickupId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('No receipt yet — this pickup has not been paid for.');
  return data;
}
