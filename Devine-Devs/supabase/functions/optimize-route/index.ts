// supabase/functions/optimize-route/index.ts
//
// Route optimisation via openrouteservice (HeiGIT). Set up 2026-09-17 as the
// server-side home for the team's route-optimisation work — the ORS API key
// lives ONLY here as the ORS_API_KEY Edge Function secret and never ships in
// the app bundle.
//
// Two modes. They are independent; neither replaces the other.
//
//   MODE 1 — point to point (the original, unchanged):
//     POST { "coordinates": [[lng, lat], [lng, lat], ...], "profile"?: "driving-car" }
//     -> proxies to ORS /v2/directions/{profile}/geojson and returns its GeoJSON
//        (route geometry + distance/duration per segment).
//     Used by the driver map's "Navigate" button for the current leg.
//
//   MODE 2 — multi-stop (added 2026-11-01):
//     POST { "mode": "multi",
//            "start": [lng, lat],
//            "stops": [{ "id": 1, "location": [lng, lat], "amount"?: [litres, slots] }, ...],
//            "end"?:  [lng, lat],
//            "capacity"?: [litres, slots],
//            "profile"?: "driving-car" }
//     -> asks ORS /optimization (VROOM) for the best VISITING ORDER, then asks
//        /v2/directions for the drawable geometry through that order, and
//        returns both. The response keeps the same { route, summary } shape as
//        mode 1, so the map renders it with no changes.
//     Used by the driver map's "Plan all stops" button.
//
//     Why two ORS calls: /optimization answers "what order", /directions
//     answers "what line to draw". Asking optimisation for geometry too
//     returns an encoded polyline in a different shape than the map already
//     reads, so we reuse the directions path rather than add a second renderer.
//
//     `amount` and `capacity` must have the SAME number of dimensions. The
//     collection model is a container swap, so the useful two are
//     [litres, container slots] — slots usually bind first, because a rigid
//     drum takes up its footprint however full it is. Both are optional: with
//     neither, this is a pure shortest-order problem.
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

// ORS/VROOM rejects very large problems and the free tier caps waypoints well
// below this; the limit is here to fail with a clear message instead of a 413.
const MAX_STOPS = 40;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type LngLat = [number, number];

function isLngLat(c: unknown): c is LngLat {
  return (
    Array.isArray(c) && c.length === 2 &&
    c.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

/** Shared by both modes: the drawable line through an ordered list of points. */
async function fetchDirections(profile: string, coordinates: LngLat[]) {
  const res = await fetch(`${ORS_BASE}/v2/directions/${profile}/geojson`, {
    method: "POST",
    headers: {
      Authorization: ORS_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json, application/geo+json",
    },
    // radiuses: let ORS snap each point to the nearest road within 2 km —
    // restaurant/manufacturer pins are typed-in addresses, not GPS fixes.
    body: JSON.stringify({ coordinates, radiuses: coordinates.map(() => 2000) }),
  });
  const body = await res.json().catch(() => null);
  return { res, body };
}

function summaryOf(orsBody: unknown) {
  // deno-lint-ignore no-explicit-any
  const s = (orsBody as any)?.features?.[0]?.properties?.summary ?? null;
  return s
    ? { distance: Number(s.distance ?? 0), duration: Number(s.duration ?? 0) }
    : { distance: 0, duration: 0 };
}

/**
 * MODE 2. Returns the optimised order plus the geometry through it.
 * Stop ids are caller-assigned integers (VROOM requires integer ids); the app
 * maps them back to pickup uuids, so nothing here needs to know about pickups.
 */
async function planMultiStop(body: Record<string, unknown>, profile: string) {
  const start = body.start;
  const end = body.end ?? null;
  const stopsIn = body.stops;
  const capacity = body.capacity ?? null;

  if (!isLngLat(start)) {
    return jsonResponse({ success: false, error: "start must be an [lng, lat] number pair" }, 400);
  }
  if (end !== null && !isLngLat(end)) {
    return jsonResponse({ success: false, error: "end must be an [lng, lat] number pair when given" }, 400);
  }
  if (!Array.isArray(stopsIn) || stopsIn.length < 1) {
    return jsonResponse({ success: false, error: "stops must be a non-empty array" }, 400);
  }
  if (stopsIn.length > MAX_STOPS) {
    return jsonResponse({ success: false, error: `too many stops (max ${MAX_STOPS})` }, 400);
  }

  const jobs: Record<string, unknown>[] = [];
  for (const [i, s] of stopsIn.entries()) {
    // deno-lint-ignore no-explicit-any
    const stop = s as any;
    if (!isLngLat(stop?.location)) {
      return jsonResponse({ success: false, error: `stops[${i}].location must be an [lng, lat] number pair` }, 400);
    }
    const id = Number(stop?.id);
    if (!Number.isInteger(id)) {
      return jsonResponse({ success: false, error: `stops[${i}].id must be an integer` }, 400);
    }
    const job: Record<string, unknown> = { id, location: stop.location };
    if (Array.isArray(stop.amount) && stop.amount.every((n: unknown) => Number.isFinite(n))) {
      job.amount = stop.amount;
    }
    jobs.push(job);
  }

  // Every job that declares an amount must match the vehicle's capacity
  // dimension, or VROOM 400s with a message that is hard to act on.
  if (Array.isArray(capacity)) {
    const bad = jobs.find(
      (j) => Array.isArray(j.amount) && (j.amount as unknown[]).length !== capacity.length,
    );
    if (bad) {
      return jsonResponse(
        { success: false, error: "every stop's `amount` must have the same number of dimensions as `capacity`" },
        400,
      );
    }
  }

  const vehicle: Record<string, unknown> = { id: 1, profile, start };
  if (end) vehicle.end = end;
  if (Array.isArray(capacity)) vehicle.capacity = capacity;

  const optRes = await fetch(`${ORS_BASE}/optimization`, {
    method: "POST",
    headers: {
      Authorization: ORS_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ jobs, vehicles: [vehicle] }),
  });
  const optBody = await optRes.json().catch(() => null);

  if (!optRes.ok) {
    console.error("optimize-route: ORS /optimization error", optRes.status, optBody);
    return jsonResponse(
      { success: false, error: "openrouteservice optimisation failed", status: optRes.status, details: optBody },
      502,
    );
  }

  // deno-lint-ignore no-explicit-any
  const steps: any[] = optBody?.routes?.[0]?.steps ?? [];
  const ordered = steps
    .filter((s) => s?.type === "job" && isLngLat(s?.location))
    .map((s) => ({ id: Number(s.id), location: s.location as LngLat, arrival: s.arrival ?? null }));

  // deno-lint-ignore no-explicit-any
  const unassigned = (optBody?.unassigned ?? []).map((u: any) => Number(u?.id));

  if (ordered.length === 0) {
    // Everything was dropped — usually capacity too small, or a point ORS
    // cannot reach. Say so rather than returning an empty map.
    return jsonResponse(
      { success: false, error: "no stops could be scheduled", unassigned, details: optBody?.summary ?? null },
      422,
    );
  }

  const line: LngLat[] = [start, ...ordered.map((o) => o.location)];
  if (end) line.push(end as LngLat);

  const { res: dirRes, body: dirBody } = await fetchDirections(profile, line);
  if (!dirRes.ok) {
    console.error("optimize-route: ORS directions error (multi)", dirRes.status, dirBody);
    return jsonResponse(
      { success: false, error: "openrouteservice request failed", status: dirRes.status, details: dirBody },
      502,
    );
  }

  return jsonResponse({
    success: true,
    optimized: true,
    profile,
    route: dirBody,
    summary: summaryOf(dirBody),
    order: ordered,
    unassigned,
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
    const profile = ALLOWED_PROFILES.has(body?.profile) ? body.profile : "driving-car";

    if (body?.mode === "multi") return await planMultiStop(body, profile);

    // ---- MODE 1: unchanged point-to-point behaviour ----
    const coordinates = body?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2 || !coordinates.every(isLngLat)) {
      return jsonResponse(
        { success: false, error: "coordinates must be an array of at least two [lng, lat] number pairs" },
        400
      );
    }

    const { res: orsResponse, body: orsBody } = await fetchDirections(profile, coordinates as LngLat[]);

    if (!orsResponse.ok) {
      console.error("optimize-route: ORS error", orsResponse.status, orsBody);
      return jsonResponse(
        { success: false, error: "openrouteservice request failed", status: orsResponse.status, details: orsBody },
        502
      );
    }

    // Response contract (matches the driver map screen's reader):
    //   { success, profile, route: <ORS GeoJSON>, summary: { distance (m), duration (s) } }
    return jsonResponse({
      success: true,
      profile,
      route: orsBody,
      summary: summaryOf(orsBody),
    });
  } catch (err) {
    console.error("optimize-route: unexpected error", err);
    return jsonResponse({ success: false, error: "Unexpected error" }, 500);
  }
});
