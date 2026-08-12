// Investor preview access — server-validated.
// The access code and signing secret live only in the investorAccess Base44
// function. The browser never sees the code and only ever holds a short-lived
// signed token it cannot forge. Verification is done server-side, so a
// hand-set sessionStorage flag no longer opens the gate.

import { base44 } from '@/api/base44Client';

const KEY = 'ooh_investor_token';
const payload = (res) => (res && typeof res === 'object' && 'data' in res ? res.data : res);

// Exchange a code for a signed token. Returns true on success.
export async function unlockInvestor(input) {
  const code = String(input || '').trim();
  if (!code) return false;
  try {
    const data = payload(await base44.functions.invoke('investorAccess', { code }));
    if (data?.ok && data?.token) {
      try {
        sessionStorage.setItem(KEY, data.token);
      } catch {
        /* storage blocked */
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getInvestorToken() {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}
export function hasInvestorToken() {
  return !!getInvestorToken();
}
export function clearInvestorSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

// Server-verify the stored token — the real gate. Returns true only if the
// server confirms the signature and expiry; clears a bad/expired token.
export async function verifyInvestorSession() {
  const token = getInvestorToken();
  if (!token) return false;
  try {
    const data = payload(
      await base44.functions.invoke('investorAccess', { action: 'verify', token }),
    );
    if (data?.ok) return true;
    clearInvestorSession();
    return false;
  } catch {
    return false;
  }
}
