import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

const adminToken = Deno.env.get("ADMIN_API_KEY");

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGet() {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, created_at, reg, postcode, area_label, services, status, contact, availability, notes, driveable",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ jobs: data ?? [] }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handlePatch(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
  };

  if (!body.id || !body.status)
    return new Response(
      JSON.stringify({ error: "id and status are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );

  if (!["pending", "done", "completed", "cancelled"].includes(body.status)) {
    return new Response(JSON.stringify({ error: "Invalid status" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("jobs")
    .update({ status: body.status })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ job: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!adminToken)
    return new Response(
      JSON.stringify({ error: "ADMIN_API_KEY is not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== adminToken) return unauthorized();

  if (req.method === "GET") return handleGet();
  if (req.method === "PATCH") return handlePatch(req);

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
