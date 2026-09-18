// supabase/functions/optimize-route/index.ts
//
// Route optimisation via openrouteservice (HeiGIT). Set up 2026-09-17 as the
// server-side home for the team's route-optimisation work — the ORS API key
// lives ONLY here as the ORS_API_KEY Edge Function secret and never ships in
// the app bundle.
//
// Starting skeleton (owner: route-optimisation teammate — replace/extend the
// body freely, the auth + key handling around it is the part to keep):
//
//   POST { "coordinates": [[lng, lat], [lng, lat], ...], "profile"?: "driving-car" }
//   -> proxies to ORS /v2/directions/{profile}/geojson and returns its GeoJSON
//      (route geometry + distance/duration per segment).
//
// Caller must be a signed-in app user (same pattern as payfast-checkout):
// the RN app calls supabase.functions.invoke('optimize-route', { body }) and
// the user's JWT is forwarded automatically.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ORS_API_KEY = Deno.env.get("ORS_API_KEY");

const ORS_BASE = "https://api.openrouteservice.org";
const ALLOWED_PROFILES = new Set(["driving-car", "driving-hgv"]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return jsonResponse({ success: false, error: "POST only" }, 405);

  if (!ORS_API_KEY) {
    return jsonResponse({ success: false, error: "ORS_API_KEY secret is not set on this project" }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) return jsonResponse({ success: false, error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const coordinates = body?.coordinates;
    const profile = ALLOWED_PROFILES.has(body?.profile) ? body.profile : "driving-car";

    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      !coordinates.every(
        (c: unknown) =>
          Array.isArray(c) && c.length === 2 && c.every((n) => typeof n === "number" && Number.isFinite(n))
      )
    ) {
      return jsonResponse(
        { success: false, error: "coordinates must be an array of at least two [lng, lat] number pairs" },
        400
      );
    }

    const orsResponse = await fetch(`${ORS_BASE}/v2/directions/${profile}/geojson`, {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json, application/geo+json",
      },
      // radiuses: let ORS snap each point to the nearest road within 2 km —
      // restaurant/manufacturer pins are typed-in addresses, not GPS fixes.
      body: JSON.stringify({ coordinates, radiuses: coordinates.map(() => 2000) }),
    });

    const orsBody = await orsResponse.json().catch(() => null);

    if (!orsResponse.ok) {
      console.error("optimize-route: ORS error", orsResponse.status, orsBody);
      return jsonResponse(
        { success: false, error: "openrouteservice request failed", status: orsResponse.status, details: orsBody },
        502
      );
    }

    // Response contract (matches the driver map screen's reader):
    //   { success, profile, route: <ORS GeoJSON>, summary: { distance (m), duration (s) } }
    const summary = orsBody?.features?.[0]?.properties?.summary ?? null;
    return jsonResponse({
      success: true,
      profile,
      route: orsBody,
      summary: summary
        ? { distance: Number(summary.distance ?? 0), duration: Number(summary.duration ?? 0) }
        : { distance: 0, duration: 0 },
    });
  } catch (err) {
    console.error("optimize-route: unexpected error", err);
    return jsonResponse({ success: false, error: "Unexpected error" }, 500);
  }
});
