import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleDonationStatus } from './handler.ts';

export default async function (req) {
  return handleDonationStatus(req, { createClientFromRequest });
}
