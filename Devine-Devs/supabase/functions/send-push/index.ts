// supabase/functions/send-push/index.ts
//
// Delivers an alert to a person's devices. Called by the
// trg_alerts_dispatch_push trigger (migration 066) on every new alerts row,
// via pg_net, with the service key from push_config.
//
// The alerts row stays the record; this is only delivery. The push payload
// carries the row's id and meta, so tapping the notification lands on the
// same screen as tapping the bell entry (see src/services/pushService.js).
//
//   POST { alertId, userId, title, message, category, type, meta }
//   -> { sent: n, skipped?: reason }
//
// Two things are deliberate:
//
//  1. **This function decides what is push-worthy, not SQL.** Changing the
//     policy is a function deploy, not a migration. Everything else still
//     lands in the bell.
//
//  2. **Unknown-device tokens are deleted.** Expo reports
//     DeviceNotRegistered for uninstalled apps; leaving those rows means
//     retrying dead tokens forever.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Deployed with --no-verify-jwt, because the caller is a Postgres trigger
// rather than a signed-in user and this project uses the new sb_* key format
// (not JWTs), so Supabase's own verification can't check it. Without this
// shared secret the function would be world-callable — anyone could push
// arbitrary notifications to any user whose id they guessed. The matching
// value lives in push_config.service_key and is sent by
// alerts_dispatch_push().
const TRIGGER_SECRET = Deno.env.get("PUSH_TRIGGER_SECRET") ?? "";

// Push is an interruption; the bell is a record. Only things that are
// time-critical or involve money earn a buzz. Everything not listed here is
// still written to alerts and still shows in the app.
const PUSH_WORTHY_TITLES = new Set([
  // driver
  "New pickup assigned",
  "Earnings added to your wallet",
  "Withdrawal paid",
  "You were set to off duty",
  "Pickup cancelled",
  // restaurant
  "Driver has arrived",
  "Pickup dispatched",
  "Payout successful",
  "Your tank is nearly full",
  "Delivery confirmed",
  // manufacturer
  "Oil on the way",
  "Incoming pickup routed to you",
  // admin: exceptions only — this role monitors, it should not be buzzed for
  // routine automation (auto-dispatched, auto-reassigned, payouts).
  "Pickup needs a driver",
]);

function isPushWorthy(title: string | null): boolean {
  if (!title) return false;
  return PUSH_WORTHY_TITLES.has(title.trim());
}

/**
 * Email fallback for a person with no reachable device. Best-effort: a
 * failure here must not turn into an error on the alert write that caused it.
 */
async function sendByEmail(
  userId: string,
  title: string | null,
  message: string | null,
): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TRIGGER_SECRET}`,
      },
      body: JSON.stringify({
        userId,
        subject: `BioLoop · ${title ?? "Update"}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;color:#122A1F">
            <div style="font-size:21px;font-weight:700;color:#15643E;letter-spacing:.5px">BioLoop</div>
            <h2 style="font-size:17px;margin:22px 0 8px">${title ?? "Update"}</h2>
            <p style="font-size:14px;line-height:1.6;color:#3C4F45;margin:0">${message ?? ""}</p>
            <p style="font-size:12px;color:#6B7F75;margin-top:26px;padding-top:14px;border-top:1px solid #E4EDE7">
              You are getting this by email because no device on your account can receive
              notifications. Open BioLoop to see it in the app.
            </p>
          </div>`,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Refuse everything that isn't the trigger. Fail closed: if the secret was
  // never configured, send nothing rather than accepting anonymous callers.
  const presented = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!TRIGGER_SECRET || presented !== TRIGGER_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const alertId = payload.alertId as string | undefined;
  const userId = payload.userId as string | undefined;
  const title = (payload.title as string | null) ?? null;
  const message = (payload.message as string | null) ?? null;
  const meta = (payload.meta as Record<string, unknown>) ?? {};

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isPushWorthy(title)) {
    return new Response(JSON.stringify({ sent: 0, skipped: "not push-worthy" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: tokens, error } = await admin
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Nobody's phone can be reached. Rather than drop a time-critical alert,
  // fall back to email — which is the only channel that reaches an iPhone
  // without a paid Apple Developer account, and also covers anyone who
  // declined notification permission or is testing in Expo Go.
  if (!tokens?.length) {
    const emailed = await sendByEmail(userId, title, message);
    return new Response(
      JSON.stringify({ sent: 0, fallback: emailed ? "email" : "none", skipped: "no devices registered" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const messages = tokens.map((row: { token: string }) => ({
    to: row.token,
    sound: "default",
    title: title ?? "BioLoop",
    body: message ?? "",
    // What pushService.routeForAlert reads on tap.
    data: { alertId, ...meta },
    channelId: "default",
  }));

  const expoResponse = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });

  const result = await expoResponse.json().catch(() => null);

  // Reap tokens Expo says are dead, so we stop retrying uninstalled apps.
  const tickets = Array.isArray(result?.data) ? result.data : [];
  const dead: string[] = [];
  tickets.forEach((ticket: Record<string, unknown>, i: number) => {
    const details = ticket?.details as Record<string, unknown> | undefined;
    if (ticket?.status === "error" && details?.error === "DeviceNotRegistered") {
      dead.push(tokens[i].token);
    }
  });
  if (dead.length) {
    await admin.from("push_tokens").delete().in("token", dead);
  }

  const sent = tickets.filter((t: Record<string, unknown>) => t?.status === "ok").length;

  return new Response(
    JSON.stringify({ sent, devices: tokens.length, pruned: dead.length }),
    { headers: { "Content-Type": "application/json" } },
  );
});
