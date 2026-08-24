import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleCreatePlanCheckout } from './handler.ts';

Deno.serve((req) => handleCreatePlanCheckout(req, { createClientFromRequest }));
