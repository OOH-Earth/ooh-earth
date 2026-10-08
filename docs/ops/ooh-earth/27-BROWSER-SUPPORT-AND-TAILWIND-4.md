# Browser support evidence and the Tailwind 4 decision

Written 2026-10-08. Read-only analysis: no support policy is changed, no migration is authorized, and "modern browsers only" is not declared.

## What the repository actually says about support
- **There is no written support policy.** Searches of `AGENTS.md`, `brain/`, `docs/ops/`, `README`, `ENGINEERING*.md`, `FIELD_TESTING_PLAYBOOK.md` and `package.json` find no supported-browser list and no `browserslist`. The only device statements are incident reports: the owner's phone is Chrome on Android (doc 02), and BACKUP was inspected at 360x740 with an Android UA (docs 00/02).
- **Build target (effective JS floor):** Vite 6.4.3 defaults to `es2020, edge88, firefox78, chrome87, safari14` (`ESBUILD_MODULES_TARGET` in `node_modules/vite`). That is a compile target, not a tested guarantee; the app also needs WebGL for its globe and maps (an unsupported-device recovery path exists), and no dependency (MapLibre 6.9, Leaflet 1.9, three 0.186, React 19.3) publishes a browser floor in its package metadata.
- **Test coverage by browser engine** (Playwright `devices`): `Desktop Chrome` and `Pixel 7`, both Chromium. **No WebKit/Safari, no Firefox, no physical-phone suite** is in CI. Physical-phone testing of the current BACKUP candidate is explicitly outstanding.

## Evidence classes (keep them separate)
| Class | What it proves | Exists today |
|---|---|---|
| Chromium emulation (Desktop Chrome, Pixel 7), CI + visual baselines (doc 26) | Layout/behaviour in Chromium at three viewports | Yes |
| Safari / WebKit | CSS/JS feature support on Apple engines (iOS has no other engine) | **None** |
| Firefox | Gecko behaviour | **None** |
| Physical phones | Real GPU, touch, keyboard, camera/geolocation, performance | **Outstanding** |

Chromium emulation says nothing about whether Safari 15, an older iPhone or Firefox ESR can render the site.

## What Tailwind 4 requires (fetched 2026-10-08 from tailwindcss.com/docs/compatibility)
Minimum **Safari 16.4, Chrome 111, Firefox 128**, built on native CSS variables/nesting, `color-mix()`, math functions, `@property` and cascade layers; the docs state there are no fallbacks for older browsers.

## Compatibility trade-off
- Tailwind 4's floor is 2-3 years above the current JS compile target (Safari 14 / Chrome 87 / Firefox 78). The gap is real, but because **current support is undefined and untested outside Chromium, it cannot be said which currently *working* devices Tailwind 4 would break.**
- Likely excluded by the Tailwind 4 floor (to verify against the vendors' lists before relying on it): iOS/iPadOS before 16.4 (devices stuck on iOS 15, such as iPhone 6s/7/SE 1st gen, iPad Air 2, iPad mini 4), Safari before 16.4, Firefox ESR before 128, Chrome before 111. For a street-level field product used on personal phones in varied regions, older handsets are a plausible audience, not a hypothetical one.
- Security side of the decision: the 7 open audit findings are devDependencies on trusted build input and none is in `dist/` (doc 24), so staying on Tailwind 3 does not expose users; it leaves CI/dev-machine hygiene risk only. No patched `braces` exists, so the findings cannot be cleared without leaving Tailwind 3.

## Recommendation
1. **Do not migrate yet.** Keep Tailwind 3 and the current support posture until the owner chooses a floor (this is an owner decision because it can exclude users).
2. **Cheap evidence first, no decision needed:** (a) record the real device/browser mix from whatever analytics Base44/hosting exposes (not accessible to the agent); (b) add a Playwright WebKit (and Firefox) project to the visual and smoke suites as a compatibility signal, understanding that Linux WebKit is not iOS Safari; (c) run the BACKUP candidate on at least one iPhone and one Android phone of different age.
3. **Then decide:** if the floor may become Safari 16.4 / Chrome 111 / Firefox 128 (and the device mix shows negligible traffic below it), proceed with the #348 plan using doc 26's baselines as the reference. If older devices must keep working, stay on Tailwind 3 and manage the build-chain findings as a documented, owner-accepted build-time risk (that acceptance is the owner's to make; this document does not record it).
4. Either way, a Tailwind migration is its own candidate, never combined with feature work, and needs fresh BACKUP qualification.

## Owner decision required (exact trade-off)
Choose between (A) raising the effective floor to Safari 16.4 / Chrome 111 / Firefox 128 in exchange for clearing the 7 findings and a maintained Tailwind, or (B) preserving the current wider-but-unverified device range while carrying the build-chain findings until upstream publishes a fixed `braces` or the floor can rise. Independent work continues meanwhile (baselines, WebKit/Firefox signal, phone testing).
