# Production regression gate — 2026-10-02

## Owner result

Production Chromium at qualified #319 merge, one worker and retries disabled: 13/16 pass, 3 fail. Release QA remains OPEN; green main CI does not supersede deployed-browser failures. Do not claim fully verified, ready for Dave, or resolve these failures by skipping tests.

Failures: selected Home popup matrix hits its shared 60-second timeout while locating the globe; glyph capture reports zero sprites at 1024×768 and 1440×900. Owner traces/screenshots exist but have not been inspected in Work. No production application regression or infrastructure root cause is established by the text output alone.

## Test-only correction and diagnostics

- Eleven independently loaded viewport checks previously shared one 60-second budget. Split into separately named tests, each retaining the same zero-intersection, >=8px gap, container containment, overflow and crash assertions.
- Glyph checks previously slept 1500ms, then sampled once. Await visible canvas and poll for the same minimum of two sprites using a bounded 15-second assertion; pixel thresholds remain unchanged.
- Assert the Home section mounts explicitly, so a missing section is reported for the precise viewport.
- No application source, SDK target, backend, schema, permissions, production data or deployed assets changed in this test-only branch. No deployment is needed to exercise these tests against production.

Verification: Prettier/test discovery pass locally. Browser execution remains required in CI and owner production Chromium. Corrected combined suite has 26 tests (19 globe tests plus the seven unchanged recovery/activity/heat cases).

## Separate #322 CI finding

Exact #322 head bfd502e: CodeQL and six blocking jobs passed, desktop browser job failed one new coordinate test at 844×390; 361 other desktop tests passed, one skipped. The existing mobile results sheet intercepts the Capture click in short landscape. This is a concrete UI-overlap finding, not evidence that manual-coordinate editing is broken. Coordinate test setup uses the existing real fullscreen control before opening capture at that viewport; never force or dispatch through the overlay. The default-landscape overlap needs its own bounded layout investigation before claiming capture journey completeness. #322 remains draft, awaiting fresh exact-head CI and BACKUP qualification.

Next: owner runs all 26 corrected production tests with one worker and no retries. If any fails, inspect its error-context, screenshot and trace before further changes. Retain the original 13/16 result and original artifacts. Production is unchanged during this diagnostic pass.

## Owner result: 26/26 — gate CLOSED

Owner ran the corrected suite (`e2e/globe-unavailable.spec.ts`, `e2e/globe-markers.spec.ts`, `e2e/home-globe-marker-artifact.spec.ts`, `e2e/live-activity-mobile.spec.ts`, `e2e/heat-layer.spec.ts`) against live `https://oohearth.app` at exact test commit `0ed533c660b4c805b146b1ccf9f112f5c1bc91ad`: **26/26 passed**, Chromium, one worker, zero retries, tracing enabled, 4.3 minutes, 2026-10-02. Checkout `/tmp/tmp.Ui5BXSGLcu`; output `test-results-production-323`.

Verified here, not taken on faith: `0ed533c`'s tree (`d15d16d`) is byte-identical to merge commit `5ca1644e47c6937f04eeebdf1610739a454d19e3`'s tree — the commit the owner tested is exactly what landed on `main`, not a near-miss. `5ca1644` itself has green CI (`36999754762`) and CodeQL (`36999754726`) at that exact head, and green CI/CodeQL on `main` after merge.

**This closes the #319 production responsive regression gate.** The original 13/16 result and its artifacts above are retained as historical evidence, not deleted or overwritten — they are superseded by this successful targeted run, not disproven; the original 3 failures' traces were never inspected, so their exact root cause remains formally unproven (plausibly the shared-timeout and sprite-timing issues #323 fixed, per the "test-only correction and diagnostics" section above, but that is the test fix's rationale, not a confirmed diagnosis of the original failures).

Authenticated QA and wider browser/device coverage beyond this 26-test suite remain separate, open limitations — not claimed closed by this result.
