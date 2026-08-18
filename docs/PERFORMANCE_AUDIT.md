# Performance Audit

Read-only, from `main` @ `644110f` (plus PR #102). All numbers are from an actual `npm run build` output on this machine, not estimated.

## What's already good (verified, not assumed)

- **Route-level code splitting is essentially complete.** Checked every page import in `src/App.jsx`: `Home` is the *only* statically-imported page component. All ~70 other routes (`Map`, `Report`, `ArLens`, every `/lab/*`, every portal, every admin page) are already behind `React.lazy()`. There was no "convert static imports to lazy" fix to make — it's already done.
- **Font loading is already non-blocking.** `index.html` uses the `preload` + `media="print" onload="this.media='all'"` swap pattern — first paint isn't blocked on the Google Fonts request.
- **No local image weight problem.** `public/` contains no bitmap images — all imagery is hosted externally (Base44's CDN). Nothing to compress in this repo.

## P0 — blocks/degrades usability, especially mobile

| Finding | Evidence | Why P0 |
|---|---|---|
| Eager entry bundle is 816 KB raw / 262 KB gzipped (`dist/assets/index-*.js`) | Confirmed via `grep` on `dist/index.html`'s single `<script type="module">` tag — this is the *only* JS that's mandatory before first paint on every route | 262 KB of JS to parse+execute before anything renders is a well-established mobile Core Web Vitals risk (delays LCP/TTI on mid-tier devices and non-fast connections), and it's paid on every single page load, not just heavy routes |

## P1 — meaningful performance issue

| Finding | Evidence | Notes |
|---|---|---|
| Only 7 of 26 files using `<img>` also use `loading="lazy"` | `grep -rl "<img"` vs `grep -rc 'loading="lazy"'` across `src/` | Not a blind fix — some of those 19 are almost certainly above-the-fold/LCP images where lazy-loading would *hurt* (delays the image the fix is supposed to speed up). Needs a per-page pass, not a sweep. |

## P2 / P3 — not measured this pass

Map/AR-specific loading, third-party script audit beyond Google Fonts, unnecessary-rerender profiling, and a real mobile network-waterfall trace all need either a live/staged environment or a browser profiling session — neither was attempted here to avoid guessing at numbers that need a real device/network trace to mean anything.

## Update — real bundle composition (second pass)

Added `rollup-plugin-visualizer` (dev-only, `npm run build:analyze`, zero cost to a normal build — verified: a plain `npm run build` produces no `bundle-analysis.html` and no size/behavior change). Generated a real treemap and parsed its module-level data. The 816 KB entry bundle breaks down as:

| Contributor | Uncompressed bytes | % of entry bundle |
|---|---|---|
| `framer-motion` + `motion-dom` | ~393 KB | ~22% |
| Base44 SDK transitive deps (`axios`, `socket.io-client`, `engine.io-*`, `partysocket`) | ~280 KB | ~16% |
| `react-dom` | 135 KB | ~8% |
| `tailwind-merge` | 102 KB | ~6% |
| `react-router` | 86 KB | ~5% |
| `@tanstack/query-core` | 72 KB | ~4% |
| `src/components/ooh/*` (nav, footer, global overlays — ~20 small files, none over 26 KB) | 236 KB | ~13% |
| Everything else (`lucide-react`, `@base44/sdk` itself, `@radix-ui/*`, `@floating-ui/*`, `src/lib`, `src/hooks`) | ~330 KB | ~26% |

**Why no fix was implemented despite having real data:**

- **`framer-motion`/`motion-dom` (the single largest contributor)** wraps the *entire* `<Routes>` tree in `App.jsx` (`<AnimatePresence><motion.div>...<Routes>...`) — it's load-bearing for the very first render, not deferrable without either delaying first paint anyway or restructuring the root render path (real risk of flicker/layout shift across all ~70 routes). Not isolated, not low-risk.
- **The Base44 SDK's transitive HTTP/realtime dependencies** (`axios`, `socket.io-client`) aren't imported anywhere in `src/` directly — they're pulled in inside `@base44/sdk`'s own `createClient()`, which `src/api/base44Client.js` imports statically and which most of the app depends on. Splitting these would mean patching or forking the SDK's internals — out of scope for "reuse existing infrastructure, smallest viable change."
- **The `src/components/ooh` chrome (236 KB)** is already fairly granular — no single always-mounted component is large enough on its own (largest is `NavMenu.jsx` at 26 KB, ~1.4% of the entry bundle) to justify the risk of restructuring App.jsx's global chrome for a marginal gain.

**Conclusion: no safe, isolated, low-risk P0/P1 fix exists in this repo's own code right now.** The two biggest levers (framer-motion's root wrapper, the SDK's transitive deps) are both structurally necessary as currently integrated. This is a real, evidence-backed negative result, not a skipped analysis.

## Fixes implemented this pass

**One, deliberately scoped small:** `rollup-plugin-visualizer` added as a dev-only, opt-in (`ANALYZE=true`) tool. Zero effect on the production build — this is diagnostic tooling, not a performance fix itself, and it's what produced every number in the table above. No application code was changed.

If a future pass wants to pursue the framer-motion or Base44-SDK-transitive-dependency reduction, it should be scoped as its own dedicated piece of work — each is a real architectural change (deferring the route-transition wrapper, or vendoring/patching SDK internals), not a "small, isolated" fix.
