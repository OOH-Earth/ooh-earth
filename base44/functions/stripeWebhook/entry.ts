import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleStripeWebhook } from './handler.ts';
import { recordOperationalHealth } from '../_shared/operationalState.ts';

const inFlight = new Map();

Deno.serve((req) =>
  handleStripeWebhook(req, {
    createClientFromRequest,
    inFlight,
    recordHealth: (outcome, durationMs, errorCode) =>
      recordOperationalHealth(req, 'stripeWebhook', outcome, durationMs, {
        createClientFromRequest,
        error_code: errorCode,
      }),
  }),
);
