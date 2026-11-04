// Where tapping an alert should take someone.
//
// Deliberately free of react-native and expo imports so it is plain,
// testable logic — pushService re-exports it for the notification tap, and
// the in-app bell can use the same function, which is the point: tapping the
// banner and tapping the bell entry must land in the same place.

// Each role's stack uses its own route names (see navigation/*Stack.js), so a
// tap has to be routed per role. `pickup` is where a pickup-specific alert
// goes; `money` is where a payout/withdrawal alert goes; `fallback` is used
// when meta says nothing useful.
export const ROLE_ROUTES = {
  restaurant: { pickup: 'Pickups', money: 'Earnings', fallback: 'Home' },
  collector: { pickup: 'DriverCollections', money: 'DriverHome', fallback: 'DriverHome' },
  manufacturer: {
    pickup: 'ManufacturerPayment',
    money: 'Forecasts',
    fallback: 'ManufacturerDashboardScreen',
  },
  admin: { pickup: 'AdminDashboard', money: 'AdminDashboard', fallback: 'AdminDashboard' },
};

/**
 * @param alert { meta, category } — meta is the jsonb payload from migration 064
 * @param role  'restaurant' | 'collector' | 'manufacturer' | 'admin'
 * @returns { screen, params } or null when nothing can be resolved
 *
 * meta.screen wins when present, but only if that role's stack actually has
 * it: a stale or mistyped route name would otherwise throw inside the
 * navigator. Anything unresolvable returns null, and the caller just opens
 * the app — never crash on a notification tap.
 */
export function routeForAlert({ meta = {}, category } = {}, role) {
  const routes = ROLE_ROUTES[role];
  if (!routes) return null;

  if (meta.screen && Object.values(routes).includes(meta.screen)) {
    return { screen: meta.screen, params: meta };
  }

  if (meta.pickupId) {
    return { screen: routes.pickup, params: { pickupId: meta.pickupId } };
  }

  // A withdrawal alert carries an amount but no pickup — send them to wherever
  // that role sees their money.
  if (meta.amount != null || meta.screen === 'Wallet') {
    return { screen: routes.money, params: {} };
  }

  return { screen: routes.fallback, params: {} };
}
