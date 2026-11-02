# Map-control contrast, measured

Before = production source `1dbddda` built unchanged; after = this change. Same harness for both: `e2e/map-control-contrast.spec.ts`, Chromium 148 (Playwright build 1223, not an iPhone), 1280x800, mocked API. The real composited background (backdrop blur included) is screenshotted with text and icons hidden; ratio = the control's computed foreground vs the **1st-percentile** background pixel (WCAG 2.x relative luminance). Assumptions: backdrops are CSS stand-ins (white, mid-grey #808080, a bright yellow/blue/white checker, dark ocean #0b1a2a), **not** real tiles; flat map only (the globe canvas sits under the same overlay DOM, not separately measured); 6 themes (`dark, light, matrix` (site default), `beta, crafty, guild`); text needs 4.5:1 (1.4.3), icons and state cues 3:1 (1.4.11), focus indicator 3:1 against the pixels it replaces. Decorative `border-slate2` outlines are not counted: every control is identified by its own text/icon.

## Map page controls, worst case over dark, matrix, beta, guild x 4 backdrops

| Control | State | Kind | Need | Before (worst, where) | After (worst, where) |
|---|---|---|---|---|---|
| expand-search edge tab | normal | icon | 3 | 2.81 (beta/white) | 4.74 (beta/white) |
| field attention | hover | text | 4.5 | 2.80 (beta/white) | 4.88 (beta/white) |
| field attention | normal | text | 4.5 | 3.18 (beta/white) | 5.08 (beta/white) |
| field tally close icon | normal | icon | 3 | 2.25 (beta/busy-bright) | 5.20 (beta/white) |
| field tally row label | normal | text | 4.5 | 3.47 (dark/busy-bright) | 5.83 (beta/dark-ocean) |
| field tally title | normal | text | 4.5 | 2.27 (beta/white) | 5.20 (beta/white) |
| style switcher | hover | text | 4.5 | 3.71 (beta/white) | 6.03 (beta/busy-bright) |
| style switcher | normal | text | 4.5 | 3.04 (beta/white) | 5.00 (beta/busy-bright) |
| view toggle: flat (selected) | selected | text | 4.5 | 8.11 (beta/mid-grey) | 8.11 (beta/busy-bright) |
| view toggle: globe | hover | text | 4.5 | 3.49 (beta/white) | 6.09 (beta/busy-bright) |
| view toggle: globe (unselected) | normal | text | 4.5 | 3.04 (beta/white) | 5.06 (beta/white) |

## Light and crafty themes, worst case (ozone-coloured pairs are token-limited and not asserted)

| Control | State | Kind | Need | Before | After | Note |
|---|---|---|---|---|---|---|
| expand-search edge tab | normal | icon | 3 | 4.10 (crafty/white) | 5.58 (crafty/white) |  |
| field attention | hover | text | 4.5 | 1.83 (light/dark-ocean) | 2.51 (light/dark-ocean) | ozone text/fill: `--c-ozone` is 232,74,0 (light) / 229,57,53 (crafty); a global token change, out of scope |
| field attention | normal | text | 4.5 | 3.65 (crafty/white) | 5.79 (crafty/white) |  |
| field tally close icon | normal | icon | 3 | 3.33 (crafty/white) | 6.08 (crafty/busy-bright) |  |
| field tally row label | normal | text | 4.5 | 5.26 (crafty/busy-bright) | 7.16 (crafty/mid-grey) |  |
| field tally title | normal | text | 4.5 | 3.33 (crafty/white) | 6.16 (crafty/white) |  |
| style switcher | hover | text | 4.5 | 2.20 (crafty/busy-bright) | 3.14 (light/dark-ocean) | ozone text/fill: `--c-ozone` is 232,74,0 (light) / 229,57,53 (crafty); a global token change, out of scope |
| style switcher | normal | text | 4.5 | 3.56 (crafty/white) | 6.01 (crafty/white) |  |
| view toggle: flat (selected) | selected | text | 4.5 | 3.39 (light/white) | 3.39 (light/busy-bright) | ozone text/fill: `--c-ozone` is 232,74,0 (light) / 229,57,53 (crafty); a global token change, out of scope |
| view toggle: globe | hover | text | 4.5 | 2.10 (crafty/white) | 3.15 (light/dark-ocean) | ozone text/fill: `--c-ozone` is 232,74,0 (light) / 229,57,53 (crafty); a global token change, out of scope |
| view toggle: globe (unselected) | normal | text | 4.5 | 3.62 (crafty/white) | 6.00 (crafty/white) |  |

## Report pin picker: "how to pin" chip (after only)

The chip was `bg-void/80 text-dim` (computed 2.20:1 on a white backdrop in the dark theme); a before run of the browser harness was not made for it. After: worst over all 6 themes x 4 backdrops:

| Control | Need | After (worst, where) |
|---|---|---|
| report: how-to-pin chip text | 4.5 | 5.86 (beta/white) |
| report: how-to-pin help icon | 3 | 5.86 (beta/white) |

In the `guild` theme a pre-existing rule (`.guild .bg-card span{color:navy !important}`) painted this chip's text navy on its navy surface (1.0:1); the chip now opts out via `.map-overlay-chip`.

## Focus indicator (global 2px #edff00 ring, offset 2px) vs the pixels it replaces, 3:1 needed

| theme/backdrop | Control | Before | After |
|---|---|---|---|
| matrix/white | style switcher | 1.07 | 16.09 |
| matrix/white | view toggle: globe | 1.07 | 16.76 |
| matrix/white | field attention | 1.09 | 15.80 |
| matrix/white | expand-search edge tab | 1.07 | 14.45 |
| matrix/mid-grey | style switcher | 3.40 | 16.69 |
| matrix/mid-grey | view toggle: globe | 1.22 | 17.31 |
| matrix/mid-grey | field attention | 3.39 | 17.64 |
| matrix/mid-grey | expand-search edge tab | 3.51 | 17.38 |
| matrix/busy-bright | style switcher | 1.04 | 15.65 |
| matrix/busy-bright | view toggle: globe | 1.04 | 16.37 |
| matrix/busy-bright | field attention | 1.03 | 16.54 |
| matrix/busy-bright | expand-search edge tab | 1.07 | 15.85 |
| matrix/dark-ocean | style switcher | 14.15 | 17.87 |
| matrix/dark-ocean | view toggle: globe | 1.22 | 18.16 |
| matrix/dark-ocean | field attention | 14.34 | 17.86 |
| matrix/dark-ocean | expand-search edge tab | 10.76 | 18.46 |
| dark/white | style switcher | 1.10 | 15.79 |
| dark/white | view toggle: globe | 1.10 | 15.91 |
| dark/white | field attention | 1.10 | 16.03 |
| dark/white | expand-search edge tab | 1.10 | 15.01 |
| dark/mid-grey | style switcher | 3.30 | 16.56 |
| dark/mid-grey | view toggle: globe | 3.16 | 15.32 |
| dark/mid-grey | field attention | 3.30 | 16.64 |
| dark/mid-grey | expand-search edge tab | 3.20 | 15.76 |
| dark/busy-bright | style switcher | 1.04 | 16.35 |
| dark/busy-bright | view toggle: globe | 1.03 | 15.74 |
| dark/busy-bright | field attention | 1.03 | 15.50 |
| dark/busy-bright | expand-search edge tab | 1.10 | 15.19 |
| dark/dark-ocean | style switcher | 13.48 | 17.68 |
| dark/dark-ocean | view toggle: globe | 9.89 | 17.63 |
| dark/dark-ocean | field attention | 13.67 | 17.55 |
| dark/dark-ocean | expand-search edge tab | 13.01 | 18.14 |

Focus checks below 3:1: before 18/32, after 0/32. Not measured: the Report help button's focus ring (its tooltip opens on focus and covers it; 0 ring pixels), disabled states (no disabled control sits over the map), the globe canvas, real tiles.
