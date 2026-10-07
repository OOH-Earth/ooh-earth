# HANDOFF — read this first

## Verified activity → place — CLOSED 2026-09-30
PR #310 merged as `a29e577d3034057ba9c55a257a0ee9535f22873b`. Verified public
FieldCheck activity now links to the existing public Location Detail using
its existing `location_id`; pending/unverified checks remain non-interactive.
BACKUP and production were built and deployed frontend-only, with live entry
and feature chunks reconciled. Production Chromium passed 387x805, 844x390,
915x412, 1024x768, and 1440x900; the field-route CTA regression passed.
No true entity/resource writes occurred. Authenticated browser QA remains
unavailable.

## Dependency audit blocker — CLOSED 2026-09-30
PR #311 merged as `e95a9ac`. The transitive axios advisory was cleared by a
lockfile-only update from 1.18.1 to 1.20.0; no unrelated dependency upgrade
or application source change was included.

## Social place discovery links — CLOSED 2026-09-29
PR #307 merged as `62829b5d273c50f9c6cd3fa35a25a37b485113f8`.
MiniMapStack place cards and popups now link to `/location/:id`, strengthening
PLACE → UNDERSTAND → ACTION with existing public data only. BACKUP and
production artifacts were hash-reconciled before browser QA. Deterministic
functional coverage passed; production passed the portrait/tablet/desktop
and 667x375 / 844x412 / 932x430 landscape matrix with no overflow, page
errors, or true entity/resource writes. Anonymous production had no natural
public Location links, so live CTA click-through was not claimed. No schema,
permission, private-data, messaging, people-nearby, or Trails work.

Next: select another safe existing place ↔ mission/activity handoff. Trails
remains a human privacy checkpoint.

## Selected marker overlay — CLOSED 2026-09-29
PR #303 (`82d5ed82145506d7a7e7d041921b46a4ff816989`) merged the focused
MapLibre popup-anchor fix. The shared `Globe3D` and `MediaCorpGlobe` popup
offset is 44px, preserving a visible selected marker. Geometry regression
tests pass at 1440x900, 1024x768, 387x805, 844x390, and 915x412 with zero
intersection and an 8px gap. Production was built from the merge and serves
`assets/index-DDdeMp_o.js`; the live affected Globe3D chunk contains the
fixed offset. No backend/resource/data writes occurred. Authenticated QA and
natural anonymous production marker selection remain environment/data
limitations; do not claim them as completed.

LAST_UPDATED: 2026-09-30 (verified activity release and security blocker shipped)

## Landscape release — CLOSED
PR #298 merged as `7c0acd2167b24c7608b1a30710f539276575604f`. Production artifact `assets/index-Dv146f8m.js` was built from that merge and its live Map chunk/CSS hashes match the build. Cache-busting live geometry: 667x375 187px, 844x390 202px, 844x412 224px, 915x412 224px, 932x430 242px; representative portrait/tablet/desktop cases had no horizontal overflow. The first old-geometry reading was a propagation race; final proof waited for live asset match before measuring.

Baseline exceptions, not release changes: `LocationRelationship` missing from approved manifests and `moderate/entry.ts:119` inferred `verified_date` type error. Both match untouched starting main. Do not alter entities/functions/manifests in this release.

The repo runs a **real-world social-network programme in short bursts**
under the owner's autonomous GREEN-release rule and PRE-DAVE RELEASE
STANDARD (see `PRODUCT.md`). Read `brain/PRODUCT.md` before any feature
work.

Everything prior (React 19, TEST-001, SEC-001/002, UX-001/002/003,
SOCIAL-1/2/3/4, CHECKPOINT-QC-READ) remains CLOSED.

## What this burst did
1. A peer session ("debug-mobile-map-black-square") and this session were
   both independently authorized by the owner to close PR #287 —
   discovered mid-way via cross-session messages, surfaced to the owner
   (never resolved by guessing between two live authorizations), owner
   picked this session, peer stood down cleanly. Worth remembering: two
   sessions can receive what reads as the same direct authorization; ask
   before assuming either should proceed.
2. Reconciled PR #287 (branched from stale `130650b`) onto current main
   (`2f1337e`) myself — clean merge, then inspected the FULL resulting
   diff to prove it only touched `LocationMap.jsx`/`LocationThumb.jsx`/
   `Map.jsx` + 1 new e2e spec + 2 docs files, nothing else (no revert of
   QuestCompletion RLS, SOCIAL-1..4, dedupe, realtime gating).
3. Closed the mobile black-square bug + a Field Attention/ticker overlap
   found in the same investigation. Verified the root cause live against
   a real affected production record, not just via passing tests — see
   `QUEUE.md` "MOBILE BLACK SQUARE".
4. Found and confirmed (independently, not just trusted) a real,
   separate, pre-existing landscape-map-collapse bug — NOT fixed here,
   recorded in `QUEUE.md`.
5. Attempted an authenticated-QA handoff (owner logs into a real browser,
   automation resumes on that session) — hit a real environment
   limitation: this session's Chromium cannot show a window the owner can
   click into, in either headless or non-headless mode. Diagnosed
   precisely (not guessed) via a direct X11 window-tree inspection.
   Recorded in `INVARIANTS.md` "Browser QA" so it isn't re-attempted
   blindly. Owner explicitly authorized falling back to the anonymous-QA
   path already used successfully in every prior burst.

## Next
The safe Mission Board → field map CTA is shipped in PR #299 (`bcebc81`)
and live production serves `assets/index-CdunO6Ul.js`. Next use the
standard BACKUP/PR/CI/merge/production loop for place-centric discovery.
Keep Trails, PERF-OBS-1, and baseline maintenance separate.

## Blockers
None release-blocking. Two carried-forward, non-urgent items:
1. `PortalOps.jsx`'s 3 documentation strings describing QuestCompletion's
   old "READ/CREATE OPEN" access are stale (the rule was narrowed to
   owner-or-admin in a prior burst) — small, safe, frontend-only text fix
   for a future pass.
2. No working authenticated-browser QA path exists in this environment —
   see `INVARIANTS.md` "Browser QA" before attempting one again.

Separately noticed, not fixed (own-scope, not bundled into the push
above): production's `DigitalBust`/`LocationPhoto` are missing a
field-level write lock on `status` that the repo already declares and
that BACKUP already has. Not currently exploitable — the entity-level
`update` rule on both is already admin-only on production, confirmed live
— but worth a future one-line schema sync once someone reviews it
deliberately.

## Sandbox note
Both `functions deploy getPublicProfile` calls (BACKUP + production) and
both `site deploy` calls ran directly this burst — no classifier denial.
If a future deploy is denied, do not bypass via the browser; hand the
exact command to the owner, e.g.
`npx --yes base44@0.1.14 --app-id <APP_ID> functions deploy <name>`
(never `--force`).

## DO_NOT_TOUCH
- `feat/weather-context-v1` (user's dirty branch) — never touch.
- UX-004 Carto key, `fix/production-app-binding`, AdObservation, Founding
  directory — separate owner decisions.
- framer-motion 13 / react-resizable-panels 4 / TypeScript 7 —
  deprioritised for this programme unless a direct blocker.
- Never fabricate users, activity, completions, or friendships.
- Lockfile conflicts: reset to the target base's lockfile and diff the
  full dependency graph (see `docs/ops/ooh-earth/01-PRIORITY-QUEUE.md`).

## FINAL HANDOFF — 2026-09-29
Release chain is reconciled: merged main `d3bd32d` → fresh production build `assets/index-T3tZAZek.js` → live production artifact. Landscape and responsive Playwright checks are green after propagation. PR #299's Mission Board → field map CTA is live. Authenticated browser QA remains unavailable; no backend resources or user data were changed.
