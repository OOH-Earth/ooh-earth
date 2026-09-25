import { handleCreateDonationCheckout } from './handler.ts';

Deno.serve((req) => handleCreateDonationCheckout(req));
