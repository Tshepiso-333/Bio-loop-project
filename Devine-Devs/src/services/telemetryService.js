// src/services/telemetryService.js
//
// The app's write side of system_events (migration 080). Everything the admin
// Operations screen shows comes from here or from the database's own audit
// triggers (migration 081).
//
// Three hard rules, because a logger that misbehaves is worse than no logger:
//
//   1. It never throws. Every path is wrapped, and a failure to log is
//      swallowed. Telemetry must not be able to break a pickup or a payment.
//   2. It never floods. The same error inside a render loop could otherwise
//      write thousands of rows in seconds, so identical events are throttled
//      and the suppressed count is carried on the next one that gets through.
//   3. It never blocks. Callers are not expected to await it; `logEvent` is
//      fire-and-forget and returns immediately.
//
// It also cannot forge an actor: log_event() is SECURITY DEFINER and stamps
// actor_user_id from auth.uid() itself, ignoring anything we send.
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { supabase } from '../../supabase';

const LEVELS = ['debug', 'info', 'warn', 'error', 'critical'];

// Same event + same message inside this window is counted, not re-sent.
const THROTTLE_MS = 30000;
// If we cannot reach the server (offline, or signed out — log_event requires a
// session) events wait here. Oldest are dropped first; losing old telemetry is
// always better than growing without bound.
const QUEUE_LIMIT = 50;

const seen = new Map();   // throttle key -> { at, suppressed }
let queue = [];
let flushing = false;
let enabled = true;

const appVersion =
  Constants?.expoConfig?.version ??
  Constants?.manifest?.version ??
  null;
const platform = `${Platform.OS}${Platform.Version ? ` ${Platform.Version}` : ''}`;

function throttleKey(payload) {
  return `${payload.p_event}|${payload.p_message ?? ''}|${payload.p_error_code ?? ''}`;
}

// Returns the number of suppressed duplicates to report, or null to skip.
function throttle(payload) {
  const key = throttleKey(payload);
  const now = Date.now();
  const previous = seen.get(key);

  if (previous && now - previous.at < THROTTLE_MS) {
    previous.suppressed += 1;
    return null;
  }

  const suppressed = previous?.suppressed ?? 0;
  seen.set(key, { at: now, suppressed: 0 });

  // Keep the throttle map from being its own leak.
  if (seen.size > 200) {
    for (const [k, v] of seen) {
      if (now - v.at > THROTTLE_MS * 4) seen.delete(k);
    }
  }

  return suppressed;
}

async function send(payload) {
  const { error } = await supabase.rpc('log_event', payload);
  if (error) throw error;
}

async function flush() {
  if (flushing || queue.length === 0) return;
  flushing = true;
  try {
    while (queue.length) {
      // Peek rather than shift, so a failure keeps the event for next time.
      await send(queue[0]);
      queue.shift();
    }
  } catch {
    // Still unreachable. Leave the rest queued and try again on the next log.
  } finally {
    flushing = false;
  }
}

/**
 * Record one event. Fire-and-forget: callers do not await this.
 */
export function logEvent({
  event,
  level = 'info',
  source = 'app',
  message = null,
  context = {},
  subjectTable = null,
  subjectId = null,
  errorCode = null,
  stack = null,
  durationMs = null,
} = {}) {
  if (!enabled || !event) return;

  try {
    const payload = {
      p_event: String(event).slice(0, 120),
      p_level: LEVELS.includes(level) ? level : 'info',
      p_source: source,
      p_message: message == null ? null : String(message).slice(0, 1000),
      p_context: context && typeof context === 'object' ? context : {},
      p_subject_table: subjectTable,
      p_subject_id: subjectId == null ? null : String(subjectId),
      p_error_code: errorCode == null ? null : String(errorCode).slice(0, 100),
      p_stack: stack == null ? null : String(stack).slice(0, 4000),
      p_duration_ms: Number.isFinite(durationMs) ? Math.round(durationMs) : null,
      p_app_version: appVersion,
      p_platform: platform,
    };

    const suppressed = throttle(payload);
    if (suppressed === null) return;
    if (suppressed > 0) {
      payload.p_context = { ...payload.p_context, suppressed_duplicates: suppressed };
    }

    queue.push(payload);
    if (queue.length > QUEUE_LIMIT) queue = queue.slice(-QUEUE_LIMIT);

    // Deliberately not awaited.
    flush();
  } catch {
    // A logger that throws is a bug multiplier. Give up on this one event.
  }
}

/**
 * Record a caught error. Pulls apart whatever shape the throw had — Error,
 * Supabase PostgrestError, or a bare string.
 */
export function logError(event, error, context = {}) {
  const code =
    error?.code ??
    error?.status ??
    error?.name ??
    null;

  logEvent({
    event,
    level: 'error',
    message: error?.message ?? String(error ?? 'Unknown error'),
    // Supabase errors carry the useful part in details/hint, not in a stack.
    stack: error?.stack ?? [error?.details, error?.hint].filter(Boolean).join('\n') ?? null,
    errorCode: code,
    context,
  });
}

/**
 * Time an async operation and log how long it took — the latency samples
 * behind system_latency. A throw is logged as an error with its duration and
 * then re-thrown, so this is transparent to the caller's own error handling.
 *
 *   const data = await withTiming('admin.load_bundle', () => loadAdminBundle());
 */
export async function withTiming(event, fn, context = {}) {
  const started = Date.now();
  try {
    const result = await fn();
    logEvent({
      event,
      level: 'debug',
      durationMs: Date.now() - started,
      context,
    });
    return result;
  } catch (error) {
    logEvent({
      event,
      level: 'error',
      message: error?.message ?? String(error),
      errorCode: error?.code ?? error?.name ?? null,
      stack: error?.stack ?? null,
      durationMs: Date.now() - started,
      context,
    });
    throw error;
  }
}

/**
 * Catch what nothing else caught: a crash on the JS thread, and promise
 * rejections nobody handled. Called once from App.js.
 *
 * The original handler is still invoked, so the red box in development and the
 * normal crash path in production behave exactly as before.
 */
export function installGlobalErrorHandler() {
  try {
    const globalHandler = global.ErrorUtils?.getGlobalHandler?.();

    global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
      logEvent({
        event: 'app.crash',
        level: isFatal ? 'critical' : 'error',
        message: error?.message ?? String(error),
        errorCode: error?.name ?? null,
        stack: error?.stack ?? null,
        context: { fatal: !!isFatal },
      });
      if (typeof globalHandler === 'function') globalHandler(error, isFatal);
    });

    // Hermes/RN expose this on the global tracking object rather than as a
    // window event, and it is absent on some targets — hence the guard.
    const tracking = require('promise/setimmediate/rejection-tracking');
    tracking?.enable?.({
      allRejections: true,
      onUnhandled: (id, error) => {
        logEvent({
          event: 'app.unhandled_rejection',
          level: 'error',
          message: error?.message ?? String(error),
          errorCode: error?.name ?? null,
          stack: error?.stack ?? null,
        });
      },
      onHandled: () => {},
    });
  } catch {
    // No global hooks on this target. Explicit logError calls still work.
  }
}

/** Turn telemetry off (used by tests, and as a kill switch). */
export function setTelemetryEnabled(value) {
  enabled = !!value;
}
