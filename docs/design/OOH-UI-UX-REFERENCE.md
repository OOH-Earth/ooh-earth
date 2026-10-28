# OOH Earth UI/UX implementation reference

Research refreshed: 28 October 2026. Version 1.0. Purpose: a shared, source-grounded direction for a coordinated UI consistency pass across mobile and desktop.

This is a specification and implementation brief, not a claim that the app has been audited or fixed. No OOH application source was available in this workspace. The supplied screenshots and implementation reports establish starting evidence only. Reproduce current defects before attributing causes.

## 1. Authority and scope

Use three explicit labels in decisions:

- **OBSERVED:** a pattern verified in the OSIRIS source listed below.
- **STANDARD:** a referenced accessibility requirement, with scope and exceptions.
- **PROJECT:** a proposed OOH design rule. These values are not extracted from OSIRIS and are not universal accessibility requirements.

Preserve OOH Earth's brand colors, existing font families, map engines, routes, data contracts and adbusting identity. Improve composition, readability, wording and interaction consistency. Preserve errors, provenance, privacy, moderation and confirmation information. Do not add unrelated OSINT, finance, surveillance or AI functionality.

One coordinated pass means a shared token/component foundation with checked consumers, not an uncontrolled global CSS rewrite. Make separately reversible commits and review units. No standard can guarantee a perfect or bug-free UI.

## 2. Verified OSIRIS source reference

Upstream: https://github.com/simplifaisoul/osiris

Live reference: https://osirisai.live/

Verified default branch: `master`. Reproducible reference commit: `59634bc2cbe418c64b258548eeda8f056b4823d0`. This commit was retrieved and the five files below were fetched both from the current default and the pinned commit; their blobs match. This does not assert that the commit is the latest upstream HEAD.

| File, pinned source | Blob SHA | Read these symbols/lines | Adaptation |
| --- | --- | --- | --- |
| [globals.css](https://github.com/simplifaisoul/osiris/blob/59634bc2cbe418c64b258548eeda8f056b4823d0/src/app/globals.css) | `cc33c7509e16e92199296c337d8f6ba56be398aa` | `:root`, lines 86–87; responsive section 435–497; `.gotham-grid-*` around 2097; `.instrument-*`, `.tool-*` | Semantic tokens, repeated panel treatment, responsive grids, safe-area awareness |
| [page.tsx](https://github.com/simplifaisoul/osiris/blob/59634bc2cbe418c64b258548eeda8f056b4823d0/src/app/page.tsx) | `e557eb6fcb80c899579f4468f75b3071406c5f4b` | `useIsMobile` line 59; `ViewSegment`; Markets anchor around 212; tool toggles around 1817–2010; mobile panel 2190–2191 | Height-aware compact mode, explicit selected state, coordinated tool disclosure, bounded mobile panels |
| [LayerPanel.tsx](https://github.com/simplifaisoul/osiris/blob/59634bc2cbe418c64b258548eeda8f056b4823d0/src/components/LayerPanel.tsx) | `037ce4fca76867d264329c83050b3054b842bb4e` | Escape handler line 231; pressed states 304/494; expanded state 404 | Group secondary layers, communicate state, dismiss predictably |
| [SearchBar.tsx](https://github.com/simplifaisoul/osiris/blob/59634bc2cbe418c64b258548eeda8f056b4823d0/src/components/SearchBar.tsx) | `c7fb021383d338e86d4e8502807ec240963553bc` | Escape around 190; panel bound 208; combobox state 222; scroll body 243 | Search as a coherent component with keyboard feedback and bounded results |
| [GlobalStatusBar.tsx](https://github.com/simplifaisoul/osiris/blob/59634bc2cbe418c64b258548eeda8f056b4823d0/src/components/GlobalStatusBar.tsx) | `837fd3c8370025e0c76019998ddc485eaaf1a0af` | Desktop-only strip, docs/privacy links | Lower emphasis for secondary telemetry; retain alternate access on phones |

### Actual OSIRIS values versus OOH decisions

| Observed OSIRIS code | OOH interpretation |
| --- | --- |
| Default `--panel-gap:12px`, `--edge-pad:20px`; <=1024: 8/12px; <=768: 6/8px; <=390: edge 4px | Share responsive tokens, but do not copy progressively cramped spacing. Use the OOH scale below. |
| 3/4-column grids become 2 at <=1024 and 1 at <=768 | Reduce columns before shrinking type; choose actual breakpoints from OOH content. |
| `useIsMobile`: width <768 OR height <500 and width <1024 | Include short-height layout tests; do not treat viewport width as the only constraint. |
| Search panel `max-h-[min(72vh,600px)]` with `min-h-0 overflow-y-auto` body | Bounded scroll areas must respect actual available OOH space, including browser keyboard and navigation. |
| Mobile panel max height `min(55vh, calc(100dvh - 100px))` and safe-area padding | Share ownership of occupied space; do not transplant the 100px or fixed bottom offset. |
| Active buttons expose `aria-pressed`; disclosure buttons expose `aria-expanded` | Match semantics to actual interaction, not appearance alone. |

**Do not copy:** 5–9px labels, 32px rail controls as the default touch target, widespread absolute offsets, root overflow locking, global transition rules, gold/cyan branding, decorative engineering grids or entrance motion. This is a source study, not an OSIRIS conformance audit. No fresh live-device inspection was performed for this revision; earlier live observations were limited and are not phone validation. Check the repository license before literal code reuse; examples below are original adaptation sketches.

## 3. OOH token contract — PROJECT

First inventory existing tokens and map these roles onto them. Introduce a new token only when a role is genuinely missing. Do not replace the font family or reset the root font size.

| Role | Proposed baseline | Usage |
| --- | --- | --- |
| Space scale | 4, 8, 12, 16, 24, 32, 48 CSS px | One shared vocabulary; 4px is for tightly related decoration, not default spacing between tap controls |
| Page inset | 16px phone, 24px tablet, 32px desktop | Compact map controls may use 12px if tested; account for safe areas |
| Panel padding | 16px compact, 24px roomy | Same inset for title, content and actions |
| Related control gap | 8px | Controls wrap rather than compress targets |
| Group gap | 16px | Separate distinct control groups |
| Section gap | 24–32px | Separate tasks/content sections |
| Body text | 1rem, about 16px at default settings; line-height 1.5 | Instructions and readable content |
| Control text / form labels | 0.875–1rem, about 14–16px; line-height >=1.4 | Search, buttons, labels, error messages |
| Secondary metadata | 0.75–0.875rem, about 12–14px | Genuine secondary context; never reduce contrast until unreadable |
| Section heading | 1.125–1.25rem, about 18–20px | Clear hierarchy without oversized blocks |
| Page heading | 1.5–2rem, about 24–32px | Fluid within this range if appropriate |
| Tap target | At least 44×44 CSS px where feasible | Applies to the clickable region, not necessarily the icon artwork |
| Icon artwork | 18–20px typical | Center within target; do not stretch artwork to match hit area |
| Reading measure | About 60–70 characters for long prose | Lists and map panels use content-specific width |

These are design defaults for review, not WCAG font-size mandates. Existing 10/11px labels are not automatically a successful end state. Increase the container or disclose secondary content instead of fitting everything by shrinking text. Preserve browser text enlargement. Avoid long all-capital instructions and excessive tracking; keep brand display text where it helps identity. Use tabular numbers for counts only where alignment improves scanning.

## 4. Alignment and layout contract — PROJECT

- Align title, description, form fields and actions to a shared leading edge. Center only genuinely centered content.
- Use baseline alignment for adjacent text; center-align icon controls. Apply `min-width:0` to flexible text columns, allow wrapping, and avoid fixed-height text containers.
- Prefer normal flow/grid/flex. Put long content in intentional scroll areas; do not globally hide overflow to mask defects.
- Shared header/nav dimensions are owned once. Map tools, sheet, attribution, nudge and notices consume those measured dimensions rather than inventing offsets.
- Use logical properties so layout is not unnecessarily tied to left/right. Support browser safe areas and dynamic viewport height. Do not assume `100vh` equals the unobscured phone viewport.
- Set `min-height:0` on flexible scroll bodies. Make one intentional scroll owner per panel; avoid nested scroll traps.
- Keep the map route's viewport behavior scoped. Report, docs and long forms must retain usable document scrolling.
- Sticky/fixed content must reserve its footprint or support a documented overlay relationship. Define named stacking roles; raising z-index cannot resolve insufficient room.
- In short landscape, disclose optional chrome and bound sheets before reducing primary text or hit targets. Preserve actual task completion, not merely a nonzero map rectangle.
- On desktop use available space through a coherent content grid; do not spread isolated controls to arbitrary corners or widen form lines indefinitely.

### Original CSS sketch, not drop-in repository code

```css
.ooh-panel {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  min-block-size: 0;
}
.ooh-panel__header, .ooh-panel__footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ooh-space-2);
  padding: var(--ooh-panel-pad);
  flex: none;
}
.ooh-panel__body {
  min-block-size: 0;
  overflow: auto;
  padding: var(--ooh-panel-pad);
  overscroll-behavior: contain;
}
.ooh-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ooh-space-2);
}
.ooh-icon-button {
  min-inline-size: 2.75rem;
  min-block-size: 2.75rem;
  display: inline-grid;
  place-items: center;
}
```

Map the example variables to actual project tokens. The parent must provide a meaningful size bound for panel scrolling. Add scoped styles through the existing system; do not paste global resets or duplicate existing primitives. A panel's background, border, focus and type come from existing brand tokens after contrast testing.

## 5. Information density and wording

**PROJECT:** one dominant task and one dominant action per active view where possible. Other actions remain discoverable through labelled groups, not deletion. This is not a rule limiting the whole screen to one button.

| Content | Default treatment | Preserve |
| --- | --- | --- |
| Search/explore | Visible near map entry | Search state, keyboard use, selected location |
| Results | Compact summary on fresh mobile map arrival; openable sheet | Count semantics, reopening, scroll position where sensible |
| Layers/environment | Labelled Tools or Layers disclosure | Active-state indication, all existing choices |
| Telemetry/tally/ticker | One quiet summary; details on demand | Real source, timestamp and unavailable states |
| Selected place | Coherent detail view or selected card | Context, source, return path |
| Errors/privacy/confirmation | Present when needed, readable and reachable | Recovery and consequences |

Use action + object labels and consistent terminology. Proposed visible wording below must be matched to actual behavior; audit existing tests before renaming accessible names.

| Ambiguous/current style | Proposed wording | Constraint |
| --- | --- | --- |
| `PAGE` | `View listing` | Only if it opens that listing |
| Chevron alone | `Open list` / `Collapse list` | Icon may remain; accessible name must state the action |
| Diagonal arrow | `Expand list` / `Restore list size` | Do not promise browser fullscreen if it only expands a sheet |
| `790 ADS` | `790 listings` or project-approved `790 ads` | Determine whether count is viewport/filter/global; do not imply the wrong scope |
| `RETRY VIEW` | `Try loading this area again` | Only where it retries that data |
| Tile/provider failure | `Map background unavailable. Enter coordinates manually.` | Keep working location/search functionality accessible where available |
| GPS refusal | `Location access is off. Search for a place or enter coordinates.` | Distinguish refusal from timeout or missing browser support |
| Unknown count/status | `Count unavailable` / `Status unavailable` | Never use zero or LIVE to disguise unknown state |

Keep decorative terminal vocabulary out of essential instructions when plain words are clearer. Do not invent activity claims. Coordinate brand-sensitive terminology with the owner without blocking unrelated layout fixes. No truncation of required error text; optional metadata may truncate only with an accessible way to read it fully.

## 6. Reusable component contracts

Reuse/extend actual primitives before creating these conceptual roles:

| Role | Required behavior |
| --- | --- |
| Panel | Named heading, readable body, actions, scroll ownership, clear close behavior; no default modal semantics |
| Disclosure | Button with expanded state and controlled region; meaningful label; reopening; focus return if focus would otherwise disappear |
| Button | Native button, correct type in forms, accessible name, pointer/touch/keyboard operation, visible focus; busy state prevents unintended duplicate action |
| Search | Persistent label, keyboard results, clear empty/loading/error distinction; stale responses cannot overwrite newer input |
| Form field | Visible associated label; help/error relationships; required/optional state; error text actionable |
| Notice | Appropriate status/alert semantics for urgency; no unnecessary focus stealing; blocking submission errors deliberately brought into view |
| Results card | Consistent image/title/context/action alignment; long-text handling; avoid nested conflicting click targets |
| Navigation | Current-route indication, usable targets, no collisions with sheets/browser UI, all destinations preserved |
| Bottom sheet | Explicit compact/half/full states; separate drag handle; button alternatives; controlled focus; no accidental drag from header controls |

For sheets: fresh mobile entry may be map-first; returning from details should preserve deliberate user state. A nominal 72px compact height is a starting point, not a clipping constraint. Scroll results independently of dragging; handle pointer cancellation and lost capture. Non-modal sheets must not trap focus as if they were dialogs. Full-screen/modal states require appropriate focus and dismissal behavior based on actual semantics. Do not set `touch-action:none` across the entire results list or page.

## 7. Accessibility requirements — STANDARD versus PROJECT

Refer to the normative WCAG text via each W3C Understanding page. These checks are not a claim of certification.

| Check | STANDARD baseline | OOH PROJECT direction |
| --- | --- | --- |
| Text contrast | Normal text >=4.5:1; qualifying large text >=3:1, with defined exceptions | Test brand green/pink against actual surfaces; no dim tiny text on imagery |
| Non-text contrast | Required component/state/graphic information >=3:1 against adjacent colors, with exceptions | Check icons, selected states and necessary field boundaries |
| Target size | AA 24×24 CSS px or permitted exceptions/spacing | Prefer 44×44 touch controls; smaller needs explicit rationale |
| Text resize | Text enlarges to 200% without loss, subject to scope | Test real browser zoom and text resizing separately from emulation |
| Reflow | Vertical content at equivalent 320px width without two-dimensional scrolling, except necessary 2D content | Map exception is not a blanket exemption for chrome, forms or labels |
| Text-spacing overrides | No loss with line-height 1.5×, paragraph spacing 2×, letter spacing .12×, word spacing .16× | These are override test values, not required default styles |
| Focus visibility/obscuration | AA focus-not-obscured requires component not entirely hidden by author content | Keep entire focused control and its ring visible where practicable |
| Dragging | A single-pointer alternative without dragging unless essential/user-agent exception | Provide tap/click sheet controls in addition to keyboard and swipe |

W3C sources retrieved for this revision:

- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html
- https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html

## 8. Coordinated implementation order

### Foundation: high coverage with bounded risk

Inventory actual route tree and shared components. Record every consumer of header, bottom navigation, button, field, panel and disclosure primitives. Capture representative before states, including defects. Build a token mapping table: current value/class, semantic role, proposed token, affected consumers, reason. Search for tiny text, fixed offsets and negative margins as candidates for review—not proof they are defects.

Introduce semantic type/space roles through the existing system. Update a representative form and panel first. Check increased type does not overflow, then migrate their shared consumers. A blind regex replacement of all pixel classes is forbidden.

### Priority routes

1. Shared header/nav and notices: readable labels, targets, layout ownership, safe areas.
2. Map and current follow-up: sheet controls, map-first default, attribution, Tools and density. Reuse in-progress commits; coordinate ownership rather than rebuilding them.
3. Report: labels/help/errors, location picker, actual tile-provider problem. Keep provider/account approvals separate; HTTP-200 watermarked tiles are not a CSS defect or a working basemap.
4. Home: primary task, contextual content and feed/nudge hierarchy.
5. Actual dashboard/detail routes, scanners and plans: inventory first; do not invent paths or functions. Preserve non-UI behavior and held release work.

Use one shared primitive or coherent route slice per local commit. Review all consumers of shared changes. A combined candidate can demonstrate the overall result while commits remain individually reversible. Do not claim majority coverage from file counts; measure affected routes/components and successful user tasks.

## 9. Verification matrix and definition of done

Minimum viewport samples: 320×640, 360×800, 390×844, 430×932, 768×1024, 820×1180, 1280×720, 1366×768, 1440×900; short landscape 667×375 and 844×390. Add content-driven intermediate sizes. Dimensions are test samples, not production breakpoints.

Representative states: anonymous/MEMBER where authorized, loading/empty/error, long labels, expanded tools, selected map item, nudge shown/dismissed, compact/half/full sheet, route return, form errors and busy states. Check supported desktop browser and WebKit engine coverage; identify actual device testing separately. Test browser chrome and virtual keyboard when available.

For every slice:

- Required elements exist and are visibly usable before measuring bounds.
- Full panel/control rectangles and intended overlap relationships pass, with hit tests and actual mouse/touch/keyboard interaction.
- Opening, closing and reopening work with expected focus and state preservation.
- No unintended page-wide overflow, obscured required control or clipping under text-spacing overrides.
- Actual 200% browser zoom and appropriate 400% reflow checks; emulation clearly labelled if real zoom unavailable.
- Whole-screen visual inspection in addition to geometry. Past attribution overlaps escaped hit-test coverage.
- Contrast calculated from actual states/surfaces, including transparency over imagery. Do not round failing ratios upward.
- Existing shared-consumer regression tests, build/lint/type checks and required CI pass, or failures have an honest evidence-backed disposition.
- Regression tests fail on the actual old defect where possible. Safety-net tests identified separately.
- First-run failures and isolated reruns retained. No unsupported claim that browser freezes explain every previous failure.

A useful completion table reports route/state, baseline defect, changed primitive, after evidence, browser/viewport/input, result and limitation. Include current source SHA and artifact identity. No percentages or “all fixed” claims without a defined denominator.

## 10. Instructions for Claude Code

Read this entire reference, current UI-Fixes.md, UI-STANDARDS.md, applicable AGENTS.md and release rules. Find the downloaded file in the actual Windows Downloads location if it is not yet in the repo. Preserve existing records and peer-owned changes.

Place this reference at `docs/design/OOH-UI-UX-REFERENCE.md` if no equivalent canonical document exists. Link it from the existing standards and fixes ledger; do not create competing sources of truth. Keep the implementation ledger separate from the specification.

Start with a short verified inventory and token/consumer mapping, then implement the independently authorized local foundation and route slices. Do not stop after a plan. Use Chrome DevTools MCP for evidence and real pointer/keyboard interaction. Reuse the intended authorized app session without inspecting unrelated tabs, extracting credentials or performing production test writes.

Adapt OSIRIS patterns using the pinned source links; read source context before copying any behavior. Do not describe its code as a formal standard. Preserve identity while prioritizing readable type, coherent spacing, shared geometry, minimal competing information and discoverable controls.

Track an explicit content-disposition table: keep visible / collapse / relocate / remove. Essential errors, privacy and sources stay accessible. Removal needs a task-based rationale; hidden functionality cannot count as a fixed collision.

Do not duplicate the existing map-followup branches or silently approve Esri/CARTO arrangements. Finish unblocked implementation and prepare coherent draft PRs, evidence and a combined local candidate. The earlier #383 merge/deployment authorization is historical and does not authorize this new broad pass. No production deploy or merge until this candidate receives explicit approval and applicable release gates pass. Coordinate shared staging reservations afresh.

Deliver: actual routes audited; token map; source/component changes; before/after evidence; real test results; exact local commits and draft PRs; remaining owner decisions and unavailable coverage. State clearly what is local, staged and live.

## 11. Issue record template

| Field | Required content |
| --- | --- |
| ID / severity | Existing ledger ID where relevant; severity tied to blocked task |
| Route / state | Actual route, auth, content and sheet/tool state |
| Evidence | Screenshot, viewport, input method, browser and reproduction |
| Root cause | Reproduced facts; hypotheses labelled separately |
| Reference | OSIRIS pinned file/symbol; STANDARD or PROJECT rule |
| Change | Actual component/path, token and content disposition |
| Validation | Command, result, interaction evidence and negative control |
| Candidate | Source SHA, build/artifact and environment |
| Status | Reported / reproduced / local fix / staged / live-verified |
| Remaining | Owner decision, dependency and coverage limit |

Successful output is a consistent, task-usable app with honest evidence—not a visual clone or a promise of zero bugs.
