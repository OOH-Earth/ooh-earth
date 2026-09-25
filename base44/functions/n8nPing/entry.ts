import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleN8nPing } from './handler.ts';

// n8nPing — Base44 → n8n bridge test.
// Proves the Base44 -> n8n webhook end-to-end: hitting this endpoint POSTs a
// test payload to the n8n Webhook node URL stored in Base44 Secrets as
// N8N_WEBHOOK_URL, then returns a sanitized status summary so we can confirm
// the round trip without reflecting downstream content.
//
// Once the bridge is proven, real functions (donation events, record changes,
// etc.) can reuse this same forwarding pattern instead of calling n8n inline.

Deno.serve(async (req) => {
  return handleN8nPing(req, { createClientFromRequest });
});
