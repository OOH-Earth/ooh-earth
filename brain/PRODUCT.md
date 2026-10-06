# PRODUCT — durable direction (owner-set, 2026-09-27)

## NORTH STAR
**"The social network that gets you off social networks."**
The centre of OOH is the real world. A person's OOH identity should
increasingly mean *what they have actually done out there* — not bio +
selfies + follower count. Target feeling: "I've discovered another layer
of my city," not "I've opened another social app."

Moat: REAL PLACES + REAL CONTRIBUTIONS + REAL PEOPLE + REAL-WORLD ACTION.

## CORE LOOP
GO OUT → DISCOVER → DO SOMETHING → DOCUMENT IT → CONNECT → BUILD A
REAL-WORLD HISTORY → GO OUT AGAIN.

## DESIGN PRINCIPLES
- City as interface, not feed as interface. The map is the primary surface.
- Urban, futuristic, playful, exploratory, slightly mysterious (underground-
  network atmosphere). Never violence, criminality, vigilantism, or
  dangerous behaviour.
- Every social surface must point back to a real place or real action.
- Small, reversible, shippable slices — no big-bang redesigns.

## SOCIAL PRINCIPLES
- Connection emerges from shared real-world activity, not from browsing
  people.
- No infinite feed, no follower-count contest, no swipe mechanics, no
  engagement-maximisation.
- **No fake social proof** — never fabricate users, activity, completions,
  or friendships. A truthful empty state beats invented engagement.

## GAMIFICATION PRINCIPLES
- Reward meaningful real-world contribution (verified reports, rechecks,
  exploration, creative/community usefulness) — never time-in-app, scroll
  depth, likes, or follower counts.
- **Reuse what already exists**: a real XP/level/badge engine already ships
  in `src/components/ooh/gamification/gamification.js` +
  `src/hooks/useGamification.js`, computed client-side from real
  contribution records (12 levels Newcomer→Mythic, badges keyed to real
  report/verification counts, `QuestCompletion` daily/weekly bonuses).
  Extend it; don't build a parallel points system.

## PRIVACY / SAFETY PRINCIPLES (hard requirements, not later patches)
- No public exact live user location. No "X is here now" interfaces.
- No public movement trail without explicit, revocable consent.
- No automatic public profile exposure — profiles stay opt-in via the
  existing `User.profile_public` flag, enforced server-side in
  `getPublicProfile` (never returns id/email/role/access/agency).
- No automatic friend/contact graph. No unrestricted stranger messaging.
- No dating in early phases; no minor/adult matchmaking mechanics, ever.
- "Nearby" means places/missions/public activity — never nearby *people*.
  Any future people-discovery must be coarse, consent-based, and
  privacy-reviewed first.
- Activity links point to places, not persons.

## MASTER SOCIAL ROADMAP (owner-set 2026-09-27 — keep; one slice per burst)
| ID | Slice | Status |
|---|---|---|
| SOCIAL-1 | DISCOVERY LINKING — live activity → real Location Detail | CLOSED 2026-09-27 |
| SOCIAL-2 | FIELD RECORD — public profile → recent verified real-world contributions | CLOSED 2026-09-27 |
| SOCIAL-3 | MISSIONS — turn existing useful contribution actions / quests into clear real-world calls to action | CLOSED 2026-09-27 |
| SOCIAL-4 | PROGRESS — unify existing XP, level, badges and contribution stats into one public/private progress experience | CLOSED 2026-09-27 |
| SOCIAL-5 | TRAILS — consent-controlled history of meaningful places/contributions | **NEXT — human privacy checkpoint** (decision package in `QUEUE.md`) |
| SOCIAL-6 | CREWS — small opt-in groups around places, interests and missions | planned |
| SOCIAL-7 | DROPS — place-linked creative/photo discoveries | planned |
| SOCIAL-8 | CONNECTIONS — consent-based person-to-person connections emerging from shared activity | planned |
| SOCIAL-9 | LOCAL DISCOVERY — privacy-safe discovery of public activity / crews / opportunities in an area | planned |
| SOCIAL-10 | COLLABORATION — creative, ecology, photography, design, community and professional opportunities around real places | planned |

FUTURE ONLY — **dating / romantic discovery is NOT part of the early
social implementation** and requires explicit owner + privacy/safety review
before any implementation.

Order past SOCIAL-3 is re-decided per burst from shipped evidence.
Detailed architecture, when needed, goes in `docs/ops/ooh-earth/`.

## PERMANENT SOCIAL ARCHITECTURE RULES
- **A. Real-world action before social graph** — people discover OOH
  through places/actions first.
- **B. Existing gamification engine first** — extend XP/levels/badges/
  quests; never build a duplicate system.
- **C. Privacy by default** — public identity stays opt-in.
- **D. No precise people-nearby** — "nearby" means places, missions,
  public activity, crews; never exact user presence.
- **E. Mutual connections** — future Connections require explicit consent
  from both sides.
- **F. Crews before broad social graph** — shared activity gives people a
  reason to connect.
- **G. No infinite feed optimisation** — the objective is getting people
  outside.
- **H. No pay-to-status** — meaningful contribution alone determines
  progress.

## VISUAL DIRECTION
Surfaces to grow toward: FIELD RECORD · OPERATIVE LEVEL · MISSION BOARD ·
CITY PROGRESS · TRAILS · CREWS · DROPS — a subtle futuristic urban field
system. But: clarity > gimmicks · accessibility > cyberpunk decoration ·
real information > fake HUD noise · mobile usability > visual spectacle.
Use the OOH Earth brand tokens. Never redesign the whole app in one burst.
Reference implementation: the Field Record list on `FounderProfile.jsx`
(numbered rows, type glyph, title, type · day-precision date, 56px+ tap
targets, visible focus ring).

## SHIPPED SO FAR
- SOCIAL-1: Home live activity cards link new places / adopted landmarks
  to their public Location Detail page.
- SOCIAL-2: public Founding Profiles show a **Field Record** — up to 5 of
  the member's own *verified* places (title, type, day-precision date),
  each linking to Location Detail. Server-side in `getPublicProfile`,
  behind the same `profile_public` gate; a contribution record, not a
  movement tracker (no coordinates, no time of day, verified only).
- SOCIAL-3: **Missions = the existing Quest engine**, renamed for users.
  Mission Board on `/operative#missions` (available / in progress / ready
  to claim / claimed, UTC reset countdown, honest claim feedback). One
  period definition — UTC day, ISO week from Monday 00:00 UTC — shared by
  `claimQuest` (authoritative) and the board. Internal names stay
  Quest/QuestCompletion. The local route planner is "field route" in
  public copy (internal `fieldMission` code unchanged).
- SOCIAL-4: **Progress** — the private `/operative` page (already had a
  coherent level/XP/stats/badges/missions layout) now says "Progress"
  instead of "Operative"; the public Founder profile shows a **Progress**
  section with only the badges truthfully derivable from data
  `getPublicProfile` already returns (3 of 21 today), running the exact
  same badge predicates as the private page — never a second formula, and
  provably never a false positive (property-tested). XP/Level stay
  private everywhere except `/operative`: no truthful public number
  exists for them. No function/schema change.

## AUTONOMY (owner-set 2026-09-27)
Bounded, reversible, tested, privacy-preserving work inside the existing
permissions/data model that passes the GREEN RELEASE CHECK ships without
asking. Anything that changes who can see what, who can contact whom,
where people are, what personal data exists, who can modify what, how
money moves, or what users consent to is a HUMAN CHECKPOINT. Never claim
legal/compliance status from an engineering review.

## PRE-DAVE RELEASE STANDARD (owner-set 2026-09-27)
Dave is not our QA environment — his feedback is product feedback, not
our primary bug detector. If Dave can spot it in 30 seconds, we should
have spotted it first. No user-facing feature is reported externally
until responsive QA, DevTools QA, network/console QA, real production QA,
visual QA and reconciliation are all complete. Do not prepare or
recommend a Dave-facing update for work that hasn't passed our own
aggressive visual and functional review first.

Existing primitives confirmed during discovery (don't rebuild):
`MiniMapStack` (Home "the terrain, now" — recent real places + mini map),
`LiveActivityFeed` (realtime, auth-gated), public Founding Profiles
(`/founders/:handle`, opt-in, real `verified_reports`/`verified_rechecks`
counts + Field Record), the XP/level/badge engine, the Quest system
(`QUESTS` + server-validated `claimQuest` + `QuestCompletion`), the local
"Field Mission" route planner (`src/lib/fieldMission.js`), and an
admin-managed `Operative` roster entity (points/tier/badges — internal,
not the public identity).

## MAP & ENVIRONMENT PRINCIPLES (2026-10-06)
The goal is not maximum pins. The goal is maximum understanding of the physical world.
- **DENSITY BEFORE GEOGRAPHY.** Show what is actually here (real river network, habitat, observations) before adding more markers or decoration.
- **UNKNOWN IS DATA.** "Unknown", "no coverage" and "no observations in view" are honest answers. Never fill a gap with a plausible value, and never imply an empty environment from missing data.
- **FRESHNESS IS PART OF TRUTH.** Every observation carries its date or provider timestamp; stale or sparse data says so.
- **REFERENCE != LIVE.** Map geography (rivers, parks, cover) is labelled Reference. Illustrative samples are labelled Illustrative. Only dated provider readings are Recent/Current. Modelled values are Derived.
- **PLACE HAS MEMORY.** Environmental context should connect back to PLACE (and later OBSERVATION -> FIELD ACTION -> ACTIVITY) without new persistent tracking or schemas invented for the sake of it.
- **MAP LAYERS MUST EXPLAIN THEMSELVES.** Each layer shows what it is, where it came from, how recent it is, and what it is not (legend, trust badge, attribution, empty/error state).
