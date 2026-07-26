# BioLoop — Manufacturer Module UI Redesign Spec

**For:** Claude Code, working inside `Devine-Devs/`
**Author:** Design/architecture pass, pre-approved by the project owner
**Type:** Presentation-layer retheme of an existing React Native (Expo) app, plus one **optional, separately-gated** structural repair phase.
**Companion docs:** `RESTAURANT_REDESIGN.md` (executed), `DRIVER_REDESIGN.md` (executed). This spec follows the same rules and adds new ones.

---

## 0 · How to use this file

Read this entire file before touching code. Then work through **Section 8 (Execution Plan)** in the exact order given.

There are **two mandatory STOP checkpoints**:
- After the Dashboard home tab (end of Phase 1)
- Before Phase 4 begins at all, because Phase 4 is structural rather than cosmetic and the owner must opt into it explicitly

This module is **larger and messier than the previous two**. Restaurant was 7 screens, Driver was 4. Manufacturer is 8 screens across ~5,500 lines, with five competing color identities and no font family set anywhere. Work slowly. The verification gate in Section 4.9 is not optional.

The visual language is already defined and already lives in the repo:

```
src/onboarding/onboardingTokens.js     ← root source of truth (#15643E lives here)
        ↓
src/auth/authTheme.js                  ← imports from onboarding
src/restaurant/restaurantTheme.js      ← imports from onboarding
src/driver/driverTheme.js              ← imports from onboarding
        ↓
src/manufacturer/manufacturerTheme.js  ← YOU WILL CREATE THIS, same pattern
```

When in doubt, **prefer the smallest change that achieves visual consistency**. Do not invent features, do not restructure data flow, do not "improve" business logic.

---

## 1 · The core problem (why this work exists)

Restaurant and Driver were migrated to the forest-green system in previous passes. Auth and Onboarding were always there. **Manufacturer is the last holdout, and it is the worst of the four.**

### 1.1 · Five competing identities in one module

| Identity | Hex | Where it appears |
|---|---|---|
| **Purple** | `#8b5cf6` → `#7c3aed` → `#6d28d9` | `ProfileScreen` header, `SuppliersScreen` header, four `Switch` tracks, edit icons |
| **Dark navy** | `#1a1a2e` → `#16213e` | Hero cards in `AlertsScreen`, `ForecastsScreen`, `QualityScreen`, and a card in the Dashboard |
| **Acid lime** | `#7EE92D` (37 uses) | `ManufacturerHomeScreen` welcome text and CTA, chart strokes, Grade A bars, AI chat accent |
| **Emerald** | `#10b981` → `#059669` → `#047857` | Dashboard header and bottom nav, AI chat header, "success" alerts |
| **Blue** | `#3b82f6` → `#2563eb` | Default alert severity |

None of these is the brand color. Forest green `#15643E` appears **nowhere** in the manufacturer module.

### 1.2 · No typography at all

```
AIChatScreen.js:                0 fontFamily / 6 fontWeight
AlertsScreen.js:                0 fontFamily / 9 fontWeight
ForecastsScreen.js:             0 fontFamily / 11 fontWeight
ManufacturerDashboardScreen.js: 0 fontFamily / 13 fontWeight
ManufacturerHomeScreen.js:      0 fontFamily / 4 fontWeight
ProfileScreen.js:               0 fontFamily / 10 fontWeight
QualityScreen.js:               0 fontFamily / 11 fontWeight
SuppliersScreen.js:             0 fontFamily / 16 fontWeight
```

**Zero font families across the entire module.** Every string renders in San Francisco on iOS and Roboto on Android. This is the single highest-impact fix in the spec and also the cheapest: setting `fontFamily` on existing text styles changes nothing structural.

### 1.3 · Other counts

- 106 `TouchableOpacity`, 0 `Pressable`. No pressed feedback anywhere.
- 47 `LinearGradient` uses. Restaurant and Driver both reduced to near-zero.
- 42 custom inline SVG icon components, all **defined inside component bodies** (Section 4.5).

All font families are **already loaded app-wide** in `App.js`. No dependency changes are needed. Do not remove Poppins or Inter from the loader; Admin still uses them.

---

## 2 · The architecture (read before you plan anything)

Manufacturer does **not** work like Restaurant or Driver. Understand this before you touch a file.

### 2.1 · Native stack, not bottom tabs

`navigation/ManufacturerStack.js` is a `createNativeStackNavigator` with nine routes. There is no `createBottomTabNavigator`.

### 2.2 · The Dashboard is a hand-rolled tab container

`ManufacturerDashboardScreen.js` imports the other six screens and renders them as **embedded components**:

```js
const renderContent = () => {
  switch (selectedTab) {
    case 'home':      return ( ...inline home JSX... );
    case 'quality':   return <QualityScreen navigation={navigation} />;
    case 'forecasts': return <ForecastsScreen navigation={navigation} />;
    case 'ai-chat':   return <AIChatScreen navigation={navigation} />;
    case 'suppliers': return <SuppliersScreen navigation={navigation} />;
    case 'alerts':    return <AlertsScreen navigation={navigation} />;
    case 'profile':   return <ProfileScreen navigation={navigation} />;
  }
};
```

wrapped in a single parent `ScrollView`, with a custom bottom nav built from `TouchableOpacity` and inline SVG icons.

### 2.3 · Four consequences of that design

1. **Nested vertical ScrollViews.** The Dashboard's `ScrollView` wraps every embedded screen, and each of those has 1 to 3 `ScrollView`s of its own. Nested same-axis scroll containers produce broken scroll physics and React Native warnings.
2. **Competing StatusBars.** Seven of the eight screens render their own `<StatusBar>`. Two mount simultaneously and the last one to mount wins, non-deterministically.
3. **Doubled safe areas.** `AlertsScreen` and `ProfileScreen` each nest a second `SafeAreaView` inside the Dashboard's layout, double-padding the top.
4. **Broken back buttons.** `AIChatScreen`, `AlertsScreen`, `ProfileScreen`, and `QualityScreen` call `navigation.goBack()`. When embedded, that pops the **stack**, sending the user to the `ManufacturerHome` welcome splash instead of back to the dashboard home tab. `ForecastsScreen` and `SuppliersScreen` call `navigate('ManufacturerDashboardScreen')`, which is a no-op because they are already on it.

### 2.4 · Dead routes

`Quality`, `Forecasts`, `AIChat`, `Suppliers`, `Alerts`, `Profile`, and `ProfileEdit` are all registered in `ManufacturerStack.js`. **Nothing in the codebase navigates to any of them.** They are reachable only through `selectedTab` state. Do not delete these routes in this pass; they are harmless and removing them is a separate decision.

### 2.5 · The `MainHeader` gate

`MainHeader` inside the Dashboard returns `null` unless `selectedTab === 'home'`. That is why each embedded screen carries its own header. The pattern is semi-intentional, so the migration to a shared header must respect it (Section 6.1).

---

## 3 · Absolute guardrails

### ✅ In scope — you MAY edit these

- `screens/manufacturer/ManufacturerHomeScreen.js`
- `screens/manufacturer/ManufacturerDashboardScreen.js`
- `screens/manufacturer/QualityScreen.js`
- `screens/manufacturer/ForecastsScreen.js`
- `screens/manufacturer/AIChatScreen.js`
- `screens/manufacturer/SuppliersScreen.js`
- `screens/manufacturer/AlertsScreen.js`
- `screens/manufacturer/ProfileScreen.js`
- `navigation/ManufacturerStack.js` — **Phase 4 only**, and only if the owner opts in
- **New file:** `src/manufacturer/manufacturerTheme.js`
- **New file:** `src/manufacturer/components/ManufacturerHeader.js`
- **New file:** `src/components/ManufacturerScreenStates.js`

That is twelve files. Nothing else.

### ⛔ NEVER touch — out of scope, do not open to edit

- `src/contexts/ManufacturerContext.js` and every other file in `src/contexts/`
- `src/services/manufacturerService.js`, `manufacturerRoutingService.js`, and every other file in `src/services/`
- `src/utils/manufacturerAnalytics.js` — **no exceptions in this spec.** Restaurant's spec had one narrowly-scoped mapper edit; this one has none
- `src/hooks/*`, `src/lib/*`, `src/providers/RoleProviderGate.js`
- `supabase.js`, `AuthContext.js`, `.env*`, `docs/SCHEMA.md`
- `src/components/profile/*` (`ProfileAvatar`, `VerifiedBadge`, `ProfileField`, `ProfileEditScreen`, `ProfileCompletionGate`)
- `src/components/RestaurantScreenStates.js`, `src/components/DriverScreenStates.js`, `src/components/admin/*`
- Any Auth, Onboarding, Restaurant, Driver, or Admin file
- `navigation/RootNavigator.js`, `AuthStack.js`, `RestaurantStack.js`, `DriverStack.js`, `AdminStack.js`
- The three existing theme files. You **import from** `onboardingTokens.js`, you do not edit it
- `package.json` / `package-lock.json`
- Any SQL, migration, or RLS policy
- `assets/welcome-page.png`, `assets/AiChat.png`, `assets/BioLoop_Logo.png` — you may change what is rendered, never the files

### Behavioral rules

- Do **not** change what any screen does. Same buttons, same handlers, same destinations.
- Do **not** add libraries. `react-native`, `expo-linear-gradient`, `react-native-svg`, `@expo/vector-icons` are all installed.
- Do **not** change any Supabase query, table, column, or field name.
- Do **not** rename any route, prop, state key, or `selectedTab` string value.
- If something is genuinely ambiguous, **STOP and ask**. Never hallucinate a missing prop, field, or route.

---

## 4 · Crash-risk register (read this twice)

The owner's explicit requirement is that this pass **must not crash the app or disturb the backend**. This module has more ways to break than the previous two.

### 4.1 · The `THEME` deletion trap

`ManufacturerDashboardScreen.js` is the only file with a module-level `const THEME = {...}`, referenced throughout its `StyleSheet.create`. `StyleSheet.create` runs at **module load**, so one surviving `THEME.primary` after deletion throws a `ReferenceError` before render. White screen, not a soft failure.

**Procedure for that file:**
1. Add the theme import.
2. Replace every `THEME.` reference.
3. `grep -n "THEME\." screens/manufacturer/ManufacturerDashboardScreen.js` returns **zero**.
4. Only then delete the block.
5. Reload before moving on.

The other seven files hardcode hex inline, so they carry no equivalent risk. They carry a different one, below.

### 4.2 · Hex strings that are data, not style

Some hex values in this module are **assigned into data structures**, not style objects. Blind find-and-replace will corrupt them or silently change chart output. Handle each deliberately:

- `ManufacturerDashboardScreen.js` ~line 82: `qualityDistribution` builds objects `{ name, value, color }` consumed by chart rendering.
- `ManufacturerDashboardScreen.js` ~lines 124 and 133: `getGradeColor` / `getGradeBg` are `switch` returns, including the `'#7EE92D20'` form (six-digit hex plus a two-digit alpha suffix). **The alpha suffix must survive.** `DRV`-style tokens do not carry alpha, so build these as template strings or add explicit alpha tokens.
- `AlertsScreen.js` ~lines 95 to 111: severity config returns `{ gradient: [...], borderColor, iconBg }`. `iconBg` also uses the `+'20'` alpha suffix.

Retheme these by **changing the values they hold**, keeping the object shape, key names, and alpha-suffix pattern identical.

### 4.3 · Grade and severity keys are business logic

`getGradeColor` switches on `'A'`, `'B'`, `'C'`. Alert severity switches on strings including `'success'`. These map to database values. **Change the colors returned. Never change a `case` label, add a case, or reorder the switch.**

### 4.4 · The `+'20'` alpha convention

The codebase appends a two-character hex alpha to six-digit colors (`'#7EE92D20'`, `'#3b82f620'`, `'#f59e0b20'`). This only works on a literal six-digit string. If you swap in a token, `MFG_COLORS.primary + '20'` still works because the token is a six-digit string, but **verify the token has no leading/trailing whitespace and is not already eight digits.** An eight-digit result plus `'20'` is a ten-character string that renders as transparent or throws on Android.

### 4.5 · Icon components defined inside component bodies

42 SVG icon components (`HomeIcon`, `ChartIcon`, `AIChatIcon`, `BellIcon`, `FilterIcon`, `TrendingUpIcon`, and so on) are declared **inside** their parent component's function body. React treats a new function identity as a new component type on every render, so the entire icon subtree unmounts and remounts each time the parent re-renders.

**Hoist each icon to module scope in its own file**, above the component. This is a pure move: same JSX, same props, same name. Do not centralize them into a shared file in this pass, and do not convert them to Ionicons except for the five bottom-nav icons in Phase 4. Keeping the diff mechanical is what makes it safe.

After hoisting, verify the icon does not close over any value from the component body. If one does (a `color` derived from state, for example), **leave that icon where it is** and note it.

### 4.6 · `ProfileScreen` local state mirrors context

`ProfileScreen` holds a `profile` object in `useState`, seeded from `manufacturer`, and re-syncs it in a `useEffect` on `[manufacturer, authProfile]`. `handleSave` writes to that local state only.

**Do not attempt to make this persist in this pass.** Wiring it to Supabase means touching a service, which is forbidden by Section 3. Section 7.3 covers the honest interim fix. Leave `handleSave`, `handleEdit`, `handleCancel`, and the `useEffect` dependency array exactly as they are.

### 4.7 · The nested ScrollView is load-bearing until Phase 4

Until Phase 4 explicitly restructures it, the parent `ScrollView` in the Dashboard is what makes the embedded screens scroll at all in some layouts. **Do not remove it during Phases 0 to 3.** Retheme inside it.

### 4.8 · Provider boundaries

`useManufacturerContext()` throws by design outside `ManufacturerProvider`, mounted in `RoleProviderGate.js` (off limits). Every new component must render **inside** a manufacturer screen. `ManufacturerHeader` may call `useSafeAreaInsets()` because `SafeAreaProvider` wraps the app in `App.js`, but must **not** call `useManufacturerContext()`. Pass data in as props.

### 4.9 · Verification gate after every single file

```bash
npx expo start -c        # app boots, no red screen
grep -rn "THEME\." screens/manufacturer/
git diff --name-only     # only Section 3 ✅ files appear
```

Then manually: open the Dashboard, tap through **all six** bottom-nav tabs, and confirm each renders. A break in an embedded screen does not surface until you visit its tab.

If `git diff --name-only` ever lists a context, hook, service, util, or another role's file, **revert it immediately** and report.

---

## 5 · The data contract (do not alter any of these)

### 5.1 · From `useManufacturerContext()`

| Value | Shape / fields read |
|---|---|
| `manufacturer` | `name`, `contact_person`, `contact_email`, `contact_phone`, `position`, `address`, `created_at`, `company_description`, `company_registration_number`, `accepted_grades`, `years_in_business` |
| `inventory` | `current_stock_liters`, `stock_change_pct` |
| `tanks` | Array |
| `forecasts` | Array. Each: `period_days`, `total_volume_liters`, `grade_a_pct`, `grade_b_pct`, `grade_c_pct`, `trend_label`, `confidence_pct` |
| `pickups` | Array. Each: `id`, `status`, `pickup_date`, `pickup_time_start`, `estimated_volume_liters`, `actual_volume_liters`, `quality_grade`, `restaurants: { name }` |
| `alerts` | Array. Each: `is_read`, plus severity fields |
| `loading`, `refreshing`, `error` | Booleans / error object |
| `refreshManufacturer` | Function |
| `updateAlertReadStatus`, `deleteAlert` | Async functions |

### 5.2 · Other bindings

- `useProfile()` → `profile.full_name`, `profile.email`, `profile.phone`
- `useAuth()` → `signOut`
- `src/utils/manufacturerAnalytics.js` → `groupPickupsByDay`, `groupPickupsByMonth`, `computeSupplierStats`. **Import and call only. Never edit.**
- `getInitials` from `src/utils/restaurantViewModels.js`, already imported by the Dashboard. **Leave this import alone.** It is pre-existing cross-module coupling. Do not add new cross-module imports, and do not "fix" this one.

### 5.3 · Route names (renaming breaks navigation)

`ManufacturerHome`, `ManufacturerDashboardScreen`, `Quality`, `Forecasts`, `AIChat`, `Suppliers`, `Alerts`, `Profile`, `ProfileEdit`

### 5.4 · `selectedTab` string values (renaming breaks the tab bar)

`'home'`, `'quality'`, `'forecasts'`, `'ai-chat'`, `'suppliers'`, `'alerts'`, `'profile'`

Note the hyphen in `'ai-chat'`. It is inconsistent with the others and it stays.

---

## 6 · The design system (build this first)

### 6.1 · Create `src/manufacturer/manufacturerTheme.js`

```js
// src/manufacturer/manufacturerTheme.js
// Manufacturer design tokens — forest-green system matching Auth, Onboarding,
// Restaurant, and Driver. Single source of truth for the Manufacturer module.
// Brand green is pulled from the onboarding tokens so #15643E is never a magic value.

import { ONB_COLORS, ONB_FONTS } from '../onboarding/onboardingTokens';

export const MFG_COLORS = {
  // Brand
  primary: ONB_COLORS.primary,       // '#15643E' forest green
  primaryMid: ONB_COLORS.primaryMid, // '#2E8B5A' mid green (charts, secondary series)
  accent: ONB_COLORS.accent,         // '#79C39A' light green (chart fills, rings)
  accentSoft: ONB_COLORS.accentSoft, // '#9FD3B3' (tertiary chart series)
  primaryShadow: 'rgba(21,100,62,0.32)',

  // Text
  ink: '#122A1F',
  body: '#6B7F75',
  muted: '#A9B5AD',

  // Surfaces
  page: '#F6F8F7',
  card: '#FFFFFF',
  surfaceSoft: '#F5F8F6',
  paleGreen: '#E7F1EB',
  selectedBg: '#F2F8F4',
  border: '#E4EDE7',
  divider: '#E4EDE7',

  // Semantic (kept — do not forest-green these)
  alertBg: '#FFF1F1', alertBorder: '#FECACA', alertText: '#DC2626',
  warnBg: '#FFF7ED', warnBorder: '#FED7AA', warnText: '#C2410C',
  positive: '#15643E', negative: '#DC2626', amber: '#F59E0B',

  white: '#FFFFFF',
};

// Quality grade → color. Replaces getGradeColor / getGradeBg literals.
// Values are six-digit strings so the existing `+ '20'` alpha convention
// keeps working. See Section 4.4.
export const MFG_GRADE = {
  A: MFG_COLORS.primary,     // '#15643E'
  B: MFG_COLORS.amber,       // '#F59E0B'
  C: MFG_COLORS.negative,    // '#DC2626'
};

// Alert severity → treatment. Replaces the inline severity switch in AlertsScreen.
// Shape matches what that switch already returns. Do not change the keys.
export const MFG_SEVERITY = {
  critical: { gradient: ['#DC2626', '#B91C1C'], borderColor: '#DC2626', base: '#DC2626' },
  warning:  { gradient: ['#F59E0B', '#D97706'], borderColor: '#F59E0B', base: '#F59E0B' },
  success:  { gradient: [MFG_COLORS.primary, '#0F4A2E'], borderColor: MFG_COLORS.primary, base: '#15643E' },
  info:     { gradient: [MFG_COLORS.primaryMid, MFG_COLORS.primary], borderColor: MFG_COLORS.primaryMid, base: '#2E8B5A' },
};

// Ordered series for multi-value charts. Use in order; do not reach past index 3
// without adding a token here first.
export const MFG_CHART_SERIES = [
  MFG_COLORS.primary,
  MFG_COLORS.primaryMid,
  MFG_COLORS.accent,
  MFG_COLORS.accentSoft,
];

export const MFG_FONTS = {
  extraBold: ONB_FONTS.extraBold,
  bold: ONB_FONTS.bold,
  semiBold: ONB_FONTS.semiBold,
  medium: ONB_FONTS.medium,
  regular: ONB_FONTS.regular,
};

export const MFG_SHADOWS = {
  card: {
    shadowColor: '#122A1F', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  button: {
    shadowColor: MFG_COLORS.primary, shadowOpacity: 0.32, shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  floating: {
    shadowColor: '#122A1F', shadowOpacity: 0.12, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
};

export const MFG_RADII = { card: 18, chip: 12, pill: 30, input: 18 };
export const MFG_SPACING = { screenPadding: 20, cardPadding: 18, gap: 12 };
```

> **Decision to confirm:** `MFG_SEVERITY.info` moves from blue `#3b82f6` to `primaryMid`. Blue exists nowhere else in BioLoop. Critical and warning stay red and amber, which is correct. If the owner wants informational alerts visually distinct from success alerts, that is one line.

### 6.2 · Token migration table (old → new)

| Old value(s) | Replace with |
|---|---|
| `#7EE92D`, `#5cb85c` | `MFG_COLORS.primary` (Grade A, CTAs) or `MFG_COLORS.accent` (chart fills). Judge per site |
| `#8b5cf6`, `#7c3aed`, `#6d28d9` (purple) | `MFG_COLORS.primary`. All of it |
| `#1a1a2e`, `#16213e` (navy) | Hero cards become **light**: `card` background, `border`, `MFG_SHADOWS.card`. Not a darker green |
| `#10b981`, `#059669`, `#047857` | `MFG_COLORS.primary` (or `primaryMid` as a secondary accent) |
| `#D1FAE5`, `#F0FDF4` | `MFG_COLORS.paleGreen` |
| `#3b82f6`, `#2563eb` | `MFG_SEVERITY.info` |
| `#F9FAFB`, `#F3F4F6` (backgrounds) | `MFG_COLORS.page` |
| `#111827` | `MFG_COLORS.ink` |
| `#6B7280`, `#666` | `MFG_COLORS.body` |
| `#9CA3AF`, `#999`, `#D1D5DB` | `MFG_COLORS.muted` |
| `#E5E7EB` | `MFG_COLORS.border` |
| `#EF4444`, `#DC2626`, `#B91C1C` | `MFG_COLORS.negative` / `alertText` |
| `#FEE2E2`, `#FEF2F2` | `MFG_COLORS.alertBg` |
| `#FECACA` | `MFG_COLORS.alertBorder` |
| `#F59E0B`, `#D97706` | `MFG_COLORS.amber` / `warnText` |
| `#FEF3C7` | `MFG_COLORS.warnBg` |
| `shadowColor: '#000'` | the matching `MFG_SHADOWS` preset |
| bare `fontWeight: '700'` | `fontFamily: MFG_FONTS.bold`, **delete the `fontWeight`** |
| bare `fontWeight: '600'` | `fontFamily: MFG_FONTS.semiBold`, delete `fontWeight` |
| bare `fontWeight: '500'` | `fontFamily: MFG_FONTS.medium`, delete `fontWeight` |
| bare `fontWeight: '400'` or none | `fontFamily: MFG_FONTS.regular` or `medium` |

Rule of thumb: **greens, limes, purples, and navies all become forest green; semantic reds, oranges, and ambers stay.** Never turn an error state green.

### 6.3 · Typography rules

- **Screen titles, hero numbers** (stock litres, forecast totals): `MFG_FONTS.extraBold`
- **Card titles, buttons, tab labels:** `MFG_FONTS.bold`
- **Labels, chart axis labels:** `MFG_FONTS.semiBold`
- **Body, chat messages:** `MFG_FONTS.medium`
- Never set `fontWeight` alongside a Plus Jakarta `fontFamily`. Combining them produces synthetic bolding on Android.
- Sentence case everywhere.

### 6.4 · Radii, spacing, gradients

Collapse the current 8, 10, 12, 14, 16, 20, 24 mix onto `MFG_RADII`. Standardise horizontal screen padding on `MFG_SPACING.screenPadding` (20).

**Gradients: 47 down to at most 3.** Restaurant and Driver both moved to flat surfaces. Keep a gradient only where it encodes data (a chart fill under a line). Every decorative gradient becomes a flat `card` surface with a `1px border` and `MFG_SHADOWS.card`. This alone removes most of the visual noise.

---

## 7 · Shared components and interaction honesty

### 7.1 · `src/manufacturer/components/ManufacturerHeader.js` (new)

Seven screens each render their own header. Replace them with one component modeled on `src/manufacturer/../restaurant/components/RestaurantHeader.js` and `src/driver/components/DriverHeader.js`. **Read both first.**

**Design:** light header, `MFG_COLORS.page` background, `barStyle="dark-content"`, title in `MFG_FONTS.extraBold` / `MFG_COLORS.ink`. Green reserved for the logo tile, avatar accent, and primary buttons.

```
<ManufacturerHeader
  title="Quality"                  // or variant="home" for logo + "Manufacturer Portal"
  avatarInitials={...} avatarUrl={...}
  onAvatarPress={...}
  showBack={false} onBack={...}    // see 7.2
  badgeCount={unreadCount}         // optional, Alerts only
/>
```

Uses the same Ionicons leaf tile as Restaurant and Driver for the `home` variant.

**Critical:** because six screens render both standalone and embedded, this header must **only** render one `<StatusBar>`. The Dashboard renders it via `MainHeader`; the embedded screens must **not** render a second one. Gate it with a `showStatusBar` prop defaulting to `true`, and pass `showStatusBar={false}` from every embedded usage. This resolves the competing-StatusBar problem from Section 2.3 without restructuring anything.

### 7.2 · The back-button fix (do this in Phase 2, it is not structural)

Four embedded screens call `navigation.goBack()`, which sends the user to the welcome splash. Fix by accepting an optional `onBack` prop:

```js
// In each embedded screen's signature:
const QualityScreen = ({ navigation, onBack }) => {
  const handleBack = onBack ?? (() => navigation.goBack());
  ...
};
```

Then in the Dashboard's `renderContent()`:

```js
case 'quality': return <QualityScreen navigation={navigation} onBack={() => setSelectedTab('home')} />;
```

This preserves standalone behavior exactly (the fallback is the current code) while fixing embedded behavior. Apply to all six embedded screens, including the two that call `navigate('ManufacturerDashboardScreen')`.

### 7.3 · Interaction honesty

Fake affordances are the fastest way to feel AI-generated and they erode trust on an app whose pitch is transparency.

- **The four dead toggles in `ProfileScreen`.** `notificationsEnabled`, `emailAlertsEnabled`, `darkModeEnabled`, `biometricEnabled` are wired to local `useState` and nothing else. Persisting them requires a service edit, which is forbidden. **Remove all four rows.** A dark-mode switch that does nothing implies an entire feature that does not exist. If the owner wants them retained as a demo, they must be visibly disabled with a "Coming soon" label, never interactive.
- **The inline profile editor.** `handleSave` writes to local state and the `useEffect` overwrites it on the next refresh, so the edit silently vanishes. **Replace the inline edit affordance with a single "Edit profile" button that calls `navigation.navigate('ProfileEdit')`**, matching Restaurant and Driver. That route is already registered in `ManufacturerStack.js` and already persists correctly through the shared `ProfileEditScreen`. Leave `handleEdit`, `handleSave`, `handleCancel`, and the `profile` state in place but unreferenced by the UI; deleting them is a cleanup for a later pass, and leaving them costs nothing.
- **The "Logout" button on `ManufacturerHomeScreen`.** Floating top-right, calls `signOut()` with **no confirmation**. Restaurant and Driver both confirm. Wrap it in the same `Alert.alert` confirmation `ProfileScreen` already uses. Do not remove it; unlike the other roles, this screen is the only exit point from the splash.
- **The AI Chat.** See Section 10, decision 6. Do not change its behavior without the owner's explicit instruction.
- **Pressed feedback.** Convert `TouchableOpacity` to `Pressable` with `style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}`. There are 106 of them, so do this **per screen as you retheme that screen**, never as a bulk pass. **Keep every `onPress` handler byte-identical.**

### 7.4 · `src/components/ManufacturerScreenStates.js` (new)

Mirror `src/components/RestaurantScreenStates.js` and `DriverScreenStates.js`. **Read both first.** Export `ManufacturerLoadingBanner`, `ManufacturerEmptyBanner`, and `ManufacturerRefreshScrollView`.

The context already exposes `loading`, `refreshing`, `error`, and `refreshManufacturer`. The Dashboard currently fakes its refresh:

```js
const onRefresh = () => {
  if (refreshManufacturer) refreshManufacturer();
  setRefreshing(true);
  setTimeout(() => setRefreshing(false), 2000);  // ← arbitrary 2s, unrelated to the actual fetch
};
```

The spinner is on a timer, not tied to the request. **Replace the local `refreshing` state with the context's `refreshing` value** so the indicator reflects the real fetch. This reads an already-exported value and adds no service calls.

Empty-state copy states the situation and offers the next action. "No alerts right now. New alerts appear here as they are raised." Not "Nothing to see here!"

---

## 8 · Execution plan (do in this order)

> After **each** file: run the Section 4.9 gate, including tapping through all six tabs.

### Phase 0 — Foundation

1. Create `src/manufacturer/manufacturerTheme.js` (Section 6.1).
2. Create `src/manufacturer/components/ManufacturerHeader.js` (Section 7.1). Read `RestaurantHeader.js` and `DriverHeader.js` first.
3. Create `src/components/ManufacturerScreenStates.js` (Section 7.4). Read the other two first.

The app should build and look **unchanged**, because nothing imports the new files yet. Confirm that before continuing.

### Phase 1 — Welcome screen and Dashboard home tab, then STOP

4. `ManufacturerHomeScreen.js` (145 lines, the easiest file, do it first to establish the pattern):
   - Keep the `welcome-page.png` background and the dark overlay.
   - Acid lime `#7EE92D` on the username and CTA → `MFG_COLORS.accent` for the name (legible on a dark overlay) and `MFG_COLORS.primary` for the CTA fill.
   - Set `fontFamily` on all four text styles. `userName` → `extraBold`, `welcomeText` → `medium`, `subtitle` → `medium`, `buttonText` → `bold`.
   - CTA radius → `MFG_RADII.pill`, shadow → `MFG_SHADOWS.button`.
   - Wrap the logout button in an `Alert.alert` confirmation (Section 7.3).
   - `TouchableOpacity` → `Pressable`.

5. `ManufacturerDashboardScreen.js`, **home tab only**:
   - Import the theme. Swap every `THEME.` reference. Delete the local `THEME` **last** (Section 4.1).
   - Hoist all 10 inline icon components to module scope (Section 4.5).
   - `MainHeader` → `<ManufacturerHeader variant="home" showStatusBar />`, keeping the `selectedTab !== 'home'` gate.
   - Retheme `getGradeColor` / `getGradeBg` to read `MFG_GRADE`, preserving the switch structure and the `+ '20'` alpha suffix (Sections 4.2 to 4.4).
   - `qualityDistribution` colors → `MFG_GRADE.A` / `.B` / `.C`. Keep the object shape.
   - Home tab cards: flat white, `1px border`, `MFG_RADII.card`, `MFG_SHADOWS.card`. Remove decorative gradients.
   - Charts: `MFG_CHART_SERIES` in order.
   - Bottom nav: active `MFG_COLORS.primary`, inactive `MFG_COLORS.muted`, labels `MFG_FONTS.semiBold`, active pill `MFG_COLORS.paleGreen`.
   - Replace the fake `setTimeout` refresh with the context's `refreshing` (Section 7.4).
   - **Do not touch `renderContent`'s six embedded cases yet.** Do not remove the parent `ScrollView` (Section 4.7).

   ### 🛑 CHECKPOINT 1 — STOP HERE

   Present the welcome screen and the Dashboard home tab. Wait for approval. The other six tabs will still look wrong; that is expected. Do not start Phase 2 until the owner confirms the direction.

### Phase 2 — The six embedded screens (only after approval)

Do them in this order, easiest to hardest. **One file at a time, full gate between each.**

6. `AlertsScreen.js` — severity switch → `MFG_SEVERITY`, preserving keys and the `iconBg` alpha suffix (Sections 4.2, 4.3). Navy hero card → light card. Hoist 4 icons. Header → `ManufacturerHeader` with `showStatusBar={false}` and `onBack`. Remove the nested `SafeAreaView`. Keep `updateAlertReadStatus` and `deleteAlert` calls exactly.
7. `SuppliersScreen.js` — purple header → light header. Hoist 6 icons. Keep `computeSupplierStats` inputs untouched. Three `ScrollView`s: leave them, Phase 4 handles nesting.
8. `QualityScreen.js` — navy hero → light card. Lime chart bars → `MFG_CHART_SERIES`. Hoist 3 icons. Keep `groupPickupsByMonth` and `computeSupplierStats` inputs untouched.
9. `ForecastsScreen.js` — lime chart strokes → `MFG_CHART_SERIES`. The dashed legend line keeps `borderStyle: 'dashed'`, only its color changes. Navy hero → light card. Hoist 4 icons. Keep `groupPickupsByDay` inputs untouched.
10. `AIChatScreen.js` — lime accent → `MFG_COLORS.primary`. Emerald header → light header. Message bubbles: user `MFG_COLORS.primary` with white text, assistant `MFG_COLORS.surfaceSoft` with `ink` text, both `MFG_RADII.card`. Suggestion chips → `paleGreen` fill, `border`, `MFG_RADII.pill`. **Do not change `getAIResponse`, `sendChatMessage`, or the `setTimeout` without an explicit instruction** (Section 10, decision 6).
11. `ProfileScreen.js` — purple header and purple `Switch` tracks → forest green. Remove the four dead toggles (Section 7.3). Replace the inline editor with an "Edit profile" button → `navigation.navigate('ProfileEdit')`. Hoist 15 icons, the largest set in the module. Remove the nested `SafeAreaView`. **Keep the `Alert.alert` logout confirmation exactly.**

### Phase 3 — Sweep

12. Each of these must return nothing:

```bash
grep -rni "#7EE92D\|#5cb85c\|#8b5cf6\|#7c3aed\|#6d28d9\|#1a1a2e\|#16213e" screens/manufacturer/
grep -rni "#10b981\|#059669\|#047857\|#3b82f6\|#2563eb" screens/manufacturer/
grep -rn "THEME\." screens/manufacturer/
grep -rn "TouchableOpacity" screens/manufacturer/
grep -rn "fontWeight" screens/manufacturer/
```

13. Confirm every text style has a `fontFamily`:

```bash
grep -c "fontFamily" screens/manufacturer/*.js   # every file > 0
```

14. `git diff --name-only` lists at most the Section 3 ✅ files.

### 🛑 CHECKPOINT 2 — STOP. Phase 4 is opt-in.

Everything above is presentational. Phase 4 changes how screens are composed. **Do not begin it unless the owner explicitly says "proceed with Phase 4."** The retheme is complete and shippable without it.

### Phase 4 — Structural repair (only on explicit instruction)

15. **Un-nest the ScrollViews.** In the Dashboard, wrap only the home case:

```js
{selectedTab === 'home' ? (
  <ManufacturerRefreshScrollView
    refreshing={refreshing}
    onRefresh={refreshManufacturer}
    contentContainerStyle={styles.scrollContent}
  >
    <View style={styles.content}>{renderHomeContent()}</View>
  </ManufacturerRefreshScrollView>
) : (
  <View style={styles.content}>{renderContent()}</View>
)}
```

Each embedded screen then owns its own scrolling. **Known tradeoff:** the non-home tabs lose pull-to-refresh, because they never had their own `RefreshControl`. Accept this, or add one per screen as a follow-up. Say which you chose.

16. **Bottom nav icons → Ionicons**, matching Restaurant and Driver: `home-outline`, `bar-chart-outline`, `chatbubbles-outline`, `trending-up-outline`, `people-outline`. Five icons only. The decorative and chart SVGs stay as hoisted components.

17. `navigation/ManufacturerStack.js` — no color changes needed, it has no styling. Touch it only if Phase 4 requires a route change, which it should not. Leave the seven currently-unreachable routes registered (Section 2.4).

---

## 9 · Definition of done (acceptance checklist)

### Phases 0 to 3

- [ ] `src/manufacturer/manufacturerTheme.js` exists and imports brand green from `onboardingTokens.js`
- [ ] No manufacturer screen declares its own `THEME` / `COLORS` object
- [ ] **Zero** occurrences of lime, purple, navy, emerald, or blue in `screens/manufacturer/`
- [ ] **Every** text style in all eight screens has a `fontFamily`. No bare `fontWeight` survives
- [ ] Gradients reduced from 47 to 3 or fewer, and every survivor encodes data
- [ ] One shared `ManufacturerHeader`. Exactly **one** `<StatusBar>` mounts at a time
- [ ] No nested `SafeAreaView` in `AlertsScreen` or `ProfileScreen`
- [ ] Back buttons on all six embedded screens return to the dashboard home tab, and still call `goBack()` when standalone
- [ ] All 42 icon components hoisted to module scope, or documented as unhoistable with a reason
- [ ] `getGradeColor`, `getGradeBg`, and the severity switch keep their exact `case` labels, object shapes, and `+ '20'` alpha suffix
- [ ] The four dead toggles are gone. "Edit profile" navigates to `ProfileEdit`
- [ ] Logout on the welcome screen confirms before signing out
- [ ] Dashboard refresh reflects the real fetch, not a `setTimeout`
- [ ] All 106 touchables show pressed feedback and call the **same handler** as before
- [ ] `git diff --name-only` touches **only** the Section 3 ✅ files. No context, hook, service, util, navigator, or other-role file changed
- [ ] `manufacturerAnalytics.js` is byte-identical
- [ ] No Supabase query, table, column, or field name changed anywhere
- [ ] App builds. All six tabs render with real data, with empty data, and while loading
- [ ] Alert read/delete, dashboard refresh, AI chat send, and sign-out all still work against the live backend

### Phase 4 (if run)

- [ ] No nested same-axis `ScrollView` anywhere in the module
- [ ] Bottom nav uses Ionicons
- [ ] The pull-to-refresh tradeoff from step 15 is documented

---

## 10 · Decisions taken on the owner's behalf

| # | Decision | Reverse it by |
|---|---|---|
| 1 | Navy hero cards (`#1a1a2e`) become **light** cards, not dark green ones. The app has no dark surface anywhere else | Restyling those four cards |
| 2 | Alert severity `info` moves from blue to `primaryMid` | One line in `MFG_SEVERITY` |
| 3 | The four dead toggles are **removed**, not disabled | Re-adding them as inert rows |
| 4 | Inline profile editing is replaced by navigation to the shared, working `ProfileEdit` | Reverting that one button |
| 5 | The `welcome-page.png` splash **stays**. It is the only manufacturer screen with real personality, and it now just needs correct fonts and colors | N/A |
| 6 | **The AI Chat is rethemed only. Its behavior is untouched.** `getAIResponse` is a keyword `if/else` chain and the 1.5s "typing" delay is `setTimeout`, so the screen presents a lookup table as an AI. This spec does not change it, because it may be a required coursework deliverable. **Owner decision needed:** leave as-is, rename to "Data assistant" and drop the artificial delay, or wire to a real API in a separate pass | Owner instruction |
| 7 | Phase 4 is opt-in and gated behind a second checkpoint | N/A |

**Out of scope, for a later pass:** Admin is the last module untouched by any redesign. The seven unreachable routes in `ManufacturerStack.js` should eventually be removed or made reachable. `RestaurantStack.js` still uses `Inter_500Medium` on its tab label.

---

## 11 · Anti-patterns — do NOT do these

- ❌ Bulk find-and-replace across the whole module. Section 4.2 hex values live in data structures, and a global replace will corrupt them
- ❌ Deleting the `THEME` object before every reference is gone (Section 4.1)
- ❌ Dropping or reordering a `case` label in `getGradeColor` or the severity switch (Section 4.3)
- ❌ Breaking the `+ '20'` alpha convention (Section 4.4)
- ❌ Removing the Dashboard's parent `ScrollView` during Phases 0 to 3 (Section 4.7)
- ❌ Making `handleSave` persist. That requires a service edit (Section 4.6)
- ❌ Editing `manufacturerAnalytics.js` for any reason
- ❌ Adding new cross-module imports. The one existing `getInitials` import stays and is not a precedent
- ❌ Changing `getAIResponse` or `sendChatMessage` without explicit instruction
- ❌ Renaming a route, prop, or `selectedTab` string. Note `'ai-chat'` keeps its hyphen
- ❌ Converting all 42 icons to Ionicons. Only the five bottom-nav icons, and only in Phase 4
- ❌ Touching `ManufacturerContext`, any service, or any hook to "make the UI cleaner"
- ❌ Turning a semantic red, orange, or amber green
- ❌ Starting Phase 4 without an explicit instruction
- ❌ Guessing at a missing field or route. If it is not in the code, **STOP and ask**

---

*End of spec. Start at Section 8, Phase 0.*
