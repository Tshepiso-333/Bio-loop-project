# BioLoop Project

BioLoop is a React Native Expo app for managing used cooking oil collection and recycling.

The simple idea:

1. Restaurants produce used cooking oil and request pickups.
2. Collectors/drivers collect the oil from restaurants.
3. Manufacturers receive the oil and use it for biodiesel/recycling.
4. Admins manage the wider platform.

The app is role-based. After login, each user is sent to the correct part of the app based on `profiles.role` in Supabase.

---

## Tech stack

- `React Native` with `Expo`
- `Supabase` for auth, database, and profile image storage
- `React Navigation` for stacks and tabs
- `AsyncStorage` for auth persistence, onboarding state, and cached role data
- Main app folder: `Devine-Devs/`

---

## Run locally

```bash
cd Devine-Devs
npm install
npm start
```

Useful scripts:

```bash
npm run android
npm run ios
```

The Supabase client is currently defined in `Devine-Devs/supabase.js`.

---

## Main app flow

The app starts in `Devine-Devs/App.js`.

The provider order matters:

```text
SafeAreaProvider
  AuthProvider
    ProfileProvider
      RootNavigator
```

What each layer does:

- `AuthProvider` watches the Supabase auth session and exposes `user`, `session`, `isAuthenticated`, and `signOut`.
- `ProfileProvider` loads the row from `profiles`, loads the role-specific business record, and calculates profile completion.
- `RootNavigator` decides whether to show onboarding, auth screens, unknown-role fallback, or the logged-in role area.
- `RoleProviderGate` mounts the correct role provider and navigation stack.
- `ProfileCompletionGate` blocks non-admin users from entering their workspace until required profile fields are filled.

---

## Roles

| Role in database | UI name | Main stack | Main provider |
| --- | --- | --- | --- |
| `restaurant` | Restaurant | `RestaurantStack` | `RestaurantProvider` |
| `collector` | Driver | `DriverStack` | `CollectorProvider` |
| `manufacturer` | Manufacturer | `ManufacturerStack` | `ManufacturerProvider` |
| `admin` | Admin | `AdminStack` | none yet |

Important naming note: the database role is `collector`, but the UI often calls this user a driver.

---

## Navigation

Navigation files live in `Devine-Devs/navigation/`.

- `RootNavigator.js` is the top-level routing decision.
- `AuthStack.js` contains login, signup, and forgot password screens.
- `RestaurantStack.js` contains restaurant tabs plus pickup/profile edit screens.
- `DriverStack.js` contains driver tabs plus profile edit.
- `ManufacturerStack.js` contains manufacturer dashboard and feature screens.
- `AdminStack.js` contains admin screens.

The logged-in route is selected by `RoleProviderGate` using the loaded `profile.role`.

---

## Data flow pattern

Most screens should not query Supabase directly.

Use this pattern:

```text
Supabase tables
  -> src/services/*
  -> src/contexts/*
  -> src/hooks/*
  -> screens/*
```

Meaning:

- Service files own database queries and inserts.
- Context files own loading state, errors, cache, refresh functions, and mutations.
- Hooks expose context data to screens.
- Screens render UI and call context methods.

Auth screens are the main exception: login and signup call Supabase Auth directly.

---

## Important folders

```text
Devine-Devs/
  App.js                         App entry and provider setup
  AuthContext.js                 Supabase session state
  supabase.js                    Supabase client
  navigation/                    App navigation stacks/tabs
  screens/                       Role and auth screens
  src/services/                  Supabase database operations
  src/contexts/                  Shared role state
  src/hooks/                     Context access hooks
  src/components/profile/        Shared profile UI and completion flow
  src/lib/dbColumns.js           Canonical Supabase column select lists
  src/lib/profileCompletion.js   Required-field completion rules
  src/lib/profileFields.js       Profile edit form definitions
  docs/SCHEMA.md                 Database table/column reference
  docs/README.md                 More detailed internal project notes
```

---

## Profile system

Every user has a base profile row:

```text
profiles.id = auth.users.id
```

Business users also have one role-specific record:

```text
restaurants.owner_user_id = profiles.id
collectors.owner_user_id = profiles.id
manufacturers.owner_user_id = profiles.id
```

`src/services/profileService.js` loads the base profile and attaches the role record as:

```js
businessDetails
```

Expected shape:

```js
{
  id,
  email,
  role,
  full_name,
  phone,
  city,
  province,
  bio,
  businessDetails: {
    // restaurant, collector, or manufacturer row
  }
}
```

If a non-admin user has a role but no business record, `ProfileProvider` calls `ensureRoleBusinessRecord()` and reloads the profile.

---

## Profile completion gate

Profile completion is controlled by:

- `src/lib/profileCompletion.js`
- `src/components/profile/ProfileCompletionGate.js`
- `src/components/profile/ProfileEditScreen.js`

The gate works like this:

```text
Load auth user
  -> load profiles row
  -> load role-specific businessDetails
  -> check required base fields
  -> check required role fields
  -> if incomplete, show ProfileEditScreen in completion mode
  -> if complete, render the role workspace
```

Base required fields:

- `full_name`
- `phone`
- `city`
- `province`

Role-specific required fields are defined in `ROLE_REQUIRED` inside `src/lib/profileCompletion.js`.

Profile editing remains available later through each role stack's `ProfileEdit` route.

---

## Role data providers

Each role provider loads a bundle from Supabase and caches it in AsyncStorage.

| Provider | Service | Cache key |
| --- | --- | --- |
| `RestaurantProvider` | `loadRestaurantBundle()` | `@bioloop/restaurant/{userId}` |
| `CollectorProvider` | `loadCollectorBundle()` | `@bioloop/collector/{userId}` |
| `ManufacturerProvider` | `loadManufacturerBundle()` | `@bioloop/manufacturer/{userId}` |

Cache behavior:

1. Read cached data first for fast screen rendering.
2. Fetch fresh Supabase data in the background.
3. Update state and overwrite cache.
4. Clear user caches on logout.

---

## Core database areas

- `profiles`: base user identity and role.
- `restaurants`: restaurant business profile.
- `collectors`: driver/collector business profile.
- `manufacturers`: manufacturer company profile.
- `tanks`: restaurant oil tank state.
- `pickups`: central workflow table linking restaurants, collectors, manufacturers, and tanks.
- `earnings`, `restaurant_wallets`, `withdrawals`: restaurant money flow.
- `quality_logs`, `tank_readings`, `activity_logs`, `alerts`: monitoring and event data.
- `manufacturer_inventory`, `manufacturer_tanks`, `forecasts`: manufacturer dashboard data.

Use `Devine-Devs/docs/SCHEMA.md` and `Devine-Devs/src/lib/dbColumns.js` as the source of truth for column names.

---

## Developer rules

- Keep Supabase table access inside `src/services/` unless you are working on auth.
- Keep shared state inside `src/contexts/`; do not duplicate fetch logic in screens.
- Use `owner_user_id` to find role records for the logged-in user.
- Keep `dbColumns.js`, services, and `docs/SCHEMA.md` aligned when schema fields change.
- Do not rename existing tables or remove columns without checking the role flows.
- Treat profile completion as part of access control, not only onboarding UI.

---

## Current gaps to be aware of

- Supabase keys are hardcoded in `supabase.js`; move them to environment config before production.
- Profile images require a Supabase Storage bucket named `profile-images`.
- Admin screens are still lighter than the role dashboards.
- Some advanced features, such as AI chat, notifications, map provider integration, and realtime updates, are not fully production-ready.
- Some screen comments/docs have encoding artifacts; avoid copying those artifacts into new files.
