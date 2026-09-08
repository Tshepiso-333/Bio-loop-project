import { supabase } from '../../supabase';

/**
 * Decides which manufacturer a pickup should route to, based on the
 * restaurant's primary manufacturer relationship and that manufacturer's
 * accepted grades. Returns null (falls back to admin's manual assignment)
 * when there's no primary manufacturer, or the grade doesn't match what
 * they accept.
 */
export async function resolveManufacturerForPickup(restaurantId, grade) {
  if (!restaurantId) return null;

  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('primary_manufacturer_id')
    .eq('id', restaurantId)
    .maybeSingle();

  if (restaurantError) throw restaurantError;
  if (!restaurant?.primary_manufacturer_id) return null;

  const { data: manufacturer, error: manufacturerError } = await supabase
    .from('manufacturers')
    .select('id, accepted_grades')
    .eq('id', restaurant.primary_manufacturer_id)
    .maybeSingle();

  if (manufacturerError) throw manufacturerError;
  if (!manufacturer) return null;

  const acceptedGrades = Array.isArray(manufacturer.accepted_grades) ? manufacturer.accepted_grades : null;

  if (!grade || !acceptedGrades || acceptedGrades.length === 0) {
    return manufacturer.id;
  }

  return acceptedGrades.includes(grade) ? manufacturer.id : null;
}
