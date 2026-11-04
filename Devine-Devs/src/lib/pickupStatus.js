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

// One pickup row means different things to different people, so each audience
// gets its own wording rather than sharing a lowest-common-denominator word.
// The restaurant already had its own copy (PickupsScreen.STATUS_COPY) and the
// manufacturer its own labels; these two complete the set.
//
// The word that used to be wrong: every pre-trip state read "Pending" for
// everyone. To a restaurant that is true — they are waiting. To the DRIVER it
// is not: the job is already theirs and is waiting to be started.

/**
 * The driver's own view: what this job is to the person doing it.
 */
export const DRIVER_STATUS_LABELS = {
  pending: 'To do',
  scheduled: 'To do',
  assigned: 'To do',
  in_transit: 'Heading there',
  arrival: 'At restaurant',
  in_progress: 'Collecting',
  collected: 'Oil on board',
  arrived_manufacturer: 'Dropped off',
  completed: 'Complete',
  cancelled: 'Cancelled',
};

/**
 * The system-wide view, used by admin: who holds the job and where it is,
 * described from outside rather than from any one party's seat.
 */
export const PICKUP_STATUS_LABELS = {
  pending: 'Unassigned',
  scheduled: 'Assigned',
  assigned: 'Assigned',
  in_transit: 'Driver en route',
  arrival: 'Driver at restaurant',
  in_progress: 'Collecting',
  collected: 'To manufacturer',
  arrived_manufacturer: 'Awaiting confirmation',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * The manufacturer's view: everything phrased as "is my oil coming".
 * Lived in ManufacturerDashboardScreen; moved here so the other manufacturer
 * screens stop falling back to the system wording.
 */
export const DELIVERY_STATUS_LABELS = {
  pending: 'Awaiting a driver',
  scheduled: 'Awaiting a driver',
  assigned: 'Awaiting a driver',
  in_transit: 'Driver en route to restaurant',
  arrival: 'Driver at restaurant',
  in_progress: 'Collecting',
  collected: 'On the way to you',
  arrived_manufacturer: 'Driver arrived',
  completed: 'Delivered',
  cancelled: 'Cancelled',
};

// Which physical stop the driver is currently headed to / at, for a given status.
export const legForStatus = (status) =>
  status === 'collected' || status === 'arrived_manufacturer' ? 'manufacturer' : 'restaurant';
