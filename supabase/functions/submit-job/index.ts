import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import twilio from "https://esm.sh/twilio@4.22.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ServiceItem = {
  id: string;
  name: string;
  price: number;
};

type JobPayload = {
  reg: string;
  postcode: string;
  areaLabel?: string;
  vehicle?: Record<string, unknown> | null;
  services: ServiceItem[];
  availability?: { day?: string; slot?: string } | null;
  clarifier?: Record<string, unknown> | null;
  contact: {
    name: string;
    email?: string;
    phone: string;
    addressLine: string;
    addressPostcode: string;
  };
  notes?: string;
  driveable?: boolean | null;
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const smsFrom = Deno.env.get("TWILIO_FROM_NUMBER");
const smsClient = (() => {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!accountSid || !authToken || !smsFrom) return null;
  return twilio(accountSid, authToken);
})();

function validatePayload(payload: JobPayload) {
  const errors: string[] = [];
  if (!payload.reg?.trim()) errors.push("reg is required");
  if (!payload.postcode?.trim()) errors.push("postcode is required");
  if (!payload.contact?.name?.trim()) errors.push("contact.name is required");
  if (!payload.contact?.phone?.trim()) errors.push("contact.phone is required");
  if (!payload.contact?.addressLine?.trim())
    errors.push("contact.addressLine is required");
  if (!payload.contact?.addressPostcode?.trim())
    errors.push("contact.addressPostcode is required");
  if (!Array.isArray(payload.services))
    errors.push("services must be an array");
  return errors;
}

async function sendSms(to: string, body: string) {
  if (!smsClient || !smsFrom)
    return { skipped: true, reason: "Twilio not configured" };
  const message = await smsClient.messages.create({ to, from: smsFrom, body });
  return { sid: message.sid, to: message.to };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as JobPayload;
    const errors = validatePayload(payload);
    if (errors.length) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: errors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const insertPayload = {
      reg: payload.reg.trim().toUpperCase(),
      postcode: payload.postcode.trim().toUpperCase(),
      area_label: payload.areaLabel ?? null,
      vehicle: payload.vehicle ?? null,
      services: payload.services,
      availability: payload.availability ?? null,
      clarifier: payload.clarifier ?? null,
      contact: payload.contact,
      notes: payload.notes ?? null,
      driveable: payload.driveable ?? null,
      status: "pending",
    };

    const { data, error } = await supabaseClient
      .from("jobs")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const smsResult = await sendSms(
      payload.contact.phone,
      `Thanks ${payload.contact.name}, your booking request (${insertPayload.reg}) has been received. We'll confirm shortly.`,
    );

    return new Response(JSON.stringify({ job: data, sms: smsResult }), {
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
