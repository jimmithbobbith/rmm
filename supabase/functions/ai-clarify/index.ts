import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ClarifyRequest = {
  notes?: string;
  answers?: string[];
};

type ClarifyResponse = {
  promptSummary: string;
  questions: string[];
  completed: boolean;
};

const fallbackQuestions = [
  "When did the issue first appear?",
  "Does it happen at specific speeds or temperatures?",
  "Are there any warning lights or smells accompanying it?",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ClarifyRequest;
    const notes = body.notes?.trim() ?? "";
    const answers = body.answers ?? [];

    const nextQuestions = fallbackQuestions.filter((_, idx) => !answers[idx]);
    const completed = nextQuestions.length === 0;

    const response: ClarifyResponse = {
      promptSummary: notes || "No free-text description provided yet.",
      questions: nextQuestions.length ? nextQuestions : fallbackQuestions,
      completed,
    };

    return new Response(JSON.stringify(response), {
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
