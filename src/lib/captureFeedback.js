// Wording for the map capture dialogs. It describes what the client already does (see
// offlineQueue.js and useOfflineSync.js) and changes none of it.
export const QUEUED_HEADING = 'Saved, not sent yet';

export function queuedMessage(offline) {
  const reason = offline ? 'You are offline.' : 'We could not send this just now.';
  return `${reason} It is saved on this device and has not been submitted. The app retries while it is open.`;
}
