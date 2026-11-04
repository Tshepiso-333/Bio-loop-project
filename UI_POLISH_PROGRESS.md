# UI polish progress log (do not commit)

Run: Phases 1-7 and 9, skipping Phase 8 and B4. Started 2026-11-04 from c3f8fa9.
Note: check 5 (expo export) fails at baseline: @maplibre/maplibre-react-native is in package.json but not in node_modules (needs `npm ci` by Tshepiso; installs are forbidden for Claude). Substitute per phase: Babel parse of every changed file plus a check that new imports and requires resolve.


## Phase 1
- D1: started
- D1: done, 90adf48. Removed header sign-out button, its style, and the now-unused signOut/useAuth. Profile Sign Out row remains.
- D2: started
- D2: done, f2323fe. Copied RestaurantStack safe-area insets into DriverTabs tabBarStyle.
- D3: started
- D3: done, 5836605. Collections count excludes cancelled and reads 'N to do'; map badge uses new openStopCount memo; pickupMarkers untouched.
- D4: started
- D4: done, 7f3eba2. Display label only; 'Complete' not compared anywhere.
- D5: started
- D5: done, af31796. Wrapped cardActions in !isFinished; decline button and handlers untouched.
- D6: started
- D6: done, d6cdd41. Time and dot shown only when a time exists; litres part unchanged.
- D7: started
- D7: done, ec060a1. Route line built from non-empty parts and rendered only when non-empty.
- D8: started
- D8: done, c4e42e7. Only the two THEME objects had #2563EB/#EFF6FF; no other uses in screens/driver.
- D9: started
- D9: done, 65df0bc. Display title passed to MoneyPop; not an alert title. MoneyPop.js untouched.
- Phase 1 checks: 1-4 OK; 5 substitute parse OK (real export blocked by missing maplibre).

## Phase 2
- M1: started
- M1: done, 3d53fca. Completed pickups, last 30 days or all completed; % from summed volume. sevenDayForecast removed (unused); forecasts destructure left in place (context hook line, A3).
- M2: started
- M2: done, b271870. Removed emoji from grade labels; coloured dot View stays.
- M3: started
- M3: done, f225119. Meta line skips empty/placeholder parts; star -> checkmark-circle in T.primary (#15643E); Reliability labels -> Completion rate. Line 116 untouched.
- M4: started
- M4: done, 7f9cea3. ETA Text rendered only when delivery.eta exists; eta calculation untouched.
- M5: started
- M5: done, 687dc4b. This week and Current stock cards use Math.round instead of toLocaleString.
- Phase 2 checks: 1-4 OK; 5 substitute parse OK (9 files).

## Phase 3
- G1: started
- G1: done, 2b4f24b. Completed pickups only; litre bars stacked A/B/C with totals; old % gridlines removed; title and subtitle updated. groupPickupsByMonth untouched.
- G2: started
- G2: done, 7466173. PieChart removed; one flex bar from qualityDistribution, backgroundColor C.border; pie* styles left.
- G3: started
- G3: done, c23e3c4. 7 local-day buckets ending Today, completed only, completed_at else pickup_date; litres above bars (bar scale 120->110 so labels fit the 130px container); header shows weekly total.
- Phase 3 checks: 1-4 OK; 5 substitute parse OK.

## Phase 4
- C1: started
- C1: done, 78f2ec5. Earnings subtitles x3; both arrived_manufacturer details (status confirmed).
- C2: started
- C2: done, 7ffaf1e. All 30 listed strings (34 lines); each searched first, none used in logic. FILTERS and Grade names untouched; DriverHeader.js and RestaurantProfileScreen.js not in scope.
- C3: started
- C3: done, 788b5bf. Sentence dashes -> full stop/colon/comma in 8 files; placeholders: supplier contact/email 'Not set', lastDelivery/earnings amount/avg price 'None'. Skipped (compared or not date/count/profile): manufacturer ProfileScreen fields (position/location compared at :315-316, others left for consistency + edit prefill), supplier cuisine/location/quality, AlertsScreen message, tank ring, driver rating/reviews, payment-screen grade.
- Phase 4 checks: 1-4 OK; 5 substitute parse OK.

## Phase 5
- F1: started
- F1: done, ae84f64. MANU_THEME.fonts -> Jakarta names; 17 style objects: fontWeight -> Jakarta family or removed where F.* already set.
- F2: started
- F2: done, 252a05a. 12 files (6 screens + AIAssistant), 136 style objects; fontWeight -> Jakarta family, size-only -> Regular. Checked: no weight demotion via layered or nested styles. SvgText untouched. One commit for the item (user rule 3) rather than per file.
- F3: started
- F3: done, 34e3c98. 5 driver files, 78 style objects; Inter/Poppins swapped in DriverHomeScreen; DriverAlertsScreen untouched; no weight demotion found.
- F4: started
- F4: done, bacda73. 18 Inter/Poppins token strings swapped across 3 auth screens (no live fontWeight there; 3 inside a commented-out block left alone); RestaurantStack tabBarLabelStyle swapped and fontWeight removed.
- Phase 5 checks: 1-4 OK; 5 substitute parse OK.

## Phase 6
- B1: started
- B1: done, 6aff2b0. Leaf tile replaced by BioLoop_Logo.png (path verified), logoImage 44x44 r22; logoTile style kept.
- B2: started
- B2: done, b9c4723. 33 hex values replaced (case-insensitive) across 6 AIAssistant files + dashboard divider #F3F4F6. #059669 gradient stop not in table, left.
- B3: started
- B3: done, 2b0bf9f. New src/lib/format.js formatRand (copy of statementHtml money()); 27 display-only call sites: Forecasts 14 (formatZAR/formatZARDecimal), Earnings 8 (formatCurrency, import removed), Payment 5 (currency). Old local formatter defs left in place. Watch: Finance cost-bar labels are 70px wide, R10,000.00 may be tight.
- B4: skipped. Excluded by Tshepiso for this run.
- Phase 6 checks: 1-4 OK; 5 substitute parse OK.

## Phase 7
- A1: started
- A1: done, 294a2a9. Animated opacity loop 1->0.3->1, 550ms halves, native driver, runs only while on duty, stopped in cleanup; reduce-motion read on mount + listener with cleanup (shared with A2).
- A2: started
- A2: done, abef0b0. SlideIn wrapper (opacity 0->1, translateY 12->0, 300ms cubic out, native); ids seen on first render never animate; reduce-motion skips; PickupCard props and onPress untouched.
- A3: started
- A3: done, 90fe7b6. CountUp (MoneyPop approach, addListener, 600ms, non-native) on Litres total and Collections; once on first value; reduce-motion read on mount + listener, shows final number.
- Phase 7 checks: 1-4 OK; 5 substitute parse OK.

## Phase 8
- X1, X2: skipped. Excluded by Tshepiso for this run.

## Phase 9
- P9: started
- P9: done. origin/main already up to date (no merge needed); checks 1-4 OK; real check 5 still fails on missing @maplibre (pre-existing, needs npm ci); import check: all imports in 29 changed files resolve except that one.
