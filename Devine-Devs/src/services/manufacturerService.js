import { supabase } from '../../supabase';
import { pickups as pickupsSchema } from '../lib/dbColumns';
import { finalizePickupEarnings } from './payoutService';
import { notifyAllAdmins, notifyUser } from './notificationService';

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
    .from('tanks')
    .select('*')
    .eq('manufacturer_id', manufacturerId)
    .order('last_updated', { ascending: false });

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

export async function getAssignedRestaurants(manufacturerId) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('primary_manufacturer_id', manufacturerId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPickupsForManufacturer(manufacturerId) {
  // Join restaurant and collector info for UI convenience
  const select = "*, restaurants(name, address, phone, email, cuisine, image_url, created_at), collectors(full_name, rating)";

  const { data, error } = await supabase
    .from(pickupsSchema.table)
    .select(select)
    .eq('manufacturer_id', manufacturerId)
    .order('pickup_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

const confirmationPickupSelect =
  '*, restaurants(name, owner_user_id), collectors(full_name, owner_user_id), manufacturers(name)';

/**
 * The manufacturer's confirmation is what actually finishes a trip: the
 * driver's last checkpoint is 'arrived_manufacturer' (see
 * collectorService.notifyForStatus) and stops there — this is the only path
 * that moves a pickup to 'completed', creates earnings, and notifies the
 * restaurant/driver/admin the trip is done.
 */
async function notifyDeliveryConfirmed(pickup) {
  const restaurantOwnerId = pickup.restaurants?.owner_user_id ?? null;
  const collectorOwnerId = pickup.collectors?.owner_user_id ?? null;
  const restaurantName = pickup.restaurants?.name ?? 'the restaurant';
  const manufacturerName = pickup.manufacturers?.name ?? 'the manufacturer';

  const jobs = [];

  if (restaurantOwnerId) {
    jobs.push(notifyUser(restaurantOwnerId, {
      title: 'Delivery confirmed',
      message: `${manufacturerName} confirmed receipt of your oil. Earnings recorded.`,
      category: 'delivery',
    }));
  }

  if (collectorOwnerId) {
    jobs.push(notifyUser(collectorOwnerId, {
      title: 'Trip complete',
      message: `${manufacturerName} confirmed receipt of the oil you delivered. Trip complete.`,
      category: 'delivery',
    }));
  }

  jobs.push(notifyAllAdmins({
    title: 'Trip complete',
    message: `${manufacturerName} confirmed receipt of oil from ${restaurantName}.`,
    category: 'delivery',
  }));

  if (jobs.length) await Promise.allSettled(jobs);
}

/**
 * `gatewayReference` is a payment_transactions.id — the manufacturer only
 * reaches this after paying (see ManufacturerPaymentScreen), so by the time
 * this runs the payment is already recorded; this just finishes the trip and
 * stamps the earnings it creates with which payment funded them.
 */
export async function confirmDeliveryReceived(pickupId, gatewayReference) {
  const { data, error } = await supabase
    .from(pickupsSchema.table)
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', pickupId)
    .select(confirmationPickupSelect)
    .single();

  if (error) throw error;

  await finalizePickupEarnings(data, { gatewayReference });

  try {
    await notifyDeliveryConfirmed(data);
  } catch (err) {
    console.error('Error sending delivery confirmation notifications:', err.message);
  }

  return data;
}

export async function updateAlertReadStatus(alertId, isRead) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read: isRead })
    .eq('id', alertId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAlert(alertId) {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId);

  if (error) throw error;
  return alertId;
}

const EMPTY_BUNDLE = {
  manufacturer: null,
  inventory: null,
  tanks: [],
  forecasts: [],
  pickups: [],
  alerts: [],
  assignedRestaurants: [],
};

export async function loadManufacturerBundle(ownerUserId) {
  const manufacturer = await getManufacturerByOwnerId(ownerUserId);

  if (!manufacturer) return { ...EMPTY_BUNDLE };

  const manufacturerId = manufacturer.id;

  const [inventory, tanks, forecasts, pickups, alerts, assignedRestaurants] = await Promise.all([
    getManufacturerInventory(manufacturerId),
    getManufacturerTanks(manufacturerId),
    getForecasts(manufacturerId),
    getPickupsForManufacturer(manufacturerId),
    supabase.from('alerts').select('*').eq('user_id', ownerUserId).order('created_at', { ascending: false }).then(r => { if (r.error) throw r.error; return r.data ?? []; }),
    getAssignedRestaurants(manufacturerId),
  ]);

  return {
    manufacturer,
    inventory,
    tanks,
    forecasts,
    pickups,
    alerts,
    assignedRestaurants,
  };
}

export default {
  getManufacturerByOwnerId,
  getManufacturerInventory,
  getManufacturerTanks,
  getForecasts,
  getPickupsForManufacturer,
  getAssignedRestaurants,
  confirmDeliveryReceived,
  loadManufacturerBundle,
  updateAlertReadStatus,
  deleteAlert,
};
