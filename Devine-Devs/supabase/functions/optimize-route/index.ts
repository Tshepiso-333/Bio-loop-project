// supabase/functions/optimize-route/index.ts

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Store your Google Routes API key in Supabase as GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_API_KEY =
  Deno.env.get("GOOGLE_MAPS_API_KEY");

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}

Deno.serve(async (req) => {
  // -------------------------------------------------------
  // CORS
  // -------------------------------------------------------

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "POST only" },
      405,
    );
  }

  // -------------------------------------------------------
  // Google API key
  // -------------------------------------------------------

  if (!GOOGLE_MAPS_API_KEY) {
    console.error(
      "optimize-route: GOOGLE_MAPS_API_KEY is missing",
    );

    return jsonResponse(
      {
        error:
          "GOOGLE_MAPS_API_KEY secret is not configured",
      },
      500,
    );
  }

  try {
    // -----------------------------------------------------
    // Authenticate BioLoop user
    // -----------------------------------------------------

    const authHeader =
      req.headers.get("Authorization") ?? "";

    if (!authHeader) {
      return jsonResponse(
        { error: "Missing Authorization header" },
        401,
      );
    }

    const userClient = createClient(
      SUPABASE_URL,
      ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error(
        "optimize-route: authentication failed",
        authError,
      );

      return jsonResponse(
        { error: "Not authenticated" },
        401,
      );
    }

    // -----------------------------------------------------
    // Request body
    // -----------------------------------------------------

    const body = await req
      .json()
      .catch(() => ({}));

    const coordinates =
      body?.coordinates;

    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2
    ) {
      return jsonResponse(
        {
          error:
            "At least two coordinates are required",
        },
        400,
      );
    }

    const origin = coordinates[0];

    const destination =
      coordinates[coordinates.length - 1];

    if (
      !Array.isArray(origin) ||
      !Array.isArray(destination) ||
      origin.length !== 2 ||
      destination.length !== 2
    ) {
      return jsonResponse(
        {
          error:
            "Coordinates must use [longitude, latitude]",
        },
        400,
      );
    }

    const [
      originLongitude,
      originLatitude,
    ] = origin;

    const [
      destinationLongitude,
      destinationLatitude,
    ] = destination;

    console.log(
      "Google route request:",
      {
        originLatitude,
        originLongitude,
        destinationLatitude,
        destinationLongitude,
      },
    );

    // -----------------------------------------------------
    // Google Routes API
    // -----------------------------------------------------

    const googleResponse = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "X-Goog-Api-Key":
            GOOGLE_MAPS_API_KEY,

          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline.geoJsonLinestring",
        },

        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude:
                  originLatitude,

                longitude:
                  originLongitude,
              },
            },
          },

          destination: {
            location: {
              latLng: {
                latitude:
                  destinationLatitude,

                longitude:
                  destinationLongitude,
              },
            },
          },

          travelMode: "DRIVE",

          routingPreference:
            "TRAFFIC_AWARE",

          computeAlternativeRoutes:
            false,

          polylineQuality:
            "HIGH_QUALITY",

          polylineEncoding:
            "GEO_JSON_LINESTRING",

          units: "METRIC",
        }),
      },
    );

    const googleBody =
      await googleResponse
        .json()
        .catch(() => null);

    if (!googleResponse.ok) {
      console.error(
        "Google Routes API error:",
        googleResponse.status,
        googleBody,
      );

      return jsonResponse(
        {
          error:
            "Google Routes API request failed",

          status:
            googleResponse.status,

          details:
            googleBody,
        },
        502,
      );
    }

    // -----------------------------------------------------
    // Get first route
    // -----------------------------------------------------

    const googleRoute =
      googleBody?.routes?.[0];

    if (!googleRoute) {
      return jsonResponse(
        {
          error:
            "Google returned no route",
        },
        502,
      );
    }

    const geometry =
      googleRoute?.polyline
        ?.geoJsonLinestring;

    if (
      !geometry ||
      !Array.isArray(
        geometry.coordinates,
      )
    ) {
      console.error(
        "Google route geometry missing:",
        googleBody,
      );

      return jsonResponse(
        {
          error:
            "Google returned no route geometry",
        },
        502,
      );
    }

    // -----------------------------------------------------
    // Google duration comes back like "523s".
    // Convert it to seconds for DriverMapScreen.
    // -----------------------------------------------------

    const durationString =
      googleRoute.duration ?? "0s";

    const durationSeconds =
      Number(
        String(durationString)
          .replace("s", ""),
      ) || 0;

    // -----------------------------------------------------
    // Return SAME shape DriverMapScreen already expects
    // -----------------------------------------------------

    return jsonResponse({
      success: true,

      provider: "google",

      summary: {
        distance:
          googleRoute.distanceMeters ??
          null,

        duration:
          durationSeconds,
      },

      route: {
        type: "FeatureCollection",

        features: [
          {
            type: "Feature",

            properties: {},

            geometry,
          },
        ],
      },
    });
  } catch (error) {
    console.error(
      "optimize-route unexpected error:",
      error,
    );

    return jsonResponse(
      {
        error: "Unexpected error",

        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500,
    );
  }
});