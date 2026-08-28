import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleOperationalHealth } from './handler.ts';

Deno.serve((req) => handleOperationalHealth(req, { createClientFromRequest }));
