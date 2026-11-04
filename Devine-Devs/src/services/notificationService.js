import { supabase } from '../../supabase';

//  is the routing payload (migration 064): { pickupId, screen, ... }.
// Tapping the alert in the bell — and later the push notification built from
// it — uses this to open the thing the alert is about. Pass it whenever the
// alert refers to a specific pickup, payment or tank.
export async function notifyAllAdmins({ title, message, category = 'info', type = 'info', meta = {} }) {
  const { data: admins, error: adminsError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (adminsError) throw adminsError;
  if (!admins?.length) return [];

  const rows = admins.map((admin) => ({
    user_id: admin.id,
    title,
    message,
    category,
    type,
    meta,
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase.from('alerts').insert(rows).select('*');
  if (error) throw error;
  return data;
}

export async function notifyUser(userId, { title, message, category = 'info', type = 'info', meta = {} }) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      user_id: userId,
      title,
      message,
      category,
      type,
      meta,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Marks one of the current user's alerts read. RLS (alerts_access) limits
 * this to the caller's own rows, so no ownership check is needed here.
 */
export async function markAlertRead(alertId, isRead = true) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read: isRead })
    .eq('id', alertId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
