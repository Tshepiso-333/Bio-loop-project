import { supabase } from '../../supabase';

export async function notifyAllAdmins({ title, message, category = 'info', type = 'info' }) {
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
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase.from('alerts').insert(rows).select('*');
  if (error) throw error;
  return data;
}

export async function notifyUser(userId, { title, message, category = 'info', type = 'info' }) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      user_id: userId,
      title,
      message,
      category,
      type,
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
