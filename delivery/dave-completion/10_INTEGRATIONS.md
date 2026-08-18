# Integrations

Real, currently-active external integrations only — no speculative entries.

| Integration | What it does | Real or mocked in this sandbox | Credentials location |
|---|---|---|---|
| Base44 SDK | Entity storage, auth, file upload, functions (`scanAd`, `verifyWallet`, `claimQuest`, `moderate`) | Real SDK, no live backend in this sandbox — `VITE_BASE44_APP_BASE_URL` intentionally unset; all e2e tests mock the REST surface | Production: Base44 project config (not in this repo) |
| Open-Meteo Air Quality API | Live PM2.5 for the AR overlay and map HUD | Real, live, no key required | None needed |
| OpenStreetMap Nominatim | Map search geocoding | Real, live, no key required (rate-limited, respected via debounce+cache in `MapSearch.jsx`) | None needed |
| Zora | NFT market data display (`/zora`), external mint destination (`zora.co/create`) | Real market data; minting itself happens entirely on Zora's site, not in this app | None — no Zora API key in this app |
| MetaMask / Phantom (browser wallet extensions) | Wallet connect + ownership signature | Real, client-side only | None — no server-side wallet keys |
| GitHub Actions / CodeQL / Dependabot | CI, security scanning, dependency updates | Real, active | Managed via GitHub org, not app secrets |

## Explicitly not integrated (confirmed via repository search, not assumed)

- **Hermes** — zero references anywhere in the repository. See `12_HERMES_STATUS.md`.
- **On-chain RPC/indexer** — no direct blockchain read/write from the app;
  all chain interaction is either client-side wallet signing or delegated to
  Zora's own site.
- **E-signature provider** (DocuSign, HelloSign, etc.) — not integrated;
  relevant only if Decision F (agency workflow) proceeds.
- **Payroll/timesheet provider** — not integrated; same.
