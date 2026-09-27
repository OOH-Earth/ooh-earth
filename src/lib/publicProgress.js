// Public Progress — the truthful subset of a member's badges that can be
// shown on their PUBLIC Founder profile, derived ONLY from fields
// getPublicProfile already returns publicly (contributions.verified_reports
// / contributions.verified_rechecks). No new field is added to that
// function for this: everything here runs client-side over data the
// visitor already received.
//
// This deliberately reuses the exact same canonical BADGES.check()
// predicates the private /operative page uses — never a second, competing
// formula (see brain/PRODUCT.md rule B). A public-only stats object is
// built with ONLY the two keys that are provably identical, in both name
// and meaning, to what the private page computes:
//   verified          == contributions.verified_reports  (own Location
//                         rows with status:'verified' -- same query)
//   rechecksVerified   == contributions.verified_rechecks (own FieldCheck
//                         rows with status:'verified' -- same query)
// Every other private stat key (reports, photos, busts, mints, leads,
// streak, xp, brandCounts) is left undefined. A badge whose check()
// touches any of those can never wrongly evaluate true from missing data
// (undefined comparisons are falsy) -- so this is only ever
// UNDER-inclusive of the real private badge set, never over-inclusive.
// A badge that cannot be reproduced this way simply never appears here;
// it still appears on the private /operative page as before.
//
// XP/Level are intentionally NOT exposed publicly at all: the real XP
// total also depends on entirely private inputs (total report count
// including pending, photo bonus, DigitalBust/Mint/LeadClaim counts,
// QuestCompletion XP) that have no public equivalent, so no truthful
// public XP/Level number can be produced. Inventing an approximate one
// would silently diverge from the private truth -- not allowed.

import { BADGES } from '../components/ooh/gamification/gamification.js';

export function publicStatsFrom(contributions) {
  return {
    verified: Number(contributions?.verified_reports) || 0,
    rechecksVerified: Number(contributions?.verified_rechecks) || 0,
  };
}

export function publicEarnedBadges(contributions) {
  const stats = publicStatsFrom(contributions);
  return BADGES.filter((b) => {
    try {
      return !!b.check(stats);
    } catch {
      return false;
    }
  });
}
