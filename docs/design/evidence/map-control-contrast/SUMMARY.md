# Map-control contrast, measured

Before = production source `1dbddda` built unchanged (measured with an earlier, smaller control list); after = `ui/map-control-contrast`. Harness: `e2e/map-control-contrast.spec.ts` (run with `CONTRAST_FULL=1`), Chromium 148 (Playwright build 1223, not an iPhone), 1280x800, mocked API. The real composited background (backdrop blur included) is screenshotted with text and icons hidden; ratio = the control's painted foreground vs the **1st-percentile** background pixel (WCAG 2.x relative luminance).

**Assumptions and limits (explicit):** backdrops are CSS stand-ins (white, mid-grey #808080, a bright yellow/blue/white checker, dark ocean #0b1a2a), **not** real tiles; a 1st-percentile sample is a method choice, not proof for every possible map background; flat map only (globe canvas not separately measured); 6 themes (`dark, light, matrix` = site default, `beta, crafty, guild`); text 4.5:1 (1.4.3), icons and state cues 3:1 (1.4.11), focus indicator 3:1 against the pixels it replaces. Decorative `border-slate2` outlines are not counted. A first full run overlapped other browser work and showed 8 spurious values (e.g. 1.00); they did not reproduce on a clean rerun, and the clean rerun is the evidence kept here (the earlier runs are retained as `after-*.json`).

## Light, crafty, beta (user-selectable): what was wrong and what changed

- Light / crafty: ozone/flare *text* on the map surfaces was 2.1-3.5:1 and `text-void` on ozone/flare *fills* 2.8-4.4:1. Fixed with scoped rules inside `[data-tour='map']`: `--c-ozone-ink` for text (light 176,55,0; crafty 255,110,105), black text on fills. Sizes, borders, hover and selected cues unchanged.

- Beta: `.beta a{color:#61afef}` painted blue text on the teal Report fill (1.1:1); the black-on-fill rule now covers beta too.

## All themes: worst case over 6 themes x 4 backdrops (reported values; KNOWN = recorded, not fixed)

| Control | State | Kind | Need | Before (worst, where) | After (worst, where) | Note |
|---|---|---|---|---|---|---|
| attention filter chip | normal | text | 4.5 | not measured | 4.61 (beta/busy-bright) |  |
| attention filter chip (selected) | selected | text | 4.5 | not measured | 4.92 (crafty/busy-bright) |  |
| expand-search edge tab | normal | icon | 3 | 2.81 (beta/white) | 4.62 (guild/white) |  |
| field attention | hover | text | 4.5 | 1.83 (light/dark-ocean) | 4.61 (beta/busy-bright) |  |
| field attention | normal | text | 4.5 | 3.18 (beta/white) | 5.08 (beta/white) |  |
| field attention | selected | text | 4.5 | not measured | 3.65 (matrix/busy-bright) | KNOWN: matrix CRT scanline overlay darkens rows across green fills (1st-percentile lands on a dark row) |
| field tally (collapsed, ozone text) | normal | text | 4.5 | not measured | 5.03 (light/dark-ocean) |  |
| field tally close icon | normal | icon | 3 | 2.25 (beta/busy-bright) | 5.06 (guild/white) |  |
| field tally row label | normal | text | 4.5 | 3.47 (dark/busy-bright) | 6.13 (beta/white) |  |
| field tally title | normal | text | 4.5 | 2.27 (beta/white) | 5.27 (beta/white) |  |
| style switcher | hover | text | 4.5 | 2.20 (crafty/busy-bright) | 5.01 (light/dark-ocean) |  |
| style switcher | normal | text | 4.5 | 3.04 (beta/white) | 5.20 (beta/mid-grey) |  |
| toolbar: Capture (fill) | hover | text | 4.5 | not measured | 2.62 (matrix/white) | KNOWN: matrix CRT scanline overlay darkens rows across green fills (1st-percentile lands on a dark row) |
| toolbar: Capture (fill) | normal | text | 4.5 | not measured | 4.86 (crafty/white) |  |
| toolbar: Find units (ozone text) | hover | text | 4.5 | not measured | 4.69 (crafty/mid-grey) |  |
| toolbar: Find units (ozone text) | normal | text | 4.5 | not measured | 4.99 (light/mid-grey) |  |
| toolbar: Graffiti (fill) | hover | text | 4.5 | not measured | 4.93 (crafty/white) |  |
| toolbar: Graffiti (fill) | normal | text | 4.5 | not measured | 3.38 (matrix/dark-ocean) | KNOWN: matrix CRT scanline overlay darkens rows across green fills (1st-percentile lands on a dark row) |
| toolbar: Report (fill) | hover | text | 4.5 | not measured | 1.67 (matrix/busy-bright) | KNOWN: matrix CRT scanline overlay darkens rows across green fills (1st-percentile lands on a dark row) |
| toolbar: Report (fill) | normal | text | 4.5 | not measured | 2.85 (matrix/white) | KNOWN: matrix CRT scanline overlay darkens rows across green fills (1st-percentile lands on a dark row) |
| view toggle: flat (selected) | selected | text | 4.5 | 3.39 (light/white) | 4.96 (crafty/white) |  |
| view toggle: globe | hover | text | 4.5 | 2.10 (crafty/white) | 5.03 (light/dark-ocean) |  |
| view toggle: globe (unselected) | normal | text | 4.5 | 3.04 (beta/white) | 4.92 (beta/white) |  |

## Report pin picker: "how to pin" chip (after only; no before browser run)

| Control | Need | After (worst, where) |
|---|---|---|
| report: how-to-pin chip text | 4.5 | 5.86 (beta/white) |
| report: how-to-pin help icon | 3 | 5.86 (beta/white) |

In `guild` a pre-existing rule (`.guild .bg-card span{color:navy !important}`) painted this chip's text navy on its navy surface (1.0:1); the chip opts out via `.map-overlay-chip`.

## Focus indicator (global 2px #edff00 ring, offset 2px)

| theme/backdrop | Control | Before | After |
|---|---|---|---|
| matrix/white | style switcher | 1.07 | 14.80 |
| matrix/white | view toggle: globe | 1.07 | 16.77 |
| matrix/white | field attention | 1.09 | 16.90 |
| matrix/white | expand-search edge tab | 1.07 | 15.67 |
| matrix/mid-grey | style switcher | 3.40 | 16.69 |
| matrix/mid-grey | view toggle: globe | 1.22 | 16.15 |
| matrix/mid-grey | field attention | 3.39 | 17.13 |
| matrix/mid-grey | expand-search edge tab | 3.51 | 16.70 |
| matrix/busy-bright | style switcher | 1.04 | 15.95 |
| matrix/busy-bright | view toggle: globe | 1.04 | 16.37 |
| matrix/busy-bright | field attention | 1.03 | 16.54 |
| matrix/busy-bright | expand-search edge tab | 1.07 | 15.85 |
| matrix/dark-ocean | style switcher | 14.15 | 17.87 |
| matrix/dark-ocean | view toggle: globe | 1.22 | 18.07 |
| matrix/dark-ocean | field attention | 14.34 | 17.97 |
| matrix/dark-ocean | expand-search edge tab | 10.76 | 18.46 |
| dark/white | style switcher | 1.10 | 16.09 |
| dark/white | view toggle: globe | 1.10 | 14.52 |
| dark/white | field attention | 1.10 | 15.50 |
| dark/white | expand-search edge tab | 1.10 | 13.27 |
| dark/mid-grey | style switcher | 3.30 | 16.56 |
| dark/mid-grey | view toggle: globe | 3.16 | 16.53 |
| dark/mid-grey | field attention | 3.30 | 16.80 |
| dark/mid-grey | expand-search edge tab | 3.20 | 16.86 |
| dark/busy-bright | style switcher | 1.04 | 15.06 |
| dark/busy-bright | view toggle: globe | 1.03 | 15.59 |
| dark/busy-bright | field attention | 1.03 | 15.50 |
| dark/busy-bright | expand-search edge tab | 1.10 | 15.19 |
| dark/dark-ocean | style switcher | 13.48 | 17.85 |
| dark/dark-ocean | view toggle: globe | 9.89 | 17.55 |
| dark/dark-ocean | field attention | 13.67 | 17.10 |
| dark/dark-ocean | expand-search edge tab | 13.01 | 18.14 |

Focus checks below 3:1: before 18/32, after 0/32.

## Not measured / not fixed
- Matrix scanline fills (KNOWN rows above): decoration of the theme; text is black on a bright green fill whose rows are darkened by the overlay. Reported, not claimed as a pass.
- The Report help button's focus ring (its tooltip opens on focus and covers it; 0 ring pixels).
- Disabled states (no control sits disabled over the map), the globe canvas, real tiles, real devices.
