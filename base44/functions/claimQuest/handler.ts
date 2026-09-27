import { isCompletionInPeriod, isInPeriod, periodKey } from './period.ts';

const QUESTS = {
  daily_report: { type: 'daily', metric: 'dailyReports', target: 1, reward_xp: 50 },
  daily_photo: { type: 'daily', metric: 'dailyPhotos', target: 1, reward_xp: 50 },
  weekly_reports: { type: 'weekly', metric: 'weeklyReports', target: 5, reward_xp: 200 },
  weekly_busts: { type: 'weekly', metric: 'weeklyBusts', target: 3, reward_xp: 150 },
  weekly_mint: { type: 'weekly', metric: 'weeklyMints', target: 1, reward_xp: 300 },
};

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  now?: () => Date;
  inFlight?: Map<string, Promise<unknown>>;
};

// Periods are defined once in period.ts (UTC day / ISO week from Monday
// 00:00 UTC), independent of the runtime's timezone.
function recordsInPeriod(records: any[], type: string, now: Date) {
  return (records || []).filter((record) => isInPeriod(record?.created_date, type, now));
}

async function calculateProgress(
  base44: any,
  userId: string,
  quest: (typeof QUESTS)[keyof typeof QUESTS],
  now: Date,
) {
  const entities = base44.asServiceRole.entities;
  if (
    quest.metric === 'dailyReports' ||
    quest.metric === 'dailyPhotos' ||
    quest.metric === 'weeklyReports'
  ) {
    const locations = await entities.Location.filter(
      { created_by_id: userId },
      '-created_date',
      1000,
    );
    const current = recordsInPeriod(locations, quest.type, now);
    return quest.metric === 'dailyPhotos'
      ? current.filter((record) => typeof record.image_url === 'string' && record.image_url).length
      : current.length;
  }
  if (quest.metric === 'weeklyBusts') {
    const busts = await entities.DigitalBust.filter(
      { created_by_id: userId },
      '-created_date',
      1000,
    );
    return recordsInPeriod(busts, quest.type, now).length;
  }
  const mints = await entities.Mint.filter({ created_by_id: userId }, '-created_date', 1000);
  return recordsInPeriod(mints, quest.type, now).length;
}

export async function handleClaimQuest(
  req: Request,
  { createClientFromRequest, now = () => new Date(), inFlight = new Map() }: Dependencies,
) {
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const questId = body?.quest_id ?? body?.questId;
  if (typeof questId !== 'string' || questId.length > 80)
    return Response.json({ error: 'Invalid quest_id' }, { status: 400 });
  const quest = QUESTS[questId as keyof typeof QUESTS];
  if (!quest) return Response.json({ error: 'Unknown quest.' }, { status: 400 });
  const base44 = createClientFromRequest(req);
  let caller = null;
  try {
    caller = await base44.auth.me();
  } catch {
    caller = null;
  }
  if (!caller?.id) return Response.json({ error: 'Authentication required.' }, { status: 401 });
  const current = now();
  const period = periodKey(quest.type, current);
  const lockKey = `${caller.id}:${questId}:${period}`;
  const existingOperation = inFlight.get(lockKey);
  if (existingOperation) return Response.json(await existingOperation);
  const operation = (async () => {
    const completionEntity = base44.asServiceRole.entities.QuestCompletion;
    // The caller's latest claim of this quest decides replay: it counts for
    // the current period by its created_date, so claims keyed under the old
    // week formula can't be re-claimed (or wrongly block a later week).
    const latest = await completionEntity.filter(
      { quest_id: questId, created_by_id: caller.id },
      '-created_date',
      1,
    );
    if (isCompletionInPeriod(latest?.[0], questId, quest.type, current))
      return { status: 200, body: { ok: true, already: true, period_key: period } };
    const progress = await calculateProgress(base44, caller.id, quest, current);
    if (progress < quest.target)
      return { status: 403, body: { error: 'Quest requirements are not complete.' } };
    await completionEntity.create({
      quest_id: questId,
      period_key: period,
      xp_awarded: quest.reward_xp,
      created_by_id: caller.id,
    });
    return { status: 200, body: { ok: true, xp_awarded: quest.reward_xp, period_key: period } };
  })();
  inFlight.set(lockKey, operation);
  try {
    const result = await operation;
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    console.error('claimQuest failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json({ error: 'Quest claim unavailable' }, { status: 500 });
  } finally {
    inFlight.delete(lockKey);
  }
}
