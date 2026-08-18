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
| No bundle-visualizer tooling in the repo | `package.json` has no `rollup-plugin-visualizer` or equivalent | Can't safely attribute what's inside the 816 KB entry chunk (React/router/framer-motion/react-query/Base44 SDK/lucide icons used in always-mounted chrome vs. `Home.jsx` itself) without guessing — guessing at `manualChunks` config without real data risks breaking the build for no measured gain |

## P2 / P3 — not measured this pass

Map/AR-specific loading, third-party script audit beyond Google Fonts, unnecessary-rerender profiling, and a real mobile network-waterfall trace all need either a live/staged environment or a browser profiling session — neither was attempted here to avoid guessing at numbers that need a real device/network trace to mean anything.

## Fixes implemented this pass

**None.** No P0/P1 finding above met the bar of "small, isolated, measurable, low-risk, directly supported by evidence" for an actual code change:

- Route-level splitting was already complete — nothing to convert.
- The 816 KB entry bundle is a real, evidenced P0, but fixing it responsibly requires knowing what's inside it first. Guessing at a `manualChunks` split without that data is exactly the "optimise blindly" this audit was told not to do.
- The `loading="lazy"` gap is real but needs per-image judgment (LCP images should stay eager), not a mechanical sweep.

## Recommended next engineering action (small, safe, unlocks real fixes)

Add `rollup-plugin-visualizer` as a **dev-only** dependency (zero runtime/production impact) and generate one bundle-composition report. That report turns the P0 above from "816 KB, cause unknown" into a specific, evidence-backed list of what to actually move into a lazy boundary or a manual vendor chunk — at which point a real, safe, measurable fix becomes possible in one focused follow-up PR.
