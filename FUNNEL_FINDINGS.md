# Contributor Funnel — Findings & Chosen Intervention

Investigated at `origin/main` = `0c7e74cc1eb9d9dc4e30ffaf9fc9b0a4198061c9`. Follow-up
to the R&D lane's `rnd/data-intelligence-model` (PR #158), which found real
production data density too low for downstream intelligence and identified
the upstream cause as unclear — this mission traces the actual capture code
to find out why.

## B. Current contributor funnel (CONFIRMED, from code)

```
Map/entry point
  -> FieldReport.jsx (new Location, 4 steps)
       Step 1: media type, photo (capture/upload + EXIF GPS), extra photos,
               AI Ad Scanner #1 (ReportScanner.jsx -> scanAd), address, GPS,
               optional title
       Step 2: AI Ad Scanner #2 (ReportStep2Identify.jsx's own separate
               InvokeLLM call), brand_name, campaign_name, parent_corp,
               ooh_operator, ad_agency, industry_sector -- ALL OPTIONAL
       Step 3: harm classification
       Step 4: adbust/response
  -> submitCapture() -> offline-queue-backed submit -> moderation
  -> gamification refresh (Discovery panel if authenticated + brand present)

Repeat observation:
  LocationDetail.jsx / BusStopDetail.jsx
       -> FieldCheckPanel.jsx ("Re-check this spot" button, prominent,
          already shows timeline/before-after/freshness UI)
       -> FieldCheckCamera.jsx (photo required, AI Ad Scanner #3 -- a THIRD
          separate InvokeLLM call, condition/adbust_type/brand_name,
          submit)
       -> submitFieldCheck() -> same offline-queue mechanism as above
```

## C. Biggest friction points

1. **Three separate, redundant AI-extraction code paths** (`ReportScanner.jsx`
   → `scanAd` server function; `ReportStep2Identify.jsx` → its own direct
   client-side `InvokeLLM`; `FieldCheckCamera.jsx` → another direct
   client-side `InvokeLLM`). Step 2's own code comment already flags this:
   *"Step 1's AI Ad Scanner already runs this same analysis... Don't
   present a second full-price scan as the primary action."* The UI was
   partially de-emphasized to reduce confusion, but the redundant code and
   the double-scan-prompt experience both remain. This is confusion +
   wasted LLM cost, not a broken feature.
2. **Step 2 presents five optional identification fields plus a duplicate
   AI scan button**, with zero soft nudge toward completing any of them.
   `Location.jsonc`'s schema `required` is only `title`/`lat`/`lng` (title
   auto-fills from type+address if left blank) — nothing in the schema or
   UI ever makes `brand_name` feel necessary. This lines up exactly with
   the real number from PR #158: 1.2% `brand_name` coverage in production.
3. **Two external-link distractions on Step 2** (Media Corps map link,
   two Clean Creatives F-List links, all `target="_blank"`) sit right next
   to the identification fields — a plausible, if unmeasured, drop-off
   risk mid-form.

## D. Biggest technical failure points

None found that block completion — the flow is well-built: camera/upload
both work, EXIF GPS auto-fill, offline queueing with idempotent
`client_operation_id` and retry (`offlineQueue.js`), graceful AI-failure
states (`detected.error` branches in all three AI paths), clear success/
queued states. **This funnel is not broken. It is under-motivated for one
specific behavior (repeat observation) and over-optional for another
(identification).**

## E. Biggest motivation gaps

**The single most concrete, quantified finding of this whole mission:**
`useGamification.js` explicitly computed `rechecks`/`rechecksVerified`
stats from real `FieldCheck` data but excluded them from XP entirely, with
its own comment: *"Not folded into xp/baseXp -- no point value for a
re-check has been product-validated yet... Pure visibility... nothing
fabricated."* Filing a new report earns 10–100 XP depending on
verification/photo. Filing a re-check — the exact behavior that builds the
longitudinal evidence timeline this whole R&D arc has been trying to
create data for — earned **exactly 0**. No badge existed for it either
(`gamification.js`'s `BADGES` array had brand/discovery-tier badges but
nothing for repeat observation, despite the stats already being computed
and available).

## F. Repeat-observation friction

**Discoverability is not the problem** — `FieldCheckPanel.jsx` is wired
into both `LocationDetail.jsx` (general locations) and `BusStopDetail.jsx`
(transit stops, 73% of real data), with a prominent, well-styled
"Re-check this spot" CTA and a genuinely good empty-state message ("Be the
first to re-photograph this exact location. Your check starts the
timeline"). The submission flow (`FieldCheckCamera.jsx`) is already close
to the "2 taps + photo + confirm" ideal the mission asked about: open
camera, capture, optionally adjust 3 quick fields (condition/adbust/brand,
all pre-filled from the parent Location as sane defaults), submit. **The
friction is motivational, not mechanical**: zero reward, and it requires a
deliberate return trip to a specific physical spot, which is inherently a
higher bar than reporting whatever ad you happen to see.

A previously unnoticed asset: **temporal change-detection UI already
exists and works** — `src/lib/fieldCheckFreshness.js`'s `detectChanges()`/
`computeFreshness()`, shared by `FieldCheckPanel`, the map's `LocationCard`,
and a `useRecentFieldChanges` "Recently Changed" feed — deliberately
honest (never fabricates a staleness threshold, only compares *verified*
pairs). This is essentially what PR #152 prototyped from scratch with
synthetic data, except real, shipped, and already wired to real UI. It has
simply never had real `FieldCheck` data to display. **Correction to the
R&D lane's earlier grep-based conclusion** ("no dedup/temporal-diff logic
exists anywhere") — it exists, just under names (`detectChanges`,
`computeFreshness`) that keyword search for `embedding|vector|similarity|
dedup` never matched.

## G. Current measurement gaps

Read-only check of `src/lib/trackEvent.js` call sites (per the
observability lane's existing instrumentation, treated strictly
read-only): `offer_viewed`/`checkout_started`/`payment_confirmed`
(donation funnel), `report_submitted`, `brand_identified`,
`report_verified`, `recheck_verified`, `recheck_submitted`, `badge_unlocked`
already exist. **`recheck_submitted` already fires** in
`FieldCheckCamera.jsx` on a successful sync. What's missing to fully answer
Section 8's checklist: no event for "capture started" (Step 1 opened), "AI
scan completed," or "form reached Step 2" specifically — but extending
telemetry event coverage would mean touching `src/lib/trackEvent.js` call
sites across the report flow, which is a measurement-architecture change
better scoped separately, and this mission's own instruction is to *read*
existing measurement, not build more of it. Not proposed as part of this
intervention.

## H–I. Candidate interventions, scored

(BUILD_COST / FAILURE_RISK / COLLISION_RISK: lower = better; all others
higher = better)

| Candidate | COMPLETION_LIFT | DATA_QUALITY | REPEAT_VALUE | BUILD_COST↓ | MOBILE_VALUE | FAILURE_RISK↓ | TIME_TO_TEST↓ | COLLISION_RISK↓ |
|---|---|---|---|---|---|---|---|---|
| **1. Reward re-checks with real XP + badges** | 7 | 6 | 9 | 2 | 5 | 2 | 2 | 1 |
| 2. Progressive enrichment / shorten Step 2 | 6 | 4 (real risk of *reducing* completeness) | 2 | 6 | 7 | 6 | 6 | 3 |
| 3. Unify the 3 AI-extraction paths | 5 | 6 | 2 | 6 | 4 | 5 | 5 | 4 |
| 4. Proactive "nearby placement" map prompt | 7 | 6 | 8 | 7 | 8 | 5 | 5 | 5 (touches `Map.jsx`) |

## J–K. Chosen intervention & why it beats #2

**Chosen: #1 — reward verified re-checks with real XP + two badges.**

It wins not on raw score alone but on the combination the mission asked
for: highest REPEAT_CONTRIBUTION_VALUE (directly targets Section 6's
special focus), lowest COLLISION_RISK (touches only
`pointsConfig.js`/`gamification.js`/`useGamification.js` — none owned by
any other lane), lowest BUILD_COST and FAILURE_RISK (purely additive
client-side XP math over data already fetched; no new UI, no schema, no
Base44 deploy), and fastest TIME_TO_TEST (real `FieldCheck` submissions
already flow through today — the very next verified one will show non-zero
XP with no other change needed).

**#2 (shorten/defer Step 2) loses specifically on the axis Section 5 warns
about hardest**: it risks the same problem it's trying to solve. Deferring
`brand_name` further has no evidence it gets filled in *later* rather than
never — and OOH Earth's real data already shows the opposite failure mode
(fields are optional today and 98.8% never get filled). Fixing the reward
loop for the behavior that already works well (re-checks) is a strictly
safer, faster experiment than restructuring the behavior that's already
under-completing (new-report identification).

## Design-only, deferred (not implemented — see Collision/Deploy note)

A `weekly_recheck` quest (mirroring `weekly_reports`/`weekly_busts`) would
reinforce the same intervention further, but `claimQuest`'s quest
definitions are re-implemented **server-side** in
`base44/functions/claimQuest/handler.ts` for anti-cheat authority (it does
not read the client's `gamification.js` `QUESTS` array). Adding a new quest
ID would require a Base44 function code change + deploy to take effect —
explicitly out of scope for this mission ("no Base44 deploy"). Flagged as
the natural next step once this XP change is validated, not blocked by
disagreement, just by the deploy boundary.
