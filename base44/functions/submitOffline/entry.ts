import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleSubmitOffline } from './handler.ts';

Deno.serve((req) => handleSubmitOffline(req, { createClientFromRequest }));
