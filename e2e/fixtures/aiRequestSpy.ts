import type { BrowserContext, Page, Route } from '@playwright/test';

// Offline fixture for asserting which public pages call the InvokeLLM integration.
// Every external host is stubbed explicitly (no paid or third-party service is reachable);
// any other external request is recorded as `unexpected` and aborted, so a test can fail on it.
// Same-origin /api calls are answered from this file only (no Base44 backend).

export type LlmKind =
  'mushrooms' | 'flora' | 'conflict' | 'adspend' | 'brand-extraction' | 'ticker' | 'other';

export const FIXTURE_LOCATIONS = [
  ['Coca-Cola', 'verified'],
  ['coca-cola ', 'verified'],
  ['COCA-COLA', 'pending'],
  ['Shell', 'verified'],
  ['Shell', 'verified'],
  ['BP', 'rejected'],
  [undefined, 'verified'],
  ['', 'verified'],
].map(([brand_name, status], i) => ({
  id: `fx-${i}`,
  title: `Fixture ${i}`,
  address: 'Fixture St',
  notes: 'fixture',
  type: 'billboard',
  lat: 13.74 + i * 0.01,
  lng: 100.5 + i * 0.01,
  status,
  brand_name,
  created_date: '2026-10-01T00:00:00Z',
}));

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

// Image/media hosts the Home page references; stubbed with a 1x1 PNG, never fetched.
const IMAGE_HOSTS = ['firebasestorage.googleapis.com', 'static.wixstatic.com', 'base44.app'];

export function classifyLlmPrompt(body: string | null): LlmKind {
  const prompt = String(JSON.parse(body || '{}').prompt || '').toLowerCase();
  if (prompt.includes('mushroom')) return 'mushrooms';
  if (prompt.includes('plant biodiversity')) return 'flora';
  if (prompt.includes('conflict zones')) return 'conflict';
  if (prompt.includes('outdoor-advertising') && prompt.includes('spenders')) return 'adspend';
  if (prompt.includes('corpus of documented')) return 'brand-extraction';
  if (prompt.includes('environmental alerts')) return 'ticker';
  return 'other';
}

const LLM_REPLY: Record<string, unknown> = {
  mushrooms: { spots: [{ species: 'X', habitat: 'h', region: 'r', lat: 1, lng: 1 }] },
  flora: { spots: [{ species: 'Y', ecosystem: 'e', region: 'r', lat: 2, lng: 2 }] },
  conflict: { zones: [{ title: 'Z', severity: 'warning', lat: 3, lng: 3 }] },
  adspend: { brands: [{ brand: 'B', ad_spend_musd: 1, harm: 'h' }] },
  'brand-extraction': { offenders: [{ brand: 'LLM-Brand', count: 9 }] },
  ticker: { alerts: [{ title: 'T', severity: 'watch' }] },
};

export type RequestSpy = {
  llm: LlmKind[];
  unexpectedExternal: Set<string>;
  stubbedExternal: Set<string>;
};

export async function installRequestSpy(
  target: Page | BrowserContext,
  { llmStatus = 200 }: { llmStatus?: number } = {},
): Promise<RequestSpy> {
  const spy: RequestSpy = { llm: [], unexpectedExternal: new Set(), stubbedExternal: new Set() };
  await target.route('**/*', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (isLocal) {
      if (!url.pathname.startsWith('/api/')) return route.continue();
      if (url.pathname.includes('/integration-endpoints/Core/InvokeLLM')) {
        const kind = classifyLlmPrompt(req.postData());
        spy.llm.push(kind);
        if (llmStatus !== 200)
          return route.fulfill({ status: llmStatus, json: { error: 'fixture' } });
        return route.fulfill({ json: LLM_REPLY[kind] ?? {} });
      }
      if (url.pathname.includes('/entities/Location') && req.method() === 'GET') {
        return route.fulfill({
          json: Number(url.searchParams.get('skip') || 0) > 0 ? [] : FIXTURE_LOCATIONS,
        });
      }
      return route.fulfill({ json: req.method() === 'GET' ? [] : {} });
    }
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      spy.stubbedExternal.add(url.hostname);
      return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    }
    if (url.hostname === 'air-quality-api.open-meteo.com') {
      spy.stubbedExternal.add(url.hostname);
      return route.fulfill({ json: { current: { pm2_5: 10 } } });
    }
    if (url.hostname === 'server.arcgisonline.com') {
      spy.stubbedExternal.add(url.hostname);
      return route.fulfill({ contentType: 'image/png', body: PNG_1X1 });
    }
    if (IMAGE_HOSTS.includes(url.hostname)) {
      spy.stubbedExternal.add(url.hostname);
      return route.fulfill({ contentType: 'image/png', body: PNG_1X1 });
    }
    spy.unexpectedExternal.add(url.hostname);
    return route.abort();
  });
  return spy;
}
