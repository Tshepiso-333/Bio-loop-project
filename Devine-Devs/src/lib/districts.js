/**
 * Fixed list of delivery districts. Replaces free-text district entry so the
 * the DB-side district-match fallback in resolve_collector_for_pickup (migration 034)
 * can rely on exact matches instead of whatever text someone typed.
 *
 * Placeholder values based on the Johannesburg/Gauteng area already used as
 * placeholders elsewhere in profileFields.js — replace with the business's
 * real operating zones before relying on this for actual dispatch.
 */
export const DISTRICTS = [
  'Johannesburg Central',
  'Sandton',
  'Randburg',
  'Roodepoort',
  'Soweto',
  'Midrand',
  'Germiston',
  'Boksburg',
  'Kempton Park',
  'Pretoria Central',
  'Centurion',
];
