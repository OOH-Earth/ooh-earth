import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleFieldStats } from './handler.ts';

Deno.serve((req) => handleFieldStats(req, { createClientFromRequest }));
