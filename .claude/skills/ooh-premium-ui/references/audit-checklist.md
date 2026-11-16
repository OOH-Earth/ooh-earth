# Phone-first audit checklist (long form)

Run in the order of the pipeline in `SKILL.md`. Tick only what you actually ran; list the rest under "not checked".
Standards: `docs/design/UI-STANDARDS.md` (acceptance) and WCAG 2.2 AA. OSIRIS (pinned in
`docs/design/OOH-UI-UX-REFERENCE.md`; live https://osirisai.live/) informs hierarchy, spacing, disclosure and keeping the map
usable. It is not a conformance standard: do not copy its 5-9px labels or fixed offsets.

## 0. Setup
- [ ] Source SHA, tree and artifact identified (`release-manifest.json` `git_sha`, entry file); target (local / BACKUP window / production).
- [ ] Owner component and every consumer of any shared component found (`grep`). Live baseline captured at the same viewport.
- [ ] Users: anonymous (isolated context) and MEMBER, or a mocked user. Writes, uploads, AI/paid calls mocked or not exercised.

## 1. Whole-screen screenshots, phone first (look before you measure)
- [ ] 320x640, 390x844, 844x390 (SPLIT, and LIST/MAP), then 1280x800. Flat and Globe where a map exists.
- [ ] Overlapping text, panels under controls, controls half hidden, clipped text, blank bands beyond the app boundary. Note anything odd even if a probe passes.

## 2. Real interaction
- [ ] Pointer taps/clicks on the real control (DevTools MCP `click` sends real input events). Keyboard: Tab order, Enter/Space, Escape, arrow keys where relevant.
- [ ] Touch emulation (`mobile,touch`) is **emulation**; a physical device is a separate record. Synthetic `PointerEvent`s are not taps.
- [ ] Touch has no Escape and no hover: every dismissible thing needs a visible, tappable close/back control.

## 3. Bounds and edge hit tests (probes A-C, I)
- [ ] **Touch targets**: rendered target by sampling (not CSS). Aim 44px, 40px primary, 32px secondary, WCAG 2.5.8 floor 24px (spacing exception noted when relied on). No invisible extension into neighbours; 0 sampled points over neighbouring links/titles/rows.
- [ ] **Edges, not just centres**: every sampled point of each control resolves to that control (`owned = n/n`). A centre-only test passed while 37% of two zoom buttons took Report's tap.
- [ ] Clipping: element rect inside its container and the viewport; bounded panels scroll their own labelled list.
- [ ] **Scroll ownership**: which element scrolls; the document does not; the last item reaches the end and clears bottom chrome; `overscroll-behavior` considered; no horizontal overflow.
- [ ] Blank space: `documentElement.scrollHeight == innerHeight`, background token on html/body, no unfilled band under the app.

## 4. Type, contrast, state
- [ ] **Readable type**: computed font-size; informational text >= 10px; primary actions larger. No text shrunk to fit: reflow or disclose.
- [ ] **Contrast over imagery** (probe G): text/icon colour against the sampled backdrop pixels, 4.5:1 text, 3:1 large text/UI components (WCAG 1.4.3/1.4.11), in Globe and Flat.
- [ ] Accessible names on icon-only controls; `aria-pressed`/`aria-expanded` match state; text not truncated into meaninglessness.

## 5. Keyboard focus
- [ ] Focus visible and not obscured (2.4.11 minimum; project: no part covered). Opening a disclosure/dialog moves focus in; Escape and the close control both dismiss; focus returns to the opener (wait for the close animation before reading focus).
- [ ] Labels associated with fields; errors tied with `aria-describedby`+`aria-invalid`, announced, focus lands on the invalid field (mock the failure, never submit live).

## 6. Paint vs hit-test (probe F)
- [ ] Control visible in the screenshot **and** nothing opaque/textual above it with `pointer-events:auto` forced. Stacking contexts cap z-index: fix the owning layer.

## 7. Viewport changes (probe H)
- [ ] Resize and orientation change **without reload**: portrait->landscape->portrait; overlay classes/container queries re-evaluate, no stuck panel, state (mode, view, open disclosure) behaves.

## 8. Rank, fix, prove
- [ ] Rank: blocked action > lost focus > clipped info > runtime error > regression vs live > nit. Reproduce each with numbers + screenshot.
- [ ] Fix: reflow or labelled disclosure before shrinking text/controls; opt-in scope for shared components; no global `overflow:hidden`.
- [ ] Regression fails on the old build **for the real reason** (not because new markup is missing); first failure recorded.
- [ ] Verify changed and shared surfaces + desktop regression specs; run `npx tsc -p jsconfig.json` and prettier.

## 9. Record
Use `evidence-record.md`. Separate: caught by a probe / needed human visual inspection / not checked. State limitations
(emulation, no physical phone, engine, data differences). Do not call a checked-in skill "active automation" unless wired up and run.
