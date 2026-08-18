# Decisions & Blockers — Sorted for Dave

Every item below is sorted into exactly one category. Nothing here is
engineering work disguised as a "decision" — each genuinely needs your
input, external access, or scope before another line of code should be
written.

---

## A. Engineering Complete
(Shipped, merged, tested — nothing to decide.)

Corporate footprint cross-referencing · brand/parent-corp map search ·
Activity Heat + hotspot-to-report handoff · AR parent-corporation context ·
trophy → NFT Studio connection · CI observability across every gate.

See `DAVE_COMPLETION_CHECKLIST.md` items 3, 4, 5, 6, 7, 9, 11, 13.

## B. Verified Existing
(Already real before this pass — re-confirmed, not rebuilt.)

Adbusting capture + AI identification · brand intelligence · AR
camera/GPS/capture pipeline · contribution/trophy/XP system · commercial
licensing (AGPL-3.0 / CC BY-SA 4.0).

See `DAVE_COMPLETION_CHECKLIST.md` items 1, 2, 8, 10, 18.

## C. Partial — Needs a Product Decision

| Item | Why it's partial | What Dave must decide | Recommended default |
|---|---|---|---|
| Verified-only heat filter | Not built — small, additive | Ship it or not? | Ship it — low risk, uses existing `status` field |
| NFT on-chain minting | Prepare-in-app works; minting itself is external (Zora) | Which chain (Base/Solana, both already modeled)? Who pays gas? Keep external or bring in-app? | Keep external — avoids the app custodying funds or keys |
| Business intelligence view | Real data exists per-location; no dashboard | What specific question should it answer? | None — don't build a dashboard for no named question |
| Fundraising intelligence view | Same underlying data, no dedicated view | Same as above | Same as above |
| Real `Brand`/`Organisation` entity | Free-text fields work today | Worth a migration for cross-spelling dedup (e.g. "Shell" vs "Shell plc")? | No — not needed for anything currently asked |

## D. Blocked — Needs External Access

| Item | Why | What's needed | Who decides | What unblocks it |
|---|---|---|---|---|
| Release 1.3.0 (PR #63) | Check-runs pass on the commit but don't link into the PR's own branch-protection rollup — a diagnosed gap in an earlier fix (PR #64), not a new bug | GitHub org/repo **Settings** access | A human with org admin rights | Fix the rollup linkage, or manually re-trigger via a mechanism that populates it |
| Real on-chain NFT minting (if pursued) | No deployed contract, no funded wallet, no chain decision | External wallet/contract infrastructure | Dave (business) + whoever holds the wallet | Decision C above, plus the infrastructure itself |

## E. Not Started — Needs Scope

| Item | Why | What Dave must decide | Estimated size | Commercial value | Risk |
|---|---|---|---|---|---|
| **Agency / freelance workflow** | `ClientPortal.jsx` is an honest, explicitly sample-labeled scaffold — zero real timesheet/clock-in/signed-document infrastructure exists anywhere in the repo | Worker classification (employee/contractor/volunteer — real legal weight); e-signature vendor or a simpler acknowledgment flow; internal-ops-only vs. client-facing | Medium–large | Medium — enables real client/contributor operations | Legal/compensation exposure if scoped wrong before building |
| **Hermes** | Zero references anywhere in the repository (`grep -rli "hermes"` across every source/config/doc file — zero matches) | What Hermes actually is, its API/auth surface, and what it's for | Unknown until specified | Unknown until specified | Building without a spec means fabricating an integration |

---

## Full detail on each

Decision A (Brand entity), B (heat filter), C (AR object detection), D (NFT
chain), F (agency scope), G (Hermes spec), H (BI use case), I (relicensing)
are elaborated with full reasoning in the per-topic status files:
`11_NFT_WEB3_STATUS.md`, `12_HERMES_STATUS.md`, `13_AGENCY_WORKFLOW_STATUS.md`,
`15_LICENSING_STATUS.md`. This file is the fast-scan summary; those are the
detailed backing.

**Note**: the earlier "Decision E — ship the badge→NFT prefill link?" is now
resolved — it shipped as PR #98 and is listed in section A above.
