import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleFieldStats } from './handler.ts';
import { recordFieldStatsHealth } from './operationalState.ts';

Deno.serve((req) =>
  handleFieldStats(req, {
    createClientFromRequest,
    recordHealth: (outcome, durationMs, errorCode) =>
      recordFieldStatsHealth(
        req,
        outcome,
        durationMs,
        createClientFromRequest,
        undefined,
        undefined,
        errorCode,
      ),
  }),
);
