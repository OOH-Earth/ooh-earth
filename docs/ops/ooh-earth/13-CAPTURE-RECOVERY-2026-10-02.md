# Capture recovery and release qualification — 2026-10-02

## Qualified release

Owner terminal reports 16/16 Chromium tests passed against live BACKUP with one worker and retries disabled at `7f58ce9`. This covers forced WebGL2 recovery, normal globe markers/geometry, mobile activity and heat. Earlier six-worker run failed 11/14; concurrency is a possible contributor, not a proven root cause. Exact-head CI run 36902037859 and CodeQL 36902037871 succeeded. #319 merged as `31617284a289c62d8a8cb312fc4d70c079c5a746`.

Fresh merged-source production entry: `assets/index-D7jCRmhl.js`; SHA256 `d8aca1f8dd214ca9c71293287a4a94192c2c55c8526cb55c2107d17615fa59e7`; SDK appId `6a62213cff3ccbca88c04ff5`, BACKUP string hits zero. No deployment initiated from Work. Previous Base44 API execution-policy denial prevents deployment here. Production live reconciliation remains a separate gate.

## Bounded audit

Goal: recover field capture when camera/location are unavailable, without losing place context. Current-run cloud Chromium at 1363×936, anonymous BACKUP, was used. No real user location supplied; public test coordinates were typed without submission.

| Step | Health | Evidence |
| --- | --- | --- |
| 1. Map → Capture | Works | Visible capture action opens named, focus-trapped modal; exact screenshot capture-01-map.jpg |
| 2. Camera/location unavailable | Recovery offered | Gallery and manual coordinate fields appear; exact screenshot capture-02-recovery.jpg |
| 3. Fill both coordinates | Defect confirmed | Manual inputs removed and focus moves to page root; exact screenshot capture-03-hidden-inputs.jpg |

Screenshots are current-run local audit attachments, not historical screenshots. Camera hardware, actual geolocation, upload, submission and authenticated states were not exercised. No upload or contribution submission was initiated. This is a bounded recovery audit, not full capture-loop or accessibility certification.

## Root cause and candidate

`QuickCapture.jsx` renders manual inputs only while latitude or longitude is empty. The first character in the second field removes both fields; corrections and negative-coordinate typing can be interrupted. Candidate tracks whether coordinates were manually edited, keeps those fields visible, and assigns stable accessible names. Successful geolocation and reset clear manual mode. Existing upload, submission, offline queue, identity, moderation and privacy semantics are unchanged.

Three responsive browser regression cases type a negative longitude character by character, assert focus/value retention, edit latitude, check overflow and verify no entity mutation requests. Browser execution must complete in CI; local browser unavailable. Local lint/typecheck pass; build/format validation recorded separately. No new schema/vendor/permission/function or backend work.

Next: qualify this candidate on BACKUP after CI, then serialize its release after #319. Continue the existing Place → Contribution loop without inventing public creative publishing or social graph infrastructure.

## Fresh production observation

Public check at the end of this pass finds production entry `assets/index-D00a9FXq.js`, SHA256 `8a497bad076918554120b7b72f4b5af2506949276a0f096e29de2febb105711b`; Globe3D `Globe3D-BJEfLZs5.js`. Runtime SDK targets production with zero BACKUP references. Live release manifest identifies merged #318 (`133e9db`) rather than previous #308. This deployment was not performed by Work. Do not assume the earlier production artifact remains current; reconcile the #318 build before recommending the #319 deploy. Manifest fields alone do not establish rendered release qualification.

Fresh #318-targeted build produces the same `index-D00a9FXq.js` entry and SHA256 as live production. The entry is reconciled byte-for-byte. This removes source ambiguity for the pending #319 frontend release; it does not substitute for rendered production QA.

## Owner deployment and current live proof

Owner attachment `Pasted text(20261002-104011).txt` records successful frontend-only production deployment from pinned #319 merge in `/tmp/tmp.YaCwdsSQqU`, after the entry hash guard passed. Fresh public production entry is `/assets/index-D7jCRmhl.js`, SHA256 `d8aca1f8dd214ca9c71293287a4a94192c2c55c8526cb55c2107d17615fa59e7`. Live manifest identifies `31617284a289c62d8a8cb312fc4d70c079c5a746`. Entry and Home-D9J_DvYd, Map-DyQwRnAb, Globe3D-DQhI618A, LiveActivityFeed-Ax881eaI chunks match the clean merged-source build byte-for-byte. Earlier #318 production observation is superseded.

Cloud Chromium 1363×936 without WebGL2 renders Home normally with a 44px field-map recovery link. Clicking navigates to `/map`: Leaflet container 723×657.21875, 23 marker DOM elements, visible real clusters/thumbnails, no document overflow and no page error boundary. Console inspection finds known session-recordings 429 and browser-extension metadata failures, no application error entries. Current-run screenshot `production-319-flat.jpg` captured and inspected. No upload, capture submission or entity mutation was initiated; comprehensive network mutation monitoring was unavailable. Full responsive supported-device and authenticated production QA are not claimed; owner serial production regression remains pending.
