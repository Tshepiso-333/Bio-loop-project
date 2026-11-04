// supabase/functions/send-email/index.ts
//
// Sends transactional email through Brevo. Two jobs:
//
//   1. Statements a person asked for ("email me my statement").
//   2. The notification channel for anyone push can't reach — above all
//      iPhone users, since iOS push needs a paid Apple Developer account and
//      there is no free or open-source substitute (Apple only accepts APNs).
//      send-push calls here when a user has no registered device.
//
// The SMTP credentials configured for Supabase auth emails can't be used from
// a function, so this goes through Brevo's REST API with BREVO_API_KEY.
//
//   POST { to?, userId?, subject, html, text? }
//   -> { sent: true, messageId }
//
// Either `to` or `userId` is required; `userId` is looked up in profiles so
// callers never have to carry email addresses around.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

// Same shared secret as send-push: the callers are a Postgres trigger and
// another Edge Function, not a signed-in user, so Supabase's own JWT
// verification can't check them. Fails closed.
const TRIGGER_SECRET = Deno.env.get("PUSH_TRIGGER_SECRET") ?? "";

// Brevo single-sender verification is on this address. Until a domain is
// verified there is no DKIM/DMARC, so some recipients will see these in spam
// — see docs/NOTIFICATIONS.md.
const SENDER = { name: "BioLoop", email: "ngubanemzobanzi4@gmail.com" };

/** Strips tags for the plain-text part, so the mail isn't HTML-only. */
function toPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h1|h2|h3)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const presented = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!TRIGGER_SECRET || presented !== TRIGGER_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!BREVO_API_KEY) {
    return new Response(JSON.stringify({ error: "BREVO_API_KEY is not configured" }), {
      status: 500,
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

  const subject = (payload.subject as string | undefined)?.trim();
  const html = payload.html as string | undefined;
  let to = (payload.to as string | undefined)?.trim();
  const userId = payload.userId as string | undefined;
  let toName: string | undefined;

  if (!subject || !html) {
    return new Response(JSON.stringify({ error: "subject and html are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Resolve a userId to an address, so callers don't pass emails around.
  if (!to && userId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();
    to = profile?.email ?? undefined;
    toName = profile?.full_name ?? undefined;
  }

  if (!to) {
    return new Response(JSON.stringify({ error: "No recipient address" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const brevoResponse = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Brevo wants the raw xkeysib- key in this header, not a bearer token.
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [toName ? { email: to, name: toName } : { email: to }],
      subject,
      htmlContent: html,
      textContent: (payload.text as string | undefined) ?? toPlainText(html),
    }),
  });

  const result = await brevoResponse.json().catch(() => null);

  if (!brevoResponse.ok) {
    return new Response(
      JSON.stringify({
        error: "Brevo rejected the message",
        status: brevoResponse.status,
        detail: result,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ sent: true, messageId: result?.messageId ?? null }),
    { headers: { "Content-Type": "application/json" } },
  );
});
