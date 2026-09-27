import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleGetPublicProfile } from './handler.ts';

// getPublicProfile — public projection of an opt-in Founding Profile. All
// logic and the privacy contract live in handler.ts (testable without a
// live backend); see tests/getPublicProfile.test.ts.

Deno.serve((req) => handleGetPublicProfile(req, { createClientFromRequest }));
