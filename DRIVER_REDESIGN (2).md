# BioLoop — Driver Module UI Redesign Spec

**For:** Claude Code, working inside `Devine-Devs/`
**Author:** Design/architecture pass, pre-approved by the project owner
**Type:** Presentation-layer retheme of an existing React Native (Expo) app. **Not** a rewrite.
**Companion doc:** `RESTAURANT_REDESIGN.md` (already executed). This spec follows the same rules.

---

## 0 · How to use this file

Read this entire file before touching code. Then work through **Section 7 (Execution Plan)** in the exact order given. There is a **mandatory STOP checkpoint after the Home screen**. Do not proceed past it until the owner approves the Home result.

This is a **retheme of components that already exist**, not net-new UI. The visual language is already defined and already lives in the repo:

```
src/onboarding/onboardingTokens.js   ← root source of truth (#15643E lives here)
        ↓
src/auth/authTheme.js                ← imports from onboarding
        ↓
src/restaurant/restaurantTheme.js    ← imports from onboarding
        ↓
src/driver/driverTheme.js            ← YOU WILL CREATE THIS, same pattern
```

Your job is to propagate that language onto the four Driver screens and the Driver tab bar, which have drifted onto a different palette, a different font stack, and in most places **no font family at all**.

When in doubt, **prefer the smallest change that achieves visual consistency**. Do not invent features, do not restructure data flow, do not "improve" business logic.

---

## 1 · The core problem (why this work exists)

The Restaurant module was migrated to the forest-green system in a previous pass. Auth and Onboarding were already there. **Driver is now the visual outlier.**

| | **Auth / Onboarding / Restaurant (the target)** | **Driver (current, wrong)** |
|---|---|---|
| Primary green | Forest `#15643E` via token | Emerald `#10b981` / `#059669` / `#047857`, hardcoded |
| Token source | One theme file per module | **Five separate local `THEME` objects** |
| Headings font | Plus Jakarta Sans | Mostly **none**. Only `fontWeight` is set, so text falls back to the OS system font |
| Text colors | ink `#122A1F`, body `#6B7F75`, muted `#A9B5AD` | `#111827`, `#6B7280`, `#9CA3AF` |
| Page background | `#F6F8F7` | `#F9FAFB` |
| Header | One shared light header, dark status bar | **Three copy-pasted green gradient headers**, light status bar. Map has none |
| Cards | Flat white, `1px #E4EDE7` border, radius 18 | Gradient fills, no borders, radii mixed across 10/12/14/16/20 |
| Buttons | Flat primary, pill radius, green-tinted shadow | `LinearGradient` pills, radius 10/12 |
| Touch feedback | `Pressable` with pressed state | `TouchableOpacity`, no pressed state |

A driver finishes a calm forest-green sign-up and lands in a bright teal dashboard rendered in the system font. **Every fix below serves one goal: make the Driver module feel like the same product as the rest of the app.**

There is also a concrete visual bug this fixes. `DriverProfileScreen` already renders the shared `ProfileAvatar` and `VerifiedBadge`, both of which are hardcoded forest green (`#15643E` on `#E7F1EB`). They currently sit on top of an emerald gradient header, so a forest-green badge is stacked on a teal background. Moving to a light header resolves this without touching those shared components.

All font families are **already loaded app-wide** in `App.js` (`useFonts`), including all five Plus Jakarta Sans weights. **No dependency changes are needed.** Do not remove Poppins or Inter from the font loader; Manufacturer and Admin still use them.

---

## 2 · Absolute guardrails

### ✅ In scope — you MAY edit these

- `screens/driver/DriverHomeScreen.js`
- `screens/driver/DriverCollectionsScreen.js`
- `screens/driver/DriverMapScreen.js`
- `screens/driver/DriverProfileScreen.js`
- `navigation/DriverStack.js` — **tab bar tint, border, and label font only**
- **New file** you will create: `src/driver/driverTheme.js`
- **New file** you will create: `src/driver/components/DriverHeader.js`
- **New file** you will create: `src/driver/components/DriverStatusBadge.js`
- **New file** you will create: `src/components/DriverScreenStates.js`

That is nine files. Nothing else.

### ⛔ NEVER touch — out of scope, do not open to edit

- `src/contexts/CollectorContext.js` and every other file in `src/contexts/`
- `src/services/collectorService.js` and every other file in `src/services/`
- `src/hooks/*` (`useProfile`, `useRestaurant`, `useOnboarding`)
- `src/providers/RoleProviderGate.js`
- `supabase.js`, `AuthContext.js`, `.env*`, `docs/SCHEMA.md`
- `src/components/profile/*` (`ProfileAvatar`, `VerifiedBadge`, `ProfileField`, `ProfileEditScreen`, `ProfileCompletionGate`)
- `src/components/RestaurantScreenStates.js`
- Any Auth, Onboarding, Restaurant, Manufacturer, or Admin file
- `navigation/RootNavigator.js`, `AuthStack.js`, `RestaurantStack.js`, `ManufacturerStack.js`, `AdminStack.js`
- `src/onboarding/onboardingTokens.js`, `src/auth/authTheme.js`, `src/restaurant/restaurantTheme.js` (you **import from** onboarding tokens, you do not edit them)
- `package.json` / `package-lock.json`
- Any SQL, migration, or RLS policy

### Behavioral rules

- Do **not** change what any screen does. The same buttons trigger the same handlers and navigate to the same routes.
- Do **not** add libraries. Everything here is achievable with `react-native`, `expo-linear-gradient`, `react-native-svg`, `react-native-maps`, and `@expo/vector-icons`, all already installed.
- Do **not** change any Supabase query, table name, column name, or field name.
- Preserve every existing prop on every component.
- If something is genuinely ambiguous, **STOP and ask** rather than guessing. Never hallucinate a missing prop, field, or route.

---

## 3 · Crash-risk register (read this twice)

The owner's explicit requirement is that this pass **must not crash the app or disturb the backend**. These are the specific ways this refactor can break things, and how to avoid each one.

### 3.1 · Deleting a `THEME` object while references survive

Each driver screen defines a module-level `const THEME = {...}` that its `StyleSheet.create` block references. `StyleSheet.create` runs at **module load**, so a single surviving `THEME.primary` after you delete the object throws a `ReferenceError` before the screen ever renders. That is a white screen, not a soft failure.

**Procedure, in this order, per file:**
1. Add the theme import at the top.
2. Replace every `THEME.x` reference throughout the file.
3. Run `grep -n "THEME\." <file>` and confirm **zero** results.
4. Only then delete the `const THEME = {...}` block.
5. Reload the app before moving to the next file.

### 3.2 · Status lookup without a fallback

Both `DriverHomeScreen` and `DriverCollectionsScreen` contain:

```js
const { label, bg, color } = config[status] || config.pending;
```

The `|| config.pending` is load-bearing. The database can return `cancelled` or `assigned`, which are not keys in the config object. Without the fallback, this destructures `undefined` and crashes the list. **When you extract this into `DriverStatusBadge.js`, the fallback must survive verbatim.**

### 3.3 · `DriverMapScreen` early returns are null guards, not decoration

The render body reads `location.latitude` and `location.longitude` directly, with no optional chaining. It is only safe because two early returns (`if (loading)` and `if (errorMsg)`) run first, and `loading` starts `true`. **Do not reorder, merge, or wrap those early returns.** Restyle their contents in place. If you hoist the `MapView` above them, the app crashes on mount.

### 3.4 · The GPS closure uses refs deliberately

`collectorIdRef` and `lastPersistedAtRef` are refs rather than state so the `watchPositionAsync` callback, set up once on mount, always sees current values without tearing down the subscription. The `useEffect` dependency array is `[]` on purpose. **Do not add dependencies to it, do not convert those refs to state, and do not touch `persistLocation` or `LOCATION_PERSIST_INTERVAL_MS`.** Changing the persist interval changes database write volume.

### 3.5 · Provider boundaries

`useCollectorContext()` throws by design if called outside `CollectorProvider`. The provider is mounted in `RoleProviderGate.js`, which is off limits. Every new component you create must be rendered **inside** a driver screen, never hoisted into the navigator. `DriverHeader` may call `useSafeAreaInsets()` because `SafeAreaProvider` wraps the whole app in `App.js`, but it must **not** call `useCollectorContext()`. Pass data in as props instead.

### 3.6 · Initials helper

`DriverHomeScreen` currently computes initials inline:

```js
(collector?.full_name || 'D').split(' ').map(n => n[0]).join('')
```

This returns `undefined` characters on a name with double spaces. When you move this into `DriverHeader`, define a small local helper in that file that filters empty segments and caps at two characters. **Do not import `getInitials` from `src/utils/restaurantViewModels.js`.** That file belongs to the Restaurant module and cross-importing it couples the two modules.

### 3.7 · Unused imports after removals

Removing the sign-out button from the Home header leaves `useAuth` unused in `DriverHomeScreen`. Remove the import too, so the linter stays clean. Do the same for `LinearGradient` in any file where the last gradient is deleted. Verify nothing else in the file still uses them first.

### 3.8 · Verification gate after every single file

After each file, run all three:

```bash
npx expo start -c        # app boots, no red screen
grep -rn "THEME\." screens/driver/ navigation/DriverStack.js
git diff --name-only     # only files from Section 2's ✅ list appear
```

If `git diff --name-only` ever lists a context, hook, service, or another role's file, **revert that file immediately** and report it.

---

## 4 · The data contract (do not alter any of these)

Everything below is read by the driver screens today. Every name, key, and shape must be identical after your pass. This is the boundary between the UI and the backend.

### 4.1 · From `useCollectorContext()`

| Value | Shape / fields read |
|---|---|
| `collector` | `id`, `full_name`, `is_on_duty`, `total_liters`, `route_name`, `district`, `profile_image_url`, `employee_code`, `is_verified`, `vehicle_make`, `vehicle_model`, `vehicle_registration`, `vehicle_type`, `years_experience`, `languages`, `bio` |
| `pickups` | Array. Each: `id`, `status`, `pickup_time_start`, `estimated_volume_liters`, `actual_volume_liters`, `restaurants: { name, address, phone, latitude, longitude }` |
| `stats` | `total_liters`, `route_name`, `district`, `weeklyChange`, `rating`, `reviews_count`, `litersTotal`, `total_collections`, `collections`, `co2Saved`, `co2_saved_kg` |
| `wallet` | `balance` |
| `earnings` | Array. Each: `amount`, `withdrawal_id` |
| `loading`, `refreshing`, `error` | Booleans / error object. **Currently unused by driver screens. Section 6.3 wires them in read-only.** |
| `refreshCollector` | Function. **Currently unused. Section 6.3 wires it to pull-to-refresh.** |
| `toggleDutyStatus(bool)` | Async |
| `requestWithdrawal()` | Async |
| `updatePickupStatus(id, status)` | Async |
| `declinePickup(id, reason)` | Async |

### 4.2 · Other bindings

- `useProfile()` → `profile.full_name`, `profile.profile_image_url`
- `useAuth()` → `signOut`
- `updateCollectorLocation(collectorId, { latitude, longitude })` imported directly from `collectorService` in `DriverMapScreen`. Keep the import and the call signature exactly.

### 4.3 · Route names (renaming any of these breaks navigation)

`DriverTabs`, `DriverHome`, `DriverCollections`, `DriverMap`, `DriverProfile`, `ProfileEdit`

### 4.4 · Status string values

`'pending'`, `'in_progress'`, `'completed'`. Treat any other value as pending via the fallback in Section 3.2. The status **transition logic** in `handleAction` (pending → in_progress → completed) is business logic. Do not touch it.

---

## 5 · The design system (build this first)

### 5.1 · Create `src/driver/driverTheme.js`

Single source of truth for the whole Driver module, mirroring how `restaurantTheme.js` works for Restaurant. Every driver screen imports from here. No screen may declare its own `THEME` / `COLORS` / `FONTS` object after this file exists.

```js
// src/driver/driverTheme.js
// Driver design tokens — forest-green system matching Auth + Onboarding + Restaurant.
// Single source of truth for the Driver module. Brand green is pulled from the
// onboarding tokens so #15643E never appears as a magic value.

import { ONB_COLORS, ONB_FONTS } from '../onboarding/onboardingTokens';

export const DRV_COLORS = {
  // Brand
  primary: ONB_COLORS.primary,       // '#15643E' forest green
  primaryMid: ONB_COLORS.primaryMid, // '#2E8B5A' mid green (in-progress, accents)
  accent: ONB_COLORS.accent,         // '#79C39A' light green (rings, progress)
  accentSoft: ONB_COLORS.accentSoft, // '#9FD3B3'
  primaryShadow: 'rgba(21,100,62,0.32)',

  // Text
  ink: '#122A1F',        // headings / primary text
  body: '#6B7F75',       // body copy + labels
  muted: '#A9B5AD',      // captions, disabled, placeholder icons

  // Surfaces
  page: '#F6F8F7',       // screen background
  card: '#FFFFFF',
  surfaceSoft: '#F5F8F6',   // inset fills
  paleGreen: '#E7F1EB',     // icon circles, chips
  selectedBg: '#F2F8F4',    // selected / active fill
  border: '#E4EDE7',
  divider: '#E4EDE7',

  // Semantic (kept — do not forest-green these)
  alertBg: '#FFF1F1', alertBorder: '#FECACA', alertText: '#DC2626',
  warnBg: '#FFF7ED', warnBorder: '#FED7AA', warnText: '#C2410C',
  positive: '#15643E', negative: '#DC2626', amber: '#F59E0B',

  white: '#FFFFFF',
};

// Pickup status → visual treatment. One place, used by DriverStatusBadge,
// the collections card accent, and the map pins.
export const DRV_STATUS = {
  pending:     { label: 'Pending',     fg: '#C2410C',              bg: '#FFF7ED' },
  in_progress: { label: 'In progress', fg: DRV_COLORS.primaryMid,  bg: DRV_COLORS.paleGreen },
  completed:   { label: 'Completed',   fg: DRV_COLORS.primary,     bg: DRV_COLORS.selectedBg },
};

export const DRV_FONTS = {
  extraBold: ONB_FONTS.extraBold, // big numbers, screen titles
  bold: ONB_FONTS.bold,           // card titles, buttons
  semiBold: ONB_FONTS.semiBold,   // labels
  medium: ONB_FONTS.medium,       // body
  regular: ONB_FONTS.regular,
};

export const DRV_SHADOWS = {
  card: {
    shadowColor: '#122A1F', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  button: {
    shadowColor: DRV_COLORS.primary, shadowOpacity: 0.32, shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  floating: {
    shadowColor: '#122A1F', shadowOpacity: 0.12, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
};

export const DRV_RADII = { card: 18, chip: 12, pill: 30, input: 18 };
export const DRV_SPACING = { screenPadding: 20, cardPadding: 18, gap: 12 };
```

> **Decision to confirm:** `DRV_STATUS.in_progress` uses `primaryMid` `#2E8B5A`, replacing the current blue `#3B82F6`. Blue appears nowhere else in BioLoop, so it reads as an orphan hue. "In progress" is a positive state, so mid-green is coherent. If the owner prefers a distinct non-green for scannability, change **only** the `fg` and `bg` on that one line. Nothing else depends on it.
>
> `pending` moves from amber `#F59E0B` to the warn orange pair already in the system (`#C2410C` on `#FFF7ED`), which is what Restaurant uses. Pending is genuinely "needs action", so a warm tone is correct and should stay warm.

### 5.2 · Token migration table (old → new)

Apply in **every** driver screen and in `DriverStack.js`.

| Old value(s) found in code | Replace with |
|---|---|
| `#10b981`, `THEME.primary`, `THEME.completed` | `DRV_COLORS.primary` |
| `#059669`, `#047857`, `THEME.primaryDark`, `THEME.primaryDarker` | `DRV_COLORS.primary` (or `primaryMid` for a secondary accent) |
| `#D1FAE5`, `THEME.primaryLight`, `THEME.completedBg` | `DRV_COLORS.paleGreen` |
| `#F9FAFB`, `THEME.offWhite` (backgrounds) | `DRV_COLORS.page` |
| `#111827`, `THEME.text` | `DRV_COLORS.ink` |
| `#6B7280`, `THEME.textSecondary` | `DRV_COLORS.body` |
| `#9CA3AF`, `THEME.gray`, `THEME.grayMid` | `DRV_COLORS.muted` |
| `#E5E7EB`, `#E5E5EA`, `THEME.grayLight` | `DRV_COLORS.border` |
| `#EF4444`, `THEME.danger` | `DRV_COLORS.negative` |
| `#FEE2E2`, `THEME.dangerBg` | `DRV_COLORS.alertBg` |
| `#DC2626` (decline link) | `DRV_COLORS.alertText` |
| `#F59E0B`, `THEME.star`, `THEME.pending` | `DRV_COLORS.amber` for the star; status pending → `DRV_STATUS.pending` |
| `#3B82F6`, `#DBEAFE`, `THEME.inProgress*` | `DRV_STATUS.in_progress` |
| `shadowColor: '#000'` | the matching `DRV_SHADOWS` preset |
| `Poppins_700Bold` | `DRV_FONTS.bold` (or `extraBold` for hero numbers) |
| `Inter_400Regular` | `DRV_FONTS.medium` or `regular` |
| bare `fontWeight: '700'` with no family | `fontFamily: DRV_FONTS.bold`, and **delete the `fontWeight`** |
| bare `fontWeight: '600'` with no family | `fontFamily: DRV_FONTS.semiBold`, delete `fontWeight` |
| bare `fontWeight: '500'` with no family | `fontFamily: DRV_FONTS.medium`, delete `fontWeight` |

Rule of thumb: **greens become forest green; semantic reds, oranges, and ambers stay.** Never turn an error state green.

### 5.3 · Typography rules

- **Screen titles, hero numbers** (wallet balance, speed, litres): `DRV_FONTS.extraBold`
- **Card titles, buttons:** `DRV_FONTS.bold`
- **Labels:** `DRV_FONTS.semiBold`
- **Body:** `DRV_FONTS.medium`
- Never set `fontWeight` alongside a Plus Jakarta `fontFamily`. The family already encodes the weight, and combining them produces synthetic bolding on Android.
- **Sentence case everywhere.** `DriverProfileScreen` has `textTransform: 'uppercase'` with `letterSpacing: 0.5` on its section title. Remove both. Sentence case matches Auth and Restaurant.

### 5.4 · Radii and spacing

Driver currently uses 10, 12, 14, 16, 20, and 22.5 with no logic. Collapse to the scale: cards `DRV_RADII.card` (18), chips and badges `DRV_RADII.chip` (12), primary buttons `DRV_RADII.pill` (30), circular elements stay `size / 2`.

Screen horizontal padding is `DRV_SPACING.screenPadding` (20). The driver screens currently mix `paddingHorizontal: 16` on cards with `20` on headers, which is why nothing lines up vertically. **Standardise on 20.**

---

## 6 · Shared components (build after the theme, before the screens)

### 6.1 · `src/driver/components/DriverHeader.js` (new)

Currently the gradient header is copy-pasted into three screens, each slightly different. Replace all of them with one component. Model it on `src/restaurant/components/RestaurantHeader.js`, which you should read first.

**Design:** a **light header**, not a full-bleed green banner.

- Background `DRV_COLORS.page`, `barStyle="dark-content"`
- Title in `DRV_FONTS.extraBold`, `DRV_COLORS.ink`
- Brand green reserved for the small logo tile, the avatar accent, and primary buttons. Not the whole bar.
- Uses `useSafeAreaInsets()` for `paddingTop`. Takes no context, only props.

```
<DriverHeader
  title="Collections"            // or variant="home" for logo + "Driver Portal"
  avatarInitials={...} avatarUrl={...} isVerified={...}
  onAvatarPress={...}            // Home only, navigates to the Profile tab
  showBack={false} onBack={...}
/>
```

**Do not include a sign-out button.** See Section 6.5.

The `home` variant shows the BioLoop logo. The Restaurant header uses an `Ionicons` leaf tile rather than the PNG. Driver currently uses `assets/BioLoop_Logo.png`. **Use the same Ionicons leaf tile as Restaurant** so the two portals match. The PNG asset stays in the repo untouched; you are only changing what this header renders.

Define the initials helper locally in this file per Section 3.6.

### 6.2 · `src/driver/components/DriverStatusBadge.js` (new)

`StatusBadge` is currently defined **twice, identically**, in `DriverHomeScreen` and `DriverCollectionsScreen`. Extract it once.

```js
// Reads DRV_STATUS. Keeps the `|| pending` fallback from Section 3.2.
export default function DriverStatusBadge({ status }) { ... }
```

Both screens then import it and delete their local copies. Same rendered output, same single `status` prop.

### 6.3 · `src/components/DriverScreenStates.js` (new)

This is the one place the spec goes slightly beyond a pure retheme, and it is tightly scoped. `CollectorContext` already exposes `loading`, `refreshing`, `error`, and `refreshCollector`, and **the driver screens consume none of them**. There is no pull-to-refresh anywhere in the module and no loading state. A driver on a bad connection currently sees an empty screen with no explanation.

Mirror `src/components/RestaurantScreenStates.js` exactly. **Read that file first and copy its structure.** Export three components:

- `DriverLoadingBanner({ message })` — centered spinner in `DRV_COLORS.primary` inside a soft card, `DRV_FONTS.medium` caption
- `DriverEmptyBanner({ message, icon, actionLabel, onAction })` — muted icon in a `paleGreen` circle, one-line message, optional primary action button
- `DriverRefreshScrollView({ refreshing, onRefresh, ...rest })` — `ScrollView` with a `RefreshControl` tinted `DRV_COLORS.primary`

**This component only reads values the context already exposes.** It adds no service calls, no new queries, and no new state. `refreshCollector` is an existing exported function; you are calling it, not writing it.

Empty-state copy should follow the app's voice: state the situation plainly and offer the next action. "No collections assigned yet. New pickups appear here once dispatch assigns them." Not "Nothing to see here!"

### 6.4 · Tab bar (`navigation/DriverStack.js`)

Colors, border, height, and label font only. Match `RestaurantStack.js` so the two portals feel identical:

```js
const THEME = {
  primary: '#15643E',
  gray: '#A9B5AD',
  white: '#FFFFFF',
  grayLight: '#E4EDE7',
};
```

Also set `height: 65` (from 70) and `paddingTop: 8` to match Restaurant, and add `fontFamily: 'PlusJakartaSans_500Medium'` to `tabBarLabelStyle` while deleting its `fontWeight`. **Do not change the tab names, the screen components, the icon logic, or the stack structure.**

> Note for the owner, not an instruction: `RestaurantStack.js` still uses `Inter_500Medium` on its tab label. That is a leftover from the previous pass. It is out of scope here. Flag it and move on.

### 6.5 · Interaction honesty

Fake affordances are the fastest way to feel AI-generated and they erode trust on an app whose pitch is transparency.

- **Sign-out in the Home header.** `DriverHomeScreen` has a red-tinted sign-out button in the header that calls `signOut()` with **no confirmation dialog**. A destructive, unconfirmed action one tap from the top bar is a hazard, especially for a driver mid-route. **Remove it.** `DriverProfileScreen` already has a proper sign-out with an `Alert.alert` confirmation, and that stays.
- **Notification bell and red dot.** The bell on Home is a `TouchableOpacity` with **no `onPress`** and a permanently lit red dot. Remove the dot. Keep the bell only if it is visibly static and inert, otherwise remove it too. Do not wire a fake notifications screen.
- **Pressed feedback.** Convert every `TouchableOpacity` to `Pressable` with `style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}`. Quiet, not bouncy. **Keep every `onPress` handler byte-identical when you convert.**
- **Dead styles.** `DriverCollectionsScreen` carries roughly 40 lines of orphaned styles (`headerContent`, `logoContainer`, `logoCircle`, `logoImage`, `appName`, `companyName`) for a logo block that was already deleted from its JSX. `DriverProfileScreen` has the same problem with `avatarWrap` and `avatarText`, left behind when `ProfileAvatar` was adopted. Delete them. Confirm with `grep` that nothing references each style key before removing it.

---

## 7 · Execution plan (do in this order)

> Work file by file. After **each** file: confirm it still renders, all existing buttons still navigate and trigger the same handlers, and no prop or route was renamed. Run the Section 3.8 verification gate.

### Phase 0 — Foundation

1. Create `src/driver/driverTheme.js` (Section 5.1).
2. Create `src/driver/components/DriverStatusBadge.js` (Section 6.2).
3. Create `src/driver/components/DriverHeader.js` (Section 6.1). Read `RestaurantHeader.js` first.
4. Create `src/components/DriverScreenStates.js` (Section 6.3). Read `RestaurantScreenStates.js` first.
5. Retint `navigation/DriverStack.js` (Section 6.4).

At this point the app should build and look **unchanged** except the tab bar, because no screen imports the new files yet. Confirm that before continuing.

### Phase 1 — Home, then STOP

6. `screens/driver/DriverHomeScreen.js`:
   - Import the theme. Swap every `THEME.` reference. Delete the local `THEME` last (Section 3.1).
   - Replace the gradient header with `<DriverHeader variant="home" ... />`. **Remove the sign-out button and the notification dot** (Section 6.5). Remove the now-unused `useAuth` import.
   - Delete the local `StatusBadge`, import `DriverStatusBadge`.
   - **On-duty toggle becomes the first element below the header** and gains visual weight: a card with a status dot (`primary` when on duty, `muted` when off), the label in `DRV_FONTS.bold`, and the `Switch` with `trackColor={{ true: DRV_COLORS.primary, false: DRV_COLORS.border }}`. This is the single most consequential control on the screen and it is currently the quietest thing on it. Keep `handleToggleDuty` and the `togglingDuty` disabled state exactly as they are.
   - **Wallet card becomes the hero.** Balance in `DRV_FONTS.extraBold` at roughly 32px, `DRV_COLORS.ink`. Unpaid amount as a quiet sub-line. "Request withdrawal" as a flat `primary` pill with `DRV_SHADOWS.button`, keeping the existing disabled logic (`requestingWithdrawal || unpaidEarnings <= 0`) untouched.
   - Stat cards and the weekly card: replace the `LinearGradient` fills with flat white cards, `1px DRV_COLORS.border`, `DRV_RADII.card`, `DRV_SHADOWS.card`. Icon circles use `paleGreen`.
   - Pickup cards: keep the left accent stripe but drive its color from `DRV_STATUS[status].fg` instead of always `primary`.
   - "View all pickups" button: flat `primary` pill, not a gradient. Keep `navigation.navigate('DriverCollections')`.
   - Wrap the `ScrollView` in `DriverRefreshScrollView` with `refreshing` and `refreshCollector` from the context. Add `DriverLoadingBanner` when `loading && pickups.length === 0`.

   ### 🛑 CHECKPOINT — STOP HERE

   Present the redesigned Home screen and wait for the owner's approval before continuing. Do not start Collections until they confirm the direction. If they request changes, apply them to Home first; those decisions then carry into the remaining screens.

### Phase 2 — Roll across remaining screens (only after approval)

7. `screens/driver/DriverCollectionsScreen.js`:
   - Theme migration. Delete the local `THEME` and `StatusBadge`. **Delete the orphaned logo styles** (Section 6.5).
   - Header → `<DriverHeader title="Collections" />` with the count as a sub-line.
   - Filter chips: `surfaceSoft` background with a `border`, active state `primary` fill with white text, `DRV_RADII.pill`. Model on the `TabSwitcher` in `screens/restaurant/PickupsScreen.js` for consistency.
   - Collection cards: flat white, `border`, `DRV_RADII.card`, status-driven left accent from `DRV_STATUS`.
   - "Call" button becomes the secondary style (white fill, `1.5px border`, `ink` text). The action button becomes a flat `primary` pill, not a gradient. Disabled state uses `surfaceSoft` with `muted` text.
   - "Decline this pickup" stays a quiet text link in `alertText`. Keep the `Alert.alert` confirmation exactly.
   - **Keep `handleAction`, `handleDecline`, the status transition chain, and the `useMemo` mapping untouched.**
   - Replace the bare empty state with `DriverEmptyBanner`. Wrap in `DriverRefreshScrollView`.

8. `screens/driver/DriverMapScreen.js`:
   - Theme migration only. **Do not restructure this file** (Sections 3.3 and 3.4).
   - Add `<DriverHeader title="Map" />` above the `MapView` for consistency with the other three screens. The map keeps the rest of the viewport.
   - Loading and error states: keep the early returns exactly where they are. Restyle their contents. **Replace the 📍 emoji with `<Ionicons name="location-outline" />`**, matching every other screen in the app.
   - Driver marker: `DRV_COLORS.primary` core, `DRV_COLORS.accent` at 30% for the pulse ring, white border. Pickup pins use `pinColor={DRV_COLORS.primary}`.
   - Speed badge and pickup-count badge: white, `DRV_RADII.card`, `DRV_SHADOWS.floating`, numbers in `DRV_FONTS.extraBold`.
   - **The pickup badge is hardcoded at `top: 48`**, which collides with the notch on some devices. Once the header exists, position it relative to the header instead of the raw screen top.

9. `screens/driver/DriverProfileScreen.js`:
   - Theme migration. Delete the local `THEME` and the orphaned `avatarWrap` / `avatarText` styles.
   - Header → light `<DriverHeader title="Profile" />`. The profile block (avatar, name, driver ID, verified badge, rating) moves **below** the header onto the page background, as a centered hero. This is what fixes the forest-green-badge-on-teal bug described in Section 1.
   - The stats card keeps its `marginTop: -20` overlap only if it still reads well against a light header. If not, drop the negative margin and use normal spacing. Your call, note which you chose.
   - Remove `textTransform: 'uppercase'` and `letterSpacing` from `sectionTitle` (Section 5.3).
   - `MenuItem` rows: `paleGreen` icon circles, `border` dividers, `Pressable` feedback. Danger row keeps `alertBg` and `negative`.
   - **Keep the `Alert.alert` sign-out confirmation and every `navigation.navigate('ProfileEdit')` call exactly as they are.**
   - Do not modify `ProfileAvatar` or `VerifiedBadge`. They are already correct.

### Phase 3 — Sweep

10. Run these and confirm each returns nothing:

```bash
grep -rn "#10b981\|#059669\|#047857\|#D1FAE5\|#3B82F6\|#DBEAFE" screens/driver/ navigation/DriverStack.js
grep -rn "Poppins_\|Inter_" screens/driver/
grep -rn "THEME\." screens/driver/ navigation/DriverStack.js
grep -rn "toUpperCase()\|textTransform" screens/driver/
grep -rn "TouchableOpacity" screens/driver/
```

The only acceptable survivors are semantic reds, oranges, and ambers referenced through `DRV_COLORS`.

11. Final `git diff --name-only`. It must list **at most** the nine files in Section 2's ✅ list. If anything else appears, revert it.

---

## 8 · Definition of done (acceptance checklist)

- [ ] `src/driver/driverTheme.js` exists and imports brand green from `onboardingTokens.js`
- [ ] **No** driver screen and **no** driver navigator declares its own `THEME` / `COLORS` / `FONTS` object
- [ ] Every driver screen uses forest green `#15643E` via token and Plus Jakarta Sans. No emerald, no blue status badge, no bare `fontWeight` without a family
- [ ] One shared `DriverHeader`. The three copy-pasted gradient headers are gone. Light header, dark status bar, on all four screens including Map
- [ ] `DriverStatusBadge` is defined once and imported twice. The `|| pending` fallback survives
- [ ] No sign-out button in the Home header. Sign-out still works from Profile with its confirmation dialog
- [ ] No permanent notification dot. No dead affordances
- [ ] Loading, empty, and pull-to-refresh states exist on Home and Collections, using only context values that already existed
- [ ] The 📍 emoji is replaced with an Ionicon
- [ ] Sentence case everywhere. No `textTransform: 'uppercase'` in the driver module
- [ ] Every `Pressable` shows pressed feedback and calls the **same handler** as the `TouchableOpacity` it replaced
- [ ] Every button navigates to the **same route** as before
- [ ] Zero orphaned styles. Zero unused imports
- [ ] `git diff --name-only` touches **only** the nine files in Section 2. No context, hook, service, navigator-outside-DriverStack, or other-role file changed
- [ ] No Supabase query, table, column, or field name changed anywhere
- [ ] App builds. All four driver screens render with real data, with empty data, and while loading
- [ ] Duty toggle, withdrawal request, pickup start, pickup complete, and pickup decline all still work end to end against the live backend

---

## 9 · Anti-patterns — do NOT do these

- ❌ Rewriting a whole screen from scratch. **Edit in place**, keep component boundaries and props
- ❌ Deleting a `THEME` object before every reference to it is gone (Section 3.1). This is the single most likely way to white-screen the app
- ❌ Dropping the `|| config.pending` fallback (Section 3.2)
- ❌ Reordering or merging the `DriverMapScreen` early returns (Section 3.3)
- ❌ Adding dependencies to the GPS `useEffect`, or converting its refs to state (Section 3.4)
- ❌ Calling `useCollectorContext()` inside `DriverHeader`. Pass props
- ❌ Importing `getInitials` or anything else from `src/utils/restaurantViewModels.js`
- ❌ Renaming a route, tab, prop, or field "for clarity." It breaks callers you will not see
- ❌ Touching `CollectorContext`, `collectorService`, or any hook to "make the UI cleaner." The UI reads them as-is
- ❌ Adding a charting, animation, or UI library
- ❌ Turning a semantic red, orange, or amber green
- ❌ Deep gradients or bouncy animations. The target aesthetic is calm and airy
- ❌ Guessing at a missing field or route. If it is not in the code, **STOP and ask**
- ❌ Blowing past the Home checkpoint

---

## 10 · Decisions taken on the owner's behalf

These were chosen to keep the pass moving. Each is isolated to one place and cheap to reverse. Flag them at the Home checkpoint.

| # | Decision | Where to reverse it |
|---|---|---|
| 1 | `in_progress` moves from blue `#3B82F6` to `primaryMid` `#2E8B5A` | One line in `DRV_STATUS` |
| 2 | Wallet card becomes the Home hero, above the stat cards | Home layout order |
| 3 | Map gets a light header rather than staying full-bleed | Remove one `<DriverHeader />` |
| 4 | Duty toggle is elevated to the first element below the header, not moved into the header itself | Home layout order |
| 5 | `DriverScreenStates` is created and refresh is wired on Home and Collections | Drop the wrapper, keep the plain `ScrollView` |
| 6 | The `home` header variant uses the Ionicons leaf tile, matching Restaurant, rather than `BioLoop_Logo.png` | One block in `DriverHeader` |

**Out of scope, for a later pass:** Manufacturer and Admin are the last two modules on emerald `#10b981`. Once Driver ships, they are the only remaining inconsistency in the app. `RestaurantStack.js` also still uses `Inter_500Medium` on its tab label.

---

*End of spec. Start at Section 7, Phase 0.*
