# BioLoop UI polish: instructions for Claude Code

Written 4 Nov 2026 against `main` at commit `c3f8fa9` ("Stop showing a temperature the sensor never measured").
Every file path, line number and code snippet below was checked against that commit.

---

## How to use this file (for Tshepiso, not for Claude)

1. Save this file in the **repo root** (next to `README.md`) as `UI_POLISH.md`. Do not commit it.
2. In the terminal, at the repo root:
   ```bash
   git checkout main
   git pull
   git checkout -b ui-polish
   ```
3. Start Claude Code in the repo root.
4. Paste **Prompt 0** (Part C). Then paste **one phase prompt at a time**. Never paste several phases at once.
5. Every phase works the same way:
   - Claude reads the rules and the phase, then replies with a **plan only**.
   - You read the plan. If it mentions any file not listed in that phase, say no.
   - You reply `go`. Claude makes the changes, one commit per item, then runs the safety checks.
   - You open the app (`cd Devine-Devs && npx expo start`) and look at the screens that phase touched.
6. The phases are in order of value. Stop whenever you run out of time: the app is demo-ready after every phase.
7. If a phase goes wrong, undo just that phase:
   ```bash
   git log --oneline          # find the last good commit
   git reset --hard <hash>    # go back to it (only on the ui-polish branch)
   ```
8. When you're finished, merge `main` into `ui-polish` once more (teammates may have pushed), run the Phase 9 checks again, then open a pull request for the team.

---

## Part A: Rules (Claude, read this before every phase)

### A1. The goal

Make **visual-only** changes to the BioLoop React Native app before a live presentation. The app works. Nothing about how it works may change: no data, no backend, no navigation, no business logic. If a change cannot be made without touching logic, **skip it and report it**.

### A2. Files you may edit

Only these, and only for the items in the current phase:

- `Devine-Devs/screens/driver/*.js`
- `Devine-Devs/screens/manufacturer/*.js` and `Devine-Devs/screens/manufacturer/AIAssistant/**/*.js`
  (except `AIChatScreen.js`, see A4)
- `Devine-Devs/screens/restaurant/EarningsScreen.js`, `PickupsScreen.js`, `RestaurantHomeScreen.js`
- `Devine-Devs/screens/auth/VerifyCodeScreen.js`, `ForgotPasswordScreen.js`, `ResetPasswordScreen.js` (fonts only)
- `Devine-Devs/src/restaurant/components/RestaurantHeader.js` (logo only)
- `Devine-Devs/navigation/DriverStack.js` and `Devine-Devs/navigation/RestaurantStack.js` (only `tabBarStyle` and `tabBarLabelStyle`)
- `Devine-Devs/src/lib/pickupStatus.js` (only the one label in item D4)
- New file `Devine-Devs/src/lib/format.js` (item B3 only)

### A3. Never touch

- **Folders and files:** `supabase/`, `src/services/`, `src/contexts/`, `src/hooks/`, `src/utils/`, `docs/`, `AuthContext.js`, `supabase.js`, `App.js`, `index.js`, `package.json`, `package-lock.json`, `app.json`, `eas.json`, `tsconfig.json`, any babel or metro config, `src/lib/statementHtml.js`, `src/lib/dbColumns.js`, `src/lib/alertRouting.js`.
- **Code, in any file:**
  - Supabase calls: `supabase.`, `.from(`, `.rpc(`, `.select(`, `.insert(`, `.update(`, `.upsert(`, `.delete(`, `functions.invoke`.
  - Context methods and hooks: `updatePickupStatus`, `declinePickup`, `markAlertRead`, `refresh*`, `useCollectorContext`, `useManufacturerContext`, `useRestaurant`, `useProfile`, `useAuth`. You may only remove a now-unused `useAuth` import or destructure, as item D1 describes.
  - `navigation.navigate(...)` route names and params.
  - `onPress` handler bodies. You may remove a button, but never change what a handler does.
  - `useEffect` data loading, realtime subscriptions, timers and intervals that already exist.
  - Status values and status arrays: `'pending'`, `'scheduled'`, `'completed'`, `'cancelled'` and the others, plus `PRE_TRIP_STATUSES`, `ACTIVE_TRIP_STATUSES` and `FINISHED_STATUSES`. Only the human-readable label in item D4 changes.
- **No new packages.** Do not run `npm install`, `npx expo install` or `npm update`. Use only what is already imported somewhere in the app: React Native core, `Animated`, `react-native-svg`, `expo-linear-gradient`, `@expo/vector-icons` (Ionicons).
- **No deleting, renaming or moving files.** No renaming exports, components or props.
- **No reformatting.** Don't run Prettier or ESLint `--fix` on whole files. Keep each diff to the lines the item needs, in the file's existing code style.

### A4. Traps in this codebase (read carefully)

1. **The filter tab strings in `DriverCollectionsScreen.js` are logic.** `const FILTERS = ['All', 'Pending', 'In Progress', 'Completed'];` is compared in code (`activeFilter === 'In Progress'`). Never change these strings.
2. **Grade names are compared in code.** `ManufacturerDashboardScreen.js` checks `item.name === 'Grade A'` to pick an icon. Keep `'Grade A'`, `'Grade B'` and `'Grade C'` exactly as they are.
3. **Alert titles belong to the database.** Titles like "New pickup assigned" or "Payout successful" are written by the database. The `send-push` function and the `isMoney` regex in `DriverHomeScreen.js` (`/wallet|withdrawal paid|payout/i`) match them. Never change alert titles, that regex, or `PUSH_WORTHY_TITLES`.
4. **`pickupMarkers` in `DriverMapScreen.js` feeds route planning** ("Plan N stops"). Never change its `useMemo` or its filter. Item D3 changes only the number on the badge.
5. **These files are unused.** Don't edit or delete them: `screens/manufacturer/AIChatScreen.js`, `screens/restaurant/Loginscreen.js`, `data/driverData.js`, `auth/hardcodedUsers.js`. The live AI chat is `screens/manufacturer/AIAssistant/`.
6. **Search before renaming any visible string.** Before you change a visible string, search the whole `Devine-Devs` folder for it, for example `grep -rnF "Today's Pickups" Devine-Devs --include=*.js`. If it appears in a comparison, an object key, a `case`, a route name or an array used for logic, leave it and report it.
7. **Line numbers are hints only,** from commit `c3f8fa9`. Find code by the quoted snippet. **If a quoted snippet is not in the file, stop and report it. Do not guess or improvise a replacement.**
8. **Custom fonts on Android:** when a style uses a weight-specific family like `PlusJakartaSans_700Bold`, remove `fontWeight` from that style. On Android, a custom family combined with `fontWeight` can fall back to the system font.

### A5. How to work

- **Plan first.** For each item in the phase, list: the file, the exact existing code you found (quote it), and the exact change. Then **stop and wait for "go"**.
- After "go": do the items in order, **one commit per item**, with the message `ui(<item id>): <short summary>`, for example `ui(D1): remove logout button from driver header`. Do not push.
- **Design tokens.** Colours come from the existing theme values. Main ones:
  - Green: primary `#15643E`, mid `#2E8B5A`, pale `#E7F1EB`
  - Ink `#122A1F`, body `#6B7F75`, muted `#A9B5AD`, border `#E4EDE7`, page `#F6F8F7`, soft fill `#F5F8F6`
  - Grade colours: use each file's existing `gradeA`, `gradeB` and `gradeC` values.

  Fonts are `PlusJakartaSans_400Regular`, `_500Medium`, `_600SemiBold`, `_700Bold` and `_800ExtraBold`. These are already loaded in `App.js`. Icons come from Ionicons only.
- **Writing.** Sentence case for any new text. No em dashes (`—`) or en dashes (`–`) in new visible text; use a full stop, comma or colon.
- If an item is unclear, or would need a forbidden change, **skip it** and say why in the report.

### A6. Safety checks (run after every phase, from the repo root)

```bash
# 1. Only allowed files changed
git diff --name-only main...HEAD

# 2. No forbidden file touched (must print OK)
git diff --name-only main...HEAD | grep -E '(^|/)(supabase/|src/services/|src/contexts/|src/hooks/|src/utils/|docs/|AuthContext\.js|supabase\.js|App\.js|index\.js|package(-lock)?\.json|app\.json|eas\.json|statementHtml\.js|dbColumns\.js|alertRouting\.js)' && echo "STOP: forbidden file changed" || echo "OK: no forbidden files"

# 3. No backend call added or changed (must print OK)
git diff main...HEAD -- Devine-Devs | grep -E '^[+-][^+-].*(supabase\.|\.from\(|\.rpc\(|functions\.invoke|\.insert\(|\.upsert\(|updatePickupStatus|declinePickup|markAlertRead|navigation\.navigate)' && echo "STOP: review these lines" || echo "OK: no backend or navigation changes"

# 4. No new packages (must print OK)
git diff main...HEAD -- Devine-Devs/package.json Devine-Devs/package-lock.json | grep -q . && echo "STOP: package files changed" || echo "OK: packages untouched"

# 5. The app still bundles (must end with "Exported")
cd Devine-Devs && npx expo export --platform android --output-dir /tmp/bioloop-export && cd ..
```

Check 3 should print OK. The only expected exception is optional item X2 (Phase 8): if it's done, check 3 flags its one added `navigation.navigate('DriverMap', { pickupId: ... })` line. Explain any other hit, or undo it.

### A7. End-of-phase report

Reply with a table: item id | file(s) | done or skipped | one-line note. Then paste the output of the five checks.

---

## Part B: The phases

### Phase 1: Driver fixes

**D1. Remove the logout button from the driver header**
- File: `screens/driver/DriverHomeScreen.js`, around lines 285 to 297.
- Delete only this `TouchableOpacity`:
  ```jsx
  <TouchableOpacity
    style={
      styles.headerSignOutButton
    }
    onPress={signOut}
  >
    <Ionicons
      name="log-out-outline"
      ...
  </TouchableOpacity>
  ```
- Then:
  - Remove the `headerSignOutButton` entry from `StyleSheet.create` (around line 633).
  - Remove `const { signOut } = useAuth();` (line 154), but only if `signOut` is not used anywhere else in the file.
  - Remove `import { useAuth } from '../../AuthContext';` (line 18), but only if `useAuth` is no longer used.
- Do **not** touch `DriverProfileScreen.js`. Its "Sign Out" row with the "Are you sure?" prompt stays, and it's now the only way to log out.
- Done when `grep -n "signOut\|headerSignOutButton" screens/driver/DriverHomeScreen.js` prints nothing, and `DriverProfileScreen.js` still contains `handleSignOut`.

**D2. Lift the driver tab bar above Android's navigation buttons**
- File: `navigation/DriverStack.js`, function `DriverTabs`.
- Copy what `navigation/RestaurantStack.js` already does (lines 37, 50 and 51):
  - Add `import { useSafeAreaInsets } from 'react-native-safe-area-context';`. The package is already used by `RestaurantStack.js`.
  - At the top of `DriverTabs`, add `const insets = useSafeAreaInsets();`.
  - In `tabBarStyle`, change `paddingBottom: 10,` to `paddingBottom: Math.max(10, insets.bottom),` and `height: 65,` to `height: 65 + insets.bottom,`.
- Change nothing else in the file.

**D3. Make the driver's pickup counts agree**
- Driver Home counts open pickups as "not cancelled and not completed". Use that same rule in two places.
- `screens/driver/DriverCollectionsScreen.js`, line 223:
  - `const scheduledCount = pickups.filter(p => p.status !== 'completed').length;`
  - becomes `const scheduledCount = pickups.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;`
  - Then make the header text (around line 240, `{scheduledCount} pickups remaining today`) read `{scheduledCount} to do`. That matches Driver Home, which says "1 to do".
- `screens/driver/DriverMapScreen.js`, line 647, `{pickupMarkers.length}`:
  - Add a new `useMemo` next to `pickupMarkers`: `const openStopCount = useMemo(() => (pickups || []).filter((p) => p.status !== 'completed' && p.status !== 'cancelled').length, [pickups]);`
  - Show `{openStopCount}` in the badge.
  - Change the label on line 648 from `pickup stops` to `{openStopCount === 1 ? 'stop to do' : 'stops to do'}`.
  - **Do not change `pickupMarkers`** (trap A4.4).

**D4. One word for finished jobs**
- File: `src/lib/pickupStatus.js`, inside `DRIVER_STATUS_LABELS`: `completed: 'Complete',` becomes `completed: 'Completed',`.
- This label is only displayed. It's used in `DriverHomeScreen.js` and `DriverCollectionsScreen.js`, and never compared. Change nothing else in this file.

**D5. Hide the buttons on finished and cancelled cards**
- File: `screens/driver/DriverCollectionsScreen.js`, component `CollectionCard` (lines 56 to 128).
- Add `const isFinished = item.status === 'completed' || item.status === 'cancelled';` next to `actionDisabled`.
- Wrap the whole `<View style={styles.cardActions}> ... </View>` block (Call and the action button) in `{!isFinished ? ( ... ) : null}`.
- Leave `canDecline` and the decline button exactly as they are.
- This is safe: `handleAction` already does nothing for these two statuses.

**D6. Drop "Time TBC"**
- Both of these files have the same line:
  - `screens/driver/DriverHomeScreen.js`, around line 131
  - `screens/driver/DriverCollectionsScreen.js`, around line 82

  ```jsx
  {item.time || 'Time TBC'} ·{' '}
  ```
- Show the time and the dot only when a time exists: `{item.time ? `${item.time} · ` : ''}`.
- Keep the litres part after it unchanged.

**D7. Hide the lone " · " under the driver's name**
- File: `screens/driver/DriverHomeScreen.js`, the `welcomeRoute` `Text` (around lines 372 to 381). It joins the route name and district with `' · '`.
- Build the text from the non-empty parts only:
  - `[stats?.route_name ?? collector?.route_name, stats?.district ?? collector?.district].filter(Boolean).join(' · ')`
- Render the `Text` only when that string is not empty.

**D8. Replace the blue in-progress colour with mid green**
- In the local `THEME` objects of `screens/driver/DriverHomeScreen.js` and `screens/driver/DriverCollectionsScreen.js`:
  - `inProgress: '#2563EB'` becomes `'#2E8B5A'`
  - `inProgressBg: '#EFF6FF'` becomes `'#E7F1EB'`
- Search `screens/driver/` for any other `#2563EB` and list it in the plan before changing it.

**D9. Remove the dash from the payout pop-up title**
- File: `screens/driver/DriverHomeScreen.js`, around line 546:
  - `'Trip complete — you earned'` becomes `'Trip complete. You earned'`.
- This is display text passed to `MoneyPop`. It is not an alert title. Do not edit `MoneyPop.js`.

---

### Phase 2: Manufacturer display fixes

**M1. Grade percentages and litres from the same pickups**
- File: `screens/manufacturer/QualityScreen.js`, around lines 66 to 122.
- The problem today: each grade's `value` (%) comes from `sevenDayForecast.grade_x_pct`, while `totalVolume` sums **every** pickup, including cancelled ones. The screen shows "Grade C: 57.2% · 300 L".
- The fix: build both from the same set of pickups, using the rule the database itself uses for the forecast. That rule is completed pickups from the last 30 days, or all completed pickups if there are none in the last 30 days.
  ```js
  const completed = (pickups || []).filter((p) => p.status === 'completed');
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = completed.filter(
    (p) => new Date(p.completed_at ?? p.pickup_date ?? p.created_at).getTime() >= thirtyDaysAgo
  );
  const basis = recent.length > 0 ? recent : completed;
  ```
- Steps:
  - Build `groupedSources` from `basis` instead of `pickups`.
  - Use `p.actual_volume_liters ?? p.estimated_volume_liters ?? 0` for volume.
  - Set each grade's `value` to `total > 0 ? Math.round((gradeVolume / total) * 1000) / 10 : 0`, where `total` is the sum across all three grades.
  - If `sevenDayForecast` is no longer used anywhere in the file, remove it; otherwise leave it.
- Change nothing in `src/utils/` or the context.

**M2. One grade dot, not two**
- File: `screens/manufacturer/ForecastsScreen.js`, line 398:
  - `g === 'A' ? '🟢 Grade A' : g === 'B' ? '🟡 Grade B' : '🔴 Grade C'`
  - becomes `g === 'A' ? 'Grade A' : g === 'B' ? 'Grade B' : 'Grade C'`
- The coloured dot next to it stays.

**M3. Supplier cards: no "— •", and no star for a completion rate**
- File: `screens/manufacturer/SuppliersScreen.js`.
- Line 399, `{supplier.cuisine} • {supplier.location}`, becomes:
  - `{[supplier.cuisine, supplier.location].filter((v) => v && v !== '—').join(' · ')}`
  - Leave line 116 (`cuisine: r.cuisine ?? '—'`) alone, because other parts of the screen may read it.
- Line 377, `<Ionicons name="star" size={11} color={T.gradeB} />`:
  - Change the icon to `name="checkmark-circle"`.
  - Change the colour to the file's existing green token. Check what `T` has, and quote it in the plan.
- The "reliability" number is completed pickups divided by all pickups, not a rating. Rename its labels:
  - `Avg Reliability` (line 206) becomes `Completion rate`.
  - The modal label `Reliability` (around line 305) becomes `Completion rate`.

**M4. Drop "Time TBC" on manufacturer delivery cards**
- File: `screens/manufacturer/ManufacturerDashboardScreen.js`, around line 684: `{delivery.eta ?? 'Time TBC'}`.
- Render that `Text` only when `delivery.eta` exists.
- Do not change how `eta` is calculated.

**M5. Whole litres on the stat cards**
- File: `screens/manufacturer/ManufacturerDashboardScreen.js`, line 621: `` value={`${thisWeekVolume.toLocaleString()} L`} `` shows "18,3 L".
- Change it to `` value={`${Math.round(Number(thisWeekVolume) || 0)} L`} ``.
- Apply the same to the "Current Stock" card (around line 614) if it formats litres with `toLocaleString`.

---

### Phase 3: Manufacturer graphs

**G1. Rebuild Quality Trends as monthly bars (the "no direction" graph)**
- File: `screens/manufacturer/QualityScreen.js`.
- What is wrong today:
  - The axis is labelled 0 to 75 %, but the lines plot **litres** against a fixed `maxValue = 70`.
  - Cancelled pickups are included.
  - The lines are drawn without the `+ 20` x-offset that the dots and month labels use.
  - Only Grade A gets dots.
- Step 1, line 124:
  - `const qualityTrends = useMemo(() => groupPickupsByMonth(pickups, 4), [pickups]);`
  - becomes `const qualityTrends = useMemo(() => groupPickupsByMonth((pickups || []).filter((p) => p.status === 'completed'), 4), [pickups]);`
  - Do **not** edit `groupPickupsByMonth` in `src/utils/manufacturerAnalytics.js`.
- Step 2: add `Rect` to the existing `react-native-svg` import (lines 14 to 20). Only `Path`, `Circle`, `Line`, `Text as SvgText` and `G` are imported today.
- Step 3: rewrite only the body of `QualityTrendChart` (lines 246 to 341) as stacked monthly bars:
  - `const chartHeight = 150;` and `const chartWidth = width - 80;` stay. `width` comes from `Dimensions`, as now.
  - `const bandWidth = chartWidth / qualityTrends.length;` and `const barWidth = Math.min(44, bandWidth * 0.5);`
  - `const maxTotal = Math.max(1, ...qualityTrends.map((m) => m.gradeA + m.gradeB + m.gradeC));`
  - For each month `i`: `cx = 20 + bandWidth * i + bandWidth / 2`. Then draw three `Rect`s stacked from the baseline at `y = chartHeight`, in the order A at the bottom, then B, then C:
    - Each segment's height is `(litres / maxTotal) * (chartHeight - 24)`.
    - Fill with `T.gradeA`, `T.gradeB` and `T.gradeC`.
    - Use `rx={3}`, and skip any segment with 0 litres.
  - Above each bar, draw a `SvgText` with `` `${Math.round(total)} L` ``: `fontSize={11}`, `fill={T.ink}`, `fontWeight` 600, `textAnchor="middle"`. A month with 0 litres shows "0 L" just above the baseline.
  - Draw one baseline `Line` from `x1={20}` to `x2={chartWidth + 20}` at `y={chartHeight}`, with `stroke={T.border}`.
  - Keep the existing month labels below the bars, using the same `cx`. Remove the old 0/25/50/75 % gridlines and labels.
  - Keep the `Svg` size and the legend below it as they are.
- Step 4: around lines 505 and 506:
  - Title `Quality Trends` becomes `Quality trends`.
  - Subtitle `Last 4 months` becomes `Litres received per month, by grade`.
- With today's data you should see Aug 0 L, Sep 60 L (all red), Oct 0 L, and Nov 45 L (green and amber).

**G2. Replace the broken home donut with a split bar**
- File: `screens/manufacturer/ManufacturerDashboardScreen.js`.
- The problem: `PieChart` (around line 489) draws each grade as a full-size rotated square. The last one, red, covers the others, so the ring shows solid red with "100% Total".
- Steps:
  - Remove `<PieChart />` (around line 772) and the `PieChart` component definition.
  - Leave the `pie*` styles in place; unused styles are harmless.
  - In its place, under the three percentage tiles, add one horizontal bar:
    - A `View` with `flexDirection: 'row'`, `height: 10`, `borderRadius: 5`, `overflow: 'hidden'`, `marginTop: 16`, `backgroundColor: C.border` (or the file's existing border token; quote it in the plan).
    - Inside it, one child `View` per entry in `qualityDistribution`, with `flex: item.value` and `backgroundColor: item.color`. Skip entries where `item.value` is 0.
    - Render the bar only when the values add up to more than 0.

**G3. Make "Weekly collection" really the last 7 days**
- File: `screens/manufacturer/ManufacturerDashboardScreen.js`.
- The problem: `weeklyData` (lines 319 to 332) adds up **every pickup ever made**, grouped by weekday name, including cancelled ones, while the card says "Last 7 days".
- Step 1: replace the `weeklyData` calculation with the last 7 calendar days ending today, completed pickups only:
  - Build 7 buckets, oldest first. Each has a key `YYYY-MM-DD` from local `getFullYear`, `getMonth` and `getDate`. The label is the short weekday (`'Mon'`) for the first six days and `'Today'` for the last.
  - For each pickup with `status === 'completed'`, use `p.completed_at` converted to a local `YYYY-MM-DD`. If `completed_at` is missing, use `p.pickup_date` as the string it already is. Add `p.actual_volume_liters ?? p.estimated_volume_liters ?? 0` to the matching bucket.
  - Keep the returned shape `{ day, volume }` so `WeeklyAreaChart` keeps working.
- Step 2: in `WeeklyAreaChart` (around line 529), print the litres above each bar when `volume > 0`, using the existing `areaBarLabel` style or a copy of it.
- Step 3: in the section header around line 777:
  - `title="Weekly Collection"` becomes `title="Weekly collection"`.
  - Show the week's total next to it, for example `` action={`${Math.round(weeklyTotal)} L in 7 days`} `` where `weeklyTotal` is the sum of the buckets.

---

### Phase 4: Copy and dashes

**C1. Replace copy that reads like developer notes**

| File | Line | Now | New |
| --- | --- | --- | --- |
| `screens/restaurant/EarningsScreen.js` | 267 | `Amounts created from completed collections; not proof of payment.` | `What you earned from each collection.` |
| `screens/restaurant/EarningsScreen.js` | 272 | `Status is shown only from recorded withdrawal data.` | `Paid out automatically after each trip.` |
| `screens/restaurant/EarningsScreen.js` | 283 | `Recorded reference rates, shown with their actual update dates.` | `Current price per litre, by grade.` |
| `screens/restaurant/PickupsScreen.js` | 73 | `The collection is awaiting its recorded completion.` | `Delivered. Waiting for the manufacturer to confirm.` |
| `screens/restaurant/RestaurantHomeScreen.js` | 111 | `The delivery is awaiting its recorded completion state.` | `Delivered. Waiting for the manufacturer to confirm.` |

For the last two, first check which pickup status that `detail` belongs to. It should be the "arrived at manufacturer" state. If it belongs to a different state, skip it and report.

**C2. Sentence case.** Change only these display strings. All were checked: none is used in logic.

- `screens/driver/DriverHomeScreen.js`: `Today's Pickups` becomes `Today's pickups` (lines 458 and 464); `View All Pickups` becomes `View all pickups` (line 528); `Driver Portal` becomes `Driver portal` (line 280).
- `screens/driver/DriverProfileScreen.js`: `Litres Total` becomes `Litres total` (line 166); `Sign Out` becomes `Sign out` (the row label at line 347 and both strings in the `Alert.alert` at lines 108 and 110).
- `screens/driver/DriverMapScreen.js`: `Location Access Needed` becomes `Location access needed` (line 550).
- `screens/manufacturer/ManufacturerDashboardScreen.js`:
  - `Current Stock` becomes `Current stock`
  - `This Week` becomes `This week`
  - `Incoming Deliveries` becomes `Incoming deliveries`
  - `Quality Distribution` becomes `Quality distribution`
  - `View Details →` becomes `View details →`
  - `View All →` becomes `View all →`
  - `Confirm Received & Pay` becomes `Confirm and pay`
  - `Manufacturer Portal` becomes `Manufacturer portal` (line 450)
- `screens/manufacturer/QualityScreen.js`:
  - `Quality Distribution` becomes `Quality distribution`
  - `Current Pipeline Quality` becomes `Current pipeline quality`
  - `{grade.name} Oil Sources` (line 409) becomes `{grade.name} oil sources`
- `screens/manufacturer/SuppliersScreen.js`:
  - `Supplier Summary` becomes `Supplier summary`
  - `Active Suppliers` becomes `Active suppliers`
  - `Litres Supplied` becomes `Litres supplied`
  - `Confirm Received & Pay` becomes `Confirm and pay`
- `screens/manufacturer/ForecastsScreen.js`:
  - `Oil Inventory by Grade` becomes `Oil inventory by grade`
  - `Environmental Impact` becomes `Environmental impact`
  - `Production Value` becomes `Production value`
  - `Cost Breakdown` becomes `Cost breakdown`
  - `Total Costs` becomes `Total costs`
  - `Estimated Margin` becomes `Estimated margin`
  - `Oil Purchased` becomes `Oil purchased`
  - `Est. Biodiesel` becomes `Est. biodiesel`
  - `Est. Revenue` becomes `Est. revenue`
  - `Est. Margin` becomes `Est. margin`
- `src/restaurant/components/RestaurantHeader.js`: `Restaurant Portal` becomes `Restaurant portal` (line 77).
- **Do not change** the `FILTERS` strings in `DriverCollectionsScreen.js` (trap A4.1) or any `'Grade A'`, `'Grade B'` or `'Grade C'` string (trap A4.2).

**C3. Remove long dashes from visible text**
- Scope: string literals and JSX text in `screens/driver/`, `screens/restaurant/` (the three files from A2) and `screens/manufacturer/` (excluding `AIChatScreen.js`).
- **Not** in comments, and not in `screens/admin/`.
- Rules:
  - A dash inside a sentence becomes a full stop, comma or colon, whichever reads naturally.
  - A lone `'—'` used as a placeholder for a missing value becomes `'None'` for dates and counts, and `'Not set'` for profile fields.
- List every change in the plan, as file:line, old text and new text, before making any of them.

---

### Phase 5: Fonts (the biggest consistency win)

Make every screen use **Plus Jakarta Sans**, which is already loaded in `App.js`.

Weight mapping:

| `fontWeight` | Font family |
| --- | --- |
| `'400'`, `'normal'` or none | `PlusJakartaSans_400Regular` |
| `'500'` | `PlusJakartaSans_500Medium` |
| `'600'` | `PlusJakartaSans_600SemiBold` |
| `'700'` or `'bold'` | `PlusJakartaSans_700Bold` |
| `'800'` or `'900'` | `PlusJakartaSans_800ExtraBold` |

Rules:
- Every style object that has a `fontSize` gets the matching `fontFamily`, and its `fontWeight` is removed (trap A4.8).
- The same applies to inline and conditional styles, such as `active && { fontWeight: '700' }`.
- Do not change `fontSize`, `lineHeight` or colours.
- Leave `SvgText` inside charts alone.
- One commit per file.

Items:
- **F1** `screens/manufacturer/ManufacturerDashboardScreen.js`. The `MANU_THEME.fonts` block (around lines 70 to 76) sets every weight to `'System'`. Change it to the Jakarta names (regular, medium, semiBold, bold, extraBold). Then remove `fontWeight` from styles that use `F.*`.
- **F2** The other manufacturer screens: `AlertsScreen.js`, `ForecastsScreen.js`, `ManufacturerPaymentScreen.js`, `ProfileScreen.js`, `QualityScreen.js`, `SuppliersScreen.js`, and everything in `AIAssistant/`. They set only `fontWeight` today.
- **F3** Driver screens:
  - `DriverCollectionsScreen.js`, `DriverMapScreen.js`, `DriverMapScreen.web.js` and `DriverProfileScreen.js` use `fontWeight` only.
  - `DriverHomeScreen.js` uses `'Inter_*'` and `'Poppins_*'`; swap each for the Jakarta font of the same weight.
  - `DriverAlertsScreen.js` already uses `DRV_FONTS`; leave it.
- **F4** Sign-in and tab bars:
  - In `screens/auth/VerifyCodeScreen.js`, `ForgotPasswordScreen.js` and `ResetPasswordScreen.js`, swap every `'Inter_*'` and `'Poppins_*'` for the Jakarta font of the same weight.
  - In `navigation/RestaurantStack.js`, change `tabBarLabelStyle` from `fontFamily: 'Inter_500Medium'` to `'PlusJakartaSans_500Medium'`, and remove its `fontWeight: '500'`.

---

### Phase 6: Logo, greys and money format

**B1. Use the round BioLoop logo in the restaurant header**
- File: `src/restaurant/components/RestaurantHeader.js`, lines 72 to 74:
  ```jsx
  <View style={styles.logoTile}>
    <Ionicons name="leaf" size={22} color={REST_COLORS.white} />
  </View>
  ```
- Replace it with `<Image source={require('../../../assets/BioLoop_Logo.png')} style={styles.logoImage} resizeMode="contain" />`. `Image` is already imported on line 11.
- Add a `logoImage` style with `width: 44, height: 44, borderRadius: 22`. The driver header uses this logo at 41 by 41 (`DriverHomeScreen.js`, line 603).
- Leave `logoTile` in the stylesheet.

**B2. Bring the AI assistant onto the app's greys**
- Files: everything in `screens/manufacturer/AIAssistant/`, plus the one `#F3F4F6` in `ManufacturerDashboardScreen.js`.
- These use cool Tailwind greys while the rest of the app uses green-tinted ones. Replace exactly:

| Now | New |
| --- | --- |
| `#111827` | `#122A1F` |
| `#6B7280` | `#6B7F75` |
| `#9CA3AF` | `#A9B5AD` |
| `#E5E7EB` | `#E4EDE7` |
| `#F3F4F6` | `#F5F8F6` |
| `#D1D5DB` | `#D8E2DC` |
| `#10B981` | `#2E8B5A` |

- Case-insensitive; check lowercase versions too.

**B3. One way of writing money**
- Create `src/lib/format.js` with `export function formatRand(n)`. Copy the logic of the `money()` function in `src/lib/statementHtml.js` (lines 43 to 49) exactly. It gives `R1,234.50` and `-R15,127.00`.
- Do **not** import from or edit `statementHtml.js`.
- Use `formatRand` for visible rand amounts in:
  - `screens/manufacturer/ForecastsScreen.js` (the Finance tab)
  - `screens/restaurant/EarningsScreen.js`
  - `screens/manufacturer/ManufacturerPaymentScreen.js`
- Per-litre rates read `${formatRand(rate)}/L`.
- In the plan, list every expression you will change, as file:line and the old expression. Change **only** expressions that produce visible text. Never change a number used in a calculation, a comparison, or anything sent to a function or service.
- If this item gets complicated in any file, skip that file and report it.

**B4 (optional). One corner radius for cards**
- In the driver screens only, style objects named `card` or ending in `Card` that have `borderRadius` between 14 and 22 get `borderRadius: 18`. Leave buttons, chips and badges.

---

### Phase 7: Motion (three animations, driver side)

Rules for this phase:
- Use only `Animated` from `react-native`, with `useNativeDriver: true` for opacity and transforms.
- Every loop is stopped in the effect's cleanup (`return () => loop.stop();`), as `RestaurantHomeScreen.js` does around line 357.
- Respect the phone's "Reduce motion" setting: call `AccessibilityInfo.isReduceMotionEnabled()` once on mount, plus `AccessibilityInfo.addEventListener('reduceMotionChanged', ...)` with cleanup. When it's on, show the end state with no animation.
- Nothing inside map markers.

**A1. Pulse the on-duty dot**
- File: `screens/driver/DriverHomeScreen.js`. The dot is `{collector?.is_on_duty && <View style={styles.dutyDot} />}`.
- Make it an `Animated.View` whose opacity loops 1 → 0.3 → 1. Each half takes 550 ms (`Animated.sequence` inside `Animated.loop`, `Easing.inOut(Easing.quad)`).
- Run the loop only while `collector?.is_on_duty` is true.

**A2. Slide in new pickups**
- File: `screens/driver/DriverHomeScreen.js`, where `todayPickups.map(...)` renders `PickupCard`.
- Keep a `useRef(new Set())` of pickup ids already shown. Fill it with the ids present on first render, so nothing animates when the screen opens.
- When a pickup id appears that is not in the set, wrap that card in an `Animated.View`. It goes from `opacity: 0, translateY: 12` to `opacity: 1, translateY: 0` over 300 ms (`Easing.out(Easing.cubic)`). Then add the id to the set.
- Do not change `PickupCard`'s props or its `onPress`.

**A3. Count up the profile numbers**
- File: `screens/driver/DriverProfileScreen.js`. The values shown above `Litres total` (around line 166) and `Collections` (around line 174).
- When the screen opens, count each from 0 to its value over 600 ms, once. Copy the count-up approach in `src/components/MoneyPop.js`, which already does this.
- This one animates a number in text, so it can't use the native driver. Keep it at 600 ms.
- With Reduce motion on, show the final number straight away.

---

### Phase 8 (optional): Extras

**X1. Placeholder shapes while loading**
- Files: `screens/driver/DriverHomeScreen.js` (the "Today's pickups" list) and `screens/manufacturer/ManufacturerDashboardScreen.js` (home tab, stat cards and incoming deliveries).
- Use the `loading` flag the screen already gets from its context hook (`CollectorContext` and `ManufacturerContext` both expose `loading`). **If the screen doesn't already receive `loading`, skip it. Do not edit the context.**
- When `loading` is true and there is no data yet, render 2 or 3 grey blocks shaped like the real cards:
  - `backgroundColor: '#E4EDE7'`, `borderRadius: 18`, same heights as the cards.
  - Opacity loops 0.5 → 1 over 800 ms, with the A-phase rules.
- Replace only the spinner in those two spots.

**X2. A "Next stop" card on the driver home**
- File: `screens/driver/DriverHomeScreen.js`, below the "View all pickups" button.
- When `openPickups` has at least one item, show one card for the first open pickup: restaurant name, address, litres, and a "Navigate" button.
- The button calls `navigation.navigate('DriverMap', { pickupId: item.id })`. That is exactly the call `DriverCollectionsScreen.js` already makes in `handleAction`, so no new route or param is needed. Check the existing call before using it, and quote it in the plan.
- When there are no open pickups, render nothing.

---

### Phase 9: Final checks and build

1. Merge the latest `main` into `ui-polish`: `git fetch origin && git merge origin/main`. Resolve conflicts by keeping the teammate's logic and re-applying only our visual change.
2. Run all A6 checks. All must print OK (check 3 may show the one X2 line, if X2 was done).
3. Print `git log --oneline main..HEAD` and a one-line summary per commit.
4. Do not build or push. Tshepiso builds the `preview` APK:
   ```bash
   cd Devine-Devs
   eas build --profile preview --platform android
   ```
   The `preview` profile in `eas.json` makes an installable APK without the development tools button (the grey gear) and with the app's code inside, so the phones don't depend on a laptop.

---

## Part C: Prompts to paste into Claude Code

Paste these one at a time. Wait for each phase to finish and check the app before the next.

**Prompt 0: setup**
```
Read UI_POLISH.md in the repo root, all of Part A, carefully. This branch is visual polish only. You must not change any backend, data, navigation or business logic. Confirm:
(1) you are on branch ui-polish, created from an up-to-date main;
(2) HEAD is c3f8fa9, or newer (if newer, list the new commits and stop);
(3) run check 5 from A6 (expo export) to prove the app bundles before we start.
Then summarise the rules in Part A in 8 bullet points, so I can see you understood them, including the 8 traps in A4. Do not edit anything yet.
```

**Prompt for each phase**

Replace N with the phase number (1 to 8):
```
Phase N. Re-read UI_POLISH.md Part A, then do Phase N in Part B, exactly as written.
First reply with the plan only: for every item, the file, the exact existing code you found (quote it), and the exact change. If any quoted snippet from UI_POLISH.md is not in the file, say so and skip that item. Do not improvise.
Do not edit until I reply "go". After "go": one commit per item, then run every check in A6 and give me the A7 report.
```

**Prompt 9: final**
```
Phase 9. Re-read UI_POLISH.md Part A, then do Phase 9 in Part B. Do not push and do not run eas build.
```

**If Claude goes off-script**, paste this:
```
Stop. Undo any uncommitted changes with git restore. Re-read UI_POLISH.md Part A. You changed something outside the plan. Tell me exactly what and why, and wait.
```

---

## Part D: Not for this branch (functional issues for the team)

These came up during the review. They change behaviour or data, so they don't belong in a visual-only branch. Raise them with whoever owns that part:

1. **Cancelled pickups still appear on the driver map.** `pickupMarkers` in `DriverMapScreen.js` only excludes `completed`, so cancelled pickups show as pins and are included in "Plan N stops". A one-word filter fix, but it touches route planning, so the routing owner should make it and test it.
2. **The Finance tab shows a large negative margin** ("Estimated margin R-15 127") because the manufacturer's cost assumptions in the database (`logistics_cost` R10,000 and `other_operating_cost`) are set against about R1,600 of oil. Set demo-sized values in the database, or prepare an explanation.
3. **The driver's profile photo** on the demo account is a black image with tiny text. Upload a real photo, or remove it so the initials show.
4. **Demo as driver Thobile Mokoena.** It's the only driver account with a route and district filled in.
