# Final Engineering Checklist

Branch: `engineering/baseline`. Every row was actually run/checked, not assumed. ✅ = verified clean/present. 🔧 = found broken, fixed this sweep (Critical/High only, per mission scope). 📋 = real finding, documented, not fixed (needs a founder/design decision or is a scoped follow-up, not a minimal fix).

| Check | Result |
|---|---|
| **lint** | ✅ 0 errors |
| **typecheck** | ✅ 0 errors |
| **build** | ✅ clean (bundle-size warning unchanged — see below) |
| **Playwright** | ✅ 4/4 pass (smoke + a11y), run against the actual `engineering/baseline` build |
| **GitHub Actions YAML** | ✅ 4 workflow/config files parse clean (`ci.yml`, `codeql.yml`, `release-please.yml`, `dependabot.yml` — these live on `feature/engineering-pipeline`, re-validated here for completeness) |
| **Prettier** | 📋 357 files flagged on this branch (no Prettier config exists here — it's a `feature/engineering-pipeline` deliverable; informational only either way, per that branch's own decision register) |
| **Bundle** | 📋 main JS chunk ~4.3 MB uncompressed / ~1.2 MB gzip, unchanged. Code-splitting is a scoped follow-up (changes load behavior across the whole app), not a minimal fix. |
| **Dependency graph** | 📋 many packages behind latest (checked via `npm outdated`) — normal for an app this size, not actioned; broad version bumps need their own tested PR |
| **npm audit** | 📋 8 findings: 3 direct (`postcss` high, `react-quill` moderate, `react-router-dom` moderate), 5 transitive. `react-router-dom` is used for all client-side routing — worth prioritizing, not upgraded here (a dependency bump is a testable change of its own, not "minimal") |
| **Accessibility** | ✅ pass — regression gate against `e2e/a11y-baseline.json`. 2 known pre-existing violations (`color-contrast` on `/`, `/about`; `aria-hidden-focus` on `/about`) unchanged, still tracked, still a design decision |
| **Console errors** | ✅ sampled and verified across 28 routes: 204 entries total, all confirmed (by reading the actual error text) to be the expected `Base44Error`/404/WebSocket noise from having no live backend in this environment — not app bugs |
| **Broken images** | ✅ 0 found (checked via network-response monitoring across all 28 routes) |
| **Broken routes** | ✅ all 28 sampled routes return 200 |
| **Missing metadata** | ✅ present — canonical URL, description, title all set |
| **OpenGraph** | ✅ present — `og:url`, `og:site_name`, `og:title`, `og:description`, `og:type`, `og:image`, `og:image:alt` |
| **Twitter cards** | ✅ present — `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt` |
| **robots.txt** | 🔧 **was broken** — no file existed; Vite's SPA fallback served the HTML shell at `/robots.txt` (200, `text/html`) instead of a real robots file. Added a minimal `public/robots.txt` (`Allow: /`). |
| **sitemap.xml** | 📋 does not exist. Not added — a real sitemap needs to enumerate dynamic routes (`/location/:id`, `/bus-stop/:id`, `/category/:slug`, `/blog/:slug`) against live data, which is a build-step/feature decision, not a static file to fabricate. |
| **favicon** | ✅ present — inline SVG data URI, verified not 404-able (can't 404, it's inline) |
| **manifest** | 🔧 **was broken** — `index.html` references `<link rel="manifest" href="/manifest.json">` but the file didn't exist; same SPA-fallback issue as robots.txt (served HTML instead of JSON). Added a minimal, accurate `public/manifest.json` (name/description/theme-color pulled from the existing meta tags already in `index.html`, icon reused from the existing inline SVG — no new assets invented). |
| **Loading states** | 📋 informational only: 16 of 44 page components have an explicit loading pattern (`isLoading`, `Loader2`, `Skeleton`, etc.). Not all pages need one (many are static content) — this is a coverage signal, not a verified defect, and wasn't investigated page-by-page. |
| **Error boundaries** | 🔧 **was completely absent** — zero error boundaries anywhere in the codebase. Any uncaught render exception in any route white-screened the whole app with no recovery path, including on donation/payment-adjacent pages. Added one minimal `ErrorBoundary` class component wrapping the router's route output in `App.jsx`. Undesigned on purpose (plain dark background, one line of text, a link home) — a safety net, not a new UI surface. **Verified live**, not just by inspection: temporarily made a real page throw during render, confirmed the fallback rendered instead of a blank screen, confirmed zero uncaught page errors leaked past it, then reverted the test change and rebuilt clean. |
| **Runtime warnings / React warnings** | ✅ 0 found across the 28-route console sweep (checked for `Warning:`, `React does not recognize`, key-prop warnings, `Cannot update a component` patterns specifically — none present) |
| **Production console.log** | ✅ 0 `console.log(...)` calls anywhere in `src/` — already clean, nothing to remove |

## What was NOT touched (explicitly out of scope for this sweep)

Everything marked 📋 above is a real, verified finding — not fixed, because it needs either a product/design decision or is a larger scoped change than "minimal, behavior-preserving." Two carried over from the prior debt-cleanup pass, still real, still unfixed: the globe's `setFog` call (verified non-functional on the installed maplibre-gl version) and `useLocations.js`'s two genuinely different marker shapes (seed vs. live data) — see `TECHNICAL_DEBT_REGISTER.md` for full detail on both.

## Final verification (re-run after all fixes above)

```
npm run lint        # 0 errors
npm run typecheck   # 0 errors
npm run build        # clean
npx playwright test  # 4/4 pass (smoke + a11y)
```
