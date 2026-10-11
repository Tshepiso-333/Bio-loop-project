# Statements and receipts

Every role can download a PDF of their own money. Same data the screens show,
so a statement can never disagree with a balance.

| Role | Statement | Where |
|---|---|---|
| Restaurant | payouts received | Earnings screen |
| Driver | collection fees in, withdrawals out, available now | Home, under the wallet |
| Manufacturer | payments made (settled only) | Finance tab |
| Admin | platform books: received, paid out, kept | Finance tab |

Ranges: 30 / 90 / 365 days. Default 90.

## How it works

1. `src/services/statementService.js` — `getStatement({ role, ownerId, days })`.
   All reads, no arithmetic beyond summing the rows it fetched. RLS scopes
   every query, so passing someone else's id returns nothing.
2. `src/lib/statementHtml.js` — renders print-ready HTML. Self-contained: no
   app fonts (the PDF renderer can't see them), no external assets, no JS.
3. `src/lib/documentExport.js` — `expo-print` writes the PDF, `expo-sharing`
   opens the share sheet (save to Files, mail, WhatsApp).
4. `src/components/StatementButton.js` — the one button all four roles use.
   Takes a `tint` instead of importing any role's tokens.

`getReceipt(pickupId)` + `receiptHtml` do a single-pickup receipt from the
`platform_ledger` row: what the manufacturer paid and how it split.

## Two deliberate choices

**No `Intl`.** `toLocaleString('en-ZA')` renders 88.55 as "88,55", and Hermes
ships a reduced Intl, so the same statement could format differently on a
phone than in a test. `money()` and `shortDate()` are hand-rolled, giving
`R1,234,567.50` and `11 Oct 2026` everywhere.

**Pending payments don't count.** A manufacturer's total is settled payments
only — a started-but-unconfirmed PayFast checkout is not money that moved. It
still appears as a row, tagged "pending".

## Build requirement

`expo-print` and `expo-sharing` are native. They are in Expo Go, but a custom
dev client built *before* they were added does not have them — the button
catches that and says the build needs updating rather than crashing.

**The android-maplibre dev build needs rebuilding to download statements.**

## Not built yet: email

"Email me my statement" needs an Edge Function that renders the same HTML and
sends it through Brevo's **API** (the SMTP credentials configured for auth
emails are not usable from a function). That needs a Brevo API key in the
Supabase secret store. The on-device download covers the same need without it.
