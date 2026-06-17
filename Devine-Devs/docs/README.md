# BioLoop — Project Documentation

**Stack:** React Native (Expo) + Supabase  
**Last updated:** June 7, 2026  
**Build status:** ✅ Compiling

---

## What is BioLoop?

BioLoop tracks **used cooking oil** moving from restaurants → collected by drivers → delivered to manufacturers for biodiesel recycling.

There are four user roles:

| Role | What they do |
|---|---|
| `restaurant` | Monitor oil tanks, schedule pickups, track earnings |
| `collector` | Pick up oil from restaurants (the driver) |
| `manufacturer` | Receive oil, manage stock, view forecasts |
| `admin` | Manage all users and the platform |

After login, the app reads `profiles.role` and routes each user to their own navigation stack with their own data context.

---

## Folder structure

```
Devine-Devs/
├── App.js                          # Provider tree entry point
├── AuthContext.js                  # Session + signOut
├── supabase.js                     # Supabase client
│
├── src/
│   ├── services/                   # All Supabase queries live here
│   │   ├── restaurantService.js
│   │   ├── collectorService.js
│   │   └── manufacturerService.js
│   ├── contexts/                   # Role-based state providers
│   │   ├── RestaurantContext.js
│   │   ├── CollectorContext.js
│   │   └── ManufacturerContext.js
│   ├── hooks/
│   │   ├── useProfile.js
│   │   └── useRestaurant.js
│   ├── providers/
│   │   └── RoleProviderGate.js     # Maps role → provider + stack
│   ├── lib/
│   │   ├── cache.js                # AsyncStorage helpers
│   │   ├── dbColumns.js            # Canonical column name constants
│   │   └── roles.js                # Role string constants
│   └── utils/
│       └── restaurantViewModels.js # Maps DB rows → UI-friendly shapes
│
├── screens/
│   ├── auth/
│   ├── restaurant/
│   ├── driver/
│   ├── manufacturer/
│   └── admin/
│
├── navigation/
│   ├── RootNavigator.js
│   ├── AuthStack.js
│   ├── RestaurantStack.js
│   ├── DriverStack.js
│   └── ManufacturerStack.js
│
└── docs/
    ├── README.md       ← you are here
    └── SCHEMA.md       ← exact table/column reference
```

---

## How the app is wired (the core pattern)

Every role follows the same layered pattern. Screens never talk to Supabase directly.

```
Supabase DB
  ↓
src/services/   (all queries, load*Bundle functions)
  ↓
src/contexts/   (state, caching, refresh, mutations)
  ↓
src/hooks/      (useRestaurant, useProfile, etc.)
  ↓
screens/        (read from hooks, render UI)
```

### Provider hierarchy

```
SafeAreaProvider
└── AuthProvider
    └── ProfileProvider
        └── RootNavigator
            ├── AuthStack                 (logged out)
            ├── UnknownRoleScreen         (bad/missing role)
            └── RoleProviderGate
                  ├── RestaurantProvider → RestaurantStack   ✅
                  ├── CollectorProvider  → DriverStack        ✅
                  ├── ManufacturerProvider → ManufacturerStack ✅
                  └── AdminStack                              (planned)
```

### Login to home screen (step by step)

1. User submits credentials → `supabase.auth.signInWithPassword`
2. `AuthContext` receives session via `onAuthStateChange`
3. `ProfileContext` loads `profiles` row → gets `role`
4. `RootNavigator` passes loading gates
5. `RoleProviderGate` mounts the correct provider + stack
6. Context hydrates from AsyncStorage cache (shows data instantly)
7. Bundle fetch runs in background, updates state + cache
8. Pull-to-refresh or mutations go through context methods only

---

## Services — what each one fetches

Each service has a main `load*Bundle(ownerUserId)` function that fetches everything for that role in parallel, plus smaller helper functions for individual queries.

### `restaurantService.js`

| Function | Table(s) |
|---|---|
| `loadRestaurantBundle(ownerUserId)` | All below in parallel |
| `getRestaurantByOwnerId(ownerUserId)` | `restaurants` |
| `getTank(restaurantId)` | `tanks` |
| `getPickups(restaurantId)` | `pickups` + `collectors` join |
| `getTankReadings(tankId)` | `tank_readings` |
| `getPickupSchedules(restaurantId)` | `pickup_schedules` |
| `getWallet(restaurantId)` | `restaurant_wallets` |
| `getEarnings(restaurantId)` | `earnings` |
| `getWithdrawals(restaurantId)` | `withdrawals` |
| `getQualityLogs(restaurantId)` | `quality_logs` |
| `getActivityLogs(restaurantId)` | `activity_logs` |
| `getAlerts(userId)` | `alerts` |
| `getMarketRates()` | `market_rates` |
| `createPickupRequest(restaurantId, payload)` | `pickups` (insert) |
| `createManualPickupRequest(restaurantId, payload)` | `manual_pickup_requests` (insert) |

Used by: `RestaurantHomeScreen`, `MonitoringScreen`, `PickupsScreen`, `EarningsScreen`, `SchedulePickupScreen`, `ManualPickupScreen`

### `collectorService.js`

| Function | Table(s) |
|---|---|
| `loadCollectorBundle(ownerUserId)` | All below in parallel |
| `getCollectorByOwnerId(ownerUserId)` | `collectors` |
| `getAssignedPickups(collectorId)` | `pickups` |
| `getCollectorStats(collectorId)` | `collectors` |
| `getAlerts(userId)` | `alerts` |

Used by: `DriverHomeScreen`, `DriverMapScreen`, `DriverCollectionsScreen`

### `manufacturerService.js`

| Function | Table(s) |
|---|---|
| `loadManufacturerBundle(ownerUserId)` | All below in parallel |
| `getManufacturerByOwnerId(ownerUserId)` | `manufacturers` |
| `getManufacturerInventory(manufacturerId)` | `manufacturer_inventory` |
| `getManufacturerTanks(manufacturerId)` | `manufacturer_tanks` |
| `getForecasts(manufacturerId)` | `forecasts` |
| `getPickupsForManufacturer(manufacturerId)` | `pickups` |
| `getAlerts(userId)` | `alerts` |

Used by: `ManufacturerDashboardScreen`, `ForecastsScreen`, `QualityScreen`, `SuppliersScreen`, `AlertsScreen`

---

## Caching

Every context follows cache-first loading so screens render immediately on app open.

**Cache keys:**

```
@bioloop/restaurant/{userId}
@bioloop/collector/{userId}
@bioloop/manufacturer/{userId}
```

**Flow:**

1. App opens → read AsyncStorage cache → render immediately
2. Background fetch → update state + overwrite cache
3. Pull-to-refresh → skip cache, fetch fresh
4. Logout → `clearUserCaches(userId)` wipes all keys

**Helpers in `src/lib/cache.js`:** `readCache(key)`, `writeCache(key, data)`, `clearCache(key)`, `clearUserCaches(userId)`

---

## Finding a user's business record

The logged-in user's `auth.users.id` equals their `profiles.id`. Their business record is found via `owner_user_id`:

```
restaurants    WHERE owner_user_id = user.id
collectors     WHERE owner_user_id = user.id
manufacturers  WHERE owner_user_id = user.id
```

There is no `restaurant_id` on `profiles`. Always go through `owner_user_id`.

---

## What is done vs what is next

### ✅ Done

- Database schema — all tables and columns match app needs
- `restaurantService.js`, `collectorService.js`, `manufacturerService.js` — complete
- `RestaurantContext`, `CollectorContext`, `ManufacturerContext` — complete with caching + refresh
- All restaurant screens wired to real context data (`PickupsScreen`, `EarningsScreen`, `MonitoringScreen`, `SchedulePickupScreen`, `ManualPickupScreen`)
- All driver screens wired (`DriverHomeScreen`, `DriverCollectionsScreen`, `DriverProfileScreen`, `DriverMapScreen`)
- All manufacturer screens wired (`DashboardScreen`, `ForecastsScreen`, `QualityScreen`, `SuppliersScreen`, `AlertsScreen`)
- Mock data removed from all screens — replaced with real context data or clean placeholders (`"—"`, `0`, `[]`)
- Role-based navigation and provider wrapping
- AsyncStorage caching with cache-first UX
- RLS enabled on newer tables (`tank_readings`, `activity_logs`, `pickup_schedules`, `manufacturer_inventory`, `manufacturer_tanks`, `forecasts`)
- Documentation

### ⚠️ Partial / placeholders in use

| Area | State |
|---|---|
| Auth | Hardcoded test users in `auth/hardcodedUsers.js` — not real Supabase Auth yet |
| Historical quality logs | Placeholder `[]` — table may not be seeded |
| Market rates | Placeholder `[]` — external data source needed |
| Driver map | Context data ready, no map provider (Google Maps / Mapbox) set up yet |
| AI chat | Simplified responses — no real ML backend |
| Charts | Data structures in place, rendering needs real seeded data to validate |

### ❌ Still to do

- Replace hardcoded users with `supabase.auth.signInWithPassword` + email verification
- Add RLS policies on original tables (`tanks`, `pickups`, `earnings`, `wallets`, etc.)
- Seed test data in Supabase
- Set up real-time subscriptions (Supabase channels) inside contexts
- Image uploads (profile photos, quality log receipts)
- Push notifications
- Admin dashboard screens
- Move Supabase API keys from code into `.env`
- Runtime testing on a real device / simulator

---

## Pickup lifecycle

The `pickups` table is the central operational table — it links restaurant, collector (driver), manufacturer, and tank.

| Status | Meaning |
|---|---|
| `pending` | Created, not yet scheduled |
| `scheduled` | Date and time set |
| `in_transit` | Driver on the way |
| `arrival` | Driver arrived |
| `in_progress` | Collection happening |
| `completed` | Done — earnings recorded |
| `cancelled` | Cancelled |

---

## Screen → table reference

| Screen | Tables queried |
|---|---|
| Restaurant Home | `tanks`, `activity_logs`, `pickups`, `quality_logs`, `alerts` |
| Monitoring | `tanks`, `tank_readings`, `quality_logs` |
| Pickups | `pickups`, `collectors`, `pickup_schedules` |
| Manual Pickup | `manual_pickup_requests` |
| Earnings | `restaurant_wallets`, `earnings`, `withdrawals`, `market_rates` |
| Driver Home / Map | `collectors`, `pickups`, `restaurants` |
| Manufacturer Dashboard | `manufacturer_inventory`, `pickups`, `forecasts` |
| Admin | `profiles`, `restaurants`, `collectors`, `manufacturers` |

---

## Key rules for developers

- **Screens never import `supabase` directly.** All queries go through services. All state goes through contexts.
- **Use `dbColumns.js` constants** for column names, not string literals. Keep it in sync with `SCHEMA.md`.
- **Mutations go through context methods** (`createPickupRequest`, etc.) — not called from screens.
- **Column names to avoid:** `scheduled_at`, `available_balance`, `price_per_liter` on earnings, `oil_grade` on quality_logs, `updated_at` on tanks, `name` on collectors. See `SCHEMA.md` for correct names.

---

## Security — before going to production

1. Replace hardcoded users with Supabase Auth + JWT
2. Add RLS policies on all original tables
3. Move API keys to `.env` (never commit to git)
4. Validate input on all forms
5. Store auth tokens in Secure Storage, not AsyncStorage

---

*For exact table column names and types, see `SCHEMA.md`.*
