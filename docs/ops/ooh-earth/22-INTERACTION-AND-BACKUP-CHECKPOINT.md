# Interaction and BACKUP checkpoint — 2026-10-07

## Observed evidence

- #336 head `df43402`: CI/CodeQL green. Desktop had one retried Ecology keyboard-selection failure (details did not appear after Enter), one skip and 439 passes; mobile 107 passes. This is not zero-retry qualification.
- #343 head `ffc3cbe`: CI/CodeQL green. Desktop reproduced the queued manual-coordinate issue: longitude expected `-73.9857`, received `-7`, then passed on retry. No cause is inferred merely from a green retry.
- #342 head `143ac24`: CI/CodeQL green, hydro unit tests 26/26; desktop 458 passes and one skip, no flaky tests reported.

## Bounded correction and proof plan

The shared dialog focus hook schedules initial autofocus for a later animation frame. Previously that callback unconditionally focused the first control, even if the user had already focused an input. The correction preserves focus already inside the dialog. Opening focus, Tab trapping, Escape handling and closing focus restoration remain unchanged.

The new capture regression deliberately holds opening animation frames, types into Longitude, releases the frames and requires focus/value retention. A dedicated CI workflow first builds the previous hook implementation and requires the specific post-frame focus-loss failure, then builds the corrected source and repeats all four coordinate viewports, that regression and Ecology selection five times, serially, with zero retries (30 checks). Test discovery confirms six selected tests; execution is not claimed before results.

Ecology selection now waits for a visible card, asserts focus before Enter, targets that card's keyboard activation and asserts selected state before inspecting details. This improves diagnosis/readiness; it does not establish the cause of the earlier failure or claim an additional product defect is fixed.

## BACKUP boundary

The reconciled pilot BACKUP build at `df43402` targets app `6a6748e009b947cb29591871`: entry `/assets/index-DZvDPYaq.js`, SHA-256 `75edbe9c76b95bc15700126fc41f282791f5e016963761d23088334a8b06dbb9`. Manifest identities match that commit. It is not deployed or rendered-qualified, and it does not contain this interaction correction.

Local pinned CLI resolution timed out. An authenticated Base44 connector confirmed ownership of BACKUP and a read-only sandbox check successfully ran `base44@0.1.14`; that CLI explicitly reported it was not logged in and entered device authentication before timing out. Connector OAuth is not CLI authentication. No token is copied or inspected. A working, authenticated CLI context is required before the frontend-only deploy and live artifact/rendered checks. No deploy attempt, backend/schema/permission/entity change or production-candidate change was made.

Resume by checking exact-head CI, preserving unpublished owner work, and qualifying the intended BACKUP candidate with the corrected source included through reviewed reconciliation. Keep production frozen at `a1868f122aa965fd96ab023492bed62470fb1106`; do not substitute current main or the older #322-only script. Existing generation-layer/source-licensing/provenance checkpoints stay separate.
