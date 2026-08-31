import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleSubmitOffline } from './handler.ts';
import { recordOperationalHealth } from '../_shared/operationalState.ts';

Deno.serve((req) =>
  handleSubmitOffline(req, {
    createClientFromRequest,
    recordHealth: (outcome, durationMs, errorCode) =>
      recordOperationalHealth(req, 'submitOffline', outcome, durationMs, {
        createClientFromRequest,
        error_code: errorCode,
      }),
  }),
);
