import { supabase } from '../../supabase';
import { profiles, collectors, restaurants, manufacturers } from '../lib/dbColumns';

function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
}

export async function getProfile(userId) {
  const { data: profile, error: profileError } = await supabase
    .from(profiles.table)
    .select(profiles.select)
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  const normalizedRole = profile.role?.toLowerCase() ?? null;
  let roleData = null;

  switch (normalizedRole) {
    case 'collector': {
      const { data, error } = await supabase
        .from(collectors.table)
        .select(collectors.select)
        .eq('owner_user_id', userId)
        .maybeSingle();
      if (!error) roleData = data;
      break;
    }
    case 'restaurant': {
      const { data, error } = await supabase
        .from(restaurants.table)
        .select(restaurants.select)
        .eq('owner_user_id', userId)
        .maybeSingle();
      if (!error) roleData = data;
      break;
    }
    case 'manufacturer': {
      const { data, error } = await supabase
        .from(manufacturers.table)
        .select(manufacturers.select)
        .eq('owner_user_id', userId)
        .maybeSingle();
      if (!error) roleData = data;
      break;
    }
    default:
      roleData = null;
  }

  return {
    ...profile,
    role: normalizedRole,
    businessDetails: roleData,
  };
}

export async function updateBaseProfile(userId, payload) {
  const updates = pick(payload, [
    'full_name',
    'phone',
    'profile_image_url',
    'city',
    'province',
    'bio',
  ]);

  const { data, error } = await supabase
    .from(profiles.table)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select(profiles.select)
    .single();

  if (error) throw error;
  return data;
}

export async function ensureRoleBusinessRecord(userId, role, baseProfile = {}) {
  const normalizedRole = role?.toLowerCase();

  if (normalizedRole === 'collector') {
    const existing = await supabase
      .from(collectors.table)
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();
    if (existing.data) return existing.data;

    const { data, error } = await supabase
      .from(collectors.table)
      .insert({
        owner_user_id: userId,
        full_name: baseProfile.full_name ?? 'Collector',
        employee_code: `COL-${userId.slice(0, 8).toUpperCase()}`,
      })
      .select(collectors.select)
      .single();
    if (error) throw error;
    return data;
  }

  if (normalizedRole === 'restaurant') {
    const existing = await supabase
      .from(restaurants.table)
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();
    if (existing.data) return existing.data;

    const { data, error } = await supabase
      .from(restaurants.table)
      .insert({
        owner_user_id: userId,
        name: baseProfile.full_name ? `${baseProfile.full_name}'s Restaurant` : 'My Restaurant',
        owner_name: baseProfile.full_name ?? null,
        email: baseProfile.email ?? null,
      })
      .select(restaurants.select)
      .single();
    if (error) throw error;

    await supabase
      .from('restaurant_wallets')
      .insert({ restaurant_id: data.id, balance: 0 })
      .select('id')
      .maybeSingle();

    return data;
  }

  if (normalizedRole === 'manufacturer') {
    const existing = await supabase
      .from(manufacturers.table)
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();
    if (existing.data) return existing.data;

    const { data, error } = await supabase
      .from(manufacturers.table)
      .insert({
        owner_user_id: userId,
        name: baseProfile.full_name ? `${baseProfile.full_name} Manufacturing` : 'My Company',
        contact_person: baseProfile.full_name ?? null,
        contact_email: baseProfile.email ?? null,
      })
      .select(manufacturers.select)
      .single();
    if (error) throw error;
    return data;
  }

  return null;
}

export async function updateCollectorProfile(recordId, payload) {
  const updates = pick(payload, [
    'full_name',
    'district',
    'route_name',
    'vehicle_info',
    'profile_image_url',
    'vehicle_type',
    'vehicle_make',
    'vehicle_model',
    'vehicle_registration',
    'drivers_license_number',
    'years_experience',
    'languages',
    'bio',
  ]);

  const { data, error } = await supabase
    .from(collectors.table)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', recordId)
    .select(collectors.select)
    .single();

  if (error) throw error;
  return data;
}

export async function updateRestaurantProfile(recordId, payload) {
  const updates = pick(payload, [
    'name',
    'owner_name',
    'business_type',
    'address',
    'district',
    'cuisine',
    'latitude',
    'longitude',
    'phone',
    'email',
    'image_url',
    'website_url',
    'google_business_url',
    'operating_hours',
    'estimated_monthly_oil_liters',
    'pickup_instructions',
    'preferred_pickup_days',
    'profile_image_url',
    'cover_image_url',
  ]);

  const { data, error } = await supabase
    .from(restaurants.table)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', recordId)
    .select(restaurants.select)
    .single();

  if (error) throw error;
  return data;
}

export async function updateManufacturerProfile(recordId, payload) {
  const updates = pick(payload, [
    'name',
    'address',
    'contact_phone',
    'contact_email',
    'position',
    'contact_person',
    'company_registration_number',
    'website_url',
    'company_description',
    'accepted_grades',
    'years_in_business',
    'profile_image_url',
    'cover_image_url',
  ]);

  const { data, error } = await supabase
    .from(manufacturers.table)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', recordId)
    .select(manufacturers.select)
    .single();

  if (error) throw error;
  return data;
}

export async function saveRoleProfile(userId, role, { base = {}, business = {} }) {
  const normalizedRole = role?.toLowerCase();
  await updateBaseProfile(userId, base);

  let businessRecord = await ensureRoleBusinessRecord(userId, normalizedRole, {
    ...base,
    email: base.email,
  });

  if (!businessRecord?.id) {
    return getProfile(userId);
  }

  switch (normalizedRole) {
    case 'collector':
      businessRecord = await updateCollectorProfile(businessRecord.id, {
        ...business,
        full_name: business.full_name ?? base.full_name,
      });
      break;
    case 'restaurant':
      businessRecord = await updateRestaurantProfile(businessRecord.id, business);
      break;
    case 'manufacturer':
      businessRecord = await updateManufacturerProfile(businessRecord.id, business);
      break;
    default:
      break;
  }

  return getProfile(userId);
}

export default {
  getProfile,
  updateBaseProfile,
  ensureRoleBusinessRecord,
  updateCollectorProfile,
  updateRestaurantProfile,
  updateManufacturerProfile,
  saveRoleProfile,
};
