# BioLoop — Database Schema Reference

Authoritative column names for all Supabase tables. **Use these exact names** in services, queries, and `dbColumns.js`.

**Do not use:** `scheduled_at`, `available_balance`, `price_per_liter` on earnings, `oil_grade` on quality_logs, `updated_at` on tanks, `name` on collectors.

---

## `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary — equals `auth.users.id` |
| `email` | `text` | Unique |
| `role` | `app_role` | `restaurant` / `collector` / `manufacturer` / `admin` |
| `full_name` | `text` | Nullable |
| `phone` | `text` | Nullable |
| `status` | `user_status` | |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `restaurants`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `owner_user_id` | `uuid` | Links to `profiles.id` |
| `name` | `text` | |
| `address` | `text` | Nullable |
| `district` | `text` | Nullable — value comes from the fixed list in `src/lib/districts.js`, not free text |
| `primary_manufacturer_id` | `uuid` | Nullable — links to `manufacturers.id`. Default manufacturer this restaurant's oil routes to (see `docs/BUSINESS_LOGIC_QUESTIONS.md` #1). Admin-set. |
| `cuisine` | `text` | Nullable |
| `latitude` | `numeric` | Nullable |
| `longitude` | `numeric` | Nullable |
| `phone` | `text` | Nullable |
| `email` | `text` | Nullable |
| `image_url` | `text` | Nullable |
| `status` | `user_status` | |
| `verification_notes` | `text` | Nullable — admin's reason for verifying/unverifying, captured via the modal in `AdminDashboardScreen.js` |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `collectors`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `owner_user_id` | `uuid` | Links to `profiles.id` |
| `full_name` | `text` | Use this — not `name` |
| `employee_code` | `text` | Nullable Unique |
| `district` | `text` | Nullable — value comes from the fixed list in `src/lib/districts.js`, not free text |
| `route_name` | `text` | Nullable |
| `vehicle_info` | `text` | Nullable |
| `rating` | `numeric` | Nullable |
| `reviews_count` | `int4` | Nullable |
| `total_liters` | `numeric` | Nullable |
| `co2_saved_kg` | `numeric` | Nullable |
| `total_collections` | `int4` | Nullable |
| `is_on_duty` | `bool` | Not null, default `false` — shift availability, separate from `status` (account approval). Only on-duty + active collectors are offered pickups in the admin Dispatch board. |
| `current_latitude` | `numeric` | Nullable — live GPS, written by `DriverMapScreen` via `collectorService.updateCollectorLocation`, throttled to ~1 write/20s. Added in `014_collector_location.sql`. |
| `current_longitude` | `numeric` | Nullable — see `current_latitude`. |
| `location_updated_at` | `timestamptz` | Nullable — when the location fields were last written. Treat a stale value (driver off the app a while) as "position unknown", not current. |
| `status` | `user_status` | |
| `verification_notes` | `text` | Nullable |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `manufacturers`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `owner_user_id` | `uuid` | Links to `profiles.id` |
| `name` | `text` | |
| `address` | `text` | Nullable |
| `latitude` | `numeric` | Nullable — added `016_manufacturer_location.sql`. Needed for driver map navigation to the manufacturer leg; no UI writes this yet, so expect it null until an admin/manufacturer sets it. |
| `longitude` | `numeric` | Nullable — see `latitude`. |
| `contact_phone` | `text` | Nullable |
| `contact_email` | `text` | Nullable |
| `contact_person` | `text` | Nullable — used by `MANUFACTURER_FIELDS` (`src/lib/profileFields.js`) and `dbColumns.js`; profile-edit flow only, not previously documented here |
| `company_registration_number` | `text` | Nullable — see `contact_person` |
| `website_url` | `text` | Nullable — see `contact_person` |
| `company_description` | `text` | Nullable — see `contact_person` |
| `years_in_business` | `int4` | Nullable — see `contact_person` |
| `profile_image_url` | `text` | Nullable — see `contact_person` |
| `cover_image_url` | `text` | Nullable — see `contact_person` |
| `is_verified` | `bool` | Nullable — see `contact_person` |
| `verified_at` | `timestamptz` | Nullable — see `contact_person` |
| `position` | `text` | Nullable |
| `accepted_grades` | `json`/array | Nullable — grades this manufacturer will take, used by `manufacturerRoutingService.resolveManufacturerForPickup` as a hard filter |
| `status` | `user_status` | |
| `verification_notes` | `text` | Nullable |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `tanks`

Shared by both restaurants and manufacturers — mirrors the owner-FK pattern
`pickups` uses (nullable FKs per owner type, exactly one set). A restaurant
tank has `restaurant_id` set and `manufacturer_id` null; a manufacturer tank
has `manufacturer_id` set and `restaurant_id` null. Enforced by a check
constraint (`tanks_owner_check`). See `docs/migrations/001_merge_manufacturer_tanks.sql`.

Manufacturer-owned rows currently leave the sensor columns
(`temperature_f`, `connectivity`, `sediment_level`, `estimated_days_until_full`)
null — nothing writes them for manufacturers today.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | Nullable — set only for restaurant-owned tanks |
| `manufacturer_id` | `uuid` | Nullable — set only for manufacturer-owned tanks |
| `name` | `text` | |
| `fill_percent` | `numeric` | Nullable |
| `current_volume_liters` | `numeric` | Nullable |
| `temperature_f` | `numeric` | Nullable |
| `is_active` | `bool` | Nullable |
| `last_updated` | `timestamptz` | Nullable — use this, not `updated_at` |
| `connectivity` | `device_connectivity` | Nullable |
| `sediment_level` | `sediment_level` | Nullable |
| `status_text` | `text` | Nullable |
| `estimated_days_until_full` | `int4` | Nullable |
| `quality_grade` | `quality_grade` | Nullable — restaurant's own quality reading (manual entry today, stand-in for a real sensor). Authoritative for both manufacturer routing and payment, see `docs/BUSINESS_LOGIC_QUESTIONS.md` #4. |

---

## `pickups`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `collector_id` | `uuid` | Nullable |
| `manufacturer_id` | `uuid` | Nullable — auto-set by `manufacturerRoutingService.resolveManufacturerForPickup` when the restaurant has a matching primary manufacturer, else admin sets it manually |
| `tank_id` | `uuid` | Nullable |
| `pickup_date` | `date` | Nullable |
| `pickup_time_start` | `time` | Nullable |
| `pickup_time_end` | `time` | Nullable |
| `status` | `pickup_status` | See lifecycle in README |
| `urgency` | `urgency_level` | Nullable |
| `estimated_volume_liters` | `numeric` | Nullable |
| `actual_volume_liters` | `numeric` | Nullable |
| `quality_grade` | `quality_grade` | Nullable — copied from the tank's `quality_grade` at pickup creation, not re-measured later |
| `pickup_type` | `pickup_type` | **Required** |
| `manual_request_id` | `uuid` | Nullable |
| `decline_reason` | `text` | Nullable — set when a driver declines; `collector_id` is cleared and `status` reset to `pending` at the same time. The `pickups_collector_update` RLS policy has a `WITH CHECK` carve-out specifically for this exact shape (`collector_id IS NULL AND status = 'pending'`) — added `018_fix_pickups_collector_decline_rls.sql` after the default (USING-only) check turned out to reject a driver's own decline, since the row no longer "belongs" to them post-update. |
| `cancelled_by` | `uuid` | Nullable — the `profiles.id` of whoever cancelled it (restaurant/driver only allowed before `in_transit`; admin can override anytime) |
| `cancellation_reason` | `text` | Nullable |
| `notes` | `text` | Nullable |
| `driver_payout_amount` | `numeric` | Nullable — added `026_manufacturer_payment_flow.sql`. Admin-set per pickup (at dispatch, via the Dispatch board) — this is what the driver actually gets paid, checked by `payoutService.finalizePickupEarnings` before falling back to `platform_settings.driver_flat_rate_per_pickup`. |
| `collector_notes` | `text` | Nullable — mapped in `dbColumns.js` (`collectorNotes`); not currently written or read by any screen |
| `restaurant_notes` | `text` | Nullable — mapped in `dbColumns.js` (`restaurantNotes`); not currently written or read by any screen |
| `completed_at` | `timestamptz` | Nullable — set when `status` moves to `completed`. Only `manufacturerService.confirmDeliveryReceived` and `adminService.updatePickupStatus` ever set this (the driver's own flow stops at `arrived_manufacturer`, see lifecycle note below) |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

RLS: `pickups_restaurant_insert` (restaurant owner only), `pickups_select`
(restaurant owner OR manufacturer owner), `pickups_update` (collector owner OR
manufacturer owner, plus the post-decline carve-out from `018`), and
`pickups_admin_delete` — all with an `is_admin()` override. Manufacturer
access was added in `021_manufacturer_pickup_confirmation.sql` (before this, a
manufacturer had no RLS access to `pickups` at all and
`getPickupsForManufacturer` silently returned nothing for a real manufacturer
user) and immediately folded into one policy per command in
`022_pickups_rls_perf_consolidation.sql`, so SELECT/UPDATE aren't each
evaluating two separate permissive policies (same fix pattern as `010`/`011`
for every other table). None of these restrict *which* status transition is
allowed; that's enforced by the app layer (which UI buttons exist), not the
database.

---

## `manual_pickup_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `tank_id` | `uuid` | Nullable |
| `urgency` | `urgency_level` | |
| `reason` | `text` | |
| `notes` | `text` | Nullable |
| `is_auto_generated` | `bool` | Not null, default `false` — `true` when `restaurantService.updateTankFillPercent` auto-created this on crossing 85%. Shown as a tag in the admin Dispatch board. |
| `created_at` | `timestamptz` | Nullable |

---

## `quality_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `pickup_id` | `uuid` | Nullable |
| `grade` | `quality_grade` | Nullable — use `grade`, not `oil_grade` |
| `impurity_pct` | `numeric` | Nullable |
| `analyzed_by` | `text` | Nullable |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `market_rates`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `grade` | `quality_grade` | |
| `rate_per_liter` | `numeric` | |
| `change_label` | `text` | Nullable |
| `change_positive` | `bool` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `restaurant_balances` (view, not a table)

**As of `docs/migrations/013_drop_wallet_tables.sql` (2026-07-20), `restaurant_wallets` no longer exists.** It was a stored `balance` column that was never kept in sync by any write path — the only write to it, ever, was a one-time `balance: 0` insert at restaurant-profile creation. Replaced with this view, computed at query time as `sum(earnings.amount)` for that restaurant where `withdrawal_id IS NULL` (i.e. unclaimed earnings, available to withdraw — the exact same definition `payoutService.requestWithdrawal` already used in JS).

| Column | Type | Notes |
|---|---|---|
| `restaurant_id` | `uuid` | One row per restaurant (via `LEFT JOIN`, so a restaurant with zero earnings still returns `balance: 0`, not no row) |
| `balance` | `numeric` | Computed, not stored. Use `balance`, not `available_balance`. |

Created `WITH (security_invoker = true)` — required so the view re-checks RLS on `restaurants`/`earnings` as the querying user instead of running as the view owner (which would otherwise bypass RLS and leak every restaurant's balance to any authenticated user). A restaurant owner sees only their own row; admin (`is_admin()`) sees all of them, same as before.

---

## `collector_balances` (view, not a table)

Same shape and same migration as `restaurant_balances` above — `collector_wallets` is gone, replaced by this view. Same `security_invoker = true` reasoning applies.

| Column | Type | Notes |
|---|---|---|
| `collector_id` | `uuid` | One row per collector (`LEFT JOIN`, zero-earnings collectors still get `balance: 0`) |
| `balance` | `numeric` | Computed, not stored |

---

## `earnings`

Shared by restaurants and collectors — mirrors the `tanks` owner-FK pattern (nullable FK per owner type, exactly one set, enforced by `earnings_owner_check`). Created automatically by `payoutService.finalizePickupEarnings` when a pickup is marked `completed`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | Nullable — set only for restaurant earnings |
| `collector_id` | `uuid` | Nullable — set only for driver earnings |
| `pickup_id` | `uuid` | Nullable |
| `amount` | `numeric` | |
| `liters` | `numeric` | Nullable |
| `quality_grade` | `quality_grade` | Nullable — not `oil_grade` |
| `description` | `text` | Nullable |
| `withdrawal_id` | `uuid` | Nullable — links to the `withdrawals` row that paid this out. `payoutService.requestWithdrawal` only sums rows where this is null, so a row is never paid out twice. |
| `gateway_reference` | `uuid` | Nullable — added `026_manufacturer_payment_flow.sql`. Points at the `payment_transactions` row (the manufacturer's payment) that funded this earnings row. |
| `created_at` | `timestamptz` | Nullable |

---

## `withdrawals`

Same owner-FK pattern as `earnings` (`withdrawals_owner_check`).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | Nullable — set only for restaurant withdrawals |
| `collector_id` | `uuid` | Nullable — set only for driver withdrawals |
| `amount` | `numeric` | |
| `method` | `text` | Nullable |
| `status` | `text` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `platform_settings`

Single-row table. Both figures default to `0` — the team never gave real numbers, so nothing computes payouts from an invented figure. Set real values via the admin Finance tab's Settings modal before treating payout amounts as real.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `commission_pct` | `numeric` | Not null, default `0` — % of gross pickup value the platform keeps (skimmed from the restaurant's share) |
| `driver_flat_rate_per_pickup` | `numeric` | Not null, default `0` — fallback only, used when a pickup has no admin-set `pickups.driver_payout_amount` |
| `manufacturer_markup_pct` | `numeric` | Not null, default `10` — added `026_manufacturer_payment_flow.sql`. % added on top of the oil's gross value (volume × market rate) to get what the manufacturer actually pays at checkout — a separate margin from `commission_pct`, funded by the manufacturer rather than skimmed from the restaurant. |
| `updated_at` | `timestamptz` | Nullable |

---

## `payment_transactions`

Added `026_manufacturer_payment_flow.sql` — records a manufacturer's payment for a delivered pickup, via **real PayFast sandbox checkout** (`supabase/functions/payfast-checkout` + `payfast-itn`, see `docs/PAYFAST_INTEGRATION.md`). RLS (`028_payment_transactions_readonly_rls.sql`) is **select-only** for the owning manufacturer (to poll for completion) and admin — all writes happen server-side in the two Edge Functions via the service-role key, not from the client.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `pickup_id` | `uuid` | Nullable |
| `manufacturer_id` | `uuid` | Not null |
| `amount` | `numeric` | The manufacturer's total charge — gross oil value + `manufacturer_markup_pct`, computed server-side in `payfast-checkout`, never trusted from the client |
| `item_name` | `text` | Nullable |
| `status` | `text` | `pending` / `complete` / `failed` / `cancelled` — flipped by `payfast-itn` after verifying PayFast's callback signature |
| `m_payment_id` | `text` | Our own reference, generated in `payfast-checkout` |
| `pf_payment_id` | `text` | Nullable until PayFast's ITN arrives — PayFast's own payment ID |
| `signature_verified` | `bool` | Not null, default `false` — set `true` by `payfast-itn` once the ITN signature checks out |
| `raw_itn` | `jsonb` | Nullable — the full ITN payload as received, for support/dispute lookups |
| `created_at` | `timestamptz` | Not null |
| `updated_at` | `timestamptz` | Not null |

---

## `alerts`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` | Filter by `owner_user_id` of logged-in user |
| `title` | `text` | |
| `message` | `text` | |
| `type` | `text` | Nullable |
| `category` | `alert_category` | Nullable |
| `is_read` | `bool` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `tank_readings`

`tank_id` can point at either a restaurant-owned or manufacturer-owned
`tanks` row — it's agnostic to owner type.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `tank_id` | `uuid` | |
| `fill_percent` | `numeric` | |
| `temperature_f` | `numeric` | Nullable |
| `recorded_at` | `timestamptz` | |

---

## `activity_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `title` | `text` | |
| `subtitle` | `text` | Nullable |
| `badge` | `text` | Nullable |
| `badge_type` | `activity_badge_type` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `pickup_schedules`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `title` | `text` | |
| `subtitle` | `text` | Nullable |
| `frequency` | `schedule_frequency` | |
| `next_pickup_date` | `date` | |
| `is_active` | `bool` | |
| `created_at` | `timestamptz` | Nullable |

---

## `manufacturer_inventory`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `manufacturer_id` | `uuid` | Unique |
| `current_stock_liters` | `numeric` | |
| `stock_change_pct` | `numeric` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `forecasts`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `manufacturer_id` | `uuid` | |
| `period_days` | `int4` | |
| `total_volume_liters` | `numeric` | |
| `grade_a_pct` | `numeric` | Nullable |
| `grade_b_pct` | `numeric` | Nullable |
| `grade_c_pct` | `numeric` | Nullable |
| `trend_label` | `text` | Nullable |
| `confidence_pct` | `numeric` | Nullable |
| `created_at` | `timestamptz` | |

---

## `ai_chat_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` | |
| `is_user` | `bool` | |
| `message_text` | `text` | |
| `created_at` | `timestamptz` | Nullable |

---

## UI concept → column mapping

| UI label | Table.column |
|---|---|
| Tank fill % | `tanks.fill_percent` |
| Tank volume | `tanks.current_volume_liters` |
| Tank temperature | `tanks.temperature_f` |
| Last IoT ping | `tanks.last_updated` |
| Wallet balance | `restaurant_balances.balance` (view — see below, not a stored column) |
| Oil grade (quality) | `quality_logs.grade` |
| Oil grade (earnings) | `earnings.quality_grade` |
| Impurity % | `quality_logs.impurity_pct` |
| Market price | `market_rates.rate_per_liter` |
| Pickup date | `pickups.pickup_date` |
| Pickup time window | `pickups.pickup_time_start` + `pickup_time_end` |
| Pickup volume | `pickups.estimated_volume_liters` |
| Driver name | `collectors.full_name` (via join) |
| Next recurring pickup | `pickup_schedules.next_pickup_date` |
| Chart readings | `tank_readings.fill_percent` @ `recorded_at` |
