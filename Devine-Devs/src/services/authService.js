// Email one-time-code auth: the two flows that don't need a password.
//
// Why codes and not magic links: a link has to come back into the app
// through a deep link, which is fragile in Expo Go, on a dev build and in a
// store build all at once. A 6-digit code the person types works the same
// everywhere. The Supabase email templates are configured to send
// {{ .Token }} (see docs/AUTH_FLOWS.md); codes are 6 digits, valid 15 min.
//
// Two flows, same verify step:
//   sign in / sign up : sendSignInCode() -> verifyEmailCode()      -> session
//   forgot password   : sendPasswordResetCode() -> verifyRecoveryCode()
//                       -> updatePassword()                        -> session
import { supabase } from '../../supabase';

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

/** Friendlier text for the handful of errors users actually hit. */
function describeAuthError(error, fallback) {
  const message = String(error?.message ?? '');
  if (/rate limit|too many requests|after \d+ seconds/i.test(message)) {
    return 'Too many code requests. Wait a minute and try again.';
  }
  // Supabase answers a wrong code AND a stale one with the same string,
  // "Token has expired or is invalid", so don't claim it expired — that
  // sends people off to request a new code when they just mistyped.
  if (/expired or is invalid/i.test(message)) {
    return 'That code is wrong or has expired. Check the digits, or send yourself a new one.';
  }
  if (/expired/i.test(message)) {
    return 'That code has expired. Send yourself a new one.';
  }
  if (/invalid|incorrect/i.test(message)) {
    return 'That code is not right. Check the digits and try again.';
  }
  if (/signups not allowed|not found|no user/i.test(message)) {
    return 'No account uses that email address.';
  }
  return message || fallback;
}

/**
 * Sends a sign-in code. `profile` ({ full_name, role }) is only used when
 * creating a brand-new account — Supabase stores it as user metadata, which
 * is what the handle_new_user() trigger reads to create the profiles row and
 * the matching restaurant/collector/manufacturer record. Pass allowSignUp
 * false on the login screen so a typo can't silently create an account.
 */
export async function sendSignInCode(email, { allowSignUp = false, profile = null } = {}) {
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizeEmail(email),
    options: {
      shouldCreateUser: allowSignUp,
      ...(profile ? { data: profile } : {}),
    },
  });
  if (error) throw new Error(describeAuthError(error, 'Could not send the code.'));
  return true;
}

/** Verifies a sign-in / sign-up code. Returns the new session. */
export async function verifyEmailCode(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: String(token ?? '').trim(),
    type: 'email',
  });
  if (error) throw new Error(describeAuthError(error, 'Could not verify that code.'));
  return data;
}

/**
 * Sends a password-reset code. Deliberately no redirectTo: we want the
 * emailed {{ .Token }}, not a deep link back into the app.
 */
export async function sendPasswordResetCode(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email));
  if (error) throw new Error(describeAuthError(error, 'Could not send the reset code.'));
  return true;
}

/**
 * Verifies a reset code. On success Supabase signs the user in with a
 * recovery session — that session is what lets updatePassword() work, so
 * the new-password screen must come straight after this.
 */
export async function verifyRecoveryCode(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: String(token ?? '').trim(),
    type: 'recovery',
  });
  if (error) throw new Error(describeAuthError(error, 'Could not verify that code.'));
  return data;
}

/** Sets a new password for the currently signed-in (or recovery) session. */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(describeAuthError(error, 'Could not update the password.'));
  return data;
}
