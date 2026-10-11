# Notifications

## One record, two surfaces

The `alerts` row is the notification. A push is only a delivery van for it.

```
service/trigger inserts alerts row      <- single source of truth
        |
        +--> bell in the app (persists until read)
        +--> trg_alerts_dispatch_push -> pg_net -> send-push -> Expo -> phone
             payload carries { alertId, ...meta }
```

Tapping the banner and tapping the bell entry land on the same screen, because
both use `routeForAlert()` from `src/lib/alertRouting.js`. A tap also marks
that alert read, so the badge doesn't nag about something already dealt with.

While the app is in the **foreground** the OS banner is suppressed
(`configureForegroundBehaviour`) — a banner for the screen you are looking at
is noise; the bell is the surface then.

## Where push actually works

| | Push |
|---|---|
| Android dev/production build | yes, via FCM |
| iOS build with an APNs key | yes — needs a **paid** Apple Developer account |
| Expo Go, either platform | **no** |

Expo removed Android push from Expo Go in SDK 53+, and iOS Expo Go cannot
receive push at all. `pushService` detects Expo Go and returns a reason
instead of throwing, so the team testing in Expo Go still gets in-app alerts.

**There is no free or open-source way to push to an iPhone.** iOS only accepts
notifications from Apple's APNs. For iPhone users without that account, email
is the cross-platform channel (Brevo is already configured) — not built yet.

## What is push-worthy

Push is an interruption; the bell is a record. Only time-critical or money
events earn a buzz. The list lives in `send-push/index.ts`
(`PUSH_WORTHY_TITLES`) **not** in SQL, so changing the policy is a function
deploy rather than a migration. Everything else still lands in the bell.

Admin is monitor-only, so it is pushed for exceptions only (`Pickup needs a
driver`) and never for routine automation.

## Pieces

| Where | What |
|---|---|
| `alerts.meta` (064) | routing payload: `{ pickupId, screen, amount, tankId }` |
| `push_tokens` (066) | one row per device; RLS = own rows only |
| `register_push_token` / `unregister_push_token` | SECURITY DEFINER upsert/delete; a token moves to whoever signed in last |
| `push_config` (066) | single row: function URL + shared secret + `enabled`. RLS on, no policies, so only the service role can read it |
| `alerts_dispatch_push` (066) | trigger -> `net.http_post`; exceptions swallowed so delivery can never roll back the alert |
| `send-push` function | decides push-worthiness, sends via Expo, prunes dead tokens |
| `src/services/pushService.js` | permission, token, foreground behaviour, tap listener |
| `src/lib/alertRouting.js` | pure per-role route mapping (no RN imports, so it is testable) |

## Security note

`send-push` is deployed `--no-verify-jwt`, because the caller is a Postgres
trigger, not a signed-in user, and this project uses the new `sb_*` key format
(not JWTs) so Supabase's own verification cannot check it. It therefore
requires a shared secret in the `Authorization` header, held as the
`PUSH_TRIGGER_SECRET` function secret and in `push_config.service_key`. It
**fails closed**: no secret configured means nothing is accepted. Verified —
unauthenticated and wrong-secret calls both return 401.

## Verified end to end (2026-10-11)

Insert an alert -> trigger fires -> pg_net posts -> function authenticates ->
`{"sent":0,"skipped":"no devices registered"}`. Correct: no phone has
registered a token yet, because that needs a rebuilt dev build.

## To finish

1. **Rebuild the android-maplibre dev build** — `expo-notifications` is native
   and the installed APK predates it. Until then no token registers.
2. **FCM credentials for Android** — `google-services.json` via EAS.
3. **An EAS `projectId`** in `app.json` (`extra.eas.projectId`), which
   `getExpoPushTokenAsync` needs.
4. Email fallback for iPhone users (Brevo API key).
