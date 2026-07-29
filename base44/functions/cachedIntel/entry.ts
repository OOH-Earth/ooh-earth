import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Daily-cached LLM intel. Prompts live server-side (never client-supplied)
// so this endpoint can't be abused to spend credits on arbitrary prompts.
// Each registry key is resolved via InvokeLLM at most once per period_key,
// then served from IntelCache for every other visitor that day. This turns
// N-visitors-per-day LLM calls into 1.
const REGISTRY = {
  skyIntel: {
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    prompt: (dateKey: string) =>
      `List notable naked-eye astronomical events occurring in the next 7 days starting ${dateKey}. Include Moon conjunctions with bright stars or planets (e.g. Moon–Antares), meteor showers, planet oppositions/conjunctions, eclipses, supermoons, and notable ISS/Starlink passes. Focus on events a casual observer can see. For each: date (YYYY-MM-DD), title (short, e.g. "Moon × Antares conjunction"), body (one sentence on what + visibility), type (one of: conjunction, meteor shower, opposition, eclipse, full moon, new moon, super moon, satellite pass, planet). Order by date. Max 8 events.`,
    response_json_schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              title: { type: 'string' },
              body: { type: 'string' },
              type: { type: 'string' },
            },
            required: ['date', 'title', 'body', 'type'],
          },
        },
      },
      required: ['events'],
    },
  },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const key = body?.key;
    const entry = REGISTRY[key as keyof typeof REGISTRY];
    if (!entry) {
      return Response.json({ error: 'unknown intel key' }, { status: 400 });
    }

    const period = todayKey();

    // 1. Serve from cache if this period is already resolved.
    const hits = await base44.asServiceRole.entities.IntelCache.filter({
      cache_key: key,
      period_key: period,
    });
    if (hits && hits.length && hits[0].payload) {
      return Response.json(JSON.parse(hits[0].payload));
    }

    // 2. Cache miss — resolve once via the LLM, store, and return.
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: entry.prompt(period),
      add_context_from_internet: entry.add_context_from_internet,
      model: entry.model,
      response_json_schema: entry.response_json_schema,
    });

    await base44.asServiceRole.entities.IntelCache.create({
      cache_key: key,
      period_key: period,
      payload: JSON.stringify(result),
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
