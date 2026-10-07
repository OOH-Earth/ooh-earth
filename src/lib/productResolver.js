import { base44 } from '@/api/base44Client';
import { normalizeProductResult } from '@/lib/productEvidence';

const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map();

export function clearProductEvidenceCache() {
  cache.clear();
}

export async function resolveProductEvidence(identifier) {
  const code = identifier?.canonical;
  if (!identifier?.valid || !code) {
    return { status: 'unavailable', product: null, reason: 'invalid_identifier' };
  }
  const cached = cache.get(code);
  if (cached && Date.now() - cached.retrievedAt < CACHE_TTL_MS) return cached.value;
  try {
    const response = await base44.functions.invoke('productLookup', { code });
    const value = normalizeProductResult(response?.data ?? response);
    cache.set(code, { retrievedAt: Date.now(), value });
    return value;
  } catch {
    const value = { status: 'unavailable', product: null, reason: 'provider_unavailable' };
    cache.set(code, { retrievedAt: Date.now(), value });
    return value;
  }
}
