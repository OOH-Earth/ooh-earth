# OOH Earth UI fixes ledger

One canonical record of UI simplification work: what was reported, what was reproduced, what is fixed
locally, and what is **not** yet verified in production. Standards and project preferences live in
[`UI-STANDARDS.md`](./UI-STANDARDS.md); this file is the ledger. Do not create a second one.

Status vocabulary (kept separate on purpose):

| Status | Meaning |
| --- | --- |
| Reported | Appears in a handoff or report; not independently reproduced |
| Reproduced | Seen in a real browser with saved bounds/screenshot |
| Fixed locally | Change committed on a local branch, with a test that failed before and passes after |
| Production-verified | Observed on the deployed artifact. **Nothing here is production-verified.** |

## 1. Baseline (verified 2026-10-24)

| Item | Finding |
| --- | --- |
| Production artifact | `https://oohearth.app/` serves `assets/index-CN5akOBi.js`; `/release-manifest.json` reports `git_sha f062e0d7a90de7f716179b40666b3f3ad894ae98`, built 2026-10-23T12:24Z. Read-only fetch; matches the handoff. |
| Production line | `maintenance/production-2026-10-02` @ `f062e0d`. PR #371 (Live feed / nudge / bottom-nav) and #372 (dompurify) merged into it on 2026-10-23. |
| `main` | `e1b979d`. **Diverged** from the production line: 26 commits only on `main`, 5 only on maintenance. `main` does not contain #371. |
| Earlier header/nudge fixes | `15492b8` (nudge hidden < 500px tall) and `53d45a4` (MENU/COMMAND 768-1023px) are on `origin/fix/header-tablet-fit` and in open PR #362 (base `main`). In neither `main` nor production. |
| #373 | Open **issue** (lazy-chunk network failure). Not a layout defect; not bundled here. |
| This work | Branch `ui/simplify-map-overlays`, based on `main` e1b979d, local only (not pushed). |
| Peers | Sessions `oohearth-cf` (interactive) and `hermes-agent-oci-70` (idle). Worktrees `oohearth-livefeed`, `oohearth-ui-fix` clean. The engineering worktree `feat/weather-context-v1` was not touched. |
| Map files differ on the production line | `Map.jsx`, `ContextualNudge.jsx`, `MapBottomSheet.jsx` differ between `main` and maintenance. Promoting this work to production needs a forward-port review (see section 6). |

## 2. OSIRIS reference (research anchor, not an authority)

Upstream `https://github.com/simplifaisoul/osiris`, default branch `master`, inspected at commit
`59634bc2cbe418c64b258548eeda8f056b4823d0` (2026-10-23), MIT licence. Blob SHAs of the five files read
match the handoff: `page.tsx e557eb6f…`, `globals.css cc33c750…`, `LayerPanel.tsx 037ce4fc…`,
`SearchBar.tsx c7fb0213…`, `GlobalStatusBar.tsx 837fd3c8…`. No source was copied; patterns were
re-implemented against OOH tokens.

| OSIRIS pattern (file / symbol) | Observed live (WebGL worked in this browser) | Adopted in OOH as |
| --- | --- | --- |
| `page.tsx useIsMobile`: `w < 768 \|\| (h < 500 && w < 1024)` | Phone and 844x390 both get the compact dock | `compact` = width < 768 **or** short landscape, plus **pane** width < 600 (our split layout leaves ~380px at 1024) |
| `LayerPanel.tsx` category buttons: real `<button>`, `aria-expanded`, label carries active count, Escape closes, click pins the flyout | 40x40 category rail; flyout has title, bulk NONE/ALL, close, switch rows | One labelled **Tools** disclosure (`aria-expanded`, `aria-controls`, Escape, focus return); grouped content, not a rail |
| `LayerPanel.tsx` active counts only for real state | badges 1, 2 | Attention-on dot only when `attentionMode` is true |
| `page.tsx ViewSegment`: `aria-pressed` segmented view control | Grouped 3D/2D + Map/Sat | Existing Flat/Globe switcher kept as one segmented group |
| `SearchBar.tsx`: bounded `max-h-[min(72vh,600px)]`, inner scroll, `role=combobox` | Opens as a focused panel | Panel bounded by a **measured** `--map-panel-max` with inner scroll |
| `GlobalStatusBar.tsx`: desktop-only strip; docs/privacy links remain | Bottom strip hidden on phone | Spec bar/legend move into the Tools panel in compact; privacy/docs unaffected |
| Single bottom dock owns occupied space; other bottom controls sit above it | Zoom pad and segment sit above the dock on phone | `--map-sheet-overlap` published once; every bottom control stacks above it |

Not adopted: 7px labels (`globals.css:257`), `overflow: hidden` on the document, hover-only
affordances, ghosted controls under an open drawer (the live 844x390 drawer fades the view segment and
zoom behind it), OSIRIS palette/fonts, and any of its datasets or tools. Live OSIRIS also shows 24-32px
targets and ~7px dock labels: visual similarity is not evidence of quality.

## 3. Method

Every defect below was reproduced with `e2e/helpers/mapGeometry.ts` (`probeMap`): for each control it
records the rect, whether an ancestor clips it, and what element is topmost at the centre and at four
inset corners. Baseline = `main` e1b979d build; states = viewport x Flat/Globe x default/error x
sheet peek/full. Raw JSON and screenshots were kept outside the repo.

## 4. Issue ledger

SHAs are filled in by the final docs commit (section 7). "Fixed locally" means a test that fails on the
baseline passes on the candidate; it is not a production claim.

| ID | Route/state | Severity | Reproduced root cause | Status |
| --- | --- | --- | --- | --- |
| UI-001 | `/map`, any | High | Flat/Globe, attention toggle, tally, ticker and toolbar were separate `absolute` layers with hand-tuned `top-*`; `GlobeHud` reserved a fixed `top-16` | Fixed locally (commit 1, `52e9f12`) |
| UI-002 | every route | Medium | `ToastProvider`/`ToastViewport` are fixed z-100, always mounted, no `pointer-events-none`: an empty 420x32 box blocked the map's bottom-right on sm+ and a 32px strip covered the top on phones | Fixed locally (commit 2, `61ec546`) |
| UI-003 | `/map` < lg | High (functional) | The sheet's drag handle called `setPointerCapture` on `pointerdown`, retargeting the click away from its own buttons: **Expand sheet was dead** with a real pointer (26 of 26 probe states) | Fixed locally (commit 3) |
| UI-004 | `/map` < lg and laptop | High | Bottom owners (sheet, spec bar, Leaflet/MapLibre controls) were independent: zoom, Reset north, Auto-spin and attribution sat under the sheet (phone) or the spec bar (laptop) | Fixed locally (commit 3) |
| UI-005 | `/map` error state | High | "Retry view" lived in the scrolling body, below the 132px peek fold. *Correction to an earlier note: it was clipped by the sheet, not "overlapping the nav".* | Fixed locally (commit 3) |
| UI-006 | `/map` sheet full | Medium (a11y) | A full sheet leaves map controls focusable underneath it (WCAG 2.4.11) and, once Expand worked, pushed them off-screen | Fixed locally (commit 3): map box is `inert` when covered |
| UI-007 | `/map` short landscape | High | Shared header (112px) + bottom nav (76px) + a 96px sheet + a full-width search row left a 0-34px band; the Field-attention row sat under the sheet | Partly fixed (commit 3): header-only peek, search merged into the controls row, icon-only primary actions, zoom beside attribution. Shared header/nav budget **not changed** (UI-012) |
| UI-008 | `/map` compact | Medium | Attention, tally, ticker and optional tools stacked simultaneously over a map with little room | Fixed locally (commit 3): one labelled Tools disclosure; in short landscape it opens in the sheet |
| UI-009 | `/map` | Medium | Informational labels at 7-9px (tally, ticker, attention card, filter chips, spec-bar legend) | Partly fixed: raised to the existing 10px Label step. Decorative labels elsewhere remain |
| UI-010 | `/map` at 1024px split | Medium | Map pane ~384px wide while the window is wide, so viewport breakpoints chose the wide layout | Fixed locally (commit 3): density follows the measured pane width (< 600px) |
| UI-011 | `/map` phones | Medium | `ContextualNudge` (fixed, bottom-centre, z-70) paints over the map's zoom column | **Blocked**: peer-owned file that also differs on the production line (#371). Not edited |
| UI-012 | all routes | High (short landscape) | Shared `Nav` + `MobileBottomTabs` consume ~190px of a 390px-tall screen | **Not started**: shared chrome, separate slice, needs owner sign-off |
| UI-013 | coverage | n/a | Real browser zoom (Ctrl-+) could not be driven: headless Chromium ignored profile zoom preferences, and DevTools key events do not trigger browser accelerators | **Unavailable coverage**; CSS-viewport + DPR equivalents only |
| UI-014 | `/map` short landscape | High | The full sheet is 88% of the screen height plus a 76px nav offset: at 390px tall its top, and the Collapse button, sat at y = -12. Masked while Expand was dead | Fixed locally (commit 3): tallest snap clamped to the space above the nav |
| UI-015 | `/map` Tools panel | Medium (a11y) | Collapsing the tally swaps one button for another, so keyboard focus fell to `<body>` and Escape stopped reaching the panel | Fixed locally (commit 3): focus handed to the new toggle; Escape handled at the document |
| UI-016 | `/map` ticker | Medium | Offer/loading states used a fixed `h-8`; the label wrapped to five lines at 320px and overflowed onto the controls above; the dismiss target was 24x14px | Fixed locally (commit 3): bar grows (`min-h`), dismiss 40px |
| UI-017 | all routes at 320px | Medium | The shared bottom nav pill is clipped at both edges at 320px on `main`. **Fixed on the production line by #371** (`MobileBottomTabs` `max-w` + `shrink`), which is not on `main` | **Blocked**: shared file, peer/production-line owned |
| UI-018 | `/report` | Medium (a11y) | The four help-hint buttons (`TerminalTooltip`) were 14x14px (WCAG 2.5.8 minimum is 24px); search input had no accessible name; recenter button 20px with only a `title`; hints could not be dismissed with Escape (WCAG 1.4.13) | Fixed locally (commit 5121484): 24px hint buttons, tap toggle, Escape; named input; 32px recenter; `min-h-8` on Locate me and the map link. Shared `TerminalTooltip` has 4 consumers, all on `/report`/pin-drop |
| UI-019 | `/report` | Medium | Form labels, step tabs, chips, photo-picker tiles and hints at 7-9px | Fixed locally (commit 5121484): all `/report`-only components raised to the 10px Label step (also `MultiPhotoUpload`, shared with QuickCapture: text size only). Shared header/footer/nudge text under 10px remains (UI-012 slice) |
| UI-020 | `/report` validation | High | Submitting from step 4 without GPS jumps to step 1 and raises the error with no scroll, focus or `role=alert`: at 844x390 it sat at y=612 in a 390px viewport (invisible), and in every viewport focus stayed on the old button | Fixed locally (commit 5121484): focused `role=alert` region scrolled into view; asserted at 390x844, 320x640, 844x390, 1280x720 |
| UI-021 | `/` (Home) | Medium | On `main`, the Home bottom nudge (z-70, y 684-756) paints over the Live feed / ON AIR strip (y 748) at 390x844 (`before-home-390x844.jpg`). Primary action (Explore the map) and hierarchy are clear; no horizontal scroll at 320-1440 | **Not duplicated here**: fixed on the production line by #371 (`f062e0d`); needs the coordinated forward-port. Home otherwise audited at 5 viewports with no further defect worth a change |

## 5. Before / after (measured)

Method: `probeMap` on the `52e9f12` build ("before", top overlays already fixed, bottom region as on
`main`) and on the candidate ("after"). A control counts as covered if any of its centre or inset
corners is not the topmost element (a round attribution button is tested at its centre only).
Evidence: `docs/design/evidence/ui-fixes-2/` (JPEG screenshots + `bounds-before-after.json`; full-res
PNG originals are kept outside the repo in `~/oohearth-ui-evidence/ui-fixes-2-full-res/`).

| State | Controls covered before | after | Free map band (px) before -> after |
| --- | --- | --- | --- |
| 390x844 flat, error (Retry) | 6 | 0 | 316 -> 365 |
| 390x844 globe | 3 | 0 | 316 -> 413 |
| 360x640 flat | 5 | 0 | 112 -> 209 |
| 820x1180 globe | 3 | 0 | 596 -> 565 |
| 844x390 flat (short landscape) | 6 | 0 | 0 -> 84 |
| 667x375 globe (short landscape) | 5 | 0 | 0 -> 69 |
| 640x360 flat (200% zoom equivalent) | 7 | 0 | 0 -> **54** |
| 1440x900 flat | 3 | 0 | 438 -> 407 |
| 390x844 sheet full | 5 | 0 (map inert) | 316 -> 0 (sheet covers the map by design) |
| 844x390 tools open | 5 | 0 | 0 -> 0 (Tools open in the sheet) |

Honest reading of those numbers:

- The band shrank slightly at 820 and 1440 because primary controls are now 40px (project target) rather
  than 32px.
- **Short-landscape usability target** (project preference): every primary control reachable without
  scrolling the page, collapsed sheet header-only (<= 64px), and >= 64px of unobstructed map height
  across the full width. Met at 844x390 (84px) and 667x375 (69px). **Not met at 640x360 (54px)**: the
  shared header and nav alone take 188px of a 360px screen (UI-012).
- 320px (WCAG reflow width) passes the map-region matrix; the shared bottom nav is clipped there
  (UI-017) and the 400% case (320x200 CSS px) cannot show a map at all because the shared chrome exceeds
  the screen height. That is a UI-012 limit, not a map-layout one.

## 6. Content disposition (this surface)

See `UI-STANDARDS.md` section 5; this pass changes it as follows.

| Content | Treatment | Still reachable via |
| --- | --- | --- |
| Field attention + filters | Collapse in compact; inline on wide panes | Tools button (shows an "on" dot when active); state preserved across close/reopen |
| Tally | Collapse in compact; toggle keeps focus | Tools panel |
| AI news ticker (opt-in, labelled AI/unverified) | Collapse in compact | Tools panel; copy unchanged |
| Pin counts + key legend (spec bar) | Relocate into the Tools panel in compact | Tools panel (Flat view) |
| Find / GeoJSON / Keys / style | Inline on wide panes; inside the Tools panel at md+ in compact | Tools panel (still absent below md exactly as before: not newly exposed on phones) |
| Retry view | Relocate from the scrolling body to the always-visible sheet header (inline in the header row in short landscape) | Sheet header at every snap |
| Flat/Globe, Graffiti, Capture, Report | Keep visible; icon-only with accessible names in compact | Always |
| Source/attribution | Keep visible; stacked above the sheet/spec bar | Always |
| Results list | Unchanged; sheet header buttons are now 40px and actually work | Sheet |

## 7. Validation and candidate

Commands (Playwright against `vite preview` of a production build, Chromium):

- `e2e/map-overlay-layout.spec.ts` - 10 viewports x Flat/Globe x (default, Tools open, attention
  expanded, tally collapsed, Tools reopened), keyboard walk, route transition, frame contract.
- `e2e/map-bottom-region.spec.ts` - controls above the sheet, real sheet clicks, header on screen,
  Retry through recovery, inert when covered, laptop spec-bar clearance, short landscape.
- `e2e/toast-passthrough.spec.ts` (+ existing `toast-dismiss.spec.ts` real-click regression).
- Updated existing specs for the disclosure: `intelligent-map`, `main-map-generated-layers`.

Result on the candidate: **77 passed, 1 skipped** across the touched map/toast/Home-adjacent specs on both
Playwright projects (the skip is the UI-011 nudge `test.fixme`). The wider regression run and its
comparison with the untouched baseline are recorded below.

Negative controls: `toast-passthrough` fails on `e1b979d` with `pointer-events: auto`; the sheet-click,
Retry-in-header, covered-controls and header-on-screen tests fail against the `52e9f12` build for the
reproduced reasons above.

Forward-port check (read-only): merging the production line `f062e0d` into the candidate auto-merges
`Map.jsx` and every other file; the only conflict is `package-lock.json` (dompurify / follow-redirects
bumps). Re-checked at the final commit.

### 7a. Wider regression run and baseline comparison

| Run | Result | Status |
| --- | --- | --- |
| Touched specs, candidate | 77 passed, 1 skipped | valid |
| Full suite, candidate (Chromium 1243, 2 workers, machine loaded) | 569 passed, 68 failed, 2 skipped | not comparable: no baseline run under the same conditions |
| 20 failing files, candidate (same conditions) | 112 passed, 78 failed | not comparable |
| 20 files, baseline then candidate, Chromium 1243 (clean machine) | 189 failed / 1 passed on **both** | **infrastructure-blocked**, not evidence about the code |
| 20 files, baseline `e1b979d` then candidate `bbd9dd5`, Chromium 1223, same config/workers/fixtures | baseline 155 pass / 27 fail; candidate 156 pass / 26 fail | **valid comparison** |

The 1243 run failed everything on the untouched baseline too: with Playwright 1.63 and headless-shell
builds 1234/1243 the renderer freezes on this app (`evaluate('1+1')` never returns, ~0% CPU) while
build 1223 loads it normally; a blank `setContent` page works on all builds. The cause was not
investigated further. It means the earlier "contention" hypothesis for the 68/78 failures is **not
proven** by that run; the valid comparison is the 1223 one. The earlier 569/68 numbers are kept as
recorded and were not re-attributed.

Valid comparison (JSON reporter, matched by file + title + project):

- **Failing on both, same error signature (24): pre-existing.** `ad-scanner.spec.ts` 22,
  `footer-nav-clearance.spec.ts` 2 (320px bottom-nav clipping on `main`, fixed on the production line
  by #371; UI-017).
- **Baseline-only failures (3):** `ad-scanner-resilience` double-click, `rivers-observed` keyboard
  card, `zora-chart-render` hover. Pass on the candidate: intermittent.
- **Candidate-only failures (2):** `location-detail` (mobile) "counter is absent for pending" and
  "revisiting via client-side nav". Re-run in isolation, 4 repeats each: 8/8 pass on the candidate
  and 8/8 on baseline, so they are intermittent under load, not regressions. No toast-related or map
  failure is candidate-only.
- Not re-run: spec files that passed in the full run (not required by the new evidence).

Integration (separate branch `ui/integration-main`, from `origin/main` 065ecf8): the three code
commits replay cleanly (new SHAs 900ade0, 6406ee8, e92a260). Evidence on the old SHAs does not certify
that branch; see section 9 for its own checks.

Final SHAs: see section 9.

## 8. Remaining limitations and dependencies

- **UI-011 nudge** (blocked). Cleanest fix is after #371 is forward-ported to `main`: drop the `/map`
  hint (the map already has a Report action, so it is redundant) or stop it covering the right-hand
  control column. Owner decision on a peer-edited file. `test.fixme` in `map-overlay-layout.spec.ts`
  stays until then.
- **UI-012 shared header/bottom nav** (not started): the largest single cause of the short-landscape
  squeeze; shared chrome also edited by #371 and #362.
- **UI-017** is fixed on the production line (#371) but not on `main`.
- **Promotion to production** needs a forward-port: production is `maintenance/production-2026-10-02`;
  `Map.jsx`, `MapBottomSheet.jsx`, `ContextualNudge.jsx` differ there. Follow the existing release
  controls. Nothing was pushed, deployed, or run against shared BACKUP.
- Remaining sub-10px labels exist outside the map surfaces touched here.
- Not available: real browser zoom, real iOS Safari/Android, virtual-keyboard behaviour. Reduced-motion
  was not separately exercised.
- Routes audited: `/map` (fixed), `/report` (fixed, UI-018..020), Home (UI-021, deferred to the #371 forward-port). Not audited: dashboard/detail, scanners, `/plans`, others.
- `/report` forward-port to the production line conflicts: `FieldProtocolGuide.jsx` and `ReportStep1Document.jsx` were edited there by the R1 copy corrections (`git merge-tree` of `f062e0d`). My hunks are size-class changes only; resolve by keeping the production copy and re-applying the 10px class.

## 9. Integration branch and final commits

Integration target: `origin/main` @ `065ecf8` (checked 2026-10-25). Production maintenance line
`maintenance/production-2026-10-02` @ `f062e0d` has diverged (main 30 commits ahead, production 7 ahead,
merge base `3161728`); main lacks #371, so the Home/nudge/bottom-nav fixes are **not** on main. The
evidence branch is untouched; `ui/integration-main` replays the same commits on `main` without
rewriting it.

| Branch | SHA | Content |
| --- | --- | --- |
| `ui/simplify-map-overlays` (evidence, base `e1b979d`) | `52e9f12` | measured map overlay flow |
| | `61ec546` | toast containers pass clicks |
| | `bbd9dd5` | single bottom owner + compact map chrome |
| | `50f6cce` | standards, ledger, evidence |
| `ui/integration-main` (base `065ecf8`) | `900ade0`, `6406ee8`, `e92a260` | the three code commits replayed cleanly |
| | `82b7ef3` | docs (replay; no conflict with the engineering section) |
| | `bb8071c` | engineering docs now point at the landed standards/ledger; evidence JSON formatted |
| | `5121484` | `/report` fixes + `report-form-clarity.spec.ts` |
| | (this ledger edit) | reported in the delivery message |

Checks on the integrated build (Chromium headless-shell 1223, preview of a fresh `npm run build`):
`eslint . --quiet` clean; `prettier --check` clean for tracked files; map/toast specs 74 passed + 1
skipped (the UI-011 `test.fixme` stays: not resolved); Report-related set 71 passed + 1 intermittent
(`offline-queue-retry` "does not block a different item": 5/5 pass on both baseline and integration
when repeated); `report-form-clarity` 18/18 on the fix and 9/9 failing on the `e1b979d` build.
Evidence: `docs/design/evidence/ui-fixes-3/` (before/after `/report` at 390x844, 320x640, 844x390,
error state, Home before).
