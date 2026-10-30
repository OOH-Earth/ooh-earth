// Merge an AI detection into the report form without overwriting what the person typed while
// the scan was running. `snapshot` is the form at scan start, `current` the form at completion:
// a field that differs between the two was edited during the scan and is left alone.
export const IDENTIFY_FIELDS = ['brand_name', 'campaign_name', 'industry_sector', 'parent_corp'];

export function mergeDetection({ snapshot, current, detected }) {
  const patch = { ai_scanned: true };
  for (const field of IDENTIFY_FIELDS) {
    if ((current?.[field] ?? '') !== (snapshot?.[field] ?? '')) continue;
    const value = detected?.[field];
    if (typeof value !== 'string' || !value) continue;
    if (field === 'brand_name' && value === 'Unknown') continue;
    patch[field] = value;
  }
  return patch;
}
