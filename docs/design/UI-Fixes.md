# OOH Earth UI fixes ledger

One canonical record of UI simplification work: what was reported, what was reproduced, what is fixed
locally, and what is **not** yet verified in production. Standards and project preferences live in
[`UI-STANDARDS.md`](./UI-STANDARDS.md); the consistency-pass specification is
[`OOH-UI-UX-REFERENCE.md`](./OOH-UI-UX-REFERENCE.md); this file is the ledger. Do not create a second one.

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

## 10. Release candidate on the production line (2026-10-25)

Release path: the live app is built from `maintenance/production-2026-10-02` (live entry
`index-CN5akOBi.js` == the recorded `f062e0d` artifact, verified in the browser 2026-10-25), and `main`
lacks #371 and carries held, undeployed work. A `main`-based build would silently drop production-only
fixes, so the candidate is the production line plus this slice:
branch `release/ui-simplify-prod`, base `ee75604` (`f062e0d` + CI-only commits). `ui/integration-main`
(base `065ecf8`) and the evidence branch `ui/simplify-map-overlays` are untouched.

Conflicts resolved by understanding both sides, not by taking either wholesale:

- `MapBottomSheet.jsx`: production was unchanged there; kept this slice.
- `MapAlertTicker.jsx`: production's ticker has no `requested`/AI-summary gating (that is `main` #343); kept
  production's copy and logic and re-applied only the size/target hunks (10px, `min-h`, 40px dismiss).
- `main-map-generated-layers.spec.ts` does not exist on the production line: dropped from the replay.
- `FieldProtocolGuide.jsx`, `ReportStep1Document.jsx`: kept the production copy (the R1 corrections:
  "Union Made" removed, `text-dim` contrast change) and re-applied only the type-size/target classes.

New defects found on the release candidate (not visible on `main`), reproduced with DevTools bounds on the
live artifact and fixed:

| ID | Finding | Evidence | Fix |
| --- | --- | --- | --- |
| UI-022 | With the 44px #371 nudge visible on `/map`, the nudge (651-756) sits over the bottom sheet (636-768) on the **live** artifact: count, Expand and Fullscreen are covered | `before-PRODUCTION-index-CN5akOBi-map-390x844-nudge.jpg` | Sheet stacks above the nudge using its published `--ooh-nudge-clearance` (+6px, the nudge's own 82px offset) and the HUD re-measures; no `/map` nudge in short landscape (<500px tall: no room, Report is on the toolbar) |
| UI-011 | Resolved: the former `test.fixme` is now real hit-test + bounds assertions in 10 states (320/360/390/430/844x390, Flat and Globe); 10/10 fail on the build without the fix, 10/10 pass with it | `map-overlay-layout.spec.ts` | as UI-022 |
| UI-023 | 2px overlap between the toolbar's second row and the globe control row at 320x640 when the nudge lifts the sheet | Playwright hit-test | minimal-room offset 0.5rem -> 0.25rem |
| UI-024 | `/report` optional/status text used `text-dim/50-60` and `text-flare/70` (below 3:1 on the void background); measured on the candidate: the rest of the report text is 4.99-15:1 | DevTools contrast audit | full tokens (>=4.99:1) |
| UI-025 | 10px form labels judged against the readability request | | Form labels and helper text move to the existing 11px step; chrome/tooltips stay 10px |

Pre-existing, not caused by this slice (kept honest, not "fixed"):

- `footer-nav-clearance` "Open Command Center" at 320/375/390px on `/support` and `/plans`: 6 failures that
  reproduce **identically on the live artifact** (`f062e0d` build) in this environment, serially. Cause not
  investigated; #371's record reports them passing serially on Chromium 153 under another environment.
- On phones `Map style`, `Find units`, `Export GeoJSON` and `Access keys` are `hidden md:flex` in the
  production source as well: desktop-only, unchanged.

### Test environment (reproducible)

Playwright 1.63.0 (lockfile unchanged) defaults to Chrome Headless Shell 153.0.8010.12 (build 1243). On
this WSL2 host `canvas.getContext('webgl2')` never returns on builds 1243 (shell and full) and the
renderer freezes; build 1223 (Chrome 148.0.7778.96) creates it and the app loads. The `main` baseline
froze identically, so the earlier "189 of 190 failed" run was the browser, not the code. All local runs
use build 1223 through an **untracked** `pw.local.config.ts` that sets `launchOptions.executablePath`
and nothing else; the repository's config and lockfile are not changed. CI (GitHub runners) uses the
supported default browser and is the authoritative check.

### Checks on this candidate (local, build 1223, `vite preview` of a fresh build)

- Focused set (map, toast, intelligent-map, #371 live-feed/nav/nudge specs, report specs, focus-trap,
  smoke, a11y; 199 tests): 189 passed, 10 failed on the first run. Isolated reruns: `focus-trap` passes
  on candidate and on the live artifact (load-intermittent); the zoom200 flat map test passes 2/2 alone;
  the 6 `footer-nav-clearance` failures are identical on the live artifact; the nudge 320x640 globe case
  was a real 2px overlap and is fixed (UI-023). After the fixes: map overlay + bottom region + report
  clarity 82/82 on the final map/report code.
- DevTools MCP in a real Chrome (member session verified as `justicejonas`, MEMBER, through the account menu
  on the production tab; that tab was only read): candidate `http://127.0.0.1:4314` (entry
  `index-C96Hiotp.js`, local only, API calls return 404 so no data and no writes) at 390x844: sheet above
  the nudge (643 < 651), nav clear, zoom column clear, Retry View in the sheet header; Tools opens (40px
  controls, panel above the sheet), Escape closes it and returns focus to the toggle; 844x390: no nudge,
  zoom/Tools/Report visible above a 60px sheet; `/report`: hint buttons 24x24 with accessible names, 11px
  labels, clicking Transmit with no GPS shows a focused `role=alert` at y=433 of 844 and makes no network
  request. Member-state behaviour of the candidate was **not** tested: the local origin has no session and no
  backend; that needs a BACKUP/staging deploy.
- Real browser zoom: `Ctrl+=` through DevTools does not change `innerWidth` or `devicePixelRatio` (tested
  2026-10-25), so 200% / 400% are covered only by emulation (640x360@2, 320px width reflow). Unavailable:
  a physical phone, a virtual keyboard.

### OSIRIS comparison (qualitative; section 2 holds the research)

Adopted patterns that this candidate shows: one clear primary action per surface (map: view switch and
Report; Report: Continue/Transmit), grouped secondary tools behind a labelled Tools disclosure with
Escape and focus return, consistent panel headers and dismissal, one owner for the bottom edge. Not
adopted: 7px labels, hover-only disclosure, overflow-hidden panels. Visual resemblance is not treated
as a pass: the checks above are bounds, hit-tests, contrast ratios and keyboard behaviour.

## 11. Release qualification on BACKUP (2026-10-25)

Reservation: `~/ooh-release-records/2026-10-25/BACKUP-RESERVATION.md` (window 19:05:59Z-21:05:59Z, user-authorized,
frontend only). Peers `oohearth-cf` and `hermes-agent-oci-70` confirmed no claim. Previous BACKUP bytes
(manifest `git_sha` df4db4e, 372 files) were fetched as served into `backup-before/` with
`backup-before-sha256.txt`; restore = deploy that directory with the same CLI command.

### Findings from the staging run (anonymous and MEMBER)

| ID | Finding | Disposition |
| --- | --- | --- |
| UI-026 | After Collapse (and Expand) keyboard focus fell to `<body>`: the focused button unmounts | Fixed in `8762ba1`; `focus handoff` test fails on the f2e2b06 build served from BACKUP and passes with the fix |
| UI-029 | Visual review (MEMBER, 844x390, staging): with MapLibre's attribution pill open the zoom/compass row sat on top of the "(c) Esri, Maxar, Earthstar Geographics" text; hit-tests on the attribution button's centre did not catch it | Fixed in `57ae555`: in minimal-room layouts at >=641px the row moves up 2.25rem; new test asserts control/attribution rectangles do not intersect (fails on the f2e2b06 and 6f25eab builds, passes on 57ae555). `staging-before-attribution-fix-*` / `staging-final-*` screenshots |
| UI-027 | Nudge auto-hides after ~14s and the lifted sheet drops back ~94px; a tap aimed at the list can land on a different card | **Reviewer decision.** Accepted trade-off of stacking the sheet above the nudge. Alternative: drop the redundant `/map` nudge (the toolbar has Report), which also removes the shift |
| UI-028 | MEMBER: the Report form's coordinates were already `0,0` (not empty) on load, so "Transmit" passed validation and created a real `pending` Location at `lat 0, lng 0` | **Pre-existing, not from this PR** (`lat` initial state is `''`; the `0,0` came from a geolocation/air-quality default; `FieldReport` validation only checks `isFinite`). Separate issue recommended: reject `0,0`/require a pin or an explicit location |

**Test-data write (disclosed):** while exercising Report validation as MEMBER I clicked Transmit without first
checking the coordinates; the form submitted. Effect on BACKUP (not production): one `Location`,
id `6ade5b174365beea2ccd1286`, status `pending`, `lat 0, lng 0`, title "Billboard · Field report", created
2026-10-25T19:40:07Z by the staging member. This exceeded the "change no data" scope of the window. It was **not**
deleted by me (deleting is another data change); it needs the user's or a moderator's decision. Earlier, on
2026-10-25, I also removed the `ooh_nudge_map_report` localStorage flag in a separate production tab to show
the nudge (per-viewer convenience flag; it may have been set before).

### Identity and environment
- Staging: `https://ooh-earth-backup.base44.app` (title prefix `[STAGE]`, banner "STAGE - NOT PRODUCTION"), entry
  `index-DPrJFKDf.js` = candidate `f2e2b06` built with the BACKUP app id; 372/373 files byte-identical (only the
  host-rewritten `sitemap.xml` differs, as in earlier qualifications).
- Anonymous: isolated browser context. MEMBER: the Google chooser offered `justicejonas27@gmail.com`; Google then
  required phone verification, which I did not attempt; the user completed the sign-in. The app's visible identity
  is username `oohtestmember1`, role MEMBER, header initials "JU". The API token's subject is the justicejonas27
  address. A production login does not establish this staging session; they were separate.
- Anonymous and MEMBER at 390x844 on `/map`: sheet bottom 643 < nudge top 651; zoom in/out, Expand, Tools all
  topmost; Tools opens above the sheet, Escape closes it and focus returns to the toggle, reopen works; sheet
  expand (map inert, Collapse visible) and collapse (map usable, zoom topmost). `/report` as MEMBER: six 24x24 hint
  buttons. Not covered on staging by hand: 320px nav, short landscape, Retry/error state with real backend failure;
  those are covered by the automated specs run against the staging bytes (below).
- Specs run against the staging URL with mocked API (88 passed, 6 failed on first attempt): 1 is the new focus test
  (expected, fixed in `8762ba1`); 5 were intermittent network/timing (`ERR_NETWORK_CHANGED`, 30s load timeouts,
  a #371 lifecycle assertion): rerun serially they pass (10/11 then 11/11).

### Test environment (reproducible record)
Playwright 1.63.0, default Chrome for Testing 153.0.8010.12 (headless shell build 1243 and full chromium 1243):
`document.createElement('canvas').getContext('webgl2')` never returns on this WSL2 host (6.6.87.1-microsoft),
even on `about:blank`, so any page using WebGL (the Globe) freezes. Chrome for Testing 148.0.7778.96 (build 1223)
returns immediately. No system Chrome channel is installed in WSL. The real Chrome 155 on the user's Windows
machine renders the Globe normally (used for the DevTools checks). Chromium 148 results are **supplemental**;
they do not establish compatibility with current Chrome. GitHub Actions (supported default browser) ran the full
smoke + accessibility and mobile suites on `f2e2b06` and all passed.

### footer-nav-clearance (6 local failures)
Assertion: after `window.scrollTo(0, document.body.scrollHeight)` twice with 300ms waits, the "Open Command Center"
button's gap above the fixed nav must exceed 50px. Measured on both the live artifact and the candidate in this
environment: the page is not at the bottom when the gap is read (scrollY far from max; `html` has
`scroll-behavior: smooth` and the 4-6k px page is still scrolling), so the measured gap is negative. The same spec
passes in CI on `f2e2b06`. Users are not shown a covered control by this: the button sits above the footer
spacing once scrolling ends. Candidate does not change the behavior (identical on the live artifact). Disposition:
local timing artefact (smooth scroll), CI green; recommend making the spec wait for scroll end, as a separate
change. Owner: engineering (spec from #371).

### Zoom and device coverage
Real browser zoom could not be driven: `Ctrl+=` through DevTools does not change `innerWidth`/`devicePixelRatio`.
Emulated reflow (640x360@2, 320px width) passes and is labelled emulated. **Manual reviewer check requested:**
in Chrome open the staging URL, press `Ctrl` and `+` until the zoom badge in the address bar reads 200%, then 400%
(menu > Zoom, or Ctrl+mouse wheel), at a 1280x720 window; on `/map` and `/report` confirm no horizontal page
scroll, Tools/sheet/nudge/zoom controls stay reachable, and the Report validation message stays visible. Not
available here: a physical phone and the virtual keyboard; release policy: they are recorded as unverified
conditions for the reviewer, not as passed.

### Rollback
`~/oohearth-livefeed-rollback/dist` is R1M3 `94c79fa` (373 files, checksum list intact): it is **older** than the live
release `f062e0d` and would remove #371 and dompurify 3.4.17. The current-live artifact (373/373 files, 0 diffs
against `oohearth.app` on 2026-10-25) was copied to `~/ooh-release-records/2026-10-25/live-f062e0d-dist` with
`dist-livefeed-merged-PRODUCTION-sha256.txt` (hashes intact). Rollback for this release = deploy that directory:
`BASE44_DISABLE_TELEMETRY=1 npx base44@0.1.14 site deploy --no-build --yes --app-id 6a62213cff3ccbca88c04ff5`
from a project dir whose `dist/` is the copy. Not executed.

### Landing order
This PR first. `oohearth-cf` (`fix/unsupported-ai-claims-containment`, local) lands second after the user's
approval: it removes the `MapAlertTicker` mount and filters saved layers in `Map.jsx`; it rebases onto this PR and
re-runs its checks. `MapAlertTicker.jsx` is deleted in a follow-up.

### Final candidate on BACKUP
- Tested artifact: `57ae555e27b11b65c52202c39480005f85c49200`, BACKUP entry `index-DajQkl1k.js`, manifest `git_sha` 57ae555;
  372/373 files byte-identical to the local build with the BACKUP app id (`candidate-final-BACKUP-sha256.txt`).
  Later commits on the branch are documentation only. The production artifact is a separate build of the same sources
  with the **production** app id; asset names are content-hashed, so only the app id, `release-manifest.json` and the
  hashes derived from them differ. If the squash-merge changes any source byte, the merged commit must be rebuilt and
  re-qualified before promotion.
- Checks repeated on 57ae555 on BACKUP (real Chrome 155, MEMBER session): 844x390 map (attribution readable, controls
  above it, no nudge, all controls topmost); earlier on 6f25eab: Expand/Collapse focus handoff by mouse and keyboard
  (Enter), 320px Home (nav pill 8-312, 7 buttons inside the viewport, nudge 447-552 vs nav 564, live feed above the
  nudge: #371 intact).

## 12. Production release record (2026-10-26)

**Scope:** frontend only. No entities, functions, data, permissions or configuration changed.

| Item | Value |
| --- | --- |
| PR | #383, squash-merged into `maintenance/production-2026-10-02` |
| Merged SHA | `f63fdb1` (tree `c860f5d…`, identical to the CI-green PR head `9749669`; no app source, dependency or build-input change) |
| Review | Owner approval was given in the session. No GitHub review record exists and the branch is unprotected. |
| Artifact | Production build with app id `6a62213cff3ccbca88c04ff5`, entry `index-GursbtQf.js`, 374 files; hashes in the release records |
| Deployed | `base44@0.1.14 site deploy --no-build`, frontend only, the exact built `dist` (verified unchanged before promotion) |
| Served check | 373 of 373 non-sitemap files match the release hashes, 0 diffs |
| Previous live | `f062e0d`, entry `index-CN5akOBi.js`. Verified 373 of 373 against the saved copy immediately before deploy. |

**Checks.** Full CI on the identical tree was green. On the production-id build, the focused map and Report specs ran with supplemental Chromium 148:
- First attempt: 56 passed and 29 failed, all in the `chromium` project. The errors were `ERR_NETWORK_CHANGED`, pages not rendering and timeouts under parallel load. The log is preserved separately.
- Serial rerun: Report spec 9 of 9 and map specs 76 of 76 passed. A passing rerun does not prove the first-attempt failures were harmless, so this is recorded as the intermittent host-network pattern in issue #373.

**Live read-only smoke (390×844 emulated, Chrome 155).** I used keyboard interaction because tap clicks timed out in the isolated tab.
- Anonymous (isolated context) and MEMBER (`justicejonas`, shown in the account menu): entry bundle correct; the mobile nav sits at y=768 with the sheet header above it.
- Sheet: Expand moves focus to "Collapse sheet" (on screen) and Collapse returns focus to "Expand sheet".
- Tools: opens with focus in the panel, Escape closes it and returns focus to Tools, and it reopens.
- Map controls: zoom-in is 36px tall and attribution sits at y=601–625, clear of the sheet.
- Report: the hint opens on focus and Escape closes it (24px target). Continue advanced step 1 to 2 client-side.
- Not exercised: the nudge did not appear in these sessions, so nudge clearance wasn't checked live. The Report step 4 validation alert wasn't triggered, since it requires a submit attempt. Neither was forced.
- One 429 on an unidentified resource appeared in the MEMBER Report console.

**Accepted limitations (follow-up ledger).** Real 200% and 400% browser zoom; physical phone and virtual keyboard; a real backend-error Retry run; the stray BACKUP Location `6ade5b174365beea2ccd1286` pending decision; UI-027 sheet-shift decision; UI-028 (0,0 coordinates accepted); the Chrome 153 WebGL2 hang on WSL2.

**Rollback.** The saved current-live copy is `~/ooh-release-records/2026-10-25/live-f062e0d-dist` (373 files; hashes in `live-f062e0d-sha256.txt`). Restore means deploying that directory with the same CLI command and `--no-build`. It was not executed. The older R1M3 directory must not be used.

## 13. Follow-up to David's feedback: sheet controls, map-first list, Report basemap (2026-10-28)

Status: **local branches and draft PRs only.** Nothing is merged, staged or live; the #383 approval does not cover this.
Baseline re-verified 2026-10-28: `oohearth.app/release-manifest.json` reports `git_sha 1dbddda` (#384, built 2026-10-28T10:45Z) on
`maintenance/production-2026-10-02`, which already contains #383 (`f63fdb1`). Review units, each rebased on `1dbddda`:

| Unit | Branch | Commits |
| --- | --- | --- |
| A. Sheet interaction and map-first layout | `sheet/interaction-and-map-first` | `bbf2030` handle/drag hardening, `411f720` compact map-first state, `fc5dfb9` content-sized collapsed state + robustness specs |
| B. Basemap configuration and Report states | `basemap/config-and-report` | `75e0bb5` configuration-driven Report basemap, `07c66f4` shared CARTO key on the other raster consumers, `11e52e6` notice text |
| C. Consistency pass (combined local candidate, section 14) | `ui/consistency-pass` | merge of A and B, then its own commits |

### 13.1 What David reported

1. Listings sheet (screenshots 1 and 2): the downward chevron and diagonal arrow "don't work" (the second shows the collapsed
   sheet's upward chevron). "It might be my phone... or the cache."
2. A map-first landing with navigation over the map, listings that open and collapse, "swipe it down", referenced to Airbnb.
3. `/report`: repeated "API KEY REQUIRED" behind the pin (screenshot 3).

### 13.2 Sheet controls: what is reproduced and what is not

| Claim | Evidence | Status |
| --- | --- | --- |
| Pre-#383 build (`f062e0d`, `index-CN5akOBi.js`): Expand is dead under a **real mouse click** | Saved artifact served locally; the committed spec "mouse: expand, collapse, fullscreen and back" fails on it, and the earlier ad-hoc probe measured height 132 -> 132. Cause is UI-003 (`setPointerCapture` on the header retargets the click). Chromium's *touch tap* path passes on the same build | **Reproduced** |
| Current production (#383, `index-GursbtQf.js`, later `1dbddda`) has dead controls | Real Chrome 156, 390x844 mobile emulation, real clicks: Expand -> 743px with focus on Collapse; Fullscreen toggles `body.map-fullscreen`. Both buttons 40x40 and topmost | **Not reproduced** |
| David's screenshots predate the 2026-10-26 deploy | Consistent with the symptom; screenshot date unknown | **Unconfirmed** |
| Stale cache or service worker | No service worker in `src` or `index.html`; assets are content-hashed | **Unsupported** (not ruled out for his device) |
| iPhone / WebKit behaviour | No iPhone; Playwright WebKit would not install (host dependencies missing, needs `sudo`; not run) | **Unverified** |

`bbf2030` is **interaction hardening**, not a fix for a reproduced current-production defect. It moves the drag onto an explicit
handle button so header buttons, links and results never share a pointer target with the gesture, tracks move/up/cancel on
`window`, clears any stale live height on a committed snap change, and adds tap/Enter/arrow alternatives. It does not prove
or fix David's specific cause.

Test classification (the 18 new sheet specs, run against the untouched production build `1dbddda` with short action timeouts):

| Kind | Meaning | Specs |
| --- | --- | --- |
| Regression that fails on the reproduced old defect | fails on pre-#383 `f062e0d` | `mouse: expand, collapse, fullscreen and back with real clicks` |
| Safety net, passes on old and new | guards behaviour that already works | touch taps (3 viewports), lost pointer-up, press-and-move from a header button, map pan, reduced motion, map position/route, filter-mode toggle, results touch/wheel |
| Candidate-only behaviour | fails on production because the feature does not exist there | handle drag and keyboard, compact labelled state and Open list, inert collapsed list, cancelled touch drag, enlarged/long content, attribution/nav per snap |
| Not exercised | harness or environment limit | list **touch scrolling** (CDP touch input cannot scroll even a plain page here; wheel scrolling is tested), WebKit, a physical iPhone |

### 13.3 Map-first list

Reference actually observed: `https://www.airbnb.com/s/Bangkok--Thailand/homes` (redirected to `airbnb.co.in`), Chrome with an
iPhone user agent at 390x844, 2026-10-28 (`reference-airbnb-mobile-web-390.jpg`). Verified: map under a search pill and filter chips;
a bottom sheet with a grab-handle pill, a headline and cards; a persistent bottom tab bar; no chevron or maximise icons on the
sheet. **Not verified:** drag/snap behaviour, collapse behaviour, the native app. A web search found no first-party documentation.
No map-engine change was made to imitate it. The OSIRIS research in section 2 is reused for grouping.

Implemented on the existing peek/half/full states and the UI-027 nudge lift (no new state model):

- Fresh arrival is the existing `peek`: header-only. Floor 72px (60px short landscape), and it grows with the header's measured
  height (long or localized label, large count, text spacing), capped by the full snap, so 72px is a tested floor and not a clip.
- The handle carries the count and an explicit labelled **Open list** button (goes to `half`). Swipe is not the only way: Open list,
  Expand, handle tap/Enter and arrow keys all work. Collapsed results are `inert`; focus inside them moves to the handle.
- Real Chrome 156 on the candidate with live read-only data: 72 -> 743 -> 72 by handle drag, route unchanged.
- The result count follows the visible map area, so it can change by one when the sheet resizes the map box (existing design,
  asserted not to be stable in `map-sheet-robustness`). Map position and route are asserted to survive state changes.

### 13.4 Report "API KEY REQUIRED"

Reproduced on production in Chrome 156: the picker requests `https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`. Each
answer is **HTTP 200, `image/png`**, and the pixels are the "API KEY REQUIRED" watermark (256x256 even for `@2x`;
`before-carto-tile-as-returned-200.png`). The same bytes come back from plain `curl` with or without an oohearth.app Referer: not a
phone, browser, origin or cache effect, and not a DOM overlay. **An invalid key returns the identical bytes** (same SHA-256 prefix
`cc3f31364a73` for no key and for `?key=invalid-probe-not-a-real-key`; a probe, no account involved), so a rejected or expired key
cannot be told apart from a good map by status, headers or events.

CARTO documentation read 2026-10-28 (`https://www.carto.com/basemaps/apikey/index.html`, `https://carto.com/legal/basemap-terms/`,
terms last updated 2026-09-29): a `key` query parameter is required on every tile, style, glyph and sprite URL under
`basemaps.cartocdn.com`, raster **and vector**; free tier 5M requests/month non-commercial and 1M commercial (calendar month,
UTC); keys registered before 2026-09-23 keep working until 2026-11-30; attribution "(c) OpenStreetMap contributors, (c) CARTO"
must be prominent; keys must be the customer's own and restricted "appropriately"; proxying or server-side caching is
prohibited; CARTO may rate-limit or revoke any key without notice. The docs do not state which restriction types exist, do not
describe invalid-key behaviour, and the terms "do not explicitly address embedding keys in client-side code". Requesting a key
accepts the terms, which is an owner action; none was requested.

**CARTO consumers audited** (production, fresh isolated context, resource timing with a raised buffer, 7 s per route):

| Consumer | Routes | Requests unauthenticated CARTO tiles? |
| --- | --- | --- |
| `MapPinDropper` (hard-coded dark raster) | `/report` | **Yes, always** (6 watermarked tiles) |
| `mapStyleContext` rasters (Dark, Light, Voyager, Matrix), Leaflet flat map | `/map` Flat, portals using Leaflet | Only when a CARTO style is selected. Production's `map_style_default` is `satellite` (Esri), so default visitors do not |
| `MediaCorpsMap` rasters | `/media-corps` | Only with a CARTO style selected: 12 tiles with Dark selected, 0 with the default |
| `mapStyleContext` GL styles (MapLibre globe: `Globe3D`, `MediaCorpGlobe`) | `/`, `/map`, `/rivers`, ... | With a CARTO style selected they request the vector style, sprite and glyphs keyless; those answered 200 with real content today. Enforcement was not observed and is not assumed |

**Esri World Imagery** (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`, keyless,
returns JPEG today). Item `10df2279f9684e4a9f6a7f08febac2a9`: "licensed under the Esri Master License Agreement", credit text
"Esri, Vantor, Earthstar Geographics, and the GIS User Community" (the atlas still says "Maxar"). Esri's current developer
documentation points at an `ibasemaps-api.arcgis.com` endpoint with a token; a community answer says the keyless endpoint is not for
commercial use. **No organisational approval or entitlement for Esri exists in the repository**: the provider first appeared in a
`base44-builder[bot]` commit on 2026-08-03 and the only mention is a CSP allowlist entry. So the Esri switch is **not** the
default: it is an explicit build-time opt-in.

Change (unit B): `src/lib/basemapProvider.js`.

| Build configuration | `/report` picker |
| --- | --- |
| No key, no opt-in (default) | No provider is contacted. The map is replaced by a `role=status` panel ("Map background unavailable...") with an **Open coordinate fields** button; search, Locate me and manual coordinates keep working |
| `VITE_CARTO_BASEMAPS_KEY` set | Keyed CARTO tiles, CARTO + OpenStreetMap attribution |
| No key + `VITE_REPORT_BASEMAP_FALLBACK=esri` (owner opt-in) | Esri imagery with the service credit text |
| Any provider, 3 tile errors in a row | Notice with **Retry basemap** and the same button; any tile loading again clears it; pin and coordinates are untouched |

Other raster consumers get the same key via `withCartoKey()` (unchanged without a key). Vector styles are not touched.
**Limit, by design:** only HTTP/network failures raise `tileerror`. An HTTP-200 error image (no key, invalid or expired key) is not
detectable, no watermark detector, OCR or retry loop was added, and provider choice is therefore a configuration decision plus visual
verification of real imagery. Any `VITE_*` value is readable by every visitor: use only a key issued for browser use and restricted to
our domains in CARTO's dashboard, never a privileged key. Specs run against three builds (no key, Esri opt-in, placeholder key
`test-key-not-real`): 2 + 8 + 10 pass; the "unconfigured" spec fails on the production source.

**Owner decisions (David / project owner):** (1) request a CARTO key, accept the terms and choose commercial vs non-commercial
(commercial above 1M/month is paid), and confirm that a browser-embedded key is acceptable to CARTO; (2) confirm Esri's terms for
the Report picker before setting the opt-in, and decide the attribution text; (3) until then the default build shows no map in
Report, by design.

### 13.5 Verification and limits

Chromium 148 (Playwright build 1223; WebGL hangs on 153 in this WSL2 host), local `vite preview`, mocked API unless stated.
Unit A: 58 + 45 specs green (sheet, first-sheet, robustness, bottom region, overlay layout), `npm run typecheck`, eslint; classified against production in 13.2.
Unit B: provider modes as above, 5 `node --test` unit tests, existing Report/MediaCorps specs (one pre-existing failure,
`report-release-r1m2` "short landscape", reproduces identically on the production source). Real Chrome 156 on the earlier
candidate: Open list, collapse, handle drag both ways, Report tiles. **Not verified:** a physical iPhone or any WebKit; list touch
scrolling; real browser zoom; BACKUP or MEMBER state; short landscape with changing browser chrome. The Chromium results are
supplemental engine coverage, never an iPhone test.

**David's device checklist (iPhone):** (1) open `/map`; (2) tap the chevron and the diagonal arrow and confirm the sheet and bottom bar
respond; (3) tap **Open list**, scroll the list with a finger, collapse it; (4) drag the grab bar up and down; (5) rotate to
landscape and repeat; (6) open `/report` and inspect the map area; (7) tell us the iOS and browser version and any action that failed.

### 13.6 Rollback

Nothing is deployed. Discard with `git worktree remove` for the three worktrees and deleting their branches. A later deploy would use the
section 12 rollback (`~/ooh-release-records/2026-10-25/live-f062e0d-dist`) only if that artifact is still the previous live one; recheck
production first, because #384 has shipped since.

## 14. Coordinated consistency pass (reference v1.0, 2026-10-28)

Specification: [`OOH-UI-UX-REFERENCE.md`](./OOH-UI-UX-REFERENCE.md) (labels: **OBSERVED** OSIRIS source, **STANDARD** WCAG 2.2,
**PROJECT** proposed OOH rule). Status: **local candidate and draft PRs only. Not merged, not staged, not live.** The #383
authorization is historical; no BACKUP window or production reservation exists for this pass. Candidate: branch
`ui/consistency-pass` @ the SHA recorded in the PR (build `release-manifest.json` `git_sha`), based on production `1dbddda`, built
locally with Vite and served from `vite preview`; nothing was deployed.

### 14.1 Source verification

All five pinned OSIRIS blobs were re-fetched at commit `59634bc2cbe418c64b258548eeda8f056b4823d0` and match the reference
(`globals.css cc33c750...`, `page.tsx e557eb6f...`, `LayerPanel.tsx 037ce4fc...`, `SearchBar.tsx c7fb0213...`, `GlobalStatusBar.tsx 837fd3c8...`).
Sampled symbols match: `useIsMobile` `page.tsx:59`, Escape `LayerPanel.tsx:231`, `aria-pressed` 304/494, `aria-expanded` 404. License MIT.
Upstream `master` has moved to `f0919b8`, as the reference cautions; nothing was copied, only patterns adapted. OSIRIS is a source
study, not a conformance standard.

### 14.2 Inventory (this branch, counted from source)

- 90 `<Route>` entries in `App.jsx`; 396 `.jsx` files. Legacy fixed-pixel text below 12px: 2,457 uses of `text-[6..11px]` in 260 files
  (`text-[10px]` 897, `[9px]` 776, `[11px]` 425, `[8px]` 301, `[7px]` 66, `[6px]` 26). `text-dim` is used 1,009 times (20 as placeholder).
- Shared consumers: `Nav` is imported by 74 files, `MobileBottomTabs` 1, `MobileHeader` 3, `ClimateClock` 2, `LiveActivityFeed` 1, `LocationCard` 3,
  `MapBottomSheet` 2. A blanket replacement was **not** attempted (the reference forbids it): roles are opt-in and adopted slice by slice.
- Measured routes (6 of 90): `/`, `/map`, `/report`, `/media-corps`, `/plans`, `/support`, at 11 viewports (320x640, 360x800, 390x844,
  430x932, 768x1024, 820x1180, 1280x720, 1366x768, 1440x900, 667x375, 844x390), mocked API, anonymous. **The other 84 routes were not
  measured**, including dashboards, detail pages and scanners; no route paths were invented.

### 14.3 Token map

| Role (reference section 3) | Existing token / class | Contrast or note | Proposed role (added) | Consumers adopted |
| --- | --- | --- | --- | --- |
| Control text, form labels 14-16px | `text-[11px]` mono uppercase, tracking .2-.3em | fixed px, ignores browser text size | `text-ooh-control` (0.875rem, lh 1.45), tracking .1-.12em | Report step 1, sheet buttons, map notices |
| Secondary metadata 12-14px | `text-[7..10px]` | | `text-ooh-caption` (0.75rem, lh 1.4) | sheet header and summary, result-card link |
| Body 16px / section 18-20px / page 24-32px | `text-sm`, `text-lg`, hero sizes | | `text-ooh-body`, `text-ooh-section`, `text-ooh-page` (clamp) | none yet (defined, tested) |
| Readable secondary text | `text-dim` `--c-dim` 102 gray | **3.66:1 on void, 3.45:1 on card (dark): below 4.5:1**; `/50-/70` variants 1.7-2.3:1; light theme 88 gray passes (6.5:1) | `text-quiet` `--c-quiet` 138 gray: 6.08:1 void, 5.73:1 card; light 88 | sheet icons, Report step 1 |
| Space scale 4..48 | ad hoc | | `--ooh-space-1..7`, Tailwind `p-ooh-1..7` | unused beyond tokens (no existing spacing rewritten) |
| Page inset 16/24/32, panel pad 16/24 | ad hoc `px-4`/`px-6` | | `--ooh-page-inset`, `--ooh-panel-pad` (media queries at 768 and 1280) | none yet |
| Tap target >= 44px | `h-10 w-10` (40px), `min-h-8` (32px) | | `min-h-ooh-target` / `min-w-ooh-target` (2.75rem) | sheet buttons, Report chips and Locate me, result-card link |
| Panel primitives | per-component flex stacks | | `.ooh-panel`, `__header/__body/__footer`, `.ooh-actions`, `.ooh-icon-button` (scoped, opt-in) | none yet |

Tested in `src/lib/uiTokens.test.js` (rem roles, contrast of `--c-quiet` in both themes, 44px target role).

### 14.4 Slices (separately reversible commits on `ui/consistency-pass`)

| Slice | Commit subject | Content disposition |
| --- | --- | --- |
| Foundation | `feat(ui): semantic type/space/target roles...` | nothing removed; opt-in |
| Map sheet and result cards | `feat(ui): map sheet and result cards adopt the type/target roles; list-based wording` | **Keep visible:** count, Open list, Expand/Collapse, Fullscreen. **Relocate:** none. Names: Expand list / Collapse list / Resize list; `PAGE` -> `View listing` (accessible name includes the place); count states its scope ("in view") for the ads layers where it is viewport-filtered. **Kept as is:** Fullscreen map / Exit fullscreen (it hides app chrome and does not resize the list, so the reference's "Expand list / Restore list size" would misdescribe it); Retry view (the action retries street-view evidence, not "this area"). Renaming the sheet buttons changes accessible names relied on by 6 e2e files here and by specs on other branches (1 file on `main`) |
| Report step 1 | `feat(ui): Report step 1 adopts the type roles; specific location-failure messages` | **Keep visible:** every label, help and privacy sentence (privacy guidance 12px -> 14px). **Added:** denied / unavailable / timeout / unsupported location messages (previously a silent failure), `role=status` |
| Measurement | `test(ui): route x viewport measurement matrix` | none |
| Shared header strip | **deferred**, branch `ui/header-strip-roles-DEFERRED` | see 14.6 |

### 14.5 Measured before / after (Chromium 148, local preview, anonymous, mocked API)

"Before" is the production source `1dbddda`; "after" is the candidate without the deferred header slice. Sums over the 11 viewports.
Counts are DOM measurements, not a score: *controls* are visible buttons, links and fields; *text* is visible text elements; contrast is
computed against the nearest opaque ancestor and skips text over images/gradients (a lower bound).

| Route (sum over 11 viewports) | h-scroll states | controls <24px | controls <44px | text elements <12px | low-contrast text (of measured) |
| --- | --- | --- | --- | --- | --- |
| `/support` | 0 -> 0 | 93 -> 93 | 520 -> 520 | 971 -> 971 | 143/1014 -> 143/1014 |
| `/plans` | 0 -> 0 | 27 -> 27 | 391 -> 391 | 685 -> 685 | 61/1279 -> 61/1279 |
| `/media-corps` | 0 -> 0 | 66 -> 66 | 323 -> 323 | 272 -> 272 | 13/338 -> 13/338 |
| `/report` | 0 -> 0 | 38 -> 27 | 595 -> 432 | 890 -> 626 | 94/1000 -> 61/978 |
| `/map` | 0 -> 0 | 23 -> 23 | 653 -> 381 | 1990 -> 1454 | 223/2421 -> 223/2429 |
| **five routes (Home excluded: noisy)** | 0 -> 0 | 247 -> 236 | 2482 -> 2047 | 4808 -> 4008 | 534/6052 -> 501/6038 |

Reading it honestly:
- No horizontal page scroll in any of the 66 states before or after (asserted by the spec).
- `/report` improves in every column and `/map` improves in controls under 44px (653 -> 381) and small text (1,990 -> 1,454). The `/map`
  low-contrast count does not move (223): the sheet is a small part of that route.
- `/plans`, `/support` and `/media-corps` are unchanged: no slice touches them.
- **Home is not reported.** On the unchanged production build Home varied between 967 and 1,294 small-text elements across three identical
  runs (and one state captured a half-rendered page), so its before/after deltas are noise. The other five routes reproduced exactly on repeat
  (`/map` and `/report` baselines were identical across two runs; `/report` "after" counts varied by up to about 35 between runs, so treat its deltas as approximate).
- Measured counts are not a coverage percentage: the denominator is 6 routes of 90.

Evidence in `docs/design/evidence/consistency-pass/`: `before-after-*.jpg` (left = production, right = candidate) for `/map` and `/report` at
320x640, 390x844 and 1280x720, the Report form at 320 and 390, and `matrix-before.json` / `matrix-slices123.json` (all 66 states each).
Whole-screen inspection found two things geometry did not: the deferred header slice's height growth (14.6), and, in both before and
after, the map's "DRAG - SCROLL TO ZOOM" hint sitting under the zoom buttons at 320px (pre-existing, not changed).

### 14.6 What was tried and backed out

The shared header strip (`ClimateClock` 7-8px, `LiveActivityFeed` 8-9px and `text-dim/70` at 2.3:1, `MobileHeader`) was moved to the new roles.
Whole-screen comparison showed the strip **grew about 15-20px** and the ticker wrapped to three lines at 320px, contrary to the commit
message, and the map layout specs had not been run against that build. Fixed top padding (7rem) is reserved for the header on many
routes and short landscape already has a 188px chrome budget problem (UI-012), so this needs a coordinated header/nav budget decision,
not a text-size change. It is reverted in the candidate and kept on `ui/header-strip-roles-DEFERRED`.

### 14.7 Verification run on the exact candidate

Candidate `cf35157` (`ui/consistency-pass`; `release-manifest.json` `git_sha` of the local build), Chromium 148 (Playwright build 1223), 2 workers,
local `vite preview`, mocked API. First run of 14 spec files (sheet controls, map-first, robustness, bottom region, overlay layout, Report
basemap, location messages, Report clarity, live-activity, live-feed/nudge overlap, nav menu, footer targets, operative typography, media corps):

- **138 passed, 1 failed, 12 skipped.** The 12 skips are the Esri-opt-in and CARTO-key modes of `report-basemap`, which need differently
  built bundles and were run separately on the basemap unit (2 + 8 + 10 passed).
- The 1 failure was `map-sheet-robustness` "touching or scrolling the results never resizes the sheet": the wheel-scroll assertion timed out at 5 s
  under load. It passed 2 of 2 when rerun serially. The first-run failure is kept here; it is not claimed to be fixed.
- Earlier first-run failures on the previous build, kept for the record: `map-bottom-region` 844x390 flat (30 s page-load timeout) and
  `map-sheet-robustness` attribution/nav (timing); both passed serially.
- `npm run typecheck` clean; eslint clean on `src`; `node --test` for tokens and provider: 8 pass.
- Pre-existing, unrelated: `report-release-r1m2` "short landscape" fails identically on the untouched production source (smooth-scroll timing).
- Not run on this candidate: `a11y.spec.ts`, `smoke.spec.ts` and the wider suite; CI on the draft PRs is the authoritative check.

### 14.8 Unavailable coverage and owner decisions

Not verified: a physical iPhone or any WebKit (Playwright WebKit needs `sudo apt` host dependencies; not run); real browser zoom at
200% and 400% (emulation only); virtual keyboard and changing browser chrome; MEMBER state; BACKUP; list touch scrolling; contrast over
images and gradients; Home, dashboards, detail pages, scanners, `/plans` and `/support` slices (measured, not changed).
Decisions: (1) adopt the 12px floor in `UI-STANDARDS.md` as the new minimum for migrated surfaces (it currently says 10px is
the floor); (2) a header/nav chrome budget that allows a 12-14px clock/ticker (UI-012); (3) whether `--c-dim` itself should be lightened
globally instead of migrating 1,009 uses to `text-quiet`; (4) the CARTO and Esri decisions in section 13.4; (5) accept the renamed
sheet accessible names, which other branches' specs may reference.

## 15. Release preparation after the design decisions (2026-10-29)

Status: **draft PRs, local and BACKUP-staged candidate only. Not merged, not live.** Sections 13 and 14 are history; where they
differ from this section, this section wins (see 15.10).

### 15.1 Approved decisions and how they were applied

David delegated the design decisions on 2026-10-29. Applied as project defaults, not WCAG minimums:

| Decision | Applied | Documented exceptions |
| --- | --- | --- |
| Typography: 16px instruction/body, 14-16px labels and controls, 12px only for genuinely secondary metadata, sparingly; existing fonts and brand; rem roles | Report step 1: labels and chips 14px, privacy/photo instructions 16px (`text-ooh-body`). Sheet summary, Open list, status/Retry and the result link 14px. Ticker headlines 14px. 12px kept for the LIVE label, BKK, source tag and the md+ countdown | Unmigrated surfaces keep their legacy sizes (2,457 `text-[6..11px]` uses in 260 files were not blanket-replaced); e.g. a few Report form sub-components (photo picker) still render 11px labels. The Report map hint, attribution credit ("Maxar") and OSIRIS-style dense labels elsewhere are unchanged |
| Contrast: keep `--c-dim` for decoration, `text-quiet` for readable secondary text, migrate by role | `text-quiet` (6.08:1 on void) used in Report step 1, sheet icons, ticker source/loading text. `--c-dim` not touched; ~1,000 uses not auto-replaced | Text over the map and imagery was not contrast-measured (the matrix skips images/gradients) |
| Header/navigation: keep the deployed footprint as the budget; no growth; secondary clock/ticker detail into a labelled disclosure on constrained screens; do not clip | Header 96px below md, 98px from md up and a 31px telemetry strip (measured on production `1dbddda`); candidate stays inside it at 320, 390, 767, 768, 844 and 1280 (spec asserts it); on staging at 844x390 the header measured 97px. Below md the clock is a labelled disclosure holding the countdown, PM2.5 and coordinates; the earlier 15-20px growth slice is not used | The disclosure target is 31px tall (strip budget) by 130px+ wide: above the 24px AA floor, below the 44px target; deliberate |
| Sheet wording: "Expand list" / "Collapse list"; exact label for the diagonal arrow; no "Resize list"; no browser-fullscreen claim; preserve handle, buttons, focus return, content-sized compact state | Expand list / Collapse list; handle "Open or close the list (drag, or use arrow keys)"; diagonal control **"Full-screen map (hides navigation)" / "Exit full-screen map (shows navigation)"** | **Deviation, deliberate:** the decision's examples ("Expand list to full height", "Restore list size") describe a list resize, but this control hides the app header and navigation and does not change the list's snap; those labels would be wrong. The chevrons carry the list expand/collapse actions. The map toolbar button that triggers the same action got the same label (it previously shared the name "Fullscreen map" with the sheet button) |
| Fresh mobile map entry map-first with an obvious labelled way to open results; preserve return state, filters, selection, map position | 72px (60px short landscape, content-sized) handle with "// N ads in view" and an **Open list** button; state lives in `Map.jsx` and is asserted across collapse/expand (map position, route; the in-view count legitimately follows the visible map area) | Selection highlight is not asserted automatically (harness could not resolve the card style); filter-mode toggle persistence is |

### 15.2 PR graph after the restack (heads at the time of writing)

| PR | Branch @ head | Base | Content | Depends on provider? | CI |
| --- | --- | --- | --- | --- | --- |
| #394 | `ui/consistency-pass` @ `be64187` | production line | tokens + `text-quiet` + panel primitives, Report step 1 slice, location messages, measurement matrix | no | see PR |
| #392 | `sheet/interaction-and-map-first` @ `540dc06` | production line (first 4 commits are #394's) | handle, map-first compact state, content-sized height, inert collapsed list, role adoption, exact labels, robustness specs, `map-my-discoveries` fix | no | see PR |
| #396 | `ui/header-status-disclosure` @ `a17832c` | production line (first 4 commits are #394's) | telemetry strip footprint-preserving type roles + status disclosure | no | see PR |
| #399 | `test/stabilize-live-feed-nudge-spec` | production line | test-only fix for a pre-existing racy spec (15.11); land first | no | see PR |
| #398 | `candidate/ui-release-staging` | production line | **do not merge**: #394 + #392 + #396 combined, exists for CI and staging | no | see PR |
| #393 | `basemap/config-and-report` @ `8cba6d5` | production line | provider repair | **blocked** (15.3) | passed on its head |
| #395 | `docs/ui-reference-and-followup-ledger` | `docs/ui-fixes-release-record` (#387) | this ledger and evidence | no | none (docs base) |

Why the bases: the repository's CI runs only for PRs into `maintenance/**` and `main`; PRs stacked on another feature branch got no checks at all (#392 and #396 had none until retargeted). #394's earlier head also failed CI (reproducible `map-my-discoveries` failure: that spec looked the result-card link up by its old "PAGE" name, plus Prettier on two specs); both were fixed. Peers: #389, #390, #391 (other session) touch CI scripts, `fieldNews` and `scanAd`/`ReportStep2Identify`; no file overlap with these units. No peer branch was modified.

### 15.3 Provider: verified state and the exact dependency

Checked by name only, no values read: GitHub Actions secrets and variables (none), repo env files and `.github` (no CARTO key), Base44 secrets list (nothing returned), docs (only a CSP allowlist line). **No CARTO key, secret, variable or approved entitlement exists to use.** An invalid key returns the same watermark bytes as no key, so a non-empty `VITE_CARTO_BASEMAPS_KEY` would not be evidence of a working map. Nothing was registered, accepted, purchased, proxied or substituted; Esri and public OSM tiles were not enabled.

So #393 stays separate and is marked BLOCKED. Its default behaviour (no key: honest "Map background unavailable" panel instead of a map) removes useful behaviour and must not ship incidentally; none of #394, #392, #396, #398 contain provider code (checked by diff). **In the staged candidate `/report` still shows the CARTO watermark.** Exact account dependency: the account owner requests a browser key (accepting CARTO's 2026-09-29 terms; 1M/month free for commercial use, paid above), restricts it to our domains, sets `VITE_CARTO_BASEMAPS_KEY` at build time, and a person then verifies real imagery in a browser; or approves Esri World Imagery (opt-in flag) after confirming its terms.

### 15.4 The 12 skipped tests, individually

All 12 are in `report-basemap.spec.ts` (7 tests x 2 viewports), which belongs to #393 only, so they are not part of #394, #392, #396 or #398 (those runs had 0 skips). Provider choice is a build-time setting, so each build mode runs only its own tests:

| Test (x2 viewports each) | Skipped in default mode because | Where it ran |
| --- | --- | --- |
| Esri opt-in: Esri tiles only, credit text, pin works | needs `VITE_REPORT_BASEMAP_FALLBACK=esri` | Esri build: 8 passed |
| CARTO key: every request keyed, CARTO + OSM attribution | needs a key build (placeholder `test-key-not-real`) | key build: 10 passed |
| CARTO key: an HTTP 403 answer is reported | needs the key build | key build |
| Network failure: notice, pin and coordinates survive recovery | needs a provider that issues tile requests | Esri and key builds |
| Partial failure (2 tiles) is not an outage | same | Esri and key builds |
| A tile that loads again clears the notice | same | Esri and key builds |

Remaining coverage gap: no real key exists, so keyed imagery was never visually verified; the 200-OK watermark is undetectable by design (no detector, OCR or retry loop).

### 15.5 Test results and first-run failures (Chromium 148, Playwright build 1223; not an iPhone, not WebKit)

| Run | Result | First-run failures kept |
| --- | --- | --- |
| Sheet unit `513b5b3` (8 spec files) | 119 passed, 0 failed, 0 flaky, 0 skipped | none |
| Header unit (15 spec files, before the typography commit) | 131 passed, 1 failed | `report-release-r1m2` short landscape: **pre-existing**, fails identically on the production source |
| Integration candidate `0c78cec` (19 files, before the typography commit) | 166 passed, 3 failed | `map-bottom-region` real-click spec: 30 s page-load timeout (passed 2/2 serially); `telemetry-status` keyboard spec: header not found within 5 s of navigation (my spec's wait was too short for the lazy Report chunk; fixed); `report-release-r1m2` as above |
| **Integration candidate `6f21272` (21 files)** | **173 passed, 2 failed** | `report-release-r1m2` as above; `location-detail` "revisiting via client-side nav" under 2-worker load: **4/4 pass serially on the candidate and 4/4 on the untouched production source**, so it is load-sensitive and not a candidate regression |
| Staged bytes `df5f287` (10 files, mocked API) | 139 passed, 4 failed | `ERR_NETWORK_CHANGED` on `/map`; a 30 s load timeout; sheet "keyboard: handle arrows" and "enlarged text" timing. The last two passed **3/3 serial reruns** (5 tests each) on the staged corrected build `6f21272`; the enlarged-text spec measured before the 0.32 s height transition settled and now waits (`540dc06`) |

CI on the real heads (all 10 checks each, including Playwright smoke + accessibility and mobile Chromium) finished green on #394 `be64187`, #396 `a17832c`, #398 `bf9bf6b`, #399 `8e23975` and #392 `540dc06`; #392's smoke job failed 3 of 3 attempts on the pre-existing nudge race (15.11) and passed on rerun, so that first-run failure stays on record. #393 passed on its own head earlier. `npm run typecheck` was clean on the earlier candidate; eslint and Prettier are CI gates.

### 15.6 Whole-screen review in Chrome DevTools (real input where the machine allowed it)

Candidate on a read-only local proxy (live data) and on BACKUP, 320x640, 390x844, 844x390 landscape. Real pointer clicks, a real mouse drag and real key presses were used on BACKUP: Open/Expand list -> 743px with focus on Collapse list, Collapse list -> 72px with focus on Expand list and the list inert, handle drag up -> full, header disclosure open/Escape with focus return, full-screen control in and out (header hidden, label flips), map peek, Report at 320 (labels 14/16px, 44px type chips, no horizontal scroll), short landscape (97px header, 157px map band, 60px sheet, attribution clear). Findings: (1) **pre-existing, identical on production:** with full-screen mode and the sheet at full height only ~240px of map remains and its hint chip and zoom row crowd the toolbar and attribution; not changed here; (2) while the spec runs loaded the machine, pointer clicks through the DevTools tool timed out ("element did not become interactive") and sheet height transitions measured stale values in an occluded window; they worked on retry and the heights settled, so this is a harness/load effect, but it is recorded; (3) the Report picker still shows the CARTO watermark by design (15.3).

### 15.7 Staging (BACKUP) and rollback

- App `6a6748e009b947cb29591871`, `https://ooh-earth-backup.base44.app`, frontend only. Reservation: appended to `~/ooh-release-records/2026-10-29/BACKUP-RESERVATION.md` (window 2), after `oohearth-11` posted "scanAd window closed, BACKUP free"; it keeps the third slot (Step 2/UnitFinder preview) after mine. BACKUP's `scanAd` already runs its hardened function-only candidate.
- Preserved before any deploy: the 372 files served at the time (manifest `5c81a80`, entry `index-DoInAKbd.js`) in `backup-before-ui/`, hashes identical to the recorded 5c81a80 BACKUP hashes except the host-rewritten `sitemap.xml`.
- Deployed `df5f287`, then the corrected `6f2127298f18568c9b4a12f3208b71ce77ee306f` (manifest `git_sha 6f21272`; later commits are test-only). Served bytes vs the candidate's hashes: 371/372 identical, `sitemap.xml` differs (host-rewritten, as in earlier windows).
- **Rollback drill on the real BACKUP:** deployed `backup-before-ui/` at 14:12Z -> served manifest `5c81a80`, entry `index-DoInAKbd.js`, **372/372 files identical** to the preserved pre-state (0 differing entries). The candidate was then redeployed and verified again. Command: `BASE44_DISABLE_TELEMETRY=1 npx base44@0.1.14 site deploy --no-build --yes --app-id 6a6748e009b947cb29591871` from a project dir whose `dist/` is the directory to serve.
- No data, entities, functions or automations were touched. No production deploy, no production writes.
- **Anonymous: done** (isolated context, real input, plus specs against the served bytes with a mocked API). **MEMBER: not done.** It needs the owner to sign in on the BACKUP origin in the browser context used for testing (the earlier sanctioned test identity); no credentials were created or used, and no Transmit/submit is to be clicked (a prior window created a stray pending Location that way).
- BACKUP currently serves the candidate. Final restore (verified) will be posted in the reservation file after the MEMBER pass or when `oohearth-11` asks for the slot.

### 15.8 Coverage that remains unavailable

WebKit (Playwright needs `sudo apt` host dependencies; not installed), a physical iPhone, real browser zoom at 200% and 400%, virtual keyboard and changing browser chrome, MEMBER state, contrast over map imagery, list touch scrolling (CDP touch cannot scroll even a plain page here), and every route except the six measured (84 of 90). Counts in section 14.5 are pooled across routes and viewports: measurements, not unique defects or proof of usability.

### 15.9 Proposed landing order

0. #399 (test-only race fix). 1. #394 (foundation + Report step 1). 2. #392 and #396 in either order, rebased (their first commits disappear). 3. #393 only after the provider decision. Before any production step: recheck production (it moved to `1dbddda` during this work), preserve current live bytes, obtain a fresh joint reservation, and re-run required checks on the final heads. This section does not authorise a merge or a production deploy.

### 15.10 Corrections to earlier sections

Section 14.4 listed `Resize list`; it is now "Open or close the list (drag, or use arrow keys)". The shared header slice in 14.6 stays unused; the replacement is #396. Section 14's "slices" lived on one branch that also contained the provider commits; the units are now separated (15.2). In section 13.5 "Unit A" results were for the earlier build; 15.5 has the final-build runs.

### 15.11 CI findings on the final heads (2026-10-29)

Required CI ran on the real heads after the stacked PRs were retargeted (CI only triggers for PRs into `maintenance/**` or `main`).

| Finding | Evidence | Cause and disposition |
| --- | --- | --- |
| #398 `mobile-chromium` failed on `portal-ops-geo-intelligence.spec.ts:107` (`getByLabel('Status')` resolved to 2 elements) | CI log; reproduced by name: the phone-width header disclosure button was labelled "Climate clock and **status** details" | **Real candidate regression** (header slice #396). Names are now "Climate clock and air quality details" / "Climate and air quality details" (`a17832c`); the full `mobile-chromium` project then passed locally (134 passed; the only failure is the pre-existing short-landscape smooth-scroll test) and passed in CI. No other generic `getByLabel` lookups in `e2e/` collide (grep) |
| #392 smoke job failed on `live-feed-nudge-overlap.spec.ts:100` "dismiss control is a 44px target..." (3 of 3 attempts: persisting header/nudge overlap and a 43.99997px height) | CI log; local repeat on Chromium 148, serial x6 | **Pre-existing race, not these changes:** it fails **6/6 on the untouched production source** and 5/6 on the candidate, because it reads bounds once while the nudge animates in. It passed in CI on #393 and #394 by timing. Fixed test-only in its own PR #399 (polls until settled): 6/6 pass on both builds. #399 should land first. The CI rerun of the failed job and the retained first-run failure are both on record |
| #394 (foundation + Report step 1) CI | all checks passed on `be64187`, including smoke + accessibility and mobile | none |

The staged candidate on BACKUP was redeployed from `bf9bf6b` (includes the name fix): served manifest `git_sha bf9bf6b`, 371/372 files identical to the build's hashes (`sitemap.xml` host-rewritten).
