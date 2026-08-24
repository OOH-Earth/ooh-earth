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

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  todayKey?: () => string;
  inFlight?: Map<string, Promise<unknown>>;
};

export async function handleCachedIntel(
  req: Request,
  {
    createClientFromRequest,
    todayKey = () => new Date().toISOString().slice(0, 10),
    inFlight = new Map(),
  }: Dependencies,
) {
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
  try {
    const body = await req.json().catch(() => ({}));
    const key = body?.key as keyof typeof REGISTRY;
    const entry = REGISTRY[key];
    if (!entry) return Response.json({ error: 'unknown intel key' }, { status: 400 });
    const period = todayKey();
    const lockKey = `${key}:${period}`;
    const existing = inFlight.get(lockKey);
    if (existing) return Response.json(await existing);
    const operation = (async () => {
      const base44 = createClientFromRequest(req);
      const hits = await base44.asServiceRole.entities.IntelCache.filter({
        cache_key: key,
        period_key: period,
      });
      if (hits?.length && hits[0].payload) return JSON.parse(hits[0].payload);
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
      return result;
    })();
    inFlight.set(lockKey, operation);
    try {
      return Response.json(await operation);
    } finally {
      inFlight.delete(lockKey);
    }
  } catch (error) {
    console.error('cachedIntel failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json({ error: 'Intel unavailable' }, { status: 502 });
  }
}
