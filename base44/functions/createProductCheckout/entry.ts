import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleCreateProductCheckout } from './handler.ts';

Deno.serve((req) => handleCreateProductCheckout(req, { createClientFromRequest }));
