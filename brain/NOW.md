# NOW — current truth only

Last verified: 2026-09-27 (Social Burst #1). Re-verify anything more than a
few days old before acting on it.

## PRODUCT DIRECTION
OOH Earth is now a **social-network programme run in short bursts** — see
`brain/PRODUCT.md` (north star, core loop, privacy/safety hard rules).
Read it before any feature work.

## CURRENT_ORIGIN_MAIN
`424cd3c` at the start of this burst, plus the Social Burst #1 PR once
merged (`feat/social-v1-discover`). Always `git fetch origin main` first.

## PRODUCTION_FRONTEND
`oohearth.app` → app id `6a62213cff3ccbca88c04ff5` → entry
`index-BKY7OUQV.js` (Social Burst #1 build, on React 19 + react-leaflet 5).
Rendered QA passed on real data: Map (1 canvas, exactly 1 Location
request, 0 WebSockets anonymous), Location Detail on mobile, Home.

## BACKUP_FRONTEND
`ooh-earth-backup.base44.app` → app id `6a6748e009b947cb29591871` → entry
`index-BxOusg1z.js` (same Social Burst #1 source).

## OPEN_P0 / SECURITY
None open. No schema, function, credential, or permission change this
burst.

## SOCIAL BURST #1 — SHIPPED
The Home live activity feed (real, auth-gated realtime events — nothing
fabricated) now links new places and adopted landmarks to their public
Location Detail page. See `QUEUE.md` SOCIAL-1.

## DEPRIORITISED FOR THIS PROGRAMME
framer-motion 13, react-resizable-panels 4, TypeScript 7 — unless one
becomes a direct blocker.

## STILL SEPARATE / DEFERRED (not re-litigated)
UX-004 Carto key · `fix/production-app-binding` · AdObservation · Founding
directory.

## NEXT_TASK
Owner provides Social Burst #2. Recommendation in `QUEUE.md` SOCIAL-2.

## NEXT_PRODUCTION_WRITE
None pending.

## HUMAN_CHECKPOINT
Choose Burst #2 (recommended: public-profile real-world history, which
needs an additive `getPublicProfile` response change → owner approval for
the function deploy).
