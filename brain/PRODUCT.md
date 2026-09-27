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

## CURRENT BUILD PHASE
Social Burst #1 (2026-09-27): shipped. The existing Home live activity feed
(real, auth-gated realtime events) now links each new place / adopted
landmark to its public Location Detail page — turning ambient activity
into "go look at this." See `QUEUE.md` SOCIAL-1.

Existing primitives confirmed during discovery (don't rebuild):
`MiniMapStack` (Home "the terrain, now" — recent real places + mini map),
`LiveActivityFeed` (realtime, auth-gated), public Founding Profiles
(`/founders/:handle`, opt-in, real `verified_reports`/`verified_rechecks`
counts), the XP/level/badge engine, `QuestCompletion`, and an
admin-managed `Operative` roster entity (points/tier/badges — internal,
not the public identity).

## DEFERRED IDEAS (do not build without an explicit burst)
Missions · Progress/XP surfaced on public profiles · consent-controlled
Trails · Crews · Drops · Connections (consensual graph) · coarse local
discovery · collaboration layer · dating (not an early burst).
Order is decided per burst from shipped evidence, not from this list.
Detailed architecture, when needed, goes in `docs/ops/ooh-earth/`.
