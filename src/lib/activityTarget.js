// Where a live-activity event should take the viewer: the real place it
// happened, never a person. Returns null when the event has no public place
// to point at, so the UI renders it as non-interactive instead of guessing.
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function activityTargetPath(entityName, event) {
  if (!event || event.type !== 'create') return null;
  let id = null;
  if (entityName === 'Location') id = event.id;
  else if (entityName === 'LeadClaim') id = event.data?.location_id;
  if (typeof id !== 'string' || !SAFE_ID.test(id)) return null;
  return `/location/${id}`;
}
