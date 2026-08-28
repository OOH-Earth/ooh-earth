import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleFunnelMetrics } from './handler.ts';

Deno.serve((req) => handleFunnelMetrics(req, { createClientFromRequest }));
