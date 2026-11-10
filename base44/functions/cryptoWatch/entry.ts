import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleCryptoWatch } from './handler.ts';

Deno.serve((req) => handleCryptoWatch(req, { createClientFromRequest }));
