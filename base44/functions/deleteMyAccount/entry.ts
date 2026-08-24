import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleDeleteMyAccount } from './handler.ts';

Deno.serve((req) => handleDeleteMyAccount(req, { createClientFromRequest }));
