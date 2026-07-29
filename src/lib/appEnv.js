import { appParams } from '@/lib/app-params';

// Environment identity, derived from the build's own app id.
//   stage = OOH Earth BACKUP / sandbox (internal review)
//   live  = OOH Earth production
// Prefer the build-baked id over appParams (which a ?app_id= URL param can override),
// so environment truth can't be spoofed from the address bar.
const STAGE_APP_ID = '6a6748e009b947cb29591871';
const LIVE_APP_ID = '6a62213cff3ccbca88c04ff5';

const buildId = import.meta.env.VITE_BASE44_APP_ID || appParams.appId || '';

export const APP_ID = buildId;
export const IS_STAGE = buildId === STAGE_APP_ID;
export const IS_LIVE = buildId === LIVE_APP_ID;
// Unknown ids default to the LIVE posture: never reveal the stage banner or
// internal-only tiers on an unrecognised host.
export const APP_ENV = IS_STAGE ? 'stage' : 'live';
