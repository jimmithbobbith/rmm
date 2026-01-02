import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type LookupRequest = {
  reg?: string;
  postcode?: string;
};

type LookupResponse = {
  reg: string;
  postcode?: string;
  vehicle?: {
    make: string;
    model: string;
    year: string;
    fuelType?: string;
    colour?: string;
  };
  source: "dvla" | "stub";
  dvlaReady: boolean;
};

const dvlaMode = (Deno.env.get("DVLA_MODE") ?? "stub").toLowerCase();
const dvlaApiKey = Deno.env.get("dvla_api_key_test");

async function lookupFromDvla(reg: string, postcode?: string): Promise<LookupResponse> {
  if (!dvlaApiKey) {
    throw new Error("DVLA test API key is not configured");
  }

  const response = await fetch(
    "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": dvlaApiKey,
      },
      body: JSON.stringify({ registrationNumber: reg }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`DVLA lookup failed (${response.status}): ${details}`);
  }

  const vehicle = await response.json();

  return {
    reg,
    postcode,
    vehicle: {
      make: vehicle.make ?? "Unknown",
      model: vehicle.model ?? vehicle.typeApprovalCategory ?? "Unknown",
      year: vehicle.yearOfManufacture?.toString() ?? "Unknown",
      fuelType: vehicle.fuelType ?? vehicle.engineFuelType,
      colour: vehicle.colour,
    },
    source: "dvla",
    dvlaReady: Boolean(dvlaApiKey),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as LookupRequest;
    const reg = body.reg?.trim().toUpperCase();

    if (!reg) {
      return new Response(
        JSON.stringify({ error: "Registration is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const useDvla = dvlaMode === "test";

    const responseBody = useDvla
      ? await lookupFromDvla(reg, body.postcode)
      : {
        reg,
        postcode: body.postcode,
        vehicle: {
          make: "TBD",
          model: "TBD",
          year: "TBD",
          fuelType: "unknown",
          colour: "unknown",
        },
        source: "stub" as const,
        dvlaReady: true,
      } satisfies LookupResponse;

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
