import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleFieldStats } from './handler.ts';
import { recordOperationalHealth } from '../_shared/operationalState.ts';

Deno.serve((req) =>
  handleFieldStats(req, {
    createClientFromRequest,
    recordHealth: (outcome, durationMs, errorCode) =>
      recordOperationalHealth(req, 'fieldStats', outcome, durationMs, {
        createClientFromRequest,
        error_code: errorCode,
      }),
  }),
);
