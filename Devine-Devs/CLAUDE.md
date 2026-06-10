# BioLoop — Project Context for Claude Code

## What this project is
BioLoop is a smart waste-cooking-oil collection platform for South Africa, connecting
restaurants, collectors (drivers), and biodiesel manufacturers. It is a React Native
(Expo) app with a Supabase backend. I own the RESTAURANT side only.

## Source of truth (do not contradict these)
- Restaurant journey: sign up -> onboard (business + GPS + tank) -> activate
  sensor (simulated for now) -> tank monitored -> at threshold an automated
  collection request is created -> restaurant notified -> collector completes
  pickup -> oil graded A/B/C -> compensation calculated -> earnings/history shown.
- Compensation = volume (litres) x rate per litre x quality grade multiplier.
- Oil quality grades are ONLY A, B, or C. There is no "Grade A+".
- Automated threshold-based collection is the PRIMARY flow (default 80% capacity).
  Manual pickup is emergency-only and secondary.

## Hard constraints
- Currency is South African Rand (R / ZAR). Never use $.
- Temperature is Celsius (C), never Fahrenheit.
- The brand is "BioLoop". Never "KitchenSteward" or any other name.
- The one green is #10b981 (with #059669 dark). Do not introduce #16A34A or new greens.
- Fonts: Poppins for headings, Inter for body. Keep this.

## Boundaries — do NOT touch
- Do not modify anything in screens/driver, screens/manufacturer, or screens/admin.
- Do not invent screens, features, tables, or fields that are not in my prompt or
  the source-of-truth above.
- If something is ambiguous, or a file does not match what my prompt describes,
  STOP and ask me. Do not guess or "improve" beyond what I asked.

## Working style
- Before editing files, show me a short plan and wait for my approval.
- Make small, focused changes. One concern per change.
- After a change, tell me exactly which files you touched.