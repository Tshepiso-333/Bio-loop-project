# Auth flows

Three ways in. All of them end with a normal Supabase session, so the rest of
the app (RootNavigator picking a role stack, RLS, everything) is unchanged.

| Flow | Screens | Needs a password? |
|---|---|---|
| Password sign-in | Login | yes |
| Sign in with a code | Login → VerifyCode | no |
| Sign up with a code | SignUp → VerifyCode | no |
| Forgot password | ForgotPassword → VerifyCode → ResetPassword | sets a new one |

## Why codes, not links

Supabase can send either a magic **link** or a 6-digit **code**. A link has to
come back into the app through a deep link, which behaves differently in Expo
Go, in a dev build and in a store build. A code the person types works the
same everywhere, so every email template is configured to send `{{ .Token }}`.

The old ForgotPasswordScreen sent `redirectTo: 'bioloop://reset-password'` —
a scheme nothing registered, and the Supabase call was commented out anyway.
It never worked. It now sends a code.

## Supabase config behind it

Set via the Management API (`/config/auth`):

- `mailer_otp_length: 6`, `mailer_otp_exp: 900` (15 minutes)
- `mailer_templates_recovery_*`, `_magic_link_*`, `_confirmation_*` all contain
  `{{ .Token }}` — recovery is used by forgot-password, magic_link by sign-in
  for an existing user, confirmation by sign-up for a new one.
- `mailer_autoconfirm: true` — no separate "confirm your email" step.

## Code map

- `src/services/authService.js` — the only place that talks to Supabase auth
  for these flows: `sendSignInCode`, `verifyEmailCode`, `sendPasswordResetCode`,
  `verifyRecoveryCode`, `updatePassword`. It also turns Supabase's error
  strings into ones a person can act on.
- `screens/auth/VerifyCodeScreen.js` — one screen for both flows;
  `route.params.purpose` is `'signin'` or `'recovery'`. Auto-submits on the
  sixth digit, 45-second resend cooldown.
- `screens/auth/ResetPasswordScreen.js` — only reachable right after a verified
  recovery code, because `updateUser({ password })` needs that recovery session.

## Roles

`handle_new_user()` reads `raw_user_meta_data` → `name`, `surname`, `role` to
create the `profiles` row plus the matching restaurant/collector/manufacturer
row. So **sign-up with a code still collects name, surname and role first** —
that metadata is passed to `signInWithOtp`. Sign-in with a code never creates
an account (`shouldCreateUser: false`), so a typo'd email can't produce a
roleless user.

## Limit to know about

`rate_limit_email_sent` is **2 emails per hour** on the built-in Supabase SMTP,
and that shared sender only delivers to addresses on the Supabase org. For
team-wide testing, add custom SMTP (Resend / Brevo / SendGrid free tier) under
Authentication → Emails, then raise the rate limit. Until then these flows work
reliably only for the project owner's own address.
