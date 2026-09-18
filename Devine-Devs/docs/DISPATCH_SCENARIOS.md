# Auto-dispatch — how a pickup finds its driver

No human assigns drivers. Every `pickups` row gets a driver from the database
the moment it exists (`trg_pickups_auto_dispatch`, migration 034), and the
rules below keep that true as drivers come and go. All logic is in Postgres
(migrations 034, 046, 051, 055); the apps only read the result.

## Ranking (migration 055) — `resolve_collector_for_pickup(restaurant_id)`

Candidates: on-duty, `status = 'active'` drivers (minus one being excluded, e.g. a decliner). Ordered by:

1. **Load** — drivers with no active trip first; then the least loaded.
   Active = `scheduled / assigned / in_transit / arrival / in_progress / collected / arrived_manufacturer`.
2. **Distance** — real haversine when both sides have GPS ≤ 2 h old; otherwise district match; unknown last.
3. **Fairness** — fewest trips completed today.
4. Rating, then who came on duty first.

## Scenarios (all verified in a rolled-back test, 2026-09-18)

| # | Situation | What happens |
|---|---|---|
| S1 | 3 drivers on duty, 1 pickup | nearest **free** driver |
| S2 | 1 driver on duty, 3 pickups | that driver gets all 3 (queued as `scheduled`); order is theirs |
| S3 | nearest driver is mid-trip | a free driver wins even if further away |
| S4 | everyone is busy | least-loaded driver — never left unassigned while someone is on duty |
| S5 | driver declines | re-dispatched immediately to someone else, decliner excluded (034) |
| S6 | driver goes off duty with queued pickups | untouched (`scheduled`) pickups go to another driver, or back to `pending`; a trip already `in_transit`+ stays theirs |
| S7 | nobody on duty | pickup waits as `pending`; assigned the instant a driver goes on duty or posts GPS (046/051) |
| S8 | driver's phone dies | pg_cron (every 5 min) sets anyone silent > 30 min to off duty → S6 kicks in; driver + admins alerted |
| S9 | no GPS on either side | district match (034), else any free on-duty driver |
| S10 | two equal candidates | the one with fewer trips today |

## What the apps see

- **Driver**: pickups appear in their list with an alert; declining is the only "no". Going off duty hands queued pickups back automatically.
- **Restaurant**: pickup card shows the assigned driver (RLS 049) or "waiting for a driver".
- **Admin**: Pickups tab is read-only history; a pickup with no driver is displayed as waiting, not as a task.

## Knobs (all in SQL, one place each)

- Stale threshold: `30 minutes` in `sweep_stale_drivers()`; cron `*/5 * * * *`.
- GPS freshness for distance: `2 hours` in the resolver.
- Restaurant/driver coordinates: `restaurants.latitude/longitude`, `collectors.current_*` (written by the driver map every ~20 s).

Test suite: `scratchpad/dispatch_test.sql` in the session that wrote 055 — copy of the assertions lives in that migration's header.
