import { supabase } from '../../supabase';
import { profiles } from '../lib/dbColumns';

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from(profiles.table)
    .select(profiles.select)
    .eq('id', userId)
    .single();

  if (error) throw error;

  return {
    ...data,
    role: data.role?.toLowerCase() ?? null,
  };
}
