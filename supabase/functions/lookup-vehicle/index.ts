import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as LookupRequest;
    const reg = body.reg?.trim().toUpperCase();

    if (!reg) {
      return new Response(JSON.stringify({ error: "Registration is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stubbedVehicle: LookupResponse = {
      reg,
      postcode: body.postcode,
      vehicle: {
        make: "TBD",
        model: "TBD",
        year: "TBD",
        fuelType: "unknown",
        colour: "unknown",
      },
      source: "stub",
      dvlaReady: true,
    };

    return new Response(JSON.stringify(stubbedVehicle), {
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
