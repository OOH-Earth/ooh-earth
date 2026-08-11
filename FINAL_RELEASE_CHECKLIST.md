# OOH Earth — Final Release Checklist

Practical, actionable list for whoever takes this branch to production. Items already verified in this engineering pass are checked; everything else needs a human with access this environment didn't have (a live Base44 backend, real payment credentials, DNS, design assets).

## Engineering — verified in this pass

- [x] `npm run lint` — clean
- [x] `npm run typecheck` — clean
- [x] `npm run build` — clean (see bundle notes below)
- [x] Live Playwright pass on core routes and interactions (Phases 2–4, final pass) — zero uncaught exceptions
- [x] Accessibility regression check via axe-core against the prior baseline — no regressions, one prior violation fixed
- [x] `npm audit` — 10 → 2 vulnerabilities (the remaining 2 need a breaking-change decision, see Founder Decisions)
- [x] No hardcoded secrets or debug `console.log` calls anywhere in `src/`
- [x] `KNOWN_ISSUES.md` reflects the true current state — every entry has a status, not a guess

## Founder decisions — resolve before or shortly after launch

- [ ] **Per-route SEO** — every route currently shares the Home page's title/description/OG/canonical tags. Decide: client-side head-management (cheap, helps modern crawlers) vs. prerendering/SSR (expensive, helps all crawlers) — and who writes unique copy for 30+ pages.
- [ ] **react-router-dom v7 migration** — 6.30.4 is the newest 6.x release; the remaining open-redirect advisory needs a major version bump to clear. Not urgent (no exploitable path found in this app's own code) but not indefinitely deferrable either.
- [ ] **quill/react-quill replacement** — the only available fix for its XSS advisory downgrades to a pre-1.0 release. Needs an editor swap or an accepted-risk decision.
- [ ] **Content-Security-Policy rollout** — none exists today. Needs allow-listing Stripe, Donorbox, Google Fonts, three RPC providers, CoinGecko, OSM tiles, and the Base44 WebSocket, tested one integration at a time.
- [ ] **Legacy image host migration** — `/plans` hero image and others point to `oohearth.app`'s old WordPress media host, which 404s/CORB-blocks. Needs the images moved to a host that's actually live.
- [ ] **Adopt `feature/engineering-pipeline`'s CI+Playwright work?** — a full Playwright smoke suite + axe-core a11y regression gate already exists on that unmerged branch, same fork point as this one. Worth a deliberate merge rather than rebuilding.

## Cannot be verified in this environment — needs a live backend or real assets

- [ ] **Real Base44 backend smoke test.** This entire pass ran against a local preview build with `VITE_BASE44_APP_BASE_URL` unset — every page showed the same baseline `Base44Error 404` / WebSocket-handshake console noise because there was no backend to talk to. Before launch, run the actual app against STAGE with real auth, real Location data, and a real investor-access token, and confirm the console is clean there too.
- [ ] **Real donation flow.** The Donorbox `allow="payment"` fix and the PaymentBadges rendering were verified structurally, not against a live Donorbox account. Run an actual test donation (Stripe test mode / Donorbox sandbox if available) including Apple Pay / Google Pay.
- [ ] **Crypto donation addresses.** `LOOSE_ENDS` in `sitemapData.js` already flags wallet-address ownership as unverified — confirm before advertising them publicly.
- [ ] **Chain mismatch (Base vs Polygon).** Flagged everywhere in the codebase as unresolved (`fundConfig.js`, `sitemapData.js`, `StatusMatrix.jsx`) — this is Dave's decision, referenced here so it isn't missed at launch.
- [ ] **Real PNG icon assets.** `apple-touch-icon` and `manifest.json` both need actual raster PNGs (180×180, 192×192, 512×512, one maskable) — this environment has no ImageMagick/sharp/canvas to generate them from the existing SVG mark.
- [ ] **Base44 upload limits.** Whether `Core.UploadFile` enforces server-side file-size/type limits is unknown from this repo — check the Base44 dashboard/docs directly.

## Deployment

- [ ] Confirm `VITE_BASE44_APP_BASE_URL` and any other required env vars are set in the actual hosting environment (this branch was never built with them set).
- [ ] Confirm GitHub Actions (`build-verify`) passes on the actual PR — it now runs lint + typecheck + build, not just build.
- [ ] Merge to `main` only after founder review of this branch's diff and the decisions above.
- [ ] This branch has never been pushed. Push and open the PR only when explicitly told to.

## Post-launch

- [ ] Watch the `#40+ page` bundle sizes in CI — `Globe3D` (1.26MB) and a few others are still individually large even after code-splitting; nothing urgent, but a candidate for a later performance pass if load times on `/map` become a complaint.
- [ ] Revisit `KNOWN_ISSUES.md` #14 (dialog focus-trap) as the next dedicated engineering task.
