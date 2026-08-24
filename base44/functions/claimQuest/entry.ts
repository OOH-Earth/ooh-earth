import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleClaimQuest } from './handler.ts';

const inFlight = new Map();

Deno.serve((req) => handleClaimQuest(req, { createClientFromRequest, inFlight }));
