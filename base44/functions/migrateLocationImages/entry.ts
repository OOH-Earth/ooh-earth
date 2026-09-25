import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleMigrateLocationImages } from './handler.ts';

// One-off maintenance utility: migrates Location record image_url values
// still pointing at the legacy ooh.earth WordPress host into the app's own
// media storage. Idempotent — only touches records whose image_url still
// contains "ooh.earth", so partial runs / re-runs are safe.
export default async function (req) {
  return handleMigrateLocationImages(req, { createClientFromRequest });
}
