# OOH Earth UI standards

Ledger of defects, evidence, commits and open items: [`UI-Fixes.md`](./UI-Fixes.md).

Scope: how we lay out and simplify screens **without changing the identity** (black void,
ozone yellow `#EDFF00`, flare orange `#FF5C00`, IBM Plex Mono labels, Inter Tight body,
Orbitron brand marks, square corners). This file does not define new colours, fonts or shapes.

Every rule below is tagged:

- **[Standard]** comes from a published specification. Not negotiable without a recorded exception.
- **[Preference]** is a project decision. Can be changed by the design owner; say why in the PR.

## 1. Authoritative sources

| Source | Status checked | Used for |
| --- | --- | --- |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | W3C Recommendation (page header: 12 December 2024). WCAG 3.0 is still a draft and is **not** used as a requirement. | all **[Standard]** rules |
| [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) | informative | keyboard patterns for disclosure, toggle, dialog |
| Existing tokens in `tailwind.config.js` and `src/index.css` | in repo | all colour, type and radius values |

Platform sizes (Apple 44 pt, Material 48 dp) are **[Preference]** inputs, not WCAG requirements.

## 2. Standards (WCAG 2.2) that drive layout

| Criterion | Level | What it means here |
| --- | --- | --- |
| 1.4.10 Reflow | AA | Content works at 320 CSS px wide (400% zoom of 1280) with no two-axis scrolling, except maps/data that need it. Overlays must stack, wrap or scroll inside their own box, never extend off-screen. |
| 1.4.4 Resize Text | AA | Text scales to 200% without loss of content or function. Offsets must not be hand-tuned to one text size; the app's own "Adjust text size" control is a real input. |
| 1.4.12 Text Spacing | AA | No clipping or overlap when line/letter/word spacing is raised. Fixed-height text boxes are a defect. |
| 1.4.11 Non-text Contrast | AA | Control borders, icons and focus indicators need 3:1 against adjacent colours. |
| 1.4.13 Content on Hover or Focus | AA | Hover/focus popups are dismissible, hoverable and persistent. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | A focused control must not be entirely hidden by an overlay (sticky header, sheet, nudge). New in 2.2; the map frame is tested for it. |
| 2.5.8 Target Size (Minimum) | AA | Pointer targets are at least 24 x 24 CSS px, or have equivalent spacing. |
| 4.1.3 Status Messages | AA | Errors and confirmations are announced (`role="status"`/`alert`) and must stay visible long enough to be read. They are never hidden for decluttering. |

Reading of the 2.4.11 criterion for this repo: "not entirely hidden" is the legal minimum;
**[Preference]** we require *no part* of a control to be covered, which is stricter and is what
`e2e/map-overlay-layout.spec.ts` asserts.

## 3. Project preferences

| Preference | Value | Rationale |
| --- | --- | --- |
| Touch target | 40 x 40 px for primary map actions, 32 px minimum for secondary | Exceeds the 24 px AA floor; matches current tokenised buttons. Reaching 44 px is the target when a control is redesigned. |
| Smallest text | 10 px (the documented "Label · Mono" step in `TypeScale.jsx`). Informational and recovery text on the map is at least 10 px; the 9 px "Caption" step is for decorative labels only | 7-9 px labels remain on surfaces not yet touched (see the ledger). A project readability decision, not a WCAG minimum font size. |
| Overlay budget | At most one persistent chrome row plus one transient row over a map | Keeps the map the subject. |
| Decorative layers | Must yield space to controls and degrade by available room | GlobeHud, scanlines, telemetry. |
| Colour | Use token classes (`text-ozone`, `border-slate2`, `bg-void/80`); no new hex | Brand tokens are the canonical source. |
| Motion | Respect `prefers-reduced-motion` for new animation | Preference; WCAG 2.3.3 is AAA. |

## 4. Layout rules for overlays (derived from the root cause)

Root cause of the map collision: every overlay was `position: absolute` against the same box
with its own guessed `top-*` offset, and each later addition patched the offset again
(`top-12` -> `top-24` -> `top-36`). Offsets written for one text size, one viewport or one
expanded state break in another.

1. **One flow per corner.** Controls that share an edge live in one flex/grid container and
   wrap. Do not add a new `absolute` sibling next to an existing overlay.
2. **Decorative layers consume a measured inset, not a guessed one.** The map frame publishes
   `--map-overlay-bottom` and `--map-overlay-right-bottom` (and `data-map-room`); GlobeHud reads
   them with a fallback equal to its old offset, and every new HUD rule is scoped to
   `[data-map-room]`, so other consumers (Home globe, PortalShell) keep their previous layout.
3. **Containers own overflow.** A frame that can exceed its box scrolls internally
   (`max-h`, `overflow-y-auto`) and reserves padding for focus outlines. Nothing may leave its
   box.
4. **Use container queries for "is there room"** (`@container`, `cqh`) instead of viewport
   breakpoints when the available width is the map pane, not the window.
5. **Every edge has one owner.** Top: the overlay frame. Bottom: the mobile sheet and spec bar, measured
   by `Map.jsx` and published as `--map-sheet-overlap`, `--map-specs-h`, `--map-bottom-reserve`.
   Zoom, compass, attribution and the frame itself stack against those values; none of them chooses
   its own bottom offset. A page that does not publish them keeps its old layout (fallback 0).
6. **A control covered by a surface is not focusable.** When the sheet covers the map, the map box is
   `inert` (WCAG 2.4.11 Focus Not Obscured); controls are never left reachable underneath, and never
   pushed off-screen to avoid the overlap.
7. **Density follows the available box, not only the window.** Compact chrome applies when the width is
   under 768, **or** in short landscape (< 500px tall, < 1024px wide), **or** when the map pane is under
   600px (the 1024px split layout leaves ~380px). Secondary controls go behind one labelled
   disclosure (`aria-expanded`, `aria-controls`, Escape, focus return). Where a floating panel cannot
   fit (short landscape) the same content opens in the bottom sheet.
8. **A drag handle never captures the pointer from its own buttons.** Capturing on `pointerdown`
   retargets the click and silently kills Expand/Collapse/Close/Retry.
9. **A sheet's header must stay on screen at every snap.** Clamp the tallest snap to the space above
   the nav; otherwise Collapse can end up above the viewport.
10. **Recoverable errors live where they cannot be clipped**: the always-visible header/region, with a
    40px+ action, announced once (`role="alert"`), not under a scroll fold.
11. **No** arbitrary `z-index` increases, negative margins, text below 10 px, or hiding of an
   essential control to make room.
12. **Essential content is never removed to declutter**: primary navigation, source and
   provenance text, privacy guidance, errors and confirmation states.

## 5. Declutter classification

Each item is placed in exactly one bucket, with the user task it serves and where it can still
be found.

| Bucket | Meaning |
| --- | --- |
| Keep visible | Needed to complete the primary task on this screen. |
| Collapse | Secondary; reachable in one action from where it was. |
| Contextualize | Shown only when its state/viewport makes it useful. |
| Relocate | Moves to a place with more room; still on the same screen. |
| Remove | Duplicated or pure decoration with no task or information value. Rare. |

### Map route (`/map`), first slice

| Item | Bucket | User task | Discoverability after change |
| --- | --- | --- | --- |
| Flat / Globe switcher | Keep visible | choose the map mode | unchanged, first row |
| Action toolbar (Graffiti, Capture, Report, Find, GeoJSON, Keys, style) | Keep visible, wraps | start a capture/report, export | unchanged; wraps to a second row instead of overlapping |
| Field attention toggle and filters | Keep visible; filters stay contextual (only when toggled on) | triage places needing a recheck | unchanged order, now in flow beneath the switcher |
| Field tally | Relocate (into the stack; was bottom-left under the mobile sheet) and Contextualize (starts collapsed on phones when no stored choice) | glance at counts | "TALLY n" pill in the stack; expand/collapse preserved; stored choice honoured |
| AI news ticker | Keep visible (opt-in, labelled AI-generated/unverified) | optional context | unchanged copy; width capped so it cannot reach the zoom column |
| Globe telemetry HUD (title, UTC, signal) | Contextualize | atmosphere/orientation | on `/map`: hidden on phones (it sat illegibly over the globe and markers) and whenever the frame leaves no room; unchanged on the Home globe, which does not publish the frame variables |
| HUD moon phase | Contextualize | decorative | on `/map`: shown only when the viewport is at least 700 px tall and room remains |
| HUD centre telemetry strip | Contextualize | expert readout | shown when the map pane is at least 60rem wide (it used to show at 1024 px window width, when the pane was ~380 px) |
| Air commons panel | Contextualize | pollution context | shown when the pane is at least 44rem; its list shrinks to the room left above the zoom controls |

Not in this slice (recorded, not decided): ContextualNudge, bottom sheet vs zoom controls,
short-landscape chrome budget, all other routes. See the PR description.

## 6. Test contract for a layout change

A layout PR is not done until it shows, for the changed surface:

1. Before/after screenshots at phone, tablet, laptop and short landscape.
2. DOM bounds of every overlay box, asserted (not only label visibility): no pairwise
   intersection, inside the container, inside the viewport.
3. Hit-testing at centre and inset corners of each interactive control (a control covered by
   another element fails even if "visible").
4. Expanded and collapsed states of every disclosure on the surface.
5. Keyboard walk: each focus stop fully on-screen and uncovered.
6. Zoom: CSS-px viewport with `deviceScaleFactor` emulates Ctrl-+ layout (200% of 1280x720 is 640x360 at 2x). This is **supplementary**: real browser zoom could not be driven headlessly (profile zoom prefs are ignored; DevTools key events do not trigger browser accelerators), so it must be recorded as unavailable coverage and spot-checked manually in a real browser.
7. A route transition away and back.
8. Review of every consumer of a shared component you changed (`grep` the import).
