// At-most-one creation per submission ticket.
//
// Base44 has no unique constraints or transactions. The one documented conditional write is
// updateMany() whose query names a single record `id` as a plain value together with the
// conditions that must still hold: the conditions are re-checked at the moment of the write,
// so only one concurrent caller sees `updated === 1`
// (docs.base44.com/developers/backend/resources/entities/entity-schemas, "Claiming a record
// safely"). Every transition below uses exactly that shape. Never widen a query to $in/$or:
// the platform then reads first and updates later.
//
// A ticket is created ("reserve") before the first send, so there is always an existing row to
// claim. Losing callers never create anything.

export const LEASE_MS = 6 * 60 * 1000; // longer than the platform's 5 minute function limit

type Deps = {
  tickets: any; // service-role SubmissionTicket
  lookup: any; // service-role target entity, for reconciliation
  create: (payload: Record<string, unknown>) => Promise<any>; // caller-scoped create
  now: () => number;
  token?: () => string;
};

export type Outcome =
  | { kind: 'created'; record: any }
  | { kind: 'duplicate'; recordId: string }
  | { kind: 'pending'; retryAfterMs: number }
  | { kind: 'rejected'; status: 403 | 404 | 409 | 422; code: string }
  | { kind: 'unknown' };

export async function sha256Hex(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export const payloadHash = (payload: Record<string, unknown>) => sha256Hex(stable(payload));

export function statusOf(error: unknown): number {
  const e = error as any;
  return Number(e?.status ?? e?.response?.status ?? 0);
}

async function swap(tickets: any, query: Record<string, unknown>, set: Record<string, unknown>) {
  const result = await tickets.updateMany(query, { $set: set });
  return result?.updated === 1;
}

export async function submitWithTicket(
  deps: Deps,
  input: {
    ticketId: string;
    operationId: string;
    entityType: string;
    ownerId: string;
    payload: Record<string, unknown>;
  },
): Promise<Outcome> {
  const { tickets, lookup, create, now } = deps;
  const token = deps.token ?? (() => crypto.randomUUID());
  const read = async () => (await tickets.filter({ id: input.ticketId }, '-created_date', 1))?.[0];

  const ticket = await read();
  // One answer for "no such ticket" and "not your ticket": nothing to enumerate.
  if (
    !ticket ||
    ticket.entity_type !== input.entityType ||
    ticket.operation_hash !== (await sha256Hex(input.operationId))
  )
    return { kind: 'rejected', status: 404, code: 'UNKNOWN_TICKET' };
  if (ticket.owner_id !== input.ownerId)
    return { kind: 'rejected', status: 409, code: 'IDENTITY_MISMATCH' };

  const hash = await payloadHash(input.payload);
  const mine = token();
  let current = ticket;
  let won = false;
  if (current.state === 'open') {
    won = await swap(
      tickets,
      { id: current.id, state: 'open' },
      { state: 'claimed', claim_token: mine, claimed_at: now(), payload_hash: hash },
    );
    if (!won) current = await read();
  }

  if (!won) {
    if (current.payload_hash && current.payload_hash !== hash)
      return { kind: 'rejected', status: 409, code: 'PAYLOAD_MISMATCH' };
    if (current.state === 'completed') return { kind: 'duplicate', recordId: current.record_id };
    if (current.state !== 'claimed') return { kind: 'pending', retryAfterMs: 5000 };
    const age = now() - Number(current.claimed_at || 0);
    if (age < LEASE_MS) return { kind: 'pending', retryAfterMs: LEASE_MS - age };

    // The claiming attempt can no longer be running. Did it write before it stopped?
    const found = (
      await lookup.filter({ client_operation_id: input.operationId }, '-created_date', 1)
    )?.[0];
    if (found) {
      await swap(
        tickets,
        { id: current.id, claim_token: current.claim_token },
        { state: 'completed', record_id: found.id },
      );
      return { kind: 'duplicate', recordId: found.id };
    }
    // Take the claim over; again only one caller can.
    won = await swap(
      tickets,
      { id: current.id, claim_token: current.claim_token },
      { claim_token: mine, claimed_at: now() },
    );
    if (!won) return { kind: 'pending', retryAfterMs: 5000 };
  }

  let record: any;
  try {
    record = await create(input.payload);
  } catch (error) {
    const status = statusOf(error);
    if (status === 400 || status === 422 || status === 403) {
      // Definitely not written: free the ticket.
      await swap(
        tickets,
        { id: input.ticketId, claim_token: mine },
        { state: 'open', claim_token: '', payload_hash: '' },
      );
      return status === 403
        ? { kind: 'rejected', status: 403, code: 'FORBIDDEN' }
        : { kind: 'rejected', status: 422, code: 'VALIDATION' };
    }
    // It may or may not have been written. Keep the claim; a later attempt reconciles.
    return { kind: 'unknown' };
  }
  try {
    await swap(
      tickets,
      { id: input.ticketId, claim_token: mine },
      { state: 'completed', record_id: record.id },
    );
  } catch {
    // The record exists; reconciliation will complete the ticket on a later attempt.
  }
  return { kind: 'created', record };
}
