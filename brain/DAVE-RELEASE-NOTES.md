# DAVE RELEASE NOTES — draft, not sent

Plain, user-visible facts only. No engineering jargon, no security-sensitive
detail, no exaggeration. Kept here until the current phase (SOCIAL-1..4) is
actually closed and the owner wants a summary. **Do not send anywhere without
being asked.**

## Discovery
- When something new is added to the map (a new spot, an adopted landmark),
  the live activity feed now links straight through to that place's page,
  instead of just showing a notification you can't act on.

## Field Record
- Public member profiles now show a short list of the real places that
  member has actually mapped and had verified — up to 5, most recent first,
  each one linking to the real page for that place. Not a follower count, not
  a feed — a record of real contributions.

## Missions
- The daily/weekly "quests" are now presented as Missions with a clear board:
  what's available, what's in progress, what's ready to claim, and what's
  already claimed, plus a countdown to when they reset.
- Fixed a real bug where the app could disagree with itself about whether a
  mission's daily/weekly window had reset, depending on what timezone or
  device someone was using. There is now exactly one clock, and it's the
  same for everyone everywhere.

## Progress
- The private member page is now clearly framed around Progress — level, XP,
  contribution stats, badges and missions in one place.
- Public profiles now also show a small set of real, earned badges — only
  ones that can be shown truthfully from data that's already public on that
  profile. Nothing is shown that isn't real, and nothing private (like exact
  XP or level) is exposed publicly.

## Mobile
- Everything above was checked on both desktop and mobile screen sizes,
  including landscape on the map, before going live.

## Privacy
- No new personal information was made public in any of this. Every public
  addition only shows things that were already safe to show, computed the
  same way the private page already computes them — never a shortcut or an
  approximation that could show something untrue.
- Found and are getting fixed (separately, carefully) a case where the
  app was more open than intended about who could read a small,
  low-sensitivity internal record type. No user data was exposed to anyone
  who shouldn't have already been able to see it in practice — this is a
  hardening step, not a breach.

## Real-world-first design
- Every one of these features points back at a real place or a real,
  verifiable action someone took — never an invented stat, an invented
  activity, or a "keep scrolling" feed.
