import { supabase } from '../../supabase';
import { pickups as pickupsSchema } from '../lib/dbColumns';

export async function getManufacturerByOwnerId(ownerUserId) {
  const { data, error } = await supabase
    .from('manufacturers')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getManufacturerInventory(manufacturerId) {
  const { data, error } = await supabase
    .from('manufacturer_inventory')
    .select('*')
    .eq('manufacturer_id', manufacturerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getManufacturerTanks(manufacturerId) {
  const { data, error } = await supabase
    .from('manufacturer_tanks')
    .select('*')
    .eq('manufacturer_id', manufacturerId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getForecasts(manufacturerId) {
  const { data, error } = await supabase
    .from('forecasts')
    .select('*')
    .eq('manufacturer_id', manufacturerId)
    .order('period_days', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPickupsForManufacturer(manufacturerId) {
  // Join restaurant and collector info for UI convenience
  const select = "*, restaurants(name, address, phone), collectors(full_name, rating)";

  const { data, error } = await supabase
    .from(pickupsSchema.table)
    .select(select)
    .eq('manufacturer_id', manufacturerId)
    .order('pickup_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

const EMPTY_BUNDLE = {
  manufacturer: null,
  inventory: null,
  tanks: [],
  forecasts: [],
  pickups: [],
  alerts: [],
};

export async function loadManufacturerBundle(ownerUserId) {
  const manufacturer = await getManufacturerByOwnerId(ownerUserId);

  if (!manufacturer) return { ...EMPTY_BUNDLE };

  const manufacturerId = manufacturer.id;

  const [inventory, tanks, forecasts, pickups, alerts] = await Promise.all([
    getManufacturerInventory(manufacturerId),
    getManufacturerTanks(manufacturerId),
    getForecasts(manufacturerId),
    getPickupsForManufacturer(manufacturerId),
    supabase.from('alerts').select('*').eq('user_id', ownerUserId).order('created_at', { ascending: false }).then(r => { if (r.error) throw r.error; return r.data ?? []; }),
  ]);

  return {
    manufacturer,
    inventory,
    tanks,
    forecasts,
    pickups,
    alerts,
  };
}

export default {
  getManufacturerByOwnerId,
  getManufacturerInventory,
  getManufacturerTanks,
  getForecasts,
  getPickupsForManufacturer,
  loadManufacturerBundle,
};
