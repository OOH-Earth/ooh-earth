# QUEUE — priority lanes, stable IDs

Format per task: ID · TITLE · WHY · SCOPE · WRITE_TYPE · STATUS · EVIDENCE ·
NEXT_ACTION · DONE_WHEN.

## P0
None open.

## P1 — security / production consistency

### SEC-001 — production function drift, security-relevant (detail private)
- WHY: a production function is behind already-hardened source on
  `origin/main`/BACKUP. **Repo is public — mechanism/impact withheld from
  all tracked files; full detail is in private notes with the project
  owner.** Ask them directly before attempting to reconstruct this from
  scratch.
- SCOPE: redeploy existing, already-tested source to production. No new code.
- WRITE_TYPE: production function deploy (Lane D — human authorization
  required, never autonomous).
- STATUS: prepared, not deployed.
- EVIDENCE: `docs/ops/ooh-earth/04-SECURITY-QUEUE.md` (redacted public
  entry) — full detail is not in this repo.
- NEXT_ACTION: project owner authorizes; then redeploy from a fresh
  `origin/main` worktree, pre/post pull-and-diff verification, targeted
  smoke check of the affected surface on production.
- DONE_WHEN: production pull matches `origin/main` byte-for-byte,
  live-verified, git-reconciled (no PR needed — source already on main).

### SEC-002 — production function drift, companion finding (detail private)
- WHY: same shape as SEC-001, lower priority, same public-repo redaction
  reasoning applies.
- SCOPE: redeploy existing source, no new code.
- WRITE_TYPE: production function deploy (Lane D).
- STATUS: prepared, not deployed.
- EVIDENCE: same as SEC-001.
- NEXT_ACTION: bundle with SEC-001's authorization if the owner agrees.
- DONE_WHEN: same pattern as SEC-001.

## P1 — release / git

### GIT-001 — vetted-safe PR batch, merge blocked by sandbox classifier
- WHY: 12 dependency/small-fix PRs were reviewed clean 2026-09-25; the batch
  merge attempt was denied ("Merge Without Review") and not retried.
- SCOPE: **do not blindly re-merge from the old list** — re-read each PR's
  current diff/CI/conversations fresh before merging any (a PR could have
  changed, been superseded, or picked up new commits since).
- WRITE_TYPE: git merge only, no deploy triggered by merging to main.
- STATUS: re-audit in progress this session.
- EVIDENCE: `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md` "LANE A" entry,
  `06-EVIDENCE-LOG.md` 2026-09-25.
- NEXT_ACTION: fresh `gh pr list`/`gh pr view` per candidate; merge what's
  still safe; if blocked again, write exact commands to a merge-commands
  file for Dave.
- DONE_WHEN: every one of the 12 is merged or has an explicit reason it
  isn't (still blocked / no longer safe / superseded).

## P2 — Dave map UX (reproduce before implementing)

### UX-003 — possible results-list disappearance — CLOSED, NOT A BUG (2026-09-25)
- WHY: Dave: "may be random" — unconfirmed.
- VERDICT: **reproduced the exact "0 IN VIEW · 0 TOTAL" state** (zoom out +
  pan to an area with no location data) and confirmed it's correct,
  by-design viewport filtering — the app already shows a "Follow Map"
  recovery button in exactly this state. Not a defect.
- SECONDARY FINDING (minor, separate): in this same state, the results-list
  *content* below the "0 IN VIEW" header still shows stale results from the
  previous viewport (didn't clear to match the 0 count) — cosmetic
  inconsistency, not data loss. Worth a small fix if convenient, not urgent.
- STATUS: CLOSED — no engineering action needed for the core report.
- EVIDENCE: reproduced live on `oohearth.app/map`, Flat mode, Split view,
  desktop 1440×900, via programmatic zoom-out + pan.

### UX-004 — Carto "API KEY REQUIRED" tile watermark — REPRODUCED, real bug (2026-09-25)
- WHY: Dave saw it once outside Chrome, assumed random/not-on-Chrome.
- VERDICT: **reproduced deterministically on Chrome/Chromium**, contradicting
  Dave's own assumption — this is not random. Root cause: `Dark`/`Light`/
  `Voyager`/`Matrix` map styles (4 of 5 style options; `Satellite` is the
  only unaffected one) all point to Carto's legacy free anonymous tile
  endpoint (`{s}.basemaps.cartocdn.com/...`) with no API key, in
  `src/lib/mapStyleContext.jsx` (also duplicated in `MediaCorpsMap.jsx` and
  `MapPinDropper.jsx`). Carto's CDN doesn't hard-fail this — it serves a real
  `200 OK` PNG tile with "API KEY REQUIRED — carto.com/basemaps/apikey"
  watermarked directly into the image, so no network error ever surfaces.
  Confirmed isolated to Flat/Leaflet raster mode — Globe's MapLibre GL
  vector styles (same 4 style names, different Carto delivery mechanism)
  are unaffected.
- IMPACT: any visitor who picks Dark/Light/Voyager/Matrix in Flat mode gets
  a watermarked, degraded-looking basemap. Not a security issue, not
  data-related — purely a visual/branding problem, but it's on by default
  for a meaningful fraction of the style picker.
- FIX OPTIONS (not implemented — needs a decision, not a unilateral
  redesign of Dave's stated visual choices):
  1. Register a real Carto API key and switch to their authenticated tile
     endpoint (`accountid`/API-key-bearing URL) — needs Dave to create/fund
     a Carto account; no code change beyond adding the key.
  2. Swap the raster tile source for a different no-key-required provider
     for these 4 styles — a code-only fix, but changes the actual visual
     style Dave chose, so should be presented with a preview, not silently
     swapped.
- WRITE_TYPE: frontend-only if option 2 is chosen (Lane B once a direction
  is picked); option 1 needs Dave to obtain a credential (not something to
  do autonomously).
- STATUS: root-caused, awaiting Dave's choice of fix direction.
- EVIDENCE: live network capture (`c/d/a/b.basemaps.cartocdn.com/dark_all/...`
  all return `200`), source read (`src/lib/mapStyleContext.jsx:26-78`),
  screenshot evidence matching Dave's own report pixel-for-pixel.
- NEXT_ACTION: present both fix options to Dave; implement whichever he
  picks.

### UX-001 — desktop results-row hover/active highlight weakened
- WHY: Dave wants the previous strong fluorescent-red/pink hover/active
  treatment back — clear row↔marker correspondence.
- SCOPE: find the current component + its git history; distinguish hover /
  selected / keyboard-focus states; smallest correct restoration, not a
  redesign.
- WRITE_TYPE: frontend-only, bounded (Lane B once scoped).
- STATUS: not started — reproduce/inspect current behavior first.
- NEXT_ACTION: browser-inspect current Map page result-row/marker sync;
  `git log -p` the relevant component for the prior highlight styling.
- DONE_WHEN: hover and selected states are visually distinct, use existing
  brand tokens, keep keyboard focus visible, BACKUP+production verified.

### UX-002 — marker/icon size and quality
- WHY: Dave: icons "too micro," wants better quality/spec.
- SCOPE: audit flat/globe/cluster/selected/hover/category icons across
  desktop+mobile+DPR before touching anything.
- WRITE_TYPE: frontend-only, bounded (Lane B once scoped) — do not make
  markers so large they obscure dense views (São Paulo-density case).
- STATUS: not started.
- NEXT_ACTION: build the renderer/state/size/asset matrix described in
  `docs/ops/ooh-earth/05-TEST-MATRIX.md`'s map section (extend it), then
  scope the smallest coherent improvement.
- DONE_WHEN: matrix complete + a scoped, tested, BACKUP+production-verified
  fix (or an explicit decision to defer with reasons).

## P3 — deferred, real but not urgent

- **UX-005** landscape globe container ~150px tall. Non-blocking. Bundle
  into the UX-002 pass, don't jump the queue for it.
- **UX-006** 5 full-res `media.base44.com` image URLs 404 (resized siblings
  200). Reproduce, identify ownership, fix only if trivially safe.
- **UX-007** lazy-chunk preload has no retry on failure. Did not reproduce
  under realistic network conditions (only under an extreme CDP/QUIC
  artifact). Keep P3 unless real-user evidence appears.
- **RQ-001** remaining react-query candidates (`Account`, `InHome`, `Map`,
  `FdePortal`, `Dashboard`, `portals/AdbustingPortal`, `portals/GraffitiPortal`).
  Do not migrate merely to hit a round number. `LabAdmin`/`CareersAdmin`/
  `Plans`/`PortalOps` stay evidence-deferred — don't touch without new
  architectural evidence.

## DEFERRED — product decisions, do not reopen automatically
- AdObservation / multi-brand model — recommended, deferred.
- Founding Profile public directory — deferred, URL-only stays current.
- `fix/production-app-binding` (funnel/attribution branch) — needs a Dave
  decision on whether it's still wanted before any engineering.

## CLOSED (this session, for reference — full detail in docs/ops/)
- Globe-markers incident (PR #274) — CLOSED, browser-verified.
- P0 REST-fetch dedupe, P0.1 realtime gating, Phase 2 permission fix,
  LeadClaim fix, Public Space + Founding Profile release, Store.jsx
  react-query — all CLOSED, all deployed and verified. See
  `docs/ops/ooh-earth/00-CURRENT-STATE.md` for the full history.
