---
name: ooh-premium-ui
description: Use when changing, polishing, auditing or reviewing OOH Earth UI (map, adbusting portal, Home, Report, sheets, overlays, dialogs, buttons, HUD panels, loading/empty/error states) on mobile or desktop. Use it whenever the user asks for a more premium, smoother, non-overlapping or less cluttered interface, a UI/accessibility audit, a touch-target or clipping check, or proof that a UI fix works, even if they do not name this skill. Keeps the brand identity, accepts work against docs/design/UI-STANDARDS.md, and requires measured, source-pinned evidence before claiming a fix.
---

# OOH Earth premium UI pass and audit

Premium here means: nothing overlaps, every control is reachable, feedback is immediate and truthful, and the brand
stays recognisable. It does not mean new colours, fonts or extra animation. This skill is a procedure for a Claude
session; it does not deploy, merge or run by itself. Nothing here is active CI until a check is added to the
workflow and has run.

## Standing priority: phone first
Design and test for phones first, in this order: **320px portrait, 390px portrait, 844x390 landscape, then desktop**
(desktop is a regression check; keep its specs running). Primary actions must be readable and easy to tap, clear of
overlays and bottom navigation, with natural scrolling and focus preserved. If space is tight, **reflow** controls or
move secondary information behind a **labelled disclosure**; do not shrink text or touch targets, and do not enlarge an
invisible hit area into neighbours. Verify actual interactions, not just screenshots. Record **physical-phone checks
separately from emulation**; emulation never substitutes for them. (`docs/design/UI-STANDARDS.md` section 0.)

## 0. Read before editing (do not skip)
1. The route and the component that owns the surface: `grep` the visible text/aria-label, open the owner, list every
   consumer of any shared component (`PortalShell` has 5). Say who owns the thing you are about to change.
2. `docs/design/UI-STANDARDS.md` (rules tagged **[Standard]** vs **[Preference]**; WCAG 2.2 AA is the floor) and the
   single ledger `docs/design/UI-Fixes.md` (never start a second one; IDs are allocated there).
3. `docs/design/OOH-UI-UX-REFERENCE.md` for the OSIRIS study. OSIRIS is a **pattern** source only, pinned at
   commit `59634bc2cbe418c64b258548eeda8f056b4823d0` (links in that doc): grouping, hierarchy, height-aware compact
   mode, bounded panels (`min-h-0 overflow-y-auto`), `aria-pressed`/`aria-expanded`, Escape to dismiss. Never copy its
   5-9px labels, fixed offsets, root `overflow:hidden`, hover-only affordances, or branding. **Acceptance is OOH
   standards, never "looks like OSIRIS".**
4. The source SHA you are auditing and which artifact it maps to (`release-manifest.json` `git_sha`, tree hash). Old
   evidence from another SHA is history, not proof for this one.

## 1. Identity is fixed
Black void, ozone `#EDFF00`, flare `#FF5C00`, IBM Plex Mono labels, Inter Tight body, Orbitron marks, square corners.
Use token classes; add no new hex. Smallest informational text is 10px (the "Label · Mono" step); 9px and below
only for decorative labels. Targets: >= 24px is the WCAG 2.5.8 floor; 32px secondary and 40px primary are project
targets; 44px is the aim when a control is redesigned. Evaluate the WCAG criterion and the project target separately and
say which one a result meets.

## 2. Audit order (stop adding checks once the top items are clean)
Priority: **blocked actions > lost focus > clipped/unreachable information > runtime errors > regressions vs the live
baseline > visual nits.** Do not spend effort on nits while a higher class is open.
1. **Whole screen first.** Screenshot the full viewport before any measuring (DevTools MCP `take_screenshot`, or
   Playwright). Look at it. Overlaps that numbers miss (text over text, panels under controls, chrome eating the
   box) are usually visible at a glance.
2. **Then measure** (probes in `references/measurement-probes.md`): bounding boxes of the owning container and every
   overlay; clipping (`rect` inside the container, `scrollHeight` vs `clientHeight`); **scroll ownership** (which
   element scrolls, whether the document does, whether the last item clears bottom chrome); **hit areas by
   `elementFromPoint` sampling**, never by reading CSS or the element's own rect: pseudo-element extensions
   (`::before`) are invisible to `getBoundingClientRect`. Record the *rendered* target (w x h, edges) and its clearance
   from neighbouring actions, the title and adjacent rows. A claim like "44px target" is only valid if the sampled
   area says so. **Hit-testing is not painting:** shared chrome with `pointer-events:none` (tickers, scrims) can paint
   *over* a control that `elementFromPoint` still reports as topmost, so the control is clickable but invisible. For every
   new control, also run the paint check (probe F) and look at the whole-screen screenshot.
3. **Exercise real input**: pointer, keyboard (Tab order, Enter/Space, Escape, focus return), touch where the device
   has it. DevTools MCP `emulate` with `mobile,touch` is **emulation**: label it so, and never count it as a physical
   iPhone/Android pass. If the release gate requires a physical device, report the gap; do not infer a waiver.
4. **Semantics**: accessible names on icon-only controls; `aria-pressed`/`aria-expanded` state; labels associated with
   fields (`for`/`id`), errors tied with `aria-describedby` + `aria-invalid`, announced (`role="alert"`), focus lands
   on the invalid field; dialogs closable by Escape and Cancel; focus returns to the opener.
5. **Readability**: computed font-size (flag < 10px), contrast of text on its real background, and whether the final
   reachable content (last list row, last panel row) is actually reachable.
6. **Viewports, in this order**: 320x640, 390x844, 844x390 (short landscape; this one finds collisions), then desktop (1280x800).
   Anonymous and MEMBER, or a mocked user via `e2e/fixtures/mockBase44.ts`. Both Flat and Globe where a map is shown,
   switched at mid-zoom, plus LIST/MAP/SPLIT.
7. **Baseline**: capture the live artifact at the same viewport and comparable state before calling anything a
   regression or a pre-existing defect. Say which one you established and how.

## 3. Fix and prove
1. Reproduce each defect first (numbers + screenshot) and write down the exact failing measurement.
2. Smallest scoped fix at the owning component. Opt-in/route-scoped where the component is shared (do not grow shared
   chrome or take over the unrelated UI-012 budget). Never fix layout with global `overflow:hidden`, blocked
   `touchmove`, disabled zoom, or an invisible hit-area extension into neighbouring actions.
3. Add a regression that **fails on the old build for the real reason** (same measurement as step 1), keep the first
   failure on record, and run it on the new build. A test that only fails because new markup is missing does not prove
   the old defect.
4. Prefer stable Playwright assertions (`e2e/*.spec.ts`, mocked backend, specs run against `npm run build` + preview;
   rebuild after every source change; use `--workers=1` locally for WebGL-heavy pages). Use DevTools MCP for visual and
   interaction evidence. **Writes, uploads, AI/paid calls and failures are mocked.** Never submit a real claim, upload,
   or create a record on BACKUP or production.
5. Promote a check to required CI only after it is reliable (repeat runs, no timing sleeps as the assertion).
   No automatic production deployment from this skill.

## 4. Rules that have already bitten this repo
1. One flow per corner: controls sharing an edge live in one flex/grid container and wrap. No extra `absolute` sibling
   with a hand-tuned `top-*`.
2. Bottom space has one owner (sheet / spec bar), published as `--map-sheet-overlap`, `--map-specs-h`,
   `--map-bottom-reserve`. Decorative layers read `[data-map-room]` / opt-in `[data-hud-compact]` and hide or
   collapse when the box is short. A panel inside a ~100px map box must be bounded, scrollable and reachable, not
   absolutely positioned at its natural height.
3. Never `setPointerCapture` on a drag handle's `pointerdown`.
4. Clamp sheet snaps to the space above the nav; keep recoverable errors where a fold cannot clip them.
5. Informational text >= 10px; icon-only buttons need an accessible name; toggles expose state; Escape closes; focus
   returns.
6. Tactile press scale is gated by `prefers-reduced-motion`; new motion must be too.
7. A stacking context caps `z-index`: a child of a `z-900` layer cannot rise above a sibling at `z-1000`. Fix the
   layer that owns the stacking context (scoped to the opt-in surface), not the child.
8. A measurement made through a selector that can match the wrong element (for example Leaflet's own `aria-label="Map"`)
   is invalid. Say so and re-measure; do not keep the number.

## 5. Record (every audit; in the ledger, not chat only)
Browser and version, input method (real pointer/keyboard vs emulated touch), viewport + DPR, user (anonymous/MEMBER/mock),
source SHA and artifact (manifest `git_sha`, tree, entry file), BACKUP/production target, screenshots (paths),
what each measurement was and its value, **limitations** (emulation, no physical device, data differences between
environments) and **unresolved ownership** (e.g. UI-012 shared header). Separate "caught", "fixed", "not checked".
Do not report latency or "faster" without a paired baseline/candidate trace.

## 6. Environment notes
- `npm run build` needs `npm ci` for the branch's own lockfile (a shared `node_modules` from another branch fails to resolve
  imports). Run `npx tsc -p jsconfig.json` and prettier before pushing.
- BACKUP is a shared resource: reserve a window (see `BACKUP-RESERVATION` practice in the release records), snapshot the
  served bytes first, deploy frontend only, restore and verify saved bytes after. Production is the release owner's call.
- Use `gh pr create --body-file`; `--body` has silently failed.
