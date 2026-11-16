# Validation of this skill on the Adbusting release (2026-11-16)
What each known failure needed. "Probe" = a method written in `measurement-probes.md`; "human" = a person (or the model) looking at a
whole-screen screenshot. Emulation only (Windows Chrome DevTools MCP, `mobile,touch`); not a physical phone. This file records
manual runs. **The skill is not wired into CI or any scheduler; nothing in it has run unattended.**

| Known failure | First found by | Does the skill's method catch it? | Evidence |
| --- | --- | --- | --- |
| **Claim hit area overstated** (#419 said "~44px"; rendered 58x24 visible, ~64x34 tappable; 8px label) | Probe A during BACKUP Window I (DevTools) | **Yes, by probe A** (visible vs sampled tappable, computed font-size, leaks). Sweep (I) alone does **not** flag it: the control owns 100% and is >= 24px, so the *claimed vs rendered* comparison is the part that needs probe A / the recorded claim. | Window I record; the new spec fails on old `c869cc4`: height 24 (<44), font 8px (<10), 191 tappable points outside the visible box |
| **AIR panel hidden under the shared ticker** (button inside the map box, hit-test topmost, invisible) | The whole-screen screenshot (human) | **Probes A, B, C and the sweep missed it** (it was clickable). **Probe F (paint check)** catches it, but only after the failure was known: replayed on the unfixed build it listed the `z=950`, 95%-opaque ticker above the button. Needs the screenshot step to be done. | DevTools run on the unfixed build 2026-11-16; spec fails without the `z-1000` layer (`adbusting-short-landscape-hud.spec.ts`) |
| **Zoom controls whose centres passed but whose edges took Report's taps** (63% owned, 12px under Report) | The BACKUP screenshot (human), then measured | **Yes, by the sweep (probe I) with no hint**: replayed on the old `03fb5c7` build in Flat at 844x390 it flagged `Zoom in` and `Zoom out` at 63% owned. The old centre-only spec could not. | Replay run 2026-11-16 (local preview of the saved `03fb5c7` artifact); Playwright fails 144/256 with the old CSS |
| **AIR close control 9.4x16 on touch** | Probe I flavour (size) + measurement in Window I3 | **Yes, by the sweep** (size < 24 flagged) replayed on `97de153` with the panel open. The 32px fix then wrapped the header: **only the screenshot caught that** (probes passed). | Replay run; Window I3 record; spec now asserts header <= 40px and list >= 32px |
| Header wrap after the 32px close | Whole-screen screenshot | **No probe**; added assertions (header height, list height) after the fact. | Window I3 record |
| Globe attribution under the ticker (pre-existing) | Sweep (3% owned) then probe F | **Yes, by the sweep** (`Toggle attribution` 84% at 320, 3% at 844x390) and probe F. | I3 record; live `1dbddda` identical at 320 |

## What the human step still contributed
- Seeing text collide or a control half covered at a glance (hint under the zoom column, header wrapping, AIR painted under the ticker).
- Deciding whether a flagged item is in scope (shared chrome vs Adbusting) and whether a finding is a regression (needs a live baseline).
- Judging that a measurement was invalid (selector matched the wrong element; an overly broad paint check flagged the global CRT layers).

## Rule changes this validation produced
- Sweep (probe I) is a mandatory step; it catches partial ownership and small targets without knowing where to look. It is noisy: exclude markers; classify shared chrome separately.
- Paint check (probe F) is mandatory for any new or moved control, plus the screenshot. Hit-testing alone is not evidence of visibility.
- Re-check the screenshot after **every** fix, not only after the first: a fix can create the next defect (32px close wrapped the header; an earlier 12px margin change did not fit).
- Compare claimed sizes in a PR description against sampled sizes (probe A).
