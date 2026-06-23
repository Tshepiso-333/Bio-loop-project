import { supabase } from '../../supabase';
import { profiles } from '../lib/dbColumns';

export async function getProfile(userId) {
  // 1. Fetch the core profile (gives us the role column populated)
  const { data: profile, error: profileError } = await supabase
    .from(profiles.table)
    .select(profiles.select)
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  const normalizedRole = profile.role?.toLowerCase() ?? null;
  let roleData = null;

  // 2. Conditionally fetch based on the specific business role
  switch (normalizedRole) {
    case 'collector': {
      const { data, error } = await supabase
        .from('collectors')
        .select('*')
        .eq('owner_user_id', userId)
        .maybeSingle();

      if (!error) roleData = data;
      break;
    }

    case 'restaurant': {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_user_id', userId)
        .maybeSingle();

      if (!error) roleData = data;
      break;
    }

    case 'manufacturer': {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('*')
        .eq('owner_user_id', userId)
        .maybeSingle();

      if (!error) roleData = data;
      break;
    }

    default:
      // In case there is an unassigned role or a different type
      roleData = null;
      break;
  }

  // 3. Package and return the final unified result
  return {
    ...profile,
    role: normalizedRole,
    businessDetails: roleData, // Stores the specific table results dynamically here
  };
}