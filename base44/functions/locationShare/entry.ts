import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleLocationShare } from './handler.ts';

Deno.serve((req) => handleLocationShare(req, { createClientFromRequest }));
