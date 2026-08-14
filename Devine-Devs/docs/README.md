# BioLoop — Project Documentation

**Stack:** React Native (Expo) + Supabase (Postgres + Auth + Storage). No custom server, except two PayFast Edge Functions.
**Consolidated:** 2026-07-27 — this file replaces `ADMIN_README.md`, `BACKEND_HANDBOOK.md`, `BACKEND_READINESS_HANDOFF.md`, `DISPATCH_ROADMAP.md`, and `PAYFAST_INTEGRATION.md`, which covered overlapping ground at different points in the project and had drifted out of date against each other. `SCHEMA.md` (exact column reference) and `BUSINESS_LOGIC_QUESTIONS.md` (locked business rules) stay as separate docs — they're decisions/reference, not narrative status.

---

## What is BioLoop?

BioLoop tracks **used cooking oil** moving from restaurants → collected by drivers → delivered to manufacturers for biodiesel recycling, with the platform taking a commission and handling routing, quality grading, and payment.

Four roles share one database via `profiles.role`:

| Role | What they do |
|---|---|
| `restaurant` | Monitor oil tanks, schedule/request pickups, track earnings |
| `collector` (driver) | Accept pickups, drive the restaurant → manufacturer leg |
| `manufacturer` | Receive oil, pay for it (PayFast), manage stock, view forecasts |
| `admin` | Dispatch drivers, manage users, approve withdrawals, platform settings |

After login the app reads `profiles.role` and routes the user to their own navigation stack + data context. There is no hardcoded/mock auth anywhere anymore — this is real Supabase Auth end to end.

---

## Why there's no server, and why that's safe

The React Native app talks **directly** to Supabase using the anon/publishable key — that key identifies the project, not a user, so it's safe to ship in the app bundle. The actual security boundary is **Row Level Security (RLS)**: Postgres policies that decide who can read/write which rows. If a table's RLS is wrong, anyone with the anon key can read/write it — there is no server-side check backing it up. This is why RLS bugs (see §"Fixed this project," below) are treated as real bugs, not edge cases: they're the *only* thing standing between a user and someone else's data.

The one exception is payment: PayFast's merchant key + passphrase are real secrets that can't live in an app bundle. Those live in two Supabase Edge Functions (Deno) — the only server-side code in the whole system.

---

## The core pattern: Service → Context → Screen

Every role follows the same layered pattern. **Screens never call Supabase directly.**

```
Supabase DB
  ↓
src/services/*Service.js   (raw queries; one load*Bundle(ownerUserId) per role, fetches everything in parallel)
  ↓
src/contexts/*Context.js   (React state, AsyncStorage cache, refresh, wraps mutations)
  ↓
screens/<role>/*.js        (reads from useXContext(), calls context methods for actions)
```

Why split it this way: a service function is a pure async function you can test/reason about without React; a context turns that into stateful, cached, UI-ready data exactly once per role; a screen only ever renders and calls methods — it never needs to know a Supabase table name. Mutations always go through context methods (e.g. `admin.updatePickupStatus(...)`), never called ad hoc from a screen, so cache invalidation/refresh happens in one place.

**Caching:** cache-first on open (`AsyncStorage`, keyed `@bioloop/<role>/{userId}`) so screens render instantly, then a background fetch updates state + overwrites the cache. Pull-to-refresh skips the cache. Logout wipes all keys.

**Finding a user's business record:** `auth.users.id` = `profiles.id`. From there, `restaurants` / `collectors` / `manufacturers` are found via `owner_user_id = user.id` — there is no `restaurant_id` column on `profiles` itself.

---

## Folder structure

```
Devine-Devs/
├── App.js / AuthContext.js / supabase.js
├── src/
│   ├── services/        # restaurantService, collectorService, manufacturerService, adminService, paymentService, payoutService
│   ├── contexts/        # RestaurantContext, CollectorContext, ManufacturerContext, AdminContext
│   ├── admin/            # adminTheme.js, AdminHeader.js — admin's own design system
│   ├── driver/            # (Tshepiso's driver redesign components — not yet merged)
│   ├── hooks/            # useProfile, useRestaurant
│   ├── lib/              # cache.js, dbColumns.js, pickupStatus.js, roles.js
│   └── utils/            # restaurantViewModels.js — DB rows → UI-friendly shapes
├── screens/{auth,restaurant,driver,manufacturer,admin}/
├── navigation/           # RootNavigator + one Stack per role
├── supabase/functions/   # payfast-checkout, payfast-itn (Edge Functions)
└── docs/
    ├── README.md          ← you are here
    ├── SCHEMA.md          ← authoritative column reference, read before writing raw column names
    └── BUSINESS_LOGIC_QUESTIONS.md ← locked business rules, don't re-derive
```

---

## Pickup lifecycle

`pickups` is the central table — it links restaurant, collector, manufacturer, and tank. Status enum, in order:

```
pending → scheduled → in_transit → arrival → in_progress → collected → arrived_manufacturer → completed
```
(`assigned` is a legacy value from before dispatch was rebuilt — treat it the same as `pending`. `in_progress` is legacy too, superseded by `collected`, kept so old rows still render.) Any pre-trip state can branch to `cancelled`.

**How a pickup gets created:** a restaurant's tank crossing 85% fill (`restaurantService.updateTankFillPercent`) auto-inserts a `manual_pickup_requests` row and notifies all admins — this is a client-side check today, not a DB trigger. Admin converts the request into a `pickups` row (Dispatch: "Needs dispatch" filter) and assigns a driver + optional per-pickup payout.

**Driver leg:** accepting a pending pickup moves it through `in_transit → arrival → in_progress → collected → arrived_manufacturer` — see `src/lib/pickupStatus.js` for the shared status vocabulary. The driver's responsibility ends at `arrived_manufacturer`; there is no driver-facing "complete trip" action.

**Completion:** only the manufacturer confirming receipt (`manufacturerService.confirmDeliveryReceived`) moves a pickup to `completed`, records `completed_at`, and creates `earnings` rows via `payoutService.finalizePickupEarnings`. Admin can still override-complete a pickup manually.

---

## Money flow

Gross value = volume × `market_rates.rate_per_liter` (by grade A/B/C). Split three ways at completion:

| Party | Gets |
|---|---|
| Platform | `platform_settings.commission_pct` of gross |
| Driver | per-pickup `driver_payout_amount` if admin set one, else `driver_flat_rate_per_pickup` |
| Restaurant | remainder |

Manufacturer pays gross + `manufacturer_markup_pct` through PayFast. Both `commission_pct` and `driver_flat_rate_per_pickup` default to `0` — real numbers must be set once via admin Finance settings, or restaurants get 100%/drivers get 0.

There is no `restaurant_wallets`/`collector_wallets` table — those were dropped (migration 013); balances are computed live from `earnings` via `restaurant_balances`/`collector_balances` views.

---

## PayFast integration — current status

**Live:** real PayFast **sandbox** checkout, working end to end — manufacturer pays via `ManufacturerPaymentScreen` (WebView) → `payfast-checkout` Edge Function computes the charge server-side (never trusts a client-sent amount) → PayFast sandbox → `payfast-itn` webhook verifies the signature and flips `payment_transactions.status` to `complete` → the manufacturer's app polls for that, then calls `confirmDeliveryReceived` to finalize the pickup and create earnings.

**RLS:** the manufacturer's client is read-only on `payment_transactions` (can only `SELECT` its own rows to poll). All writes happen inside the two Edge Functions using the service-role key — the anon key never gets insert/update rights on that table.

**Known limitation, not yet closed:** `payfast-itn` only flips the transaction row to `complete` — it does not itself finalize the pickup or create earnings (that still happens client-side, after the app observes the row go `complete`). If the manufacturer closes the app between "PayFast confirms" and "the poll observes it," the trip won't auto-finalize until they reopen that screen. A fully server-authoritative version would trigger `finalizePickupEarnings`'s logic from the ITN webhook itself.

**Not yet done:** PayFast's recommended server-to-server "validate" callback and source-IP allowlisting on the ITN endpoint — worth adding before a real (non-sandbox) merchant account.

Sandbox credentials live in `.env.payfast` (gitignored), pushed to Supabase's Edge Function secret store — never read by the Expo app directly.

---

## Security model — the RLS recursion pattern

Every table has RLS enabled, and it's the *only* security boundary (no service-role key in the app). The one recurring trap: giving one role visibility into another role's table via a plain subquery creates **circular RLS evaluation** the moment both tables' policies reference each other (e.g. "can a driver see the restaurant on their pickup" needs `restaurants` to check `pickups`, but `pickups` already checks `restaurants` back). The fix used throughout this schema is a `SECURITY DEFINER` SQL function (`is_admin()`, `my_restaurant_ids()`, `my_manufacturer_ids()`, `my_collector_pickup_restaurant_ids()`, `my_collector_pickup_manufacturer_ids()`) that bypasses RLS internally, breaking the cycle at exactly one point. Never write a raw admin-role check inline in a policy on `profiles` itself — same recursion, different table (see migration 003's postmortem).

---

## Still genuinely missing (not silently forgotten)

- **No push notifications, no Supabase Realtime subscriptions.** Every screen updates on mount or pull-to-refresh only — a driver won't know they've been assigned a pickup until they open the app. `alerts` rows exist but nothing pushes them.
- **No live-updating manufacturer GPS UI** — `manufacturers.latitude`/`longitude` columns exist, nothing in the app writes to them yet (unlike collectors, who do via `DriverMapScreen`).
- **Restaurant predictive-alert category mismatch** in `MonitoringScreen.js` — known, deliberately deprioritized.
- **PayFast ITN finalize gap** — see above.
- **Driver UI redesign (Tshepiso's `ded3b0a` commit)** exists but isn't merged — her driver screens are a large rewrite (500+ lines/file) and haven't been reconciled against the backend/RLS fixes made since. Needs a deliberate merge pass, not a blind file swap.

---

## Common mistakes

- **Column name traps** — always check `SCHEMA.md` before writing a raw column name. Known traps: `scheduled_at`, `available_balance`, `price_per_liter` on earnings, `oil_grade` on quality_logs, `updated_at` on tanks, `name` on collectors (it's `full_name`).
- **Mutations belong in context methods**, never called ad hoc from a screen.
- **Admin RLS recursion** — see security model above.
- **Verify with a real build** — `cd Devine-Devs && npx expo export --platform android --output-dir <temp>` after any change; this app has no automated test suite.

---

*For exact table/column names and types, see `SCHEMA.md`. For locked business rules (routing, grading, payments, cancellation), see `BUSINESS_LOGIC_QUESTIONS.md`.*
