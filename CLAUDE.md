# BioLoop / Devine-Devs

React Native + Expo app with Supabase as the entire backend (Postgres + Auth + Storage, no custom server). Four roles share one database: `restaurant`, `collector` (driver), `manufacturer`, `admin` — see `profiles.role`.

## Read these first

- `Devine-Devs/docs/BACKEND_HANDBOOK.md` — how the backend is structured (Service → Context → Screen pattern, auth flow, caching), written to teach, not just reference.
- `Devine-Devs/docs/SCHEMA.md` — authoritative column names for every table. **Always check this before writing a raw column name** — several columns have deceptively-named traps documented at the top of the file.
- `Devine-Devs/docs/BUSINESS_LOGIC_QUESTIONS.md` — the business rules the team has actually locked in (routing, grading, payments, verification, cancellation). Don't re-derive or re-guess these; they're decided.
- `Devine-Devs/docs/DISPATCH_ROADMAP.md` — what's built vs. still-gap for cross-role notifications/dispatch.
- `Devine-Devs/docs/PAYFAST_INTEGRATION.md` — payment gateway status (currently: inbound collection only, scaffolding not live code).
- `Devine-Devs/docs/EXHIBITION_READINESS.md` — the 2026-11-03 pre-production review: what was cleaned up, the three security findings, the critical audit-trigger bug, the business-model problem with the per-litre rates, and the exhibition plan. Read §2 first — it's the open decisions.
- `Devine-Devs/docs/BACKEND_DEFENCE_BRIEF.md` — the whole backend and **why each decision was made that way**: architecture, auth, RLS (incl. the `is_admin()` recursion and the `USING`/`WITH CHECK` decline bug), the money model end to end, PayFast, the IoT RPC, dispatch resolution, observability, the known gaps, and a 30-question drill. Written from the live DB (`pg_policy`/`pg_proc`/`pg_trigger`) and the deployed functions, so it reflects what is actually running.
- `Devine-Devs/docs/EXHIBITION_DAY_PACK.md` — the stand-side companion, built from the five official UJ documents: the timetable, **stand 110's real position (one open side, mid-row, faces the 2.5 m aisle)**, the 15 judges and what each one is marking, the 90-second demo script with its fail-safes, the container calibration procedure, and an audit of what the printed walls claim against what the app actually does. Read §0.

These docs are gitignored (intentionally — internal working docs, not meant to be committed) so they won't show up in `git log`/diffs, but they're the real source of truth on disk. Read them directly.

## Schema migrations

`Devine-Devs/docs/migrations/` — numbered SQL files, also gitignored, mirroring what's actually been applied to the DB (currently up to `091`; **092 is the next free number**). **`006_consolidated_idempotent_sync.sql` and `007_owner_rls_safety_net.sql` are the base source of truth** — they supersede 001-005 by re-deriving the same end state using only idempotent operations (`add column if not exists`, `drop policy if exists` + recreate, etc.), because it became unclear which of the earlier ones had actually been run. 008-020 are incremental on top of that base. Any new migration should follow the same idempotent pattern — assume you don't know the exact current DB state, and write SQL that's safe to run regardless.

Since the Supabase MCP server is active in this project (see below), migrations are typically applied directly via the `apply_migration` MCP tool rather than pasted into the SQL editor by hand — **when you do that, also write the matching numbered `.sql` file into `docs/migrations/`** (same content, same name as passed to the tool). This folder is the on-disk history; the MCP tool applying a migration doesn't create the file for you, and this has drifted before (check `mcp__supabase__list_migrations` if unsure, and don't assume the last file on disk is the last one actually applied — `list_migrations` also renames things, so a file on disk may appear under a different name there).

**You never have to retype a migration to get it on disk.** Supabase keeps the full SQL of every applied migration in `supabase_migrations.schema_migrations` (`version`, `name`, `statements text[]`). Query it and write the files out — that way the files are the applied SQL by construction instead of a hand copy that can diverge. The Management API accepts a query with the token already in `.env.supabase-mcp`:

```
POST https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query
Authorization: Bearer $SUPABASE_ACCESS_TOKEN
{"query":"select version, name, array_to_string(statements, E';\\n') as sql
            from supabase_migrations.schema_migrations order by version"}
```

Comments survive the round trip, so the files keep their headers. This is how 078–088 were written.

`create or replace view` **cannot rename, drop or reorder a view's columns** — it fails with `42P16`. Changing a view's column set means `drop view if exists` + `create view` (this bit 073).

## Working conventions from this project's build sessions

- After any code change, rebuild the bundle to catch syntax/import errors before calling something done: `cd Devine-Devs && npx expo export --platform android --output-dir <temp-dir>`, then delete the temp dir. This app has no automated test suite; this is the verification step.
- Admin RLS is enforced via a `public.is_admin()` SQL function (SECURITY DEFINER, non-recursive) — never write a raw `exists (select 1 from profiles where ...)` inline in a policy defined ON `profiles` itself, that causes infinite recursion (this happened once, see migration 003's header for the postmortem).
- Never put a Supabase service-role key or any other high-privilege secret in the app — this app only ever uses the anon/publishable key client-side; RLS is the real security boundary. Elevated operations go through `is_admin()`-gated RLS policies, not a bypassed key.
- **A `SECURITY DEFINER` function ignores RLS, so granting one to `anon` hands the whole table to anyone with the APK.** Postgres grants `EXECUTE` to `PUBLIC` on every new function by default, which is how 29 of ours became anon-callable without anyone deciding so. Migration `086` revoked the lot; `report_tank_distance` is the **only** one `anon` may call, because an ESP32 has no JWT. After writing any new definer function, `revoke all ... from public, anon` and grant only the role that needs it, then re-run `get_advisors('security')`. Also always `set search_path` on one — a mutable search_path lets an attacker who can create objects shadow the names the function resolves.
- **`tank_devices` had RLS disabled entirely** until migration `079` (2026-11-03). Anyone with the publishable key could list device token hashes, repoint a device at another restaurant's tank, or register their own and push fabricated level/grade readings — which is a write path into *dispatch* (≥85% creates a real pickup) and into *money* (grade sets the price). It is now admin-read, no API write path at all; devices are provisioned server-side. Don't add an insert policy to make provisioning convenient.
- `restaurant_wallets`/`collector_wallets` tables no longer exist (dropped in `docs/migrations/013_drop_wallet_tables.sql`, 2026-07-20) — they were a stored `.balance` that was never kept in sync by any write path. Replaced by `restaurant_balances`/`collector_balances` **views**, computed at query time from `earnings` (`security_invoker = true`, so RLS still applies per-user). `.balance` on these views is always live now — the old "don't trust it" caveat no longer applies. See `docs/SCHEMA.md` for the exact computation.
- **Money model (current, replaced the old commission/flat-rate settings).** `platform_settings.commission_pct` and `driver_flat_rate_per_pickup` **no longer exist** — dropped in `069_drop_dead_money_settings.sql`. `platform_settings` now holds only `manufacturer_markup_pct` (currently 10). The live model:
  - `pool = litres × market_rates.rate_per_liter (by grade) × (1 + manufacturer_markup_pct/100)`
  - split by grade from `payout_splits`: **A 60/25/15 · B 50/30/20 · C 40/35/25** (restaurant / driver / platform), DB-constrained to sum to 100
  - rates today: **A R18.50 · B R15.00 · C R11.50** per litre
  - **both** the restaurant share and the driver share auto-pay instantly on completion — `earnings_auto_payout` creates an approved withdrawal for each (migration 036 for restaurants, extended to drivers in `075`). The platform keeps the remainder.
  - **consequence: every balance is always 0, and both "Withdraw" buttons were dead UI.** `restaurant_balances.balance` / `collector_balances.balance` compute from earnings with no `withdrawal_id`, and the auto-payout trigger fills that in on insert, so nothing is ever claimable. The driver wallet card was removed on 2026-11-02; the restaurant Earnings card now reads "Payouts are automatic" and shows the last payout, falling back to a **Claim** button only if an unpaid balance does appear — which would mean the trigger did not fire. Don't "fix" either screen by restoring a Withdraw button.
  - `request_driver_withdrawal()` (server-side sum, client never sends an amount) still exists and is still granted, but nothing in the app calls it any more. It is the manual fallback, not the normal path.
  - all arithmetic is in DB triggers (`pickups_auto_earnings`), never in app code, so the app can't disagree with the database
  - the manufacturer's charge (`payfast-checkout`) uses the **same** formula, grade-filtered and computed server-side, and refuses a zero charge
- **`actual_volume_liters` is read in ~15 places and written in none.** No screen or service records how much oil was actually collected, so every payout is priced on `estimated_volume_liters`. Onboarding slide 4 ("priced on verified volume") overstates this. If you add a "record litres" step, that one column makes the whole money story honest.
- `pickups_auto_earnings` falls back to **20 litres @ R10/l** when there is no completed `payment_transactions` row and no volume on the pickup. That path only runs if a pickup reaches `completed` outside the payment flow. `adminService.updatePickupStatus(id, 'completed')` can do exactly that, which is why the admin UI deliberately exposes only *cancel* — see the comment at `AdminDashboardScreen.js:47`. Don't wire a "mark complete" button without dealing with this.
- **Dropped in `090` (2026-11-04) — don't reintroduce:** `tanks.temperature_f`, `tank_readings.temperature_f` (the ESP32 does not measure temperature, so both were null on every row, and the restaurant UI converted that null to 0°F and displayed a confident **"-18°C"**), and `pickups.driver_payout_amount` (nothing has read it since the grade splits replaced it in 069). `report_tank_distance` still **accepts** `p_temperature_f` and ignores it — the signature was left alone deliberately, because changing it means drop + create + re-grant, which can't be tested without the device token.
- **`sweep_stale_drivers()` runs every 5 minutes on `pg_cron` (job 1)** and takes any driver off duty whose location is over 2h old, releasing their queue. The app only writes GPS while `DriverMapScreen` is open, so a demo phone on any other screen silently drops off duty — which leaves a tank crossing 85% creating a pickup that never dispatches. Migration `091` added `collectors.sweep_exempt`; the sweep skips exempt rows. **Thobile Mokoena (`thobile23@gmail.com`, the account that owns every ledger row) is exempt and stays on duty.** Exempt only demo accounts: for a real driver, "on duty" is a claim and a location update is the evidence.
- Location data for map/navigation (added in migrations 014/016, seeded in 019/020): `collectors.current_latitude`/`current_longitude`/`location_updated_at` (live GPS, written by `DriverMapScreen` via `collectorService.updateCollectorLocation`, throttled ~1 write/20s) and `manufacturers.latitude`/`longitude` (no UI writes this yet — admin/manufacturer-set only). Test data currently only has real coverage for one pickup/collector pair (`Kgopotso Beverly`, pickup `55555555-...`) — a second pickup (`0feb5542-...`) exists but is unassigned (`collector_id`/`manufacturer_id` null, `status: 'pending'`) and won't appear in any driver's list until an admin assigns it.
- `pickup_status` enum gained `'collected'` and `'arrived_manufacturer'` in migration 015, for the manufacturer-leg of the pickup lifecycle — check `SCHEMA.md`'s lifecycle notes before assuming the enum is just the original restaurant-leg statuses.
- `pickups_collector_update` RLS (migration 018): the policy's `WITH CHECK` must explicitly allow the post-decline row shape (`collector_id is null and status = 'pending'`) or `declinePickup()` gets silently rejected by RLS — Postgres defaults a missing `WITH CHECK` to the `USING` clause, which doesn't match the row *after* the update.

## IoT / ESP32 sensor ingest

There is **one** endpoint and it is an RPC, not an Edge Function. Don't build a second one.

```
POST /rest/v1/rpc/report_tank_distance
  apikey + Authorization: <publishable key>
  x-device-token: <the device's own token>
  { "p_distance_cm": 13,            // required
    "p_quality_grade": "A",          // optional — A|B|C
    "p_sediment_level": "medium",    // optional — low|medium|high
    "p_temperature_f": 91.4,         // optional
    "p_turbidity_raw": 1842 }        // optional — raw ADC behind the grade
```

- `SECURITY DEFINER`, granted to `anon`, so a device needs no user JWT. It authenticates by **sha256 of the `x-device-token` header** matched against `tank_devices.device_token_hash` — only the hash is stored, so a token can be replaced but never recovered.
- The device sends **raw ultrasonic distance**; Postgres derives `fill_percent` from that tank's `sensor_empty_distance_cm` / `sensor_full_distance_cm`, and litres from `capacity_liters`. Readings outside the calibrated band are stored as raw distance but don't move the level.
- One call writes one `tank_readings` row (level **and** grade together — migration 071) and refreshes the `tanks` snapshot. `coalesce` throughout, so a level-only packet never blanks a grade.
- Returns `jsonb` (`ok`, `reading_id`, `fill_percent`, `volume_liters`, `calibrated`). Optional params have defaults, so firmware sending only `p_distance_cm` still works.
- **It fails SOFT.** A missing or unknown device token returns **HTTP 200** with `{"ok": false, "error": ...}`, not a 4xx. Any client must check the `ok` field — testing the status code alone reports success while storing nothing.
- **Grading is decided on the ESP32** (team decision, 2026-11-02). The board applies its own thresholds and sends a final `p_quality_grade`; Postgres stores the verdict without re-deriving it. `p_turbidity_raw` (migration 074) carries the raw ADC the decision came from, mirroring how `distance_cm` sits beside `fill_percent` — grade sets the price, so the evidence has to survive. `tanks.last_turbidity_raw` holds the latest.
- Adding a parameter means **drop + create**, not `create or replace` — a new signature creates an overload, and two candidates matching a one-arg call make it ambiguous. Re-`grant execute ... to anon` afterwards; the drop takes the grants with it.
- **Writing `tanks.fill_percent` ≥ 85 fires `trg_tanks_auto_pickup_request`**, which creates a `manual_pickup_requests` row + a `pickups` row and alerts the restaurant and every admin. Writing `quality_grade` fires `trg_tanks_log_quality_grade` into `quality_logs`. Live sensor testing therefore creates real pickups.
- **Three things must all be true for the sensor→pickup demo to fire.** Verified end to end on 2026-11-03; one sensor reading produced 6 alerts across all four roles plus 2 audit entries. If nothing happens, it is one of these:
  1. **The tank must be BELOW 85% first.** The trigger's `WHEN` clause requires `old.fill_percent < 85`, so it fires on the *crossing*, never on being above it. A tank parked at 95% can never trigger again. (`Main Oil Tank` is deliberately left at 42% for this reason — don't "tidy" it upward.)
  2. **No open pickup may reference that `tank_id`.** `tanks_auto_pickup_request` returns early if one exists — correctly, since a higher reading is the same oil waiting for the same driver. A leftover open pickup silently kills the demo.
  3. **A driver must be ON DUTY,** or the pickup is created but not dispatched. `sweep_stale_drivers` takes a driver off duty after 2h without a location update, so check this immediately before demoing, not the night before.
  The `system_integrity` view checks all three (`iot.tank_full_no_pickup`, `ops.no_driver_on_duty`, `ops.awaiting_driver`).
- **Containers: a restaurant has ONE tank.** Team decision (2026-11-01, restated 2026-11-02): the level resets when it's emptied, only the container on site matters, and how the driver handled the swap is not the app's business — it's the same sensor reporting the same thing either way. `restaurantService.getTank()` deliberately does `.limit(1)`. The two-container swap model (migrations 072/073 — `tanks.filling_since`, the `container_swap_due` view) was **reverted in 077**; don't reintroduce it. `collectors.vehicle_capacity_liters` / `vehicle_container_slots` were kept — those are the truck's limits and multi-stop routing already accepts them.
- **20 litres is the standing default volume.** `Main Oil Tank` is set to `capacity_liters = 20` (077) and `pickups_auto_earnings` falls back to 20 L when a pickup has no volume, so the arithmetic agrees wherever it's computed. The physical demo container holds under a litre, which is useless for showing money move. To be revisited when volumes are finalised.

## Observability: audit log, errors, latency, correctness checks (built 2026-11-03)

One append-only table, `system_events` (migration `080`), is the spine. Everything else is a view over it. Admin reads it at **Admin → Operations** (`AdminOperationsScreen`, reachable from the pulse icon in the admin header and from the Health tab).

- **`system_events` is append-only and enforced as such.** `trg_system_events_immutable` raises on UPDATE and DELETE — for everyone, including the table owner and the service role. The one sanctioned exit is `prune_system_events(keep_days)`, which sets a session flag the trigger checks. Don't try to "clean up" this table with a DELETE; it will raise, and that is the point.
- **Admin-read only, and the app cannot forge an actor.** A single SELECT policy gated on `is_admin()`. Nothing holds INSERT: the app writes through `log_event()` (SECURITY DEFINER), which stamps `actor_user_id` from `auth.uid()` itself and ignores anything the caller passes.
- **Who writes into it.** DB triggers (migration `081`, fixed in `087`) for pickups, payments, earnings, withdrawals, profile role/status changes, device registration and the 85% crossing; `report_tank_distance` (migration `082`) for device auth failures and uncalibrated readings; the app via `src/services/telemetryService.js`.
- **The audit trail is written by the database on purpose.** Pickups are created and moved by triggers, earnings by `pickups_auto_earnings`, payouts by `earnings_auto_payout`. A trail written in React Native would miss every one of those and would be bypassable by anyone calling the REST API directly.
- **`logError`/`withTiming`/`logEvent`** are in `telemetryService`. It never throws, never blocks (fire-and-forget), and throttles identical events to one per 30s, carrying a `suppressed_duplicates` count on the next one through — a render-loop error would otherwise write thousands of rows. `installGlobalErrorHandler()` is called at module scope in `App.js` and chains to the original handler, so the dev red box is unchanged. `withTiming` is what fills the Speed tab; it wraps the four role bundle loads.
- **Views (migration `083`)**, all `security_invoker` so they inherit the admin-only policy: `system_health` (the four golden signals plus this business's own tiles), `system_error_groups` (folded by `fingerprint` = event + error code + first stack frame, so one row per bug), `system_latency` (p50/p95/max per operation), and `system_integrity`.
- **`system_integrity` is the one to look at first.** ~18 named invariants, each with `severity`, `failing` and a `hint` saying why it happens. It found 7 real problems the first time it ran. `failing = 0` everywhere is the green board.

### The trap that nearly shipped (migration 087)

`audit_pickups()` built a message with `coalesce(new.pickup_type, 'unknown')`. `pickup_type` is an **enum**, so Postgres tried to coerce `'unknown'` into it and raised `22P02` — and because that happened while evaluating the *arguments* to `db_log_event`, it was raised in the trigger's own frame, before reaching the `exception when others then null` that was supposed to make logging harmless. The insert inside `tanks_auto_pickup_request()` aborted, so **a tank crossing 85% created no pickup at all.** The audit trigger had broken the exact flow it was auditing.

Two rules out of it, both now applied to every audit function:

1. **Cast enums to text before `coalesce`** (`new.status::text`, not `new.status`).
2. **Wrap the whole trigger body in its own `exception when others then null`.** Relying on the callee to swallow errors was the design mistake — the guarantee has to live in the frame that can roll the caller back.

And the process point: this was found by *running* the sensor→dispatch flow end to end, not by reading the code. Do that before any build.

## Route optimisation

`supabase/functions/optimize-route/index.ts` has **two modes that work side by side**; neither replaces the other. ORS key is server-side only (`ORS_API_KEY` secret).

- **Mode 1 — point to point** (original): `{ coordinates: [[lng,lat],[lng,lat]] }` → ORS `/v2/directions/{profile}/geojson`. The driver map's **Navigate** button.
- **Mode 2 — multi-stop** (added 2026-11-01): `{ mode: "multi", start, stops: [{id, location, amount?}], end?, capacity? }` → ORS `/optimization` (VROOM) for the best **order**, then `/directions` for the drawable line. Same `{ route, summary }` response shape, so the map renders it unchanged. Job ids must be **integers** (pickups are uuids, so the app numbers stops 1..n and maps back).
- `capacity`/`amount` are multi-dimensional arrays and are supported but **not yet sent by the app** — no collector has `vehicle_container_slots` set. It currently optimises order, not fit.
- `DriverMapScreen` groups stops by **manufacturer**: only pickups sharing a destination can be one run, because a different manufacturer is a different trip. The trip panel is run-aware ("Stop 2 of 4"), Navigate targets the current stop, and arriving at the manufacturer moves **every** pickup in the run to `arrived_manufacturer` together.
- Google's Routes API is a **licensing** block, not a technical one — its results must be displayed on a Google Map, and this app uses MapLibre. That's why ORS.

## Running the app on a real device (hard-won, 2026-11-01)

- **Metro goes stale across long sessions.** Symptom: the device shows old code, or `/index.bundle` returns HTTP 500 with `Cannot read properties of undefined (reading 'get')` in `DependencyGraph.js`. Fix: kill the node process holding 8081 and restart with `npx expo start --dev-client --clear`. `npx expo export` succeeding proves nothing about the running Metro — it forks a fresh process.
- **Check Metro actually served a new bundle** (`Android Bundled … index.js` in its log) before concluding a code change didn't work.
- `android/gradle.properties` sets `reactNativeArchitectures=x86_64,arm64-v8a`, but Expo builds only the connected device's ABI. An APK built for the emulator **will not install on a phone** (`INSTALL_FAILED_NO_MATCHING_ABIS`). Build the phone's with `cd android && ./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a`, then `adb install -r`.
- A locally-built debug APK and an EAS preview APK are signed differently → `INSTALL_FAILED_UPDATE_INCOMPATIBLE`. You must uninstall first, which **wipes the session and logs the tester out**. Ask before doing it.
- Prefer **Wi-Fi over the USB tunnel**: `exp+devine-devs://expo-development-client/?url=http://<pc-lan-ip>:8081`. `adb reverse` silently drops when the cable re-enumerates, and the app then shows `ECONNREFUSED`. The dev-client scheme is `exp+devine-devs` (no explicit `scheme` in app.json).
- First bundle parse on a low-end device (A12) takes **minutes** at "Bundling 99%" — that is not a hang.
- `adb exec-out screencap -p > file.png` **corrupts the PNG in PowerShell** (adds a BOM). Use `shell screencap -p /sdcard/x.png` then `adb pull`.

## Supabase MCP

A Supabase MCP server (`supabase`) is configured for this project (see `Devine-Devs/.env.supabase-mcp` for where the credentials live, or `claude mcp list` to confirm it's active). Use it to query tables and check logs directly instead of asking the user to relay results back and forth.

**There are two access tokens and only one works.** The live, non-expiring one is `SUPABASE_ACCESS_TOKEN` in `Devine-Devs/.env.supabase-mcp`. If every call returns `Unauthorized. Please provide a valid access token` **while the server reports "Connected"**, that is an expired token, not an outage — re-register the server with the env-file token and have the user reconnect via `/mcp` (a config change does not reach the already-running process). Note `claude mcp add` echoes the token to stdout.

## Git: commits are shared between two accounts (set up 2026-09-17)

Two people work from this one clone and both must show up as authors in `git log`:

| | Author identity | Push remote | GitHub MCP |
|---|---|---|---|
| Mzoo (default git config) | `MzooNgubane <ngubanemzobanzi4@gmail.com>` | `origin` | `github` |
| Mdingi | `Mdingi_Codes <mdingibulela35@gmail.com>` (GitHub user `restore45`) | `mdingi` | `github-b` |

Rules when committing work in this repo:

- **Listen for who owns the work before committing.** Three modes:
  - *"Split it"* (default when nothing is said): break the changes into logical commits (one concern each — a component, a screen, a context/service change, a migration) and alternate authorship so both names appear.
  - *"This is Mdingi's"* / *"this is mine"*: the whole batch goes under that ONE author — still split into logical commits if it's big, but give none of it to the other person.
  - *"X did A, Y did B"*: follow the assignment exactly.
  Always state which mode you used and which commits went to whom.
- Commit as Mdingi with: `git -c user.name="Mdingi_Codes" -c user.email="mdingibulela35@gmail.com" commit -m "..."`. Plain `git commit` is Mzoo.
- **No `Co-Authored-By: Claude` line on any commit** — this overrides the default attribution; the authors are the two people only.
- Each commit must leave the app in a state that compiles (e.g. delete a component in the same commit that removes its last import, or later — not before).
- Use real timestamps; don't backdate.
- Short imperative messages in the repo's existing style (`Add unread badge to admin header actions`, not paragraphs).
- Before pushing, `git fetch origin` and rebase onto `origin/main` if teammates have pushed (this repo has 5 collaborators; non-fast-forward rejections are common). Push via `origin` unless the user asks to push as Mdingi (`git push mdingi main`, which uses restore45's stored login).
