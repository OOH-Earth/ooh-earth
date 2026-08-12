# OOH Earth — Final Engineering Summary

**Branch:** `fix/phase1-runtime` (based on `engineering/baseline`) · **Commits:** 20 · **Status:** Ready for founder review, not pushed, not merged.

This is a factual record of what changed and why. For the live, running list of tracked issues and their status, see `KNOWN_ISSUES.md` — this file is a snapshot at handoff, that one keeps going.

## What this branch is

A release-stabilisation pass across nine areas — runtime stability, navigation, forms, mapping, SEO, accessibility, performance, security, and release readiness — followed by a final completion sprint that closed out what could be safely finished without a founder decision. Every fix below was reproduced, root-caused, applied as the smallest safe change, and validated (typecheck + lint + build on every commit; a live Playwright pass wherever the fix was runtime-observable) before being committed on its own.

## Fixes shipped (13 defects, 20 commits)

| Area | Defect | Root cause | Commit |
|---|---|---|---|
| Runtime | `.matrix` theme text sizing never applied | Unescaped `[8px]` brackets parsed as an invalid CSS attribute selector instead of matching Tailwind's compiled class | `9658bd3` |
| Navigation | Header "Command" CTA and footer link were dead no-ops on 35 of 40 routes | `onCommand` prop had no default handler and no `<CommandCenter>` mounted unless a page wired it manually — only 5 pages did | `d034f81` |
| Donation | Donorbox iframe blocked from the Payment Request API | `allowpaymentrequest` is an obsolete HTML4-era attribute; browsers require the `allow="payment"` Permissions-Policy syntax | `79a56f5` |
| Mapping | Globe's atmosphere/fog effect was dead in production | `map.setFog()` doesn't exist on the installed maplibre-gl 5.24.0 (only `setSky()` does) — threw at runtime, silently swallowed by a try/catch | `da1c6f0` |
| SEO | No `sitemap.xml`; `robots.txt` didn't reference one | Never created | `0ed9c68` |
| SEO | No structured data anywhere in the document | Never added | `479a05f` |
| Accessibility | Keyboard focus could enter the closed Command Center drawer | `aria-hidden={!open}` told assistive tech to ignore it, but the drawer stayed in the DOM (`pointer-events-none` only blocks mouse, not Tab) with 17 live links still reachable | `1b2c9e6` |
| Performance | Entire app shipped as one 4.37MB (1.21MB gzip) JS chunk | All 51 route pages were statically imported in `App.jsx` — no code splitting | `09f1d1a` |
| Security | 10 npm audit vulnerabilities (5 moderate, 5 high) | Outdated nanoid, postcss, dompurify, socket.io-parser transitive versions | `6a6e8cc` |
| Security | Two embedded OSM map iframes had no sandbox/referrer policy | Never added | `2dd31f8` |
| Release Readiness | CI only ran `build` — lint/typecheck regressions could merge silently | `lint`/`typecheck` steps were never added to `.github/workflows/build.yml` | `3f99ed3` |
| Data integrity | Home page's "Live feed" fabricated activity via `Math.random()` every 5.5s | A synthetic-event `setInterval` ran unconditionally alongside an already-correct real subscription effect (`Location`/`DigitalBust`/`LeadClaim`/`FundingLead`); the fake ticker dominated since real creates are comparatively rare | `e61b023` |
| Testing | `/support` never reached `networkidle` in a headless crawl | Root-caused, not a defect: `r.stripe.com/b` is Stripe.js's own fraud-detection beacon, deliberately held open on any page loading Stripe.js — the wrong wait condition, not a site bug | — (documented in `KNOWN_ISSUES.md`) |

## What was found but deliberately not touched

- **Founder decisions** (6 items — product/architecture calls, not code fixes): per-route SEO strategy, react-router-dom v7 migration, rich-text editor replacement, CSP rollout, legacy image host migration, adopting `feature/engineering-pipeline`'s existing Playwright+CI work.
- **Recommended next engineering milestone** (1 item, pure engineering, no founder input needed): proper `role="dialog"` + focus-trap + return-focus-on-close across `CommandCenter`, `NavMenu`, and `QuickCapture`. Assessed twice (Phase 6 and this final pass) and judged too large/risky to rush into a scope-locked stabilization commit — adding dialog semantics without a matching focus trap is a known WAI-ARIA anti-pattern that can read as *more* broken to screen readers than the current state.
- **Planned features, confirmed not built** (2 items, not regressions): "Graph rendering" and "Edit & Tag panel" on the Map priority list — no implementation exists anywhere in the codebase; confirmed with the founder rather than guessed at.
- **Environment limitations** (2 items — need tooling or access this environment doesn't have): real PNG icon assets for `apple-touch-icon`/`manifest.json` (no ImageMagick/sharp/canvas available); whether Base44's `Core.UploadFile` enforces server-side upload limits (needs the Base44 dashboard, not this repo).

## Validation posture

Every commit on this branch was validated with `npm run typecheck`, `npm run lint`, and `npm run build` before being made. Runtime-observable fixes (Command Center, code-splitting, iframe sandboxing, LiveActivityFeed, the accessibility fix) were additionally verified live against a production preview build with a headless browser — either a full Playwright interaction pass or, for the accessibility fix specifically, a real axe-core scan against the pre-existing baseline in `feature/engineering-pipeline`'s `e2e/a11y-baseline.json`.

No test tooling was added to this repo's dependencies — Playwright and axe-core were installed with `--no-save` for each verification run and removed afterward, so `package.json`/`package-lock.json` carry only the intentional dependency-security fix, not test infrastructure.
