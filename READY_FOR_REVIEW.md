# Ready for Review

Branch: `engineering/baseline`. Not pushed, not merged, no PR opened — awaiting your go-ahead.

## Status: green

```
npm run lint        ✅ 0 errors  (was 7)
npm run typecheck   ✅ 0 errors  (was 1,153)
npm run build        ✅ clean
Playwright            ✅ 4/4 pass (smoke + accessibility)
```

## What this branch does

Fixes pre-existing engineering debt only — no features, no redesign, no refactors beyond what was needed to make each check pass. Full reasoning for every individual fix: `TECHNICAL_DEBT_REGISTER.md`. Full sweep results: `FINAL_ENGINEERING_CHECKLIST.md`.

## Three things worth reading before you merge

1. **The globe's atmosphere effect is silently broken in production.** `map.setFog(...)` doesn't exist on the installed maplibre-gl version — verified against the package's own type declarations, not guessed. It throws and is swallowed by an existing `try/catch`, so nothing crashes, the fog just never renders. Left alone (restoring it is a design call — port to `setSky()` and confirm the visual result).

2. **The app had zero error boundaries anywhere.** Any uncaught render exception on any route — including near the donation flow — white-screened the whole app with no recovery. Added one minimal, undesigned boundary around the router output. Verified live: forced a real crash, confirmed the fallback appeared instead of a blank screen, reverted the test.

3. **`robots.txt` and `manifest.json` didn't exist as files.** `index.html` already references `/manifest.json`; both were silently served the SPA's HTML shell instead (200 status, wrong content-type) via Vite's fallback routing. Added minimal, accurate versions — nothing invented, all content pulled from what's already in `index.html`. `sitemap.xml` is still missing but wasn't added — a real one needs dynamic route data, that's a feature decision.

## Also surfaced, not fixed (flagged, needs your call)

- `npm audit`: 2 moderate CVEs in `react-router-dom` itself (open redirect, SSR constructor injection) — a direct dependency used for all routing.
- `useLocations.js` returns markers with two genuinely different shapes depending on live vs. seed data — pre-existing, not unified.
- Bundle size (~4.3 MB main chunk) — needs code-splitting, its own PR.

## Companion branch

`feature/engineering-pipeline` (also not pushed) has the actual CI/CD tooling — GitHub Actions, Dependabot, CodeQL, Playwright/Prettier setup, release automation. This branch should merge first or alongside it, otherwise that pipeline's lint/typecheck gates go red on the very first PR through no fault of its own.
