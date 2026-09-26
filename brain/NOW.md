# NOW — current truth only

Last verified: 2026-09-26 (fresh `git fetch` + live production/GitHub
reads, this pass — "loop #4", React 19 migration, now CLOSED). Re-verify
anything here that's more than a few days old before acting on it.

## CURRENT_ORIGIN_MAIN
`7700ed6` — "chore(deps): migrate to React 19 (couples react-leaflet 5)
(#281)" — fresh `git fetch origin main`, 2026-09-26.

## PRODUCTION_FRONTEND
`oohearth.app` → app id `6a62213cff3ccbca88c04ff5` → entry
`index-BaZoBc9l.js`. **Now running React 19.3.0 + react-leaflet 5.0.0.**
Deployed source confirmed matching merged `main` exactly (built from the
same pre-merge tree, squash-merged unchanged — no redeploy needed).
Live-verified on real data (786 locations): Home globe, Map Globe, Map
Flat (react-leaflet 5 — clusters, individual markers with thumbnails,
hover-emphasis ring), mobile 390×844, all correct. Network clean except
a pre-existing, unrelated `rrweb` session-recording beacon issue (vanilla
JS, no React coupling — see QUEUE.md's REACT-19 entry for detail).

## BACKUP_FRONTEND
`ooh-earth-backup.base44.app` → app id `6a6748e009b947cb29591871` → also
running the React 19 + react-leaflet 5 migration (deployed during this
same pass, before production). Matches production's dependency versions
now that both are on merged `main`.

## OPEN_P0
None.

## CURRENT_SECURITY_GAPS
None open. Unchanged this pass — no schema/function/security work was in
scope (explicitly excluded by this loop's mission). `npm audit`: 0
vulnerabilities before and after the React 19 migration, confirmed via
a full dependency-graph diff (not just trusting `npm install`'s output).

## REACT-19 MIGRATION — CLOSED
- PR #281 merged (`7700ed6`). Combined react 18→19.3.0, react-dom same,
  react-leaflet 4.2.1→5.0.0 (proven atomically coupled at the npm
  dependency-resolution level — react-leaflet v4 hard-blocks React 19
  install, confirmed via a real failing `npm install`; no intermediate
  version exists), plus two small forced companion bumps
  (`@hello-pangea/dnd`, `cmdk`, both peer-dep blockers, both effectively
  unused in this app).
- Full discovery, lockfile-safety diffing, static+unit+Playwright
  qualification, BACKUP live QA, and **production live QA on real data**
  all done and clean. No application source code was changed — discovery
  found none was needed (react-leaflet v5's only breaking change,
  removal of `LeafletProvider`, was never used in this codebase).
- Old PRs #88 (react), #39 (react-dom), #20 (react-leaflet) closed as
  superseded, each with an explanatory comment.
- react-leaflet's "Phase C" (the original mission's assumed separate
  follow-up phase) is now moot — it was necessarily included in this
  same migration; there's nothing left to migrate independently.

## CURRENT_RELEASE_BLOCKERS
None active.

## CURRENT_PRODUCT_DECISIONS (awaiting Dave, not re-litigated)
- AdObservation, Founding Profile directory, `fix/production-app-binding`:
  unchanged, see `docs/ops/ooh-earth/`.
- **UX-004** (Carto tile watermark): decision package complete, awaiting
  Dave's free API key — untouched this pass, per explicit instruction.
- Next dependency item (pick ONE, don't start more than one at a time):
  framer-motion 12→13, react-resizable-panels 2→4, or TypeScript 7
  investigation. See `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md`'s matrix
  for the evidence behind each. None of these block anything currently.

## NEXT_TASK
No mechanical work queued. The next dependency item (framer-motion /
react-resizable-panels / TypeScript 7) needs a priority decision before
starting — none is urgent. Otherwise, everything safe and evidenced is
done.

## NEXT_PRODUCTION_WRITE
None pending.

## HUMAN_CHECKPOINT
None blocking. For when there's appetite: (1) UX-004's Carto API key,
(2) `fix/production-app-binding` decision, (3) which dependency item
(framer-motion/react-resizable-panels/TypeScript 7) to prioritize next.
