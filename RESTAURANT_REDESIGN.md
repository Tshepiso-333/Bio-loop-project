# BioLoop — Restaurant Module UI Redesign Spec

**For:** Claude Code, working inside `Devine-Devs/`
**Author:** Design/architecture pass, pre-approved by the project owner
**Type:** Presentation-layer retheme of an existing React Native (Expo) app. **Not** a rewrite.

---

## 0 · How to use this file

Read this entire file before touching code. Then work through **Section 6 (Execution Plan)** in the exact order given. There is a **mandatory STOP checkpoint after the Home screen** — do not proceed past it until the owner approves the Home result.

This is a **retheme of components that already exist**, not net-new UI. The visual language is already defined and already lives in the repo (`src/onboarding/onboardingTokens.js` and `src/auth/authTheme.js`). Your job is to propagate that language onto the seven Restaurant screens, which have drifted onto a different palette and font stack.

When in doubt, **prefer the smallest change that achieves visual consistency**. Do not invent features, do not restructure data flow, do not "improve" business logic.

---

## 1 · The core problem (why this work exists)

The app has two design languages:

| | **Auth / Onboarding (the target)** | **Restaurant (current, wrong)** |
|---|---|---|
| Primary green | Forest `#15643E` | Emerald `#10b981` / `#059669` |
| Headings font | Plus Jakarta Sans | Poppins |
| Body font | Plus Jakarta Sans | Inter |
| Text color | ink `#122A1F` / body `#6B7F75` | slate `#0F172A` / `#64748B` |
| Surfaces | white + pale green `#F5F8F6` | `#F4F4EF` off-white |
| Header | light, airy, dark status bar | full-bleed saturated green gradient |

A user finishes a calm forest-green sign-up and lands in a bright teal dashboard. It reads as two different products. **Every fix below serves one goal: make the Restaurant module feel like the same product as Auth/Onboarding.**

All three font families are **already loaded app-wide** in `App.js` (`useFonts`), including all five Plus Jakarta Sans weights. **No dependency changes are needed.** Do not remove Poppins/Inter from the font loader — other roles (Manufacturer, Driver, Admin) still use them.

---

## 2 · Absolute guardrails

### ✅ In scope — you MAY edit these
- `screens/restaurant/*.js` (all 7 screens)
- `src/components/RestaurantScreenStates.js`
- `navigation/RestaurantStack.js` — **tab bar tint colors only**
- **New file** you will create: `src/restaurant/restaurantTheme.js`
- **New file** you will create: `src/restaurant/components/RestaurantHeader.js`
- `src/utils/restaurantViewModels.js` — **display-formatting only** (the single, tightly-scoped exception in Section 3.4). Nothing else in this file.

### ⛔ NEVER touch — out of scope, do not open to edit
- Any `src/contexts/*` (RestaurantContext and all others)
- Any `src/hooks/*` (`useRestaurant`, `useProfile`, etc.)
- Any `src/services/*` (`restaurantService`, `supabase`, etc.)
- `supabase.js`, `AuthContext.js`, `.env*`
- Any Auth, Onboarding, Manufacturer, Driver, Admin, or Profile-shared (`src/components/profile/*`) files
- `navigation/RootNavigator.js`, `AuthStack.js`, or any non-Restaurant stack
- Route **names** (`RestaurantTabs`, `SchedulePickup`, `ManualPickup`, `ProfileEdit`, tab names `Home`/`Monitoring`/`Pickups`/`Earnings`/`Profile`) — renaming a route breaks navigation calls elsewhere
- Any data shape, prop name, mapper **return-key**, Supabase query, or `useMemo` dependency array
- `package.json` / `package-lock.json`

### Behavioral rules
- Do **not** change what any screen does. Same buttons trigger the same handlers and navigate to the same routes.
- Do **not** add libraries. Everything is achievable with `react-native`, `expo-linear-gradient`, `react-native-svg` (already installed), and `@expo/vector-icons`.
- Preserve all existing props on every component. If you restyle `<TankCard data={...} />`, it still receives and consumes the same `data` object with the same keys.
- If something is genuinely ambiguous, **STOP and ask** rather than guessing. Never hallucinate a missing prop, field, or route.

---

## 3 · The design system (build this first)

### 3.1 · Create `src/restaurant/restaurantTheme.js`

This is the single source of truth for the whole Restaurant module — mirroring how `authTheme.js` works for Auth. Every restaurant screen imports from here. No screen may declare its own `COLORS`/`FONTS` object after this file exists.

Pull the brand green from the onboarding tokens (single source of truth) so `#15643E` is never a magic value, exactly as `authTheme.js` already does.

```js
// src/restaurant/restaurantTheme.js
// Restaurant design tokens — forest-green system matching Auth + Onboarding.
// Single source of truth for the Restaurant module. Brand green is pulled from
// the onboarding tokens so #15643E never appears as a magic value.

import { ONB_COLORS, ONB_FONTS } from '../onboarding/onboardingTokens';

export const REST_COLORS = {
  // Brand
  primary: ONB_COLORS.primary,       // '#15643E' forest green
  primaryMid: ONB_COLORS.primaryMid, // '#2E8B5A' mid green (charts, accents)
  accent: ONB_COLORS.accent,         // '#79C39A' light green (rings, progress)
  accentSoft: ONB_COLORS.accentSoft, // '#9FD3B3'
  primaryShadow: 'rgba(21,100,62,0.32)',

  // Text
  ink: '#122A1F',        // headings / primary text
  body: '#6B7F75',       // body copy + labels
  muted: '#A9B5AD',      // captions, disabled, placeholder icons

  // Surfaces
  page: '#F6F8F7',       // screen background (calm green-tinted neutral)
  card: '#FFFFFF',
  surfaceSoft: '#F5F8F6',   // inset fills (matches auth inputBg)
  paleGreen: '#E7F1EB',     // icon circles, chips
  selectedBg: '#F2F8F4',    // selected / active fill
  border: '#E4EDE7',        // dividers + card borders
  divider: '#E4EDE7',

  // Semantic (kept — do not forest-green these)
  alertBg: '#FFF1F1', alertBorder: '#FECACA', alertText: '#DC2626',
  warnBg: '#FFF7ED', warnBorder: '#FED7AA', warnText: '#C2410C',
  positive: '#15643E', negative: '#DC2626', amber: '#F59E0B',

  white: '#FFFFFF',
};

export const REST_FONTS = {
  extraBold: ONB_FONTS.extraBold, // 'PlusJakartaSans_800ExtraBold' — big numbers, screen titles
  bold: ONB_FONTS.bold,           // 'PlusJakartaSans_700Bold' — card titles, buttons
  semiBold: ONB_FONTS.semiBold,   // 'PlusJakartaSans_600SemiBold' — labels
  medium: ONB_FONTS.medium,       // 'PlusJakartaSans_500Medium' — body
  regular: ONB_FONTS.regular,     // 'PlusJakartaSans_400Regular'
};

// Reusable soft shadows (match the auth/onboarding feel)
export const REST_SHADOWS = {
  card: {
    shadowColor: '#122A1F', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  button: {
    shadowColor: REST_COLORS.primary, shadowOpacity: 0.32, shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
};

// Standard radii + spacing so cards/buttons are consistent everywhere
export const REST_RADII = { card: 18, chip: 12, pill: 30, input: 18 };
export const REST_SPACING = { screenPadding: 20, cardPadding: 18, gap: 12 };
```

> **Decision to confirm if unsure:** page background `#F6F8F7`. It's a barely-there green-gray that sits between the auth white and the old `#F4F4EF`. If the owner prefers pure white to match auth exactly, change this one value — nothing else depends on the specific shade.

### 3.2 · Token migration table (old → new)

Apply this mapping in **every** restaurant screen and in `RestaurantScreenStates.js`. Delete each screen's local `COLORS`/`FONTS` object and import from the theme instead.

| Old value(s) found in code | Replace with |
|---|---|
| `#10b981`, `#16A34A`, `greenCard`, `tabActive`, `green` | `REST_COLORS.primary` |
| `#059669`, `#047857`, `#14532D`, `greenDark` | `REST_COLORS.primary` (or `primaryMid` for a secondary accent) |
| `#D1FAE5`, `#DCFCE7`, `greenLight` | `REST_COLORS.paleGreen` |
| `#F4F4EF`, `#F9FAFB` (backgrounds) | `REST_COLORS.page` |
| `#0F172A`, `#111827` (primary text) | `REST_COLORS.ink` |
| `#64748B`, `#6B7280` (secondary text) | `REST_COLORS.body` |
| `#94A3B8` (muted), `tabInactive` | `REST_COLORS.muted` |
| `#E2E8F0` (borders) | `REST_COLORS.border` |
| `#F8FAFC` (input bg) | `REST_COLORS.surfaceSoft` |
| `Poppins_700Bold` | `REST_FONTS.bold` (or `extraBold` for hero numbers) |
| `Poppins_600SemiBold` | `REST_FONTS.semiBold` |
| `Poppins_500Medium` | `REST_FONTS.medium` |
| `Inter_*` (all) | matching `REST_FONTS.*` weight |
| `alertText` `#DC2626`, alert bg/border | keep — map to `REST_COLORS.alert*` |
| urgent/warn oranges | keep — map to `REST_COLORS.warn*` |

Rule of thumb: **greens become forest green; semantic reds/oranges/ambers stay.** Never turn an error state green.

### 3.3 · Typography rules
- **Screen titles / big hero numbers** (tank %, balance): `REST_FONTS.extraBold`.
- **Card titles, buttons:** `REST_FONTS.bold`.
- **Labels:** `REST_FONTS.semiBold`, and **switch ALL-CAPS micro-labels to Sentence case.** The current code uppercases labels via `.toUpperCase()` and `textTransform` in many places — remove those; sentence case reads better and matches auth.
- **Body:** `REST_FONTS.medium`.
- Never set `fontWeight` and a Plus Jakarta `fontFamily` that disagree — the family already encodes the weight. Drop stray `fontWeight` props when you set the JK family.

### 3.4 · The ONE allowed data-layer edit — temperature °C (display only)

The DB field is `tank.temperature_f` (Fahrenheit). The product is South African; display Celsius. This is **display formatting only** — do not rename the field, change the query, or alter the return-key.

In `src/utils/restaurantViewModels.js`, two spots read `temperature_f`:

- `mapTankCardData` (~line 135): `temperature: toNumber(tank.temperature_f, 0)` — change the produced value to Celsius:
  `temperature: Math.round((toNumber(tank.temperature_f, 0) - 32) * 5 / 9)`
- `mapMonitoringTankInfo` device stat (~line 278): `value: \`${toNumber(tank?.temperature_f, 0)}°F\`` → compute Celsius the same way and render `…°C`.

Then in the screens, change the unit label from `° F` / `°F` to `°C`. **Do not** touch any other mapper or any other line in this file.

---

## 4 · Shared components (build after the theme, before the screens)

### 4.1 · `src/restaurant/components/RestaurantHeader.js` (new)

Currently the gradient header is **copy-pasted into 5 screens** (`Home`, `Monitoring`, `Pickups`, `Earnings`, and the modal screens), each slightly different, with a hard-coded third gradient stop `#047857` and an always-lit red notification dot. Replace all of them with one component.

**Design:** a **light header** (matches auth/onboarding), not a full-bleed green banner.
- Background: `REST_COLORS.page` or white; **dark** status-bar content (`barStyle="dark-content"`).
- Title in `REST_FONTS.extraBold`, `REST_COLORS.ink`.
- Brand green reserved for the small logo tile / avatar accent and primary buttons — not the whole bar.
- Props (keep flexible so every screen can reuse it):

```
<RestaurantHeader
  title="Earnings"               // or variant="home" to show logo + "Restaurant Portal"
  avatarInitials={...} avatarUrl={...} isVerified={...}
  onAvatarPress={...}            // navigates to Profile (Home only)
  showBack={false} onBack={...}  // true on modal screens
/>
```

- **Remove the sign-out icon from the Home header.** Sign-out already exists on the Profile screen with a confirmation dialog; a destructive action one tap from the top bar is a hazard. Home keeps only the avatar (→ Profile) and, optionally, a **static** bell with **no** permanent dot.
- The modal screens (`SchedulePickup`, `ManualPickup`) use `showBack` instead of an avatar.

Preserve every existing `onPress` target when you migrate each screen's header to this component (e.g. Home avatar still calls `navigation.navigate('RestaurantTabs', { screen: 'Profile' })`).

### 4.2 · Upgrade `src/components/RestaurantScreenStates.js`

Currently three bare, hard-coded banners (green `#10b981` inlined; unstyled). Restyle onto the theme:
- `RestaurantLoadingBanner`: centered spinner in `REST_COLORS.primary` inside a soft card, `REST_FONTS.medium` caption.
- `RestaurantEmptyBanner`: add a muted icon, a one-line message, and an **optional** primary action button (`actionLabel` + `onAction` props, both optional so existing call sites still work). Example: the "no pickups" empty state can offer "Schedule your first pickup."
- `RestaurantRefreshScrollView`: keep behavior identical; just swap `tintColor="#10b981"` → `REST_COLORS.primary`. **Do not change its props or refresh logic.**

Keep all three exports and their existing prop names; only **add** optional props.

---

## 5 · Interaction honesty (applies across all screens)

Fake affordances are the fastest way to feel "AI-generated" and erode trust on an app whose pitch is transparency.

- **Notification bell + red dot:** currently a dead `Pressable` with a permanent dot. **Remove the dot.** Keep the bell only if it's static and clearly inert, otherwise remove it too. Do not wire a fake notifications screen.
- **"AI Analysis" chip** on the tank card: dead. Remove it (recommended) unless the owner wants it wired — it has no handler today.
- **"View All" links** (Recent Activity, etc.): make them navigate to the relevant tab (`Pickups` / `Earnings`) — this needs **no backend**, just `navigation.navigate`. If a sensible target doesn't exist, remove the link rather than leave it dead.
- **Add pressed feedback** to every touchable: use `Pressable`'s `style={({ pressed }) => [...]}` with a subtle opacity (~0.85) or 0.98 scale. Quiet, not bouncy.

---

## 6 · Execution plan (do in this order)

> Work screen-by-screen. After **each** screen: confirm it still renders, all existing buttons still navigate/trigger the same handlers, and no mapper/prop/route was renamed.

**Phase 0 — Foundation**
1. Create `src/restaurant/restaurantTheme.js` (Section 3.1).
2. Apply the °C mapper edit (Section 3.4) — the only view-model change.
3. Create `src/restaurant/components/RestaurantHeader.js` (Section 4.1).
4. Upgrade `RestaurantScreenStates.js` (Section 4.2).
5. Retint the tab bar in `navigation/RestaurantStack.js`: in the local `THEME`, `primary` → `#15643E`, keep structure; active tint forest green, inactive `REST_COLORS.muted`. Colors only.

**Phase 1 — Home, then STOP**
6. `screens/restaurant/RestaurantHomeScreen.js`:
   - Delete local `COLORS`/`FONTS`; import theme.
   - Swap to `RestaurantHeader` (variant `home`, no sign-out icon).
   - **Tank card = hero.** Keep the exact data keys (`fillPercent`, `statusText`, `statusNote`, `estimatedDays`, `currentVolume`, `temperature`). Elevate it: a circular/ring fill indicator (use `react-native-svg`, already installed) with the `%` in `extraBold` centered, `REST_COLORS.accent` for the ring track and `primary` for the fill; volume + `°C` in a clean meta row. Remove the dead "AI Analysis" chip.
   - Integrate the pickup alert as a **contextual state** near the tank (red reserved for genuine ≥80% urgency), not a shouting box — but keep its `onSchedule` → `navigation.navigate('SchedulePickup')`.
   - StatCards, Recent Activity: theme colors, sentence-case labels, pressed feedback. "View All" → navigate to Pickups.

   ### 🛑 CHECKPOINT — STOP HERE
   Present the redesigned Home screen and wait for the owner's approval before continuing. Do not start Monitoring until they confirm the direction. If they request changes, apply them to Home first; those decisions then carry into all remaining screens.

**Phase 2 — Roll across remaining screens** (only after approval)
7. `MonitoringScreen.js` — theme migration; restyle the bar chart with `primary`/`accent`; quality-log table onto card + border tokens; sentence-case labels; `°C`. Keep all mapper inputs.
8. `PickupsScreen.js` — unify the three card designs (active / upcoming / history) into **one card family** with status-driven accent colors (upcoming = primary, done = muted/positive, urgent = alert). Keep the `TabSwitcher` behavior and all data.
9. `EarningsScreen.js` — make the **balance card dominant** (largest, `extraBold` number, top of page); market rates / avg quality / recent earnings / withdrawals become a consistent, quieter secondary card style. Keep the withdraw/withdrawTab logic untouched.
10. `SchedulePickupScreen.js` + `ManualPickupScreen.js` — align form inputs to the **auth input style** (from `authTheme.js`): `backgroundColor: surfaceSoft`, `borderWidth: 1.5`, `borderColor: border`, `borderRadius: 18`, focus state → `borderColor: primary` + `borderWidth: 2`, input font `REST_FONTS.medium` size 16, text `ink`. Use `RestaurantHeader` with `showBack`. Keep `createPickupRequest` / `createManualPickupRequest` calls and all validation exactly.
11. `RestaurantProfileScreen.js` — drop its 4th palette (`#111827`/`#6B7280`/`#F9FAFB`); onto the theme. Keep the `Alert.alert` sign-out confirmation and `ProfileEdit` navigation.

**Phase 3 — Sweep**
12. Grep the restaurant folder for any surviving `#10b981`, `#059669`, `#16A34A`, `Poppins_`, `Inter_`, `.toUpperCase()` on labels, `°F`, and stray `COLORS.`/`FONTS.` locals. Zero should remain in `screens/restaurant/*` except semantic reds/oranges/ambers.

---

## 7 · Definition of done (acceptance checklist)

- [ ] `restaurantTheme.js` exists; **no** restaurant screen declares its own `COLORS`/`FONTS`.
- [ ] Every restaurant screen uses forest green `#15643E` (via token) and Plus Jakarta Sans; no emerald, no Poppins, no Inter remain in `screens/restaurant/*`.
- [ ] One shared `RestaurantHeader`; the 5 copy-pasted gradient headers are gone; light header, dark status bar.
- [ ] No sign-out icon in the Home header; sign-out still works from Profile with confirmation.
- [ ] No permanent notification dot; no dead "AI Analysis" chip; "View All" links navigate or are removed.
- [ ] Temperature shows `°C` everywhere; `temperature_f` field, query, and mapper keys unchanged.
- [ ] Every button/link triggers the **same** handler and navigates to the **same** route as before.
- [ ] Pressed feedback on all touchables.
- [ ] `git diff` touches **only** the files in Section 2's ✅ list. No context/hook/service/other-role file changed.
- [ ] App builds and every restaurant screen renders with real and empty data.

---

## 8 · Anti-patterns — do NOT do these

- ❌ Rewriting a whole screen from scratch. **Edit in place**; keep component boundaries and props.
- ❌ Renaming a route, tab, prop, or mapper return-key "for clarity." It breaks callers you won't see.
- ❌ Adding a charting/animation/UI library. Use `react-native-svg` + `expo-linear-gradient` (installed).
- ❌ Touching `RestaurantContext`, hooks, or services to "make the UI cleaner." UI reads them as-is.
- ❌ Turning a semantic red/orange state green.
- ❌ Deep, heavy gradients or bouncy animations — the target aesthetic is calm and airy.
- ❌ Guessing at a missing field or route. If it's not in the code, STOP and ask.
- ❌ Blowing past the Home checkpoint.

---

*End of spec. Start at Section 6, Phase 0.*
