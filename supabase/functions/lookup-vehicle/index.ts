import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";

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

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

async function getDvlaApiKey(): Promise<{ key: string | null; ready: boolean }> {
  if (!supabase) return { key: null, ready: false };

  const { data, error } = await supabase.vault.getSecret("dvla_api_key_test");
  if (error) {
    console.error("Failed to load DVLA API key from Vault", error);
    return { key: null, ready: false };
  }

  return { key: data?.secret ?? null, ready: Boolean(data?.secret) };
}

async function lookupFromDvla(
  reg: string,
  postcode: string | undefined,
  apiKey: string,
): Promise<LookupResponse> {
  
  const response = await fetch(
    "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
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
    dvlaReady: true,
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

    const { key: dvlaApiKey, ready: dvlaReady } = await getDvlaApiKey();

    const responseBody = dvlaApiKey
      ? await lookupFromDvla(reg, body.postcode, dvlaApiKey)
      : {
        reg,
        postcode: body.postcode,
        vehicle: {
          make: "Unavailable",
          model: "Unavailable",
          year: "Unavailable",
        },
        source: "stub" as const,
        dvlaReady,
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
