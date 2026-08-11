// @ts-nocheck -- intentionally excluded from typecheck (jsconfig.json), see TECHNICAL_DEBT_REGISTER.md
import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Page through the Location entity so counts and maps reflect the true total
// instead of a silent single-request cap. A flat list(sort, 500) undercounts
// once the dataset grows past a page (the fieldStats function paginates for
// the same reason). Attached to the client so existing `base44` importers can
// call it without adding an import.
base44.listAllLocations = async (sort = '-created_date', pageSize = 500, hardCap = 5000) => {
  const out = [];
  let skip = 0;
  while (out.length < hardCap) {
    const page = await base44.entities.Location.list(sort, pageSize, skip);
    if (!page || page.length === 0) break;
    out.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return out;
};
