// @ts-nocheck
// supabase/functions/ai-chat/index.ts
//
// BioLoop AI Assistant — Gemini-backed chat endpoint.
//
// The app calls this with a JSON body:
//   { question: string, context?: object, history?: Array<{role, content}> }
//
// The function forwards the question (plus a system prompt and any BioLoop
// context passed in) to Google's Gemini API and returns:
//   { answer: string }
//
// The Gemini API key is read from the Supabase secret GEMINI_API_KEY and
// never leaves the server — the app only sees the final text answer.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Supabase Edge Functions are public by default, so we need to allow the
// mobile app (and browser previews) to call this from any origin.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── GEMINI CALL ──────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-3.8-flash'; // fast + cheap + good at structured Q&A
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Build a concise system prompt that tells Gemini who it is and how to
 * behave. The manufacturer's live data is appended as a second block so
 * the AI can reference real numbers when answering.
 */
function buildSystemPrompt(context: Record<string, unknown> | null): string {
  const base = `You are BioLoop's AI assistant for biodiesel manufacturers.
You answer questions about the manufacturer's operations: inventory, oil quality, deliveries, forecasts, and finances.
Use ONLY the data provided below. Never invent numbers.
Keep answers to 1–3 short sentences unless the user explicitly asks for detail.
Be friendly, professional, and clear — the manufacturer is a business customer, not a developer.
If the data doesn't cover the question, say so politely and suggest what the app can help with.`;

  if (!context || Object.keys(context).length === 0) {
    return base + `\n\n(No live data is attached right now — answer generally.)`;
  }

  const lines: string[] = [];
  const c = context as Record<string, any>;

  if (c.currentStock != null)
    lines.push(`• Current waste oil in stock: ${c.currentStock} L`);
  if (c.stockChange != null)
    lines.push(`• Stock change from last week: ${c.stockChange}%`);
  if (c.thisWeekVolume != null)
    lines.push(`• This week's collected volume: ${c.thisWeekVolume} L`);
  if (c.tanksCount != null) lines.push(`• Tanks on record: ${c.tanksCount}`);

  if (c.gradeA != null || c.gradeB != null || c.gradeC != null) {
    lines.push(
      `• 7-day quality forecast — Grade A: ${c.gradeA ?? 0}%, Grade B: ${
        c.gradeB ?? 0
      }%, Grade C: ${c.gradeC ?? 0}%`
    );
  }

  if (c.activeDeliveries != null)
    lines.push(`• Active deliveries in progress: ${c.activeDeliveries}`);
  if (c.activeSuppliers != null)
    lines.push(`• Assigned suppliers: ${c.activeSuppliers}`);

  if (c.estBiodiesel != null)
    lines.push(`• Estimated biodiesel output: ${c.estBiodiesel} L`);
  if (c.estRevenue != null)
    lines.push(`• Estimated revenue: R${c.estRevenue}`);
  if (c.estMargin != null)
    lines.push(`• Estimated margin: R${c.estMargin}`);

  return `${base}\n\nCURRENT MANUFACTURER DATA:\n${lines.join('\n')}`;
}

/**
 * Call Gemini with the system prompt + user question + optional history.
 */
async function askGemini({
  apiKey,
  systemPrompt,
  question,
  history,
}: {
  apiKey: string;
  systemPrompt: string;
  question: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<string> {
  // Gemini uses { role: 'user' | 'model', parts: [{ text }] }
  const contents = [
    ...(history || []).slice(-6).map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];

  const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }
  return text.trim();
}

// ─── SERVER ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const question: string = (body?.question ?? '').toString().trim();
    const context = body?.context ?? null;
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!question) {
      return new Response(JSON.stringify({ error: 'Missing "question"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildSystemPrompt(context);
    const answer = await askGemini({
      apiKey,
      systemPrompt,
      question,
      history,
    });

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ai-chat] error:', err);
    return new Response(
      JSON.stringify({
        error: 'ai-chat failed',
        message: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});