import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleClaimLead } from './handler.ts';

// claimLead — server-side write path for "claim a lead" (ClaimLeadDialog.jsx).
//
// LeadClaim.create is restricted to admin in entity RLS (base44/entities/
// LeadClaim.jsonc) -- this function is the elevated path, matching the
// pattern already used by moderate/entry.ts for Location/DigitalBust
// verification. Anonymous/pseudonymous claiming stays frictionless by
// design (operative_handle is self-typed, not tied to a real account) --
// this function validates and bounds the payload server-side rather than
// adding a login wall, per the product's existing crowdsourced-tip model.

const inFlight = new Map();

Deno.serve((req) => handleClaimLead(req, { createClientFromRequest, inFlight }));
