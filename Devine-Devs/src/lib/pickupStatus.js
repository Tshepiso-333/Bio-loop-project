// Single source of truth for the pickup_status enum's driver-trip checkpoints.
// See docs/SCHEMA.md + docs/README.md's "Pickup lifecycle" table for the full
// enum (includes 'scheduled', 'cancelled' which aren't part of the active leg).

// Every checkpoint from the driver accepting through delivery at the
// manufacturer. Excludes the terminal 'completed'/'cancelled' states.
export const ACTIVE_TRIP_STATUSES = ['in_transit', 'arrival', 'in_progress', 'collected', 'arrived_manufacturer'];

// Assigned to a driver but not yet accepted into an active trip. 'assigned'
// is a legacy value (older admin code path / seed data) — current dispatch
// (adminService.assignCollectorToPickup) sets 'scheduled' instead, but rows
// written before that change still carry 'assigned', so both must be treated
// the same as 'pending' here.
export const PRE_TRIP_STATUSES = ['pending', 'scheduled', 'assigned'];

export const PICKUP_STATUS_LABELS = {
  pending: 'Pending',
  scheduled: 'Pending',
  assigned: 'Pending',
  in_transit: 'Heading to restaurant',
  arrival: 'At restaurant',
  in_progress: 'Collecting',
  collected: 'To manufacturer',
  arrived_manufacturer: 'At manufacturer',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Which physical stop the driver is currently headed to / at, for a given status.
export const legForStatus = (status) =>
  status === 'collected' || status === 'arrived_manufacturer' ? 'manufacturer' : 'restaurant';
