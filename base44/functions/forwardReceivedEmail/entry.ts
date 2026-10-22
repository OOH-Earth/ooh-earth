import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { handleForwardReceivedEmail } from './handler.ts';

Deno.serve((req) => handleForwardReceivedEmail(req, { createClientFromRequest }));
