import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleRuntimeHealth } from './handler.ts';

Deno.serve((req) => handleRuntimeHealth(req, { createClientFromRequest }));
