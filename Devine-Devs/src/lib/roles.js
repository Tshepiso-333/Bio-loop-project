/**
 * Role constants and stack mapping.
 * profiles.role is the source of truth; collector maps to DriverStack (UI naming).
 */
export const ROLES = {
  RESTAURANT: 'restaurant',
  COLLECTOR: 'collector',
  MANUFACTURER: 'manufacturer',
  ADMIN: 'admin',
};

export const VALID_ROLES = Object.values(ROLES);

export const isValidRole = (role) =>
  typeof role === 'string' && VALID_ROLES.includes(role.toLowerCase());
