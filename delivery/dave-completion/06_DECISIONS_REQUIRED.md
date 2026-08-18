# Decisions Required From Dave

Every item below materially affects business model, legal exposure,
architecture, or credentials — exactly the category this mission's own rules
say must stop for a decision rather than guess. Each has a recommended
default where one exists.

## Decision A — Real `Brand`/`Organisation` entity?
**Question:** Keep running on the existing free-text `brand_name`/`parent_corp`
fields (works today, zero migration risk), or build a real relational entity
(would let you dedupe spelling variants — "Shell" vs "Shell plc" — and attach
brand-level metadata not tied to any one location)?
**Recommended default:** Keep the free-text model. Nothing currently asked
requires the migration; revisit only if a concrete need appears (e.g.
brand-level analytics across variant spellings).
**Blocks:** Nothing currently. Would unblock: cross-spelling brand dedup.

## Decision B — Verified-only heat filter?
**Question:** Add a toggle to show heat intensity from verified reports only?
**Recommended default:** Ship it — it's a small, additive filter using
existing `status` data, no new architecture.
**Blocks:** Item 4 in `04_REMAINING_WORK.md`.

## Decision C — Real AR object detection?
**Question:** Invest in genuine client-side computer vision for the "lock on"
reticle (currently an honest manual UI gesture), or keep it as-is?
**Recommended default:** Keep as-is. It's already honestly labeled, never
claims real detection, and a real CV feature is a multi-week model/latency/
accuracy project, not a small integration.
**Blocks:** Nothing — current UI is honest either way.

## Decision D — NFT on-chain strategy
**Question:** Who deploys/pays for the smart contract, which chain (Base or
Solana — both already modeled in `Mint.jsonc`), and is "prepare in-app,
mint externally on Zora" the permanent design, or should minting move
in-app?
**Recommended default:** Keep prepare-in-app/mint-externally — it's honest,
already works, and avoids the app custodying gas funds or private keys.
**Blocks:** Any real on-chain minting work (Blocker #2).

## Decision E — Ship the badge→NFT prefill link?
**Question:** The working prototype (earned badge deep-links into the NFT
studio with title/grade prefilled from the badge's tier) exists but was
shelved as out-of-priority in an earlier pass. Ship it now?
**Recommended default:** Yes — small, real, already built and verified, ties
two existing systems together without inventing anything.
**Blocks:** Item 3 in `04_REMAINING_WORK.md`.

## Decision F — Agency/freelance operations scope
**Question:** What is the actual v1 scope? Specifically:
- Are contributors employees, contractors, or volunteers (this changes what
  "timesheets"/"clock in-out" legally imply)?
- Is a real e-signature integration (e.g. DocuSign/HelloSign) in budget, or
  is "signed documents" a simpler acknowledgment flow?
- Is this internal-ops-only, or client-facing (the existing `ClientPortal.jsx`
  scaffold is client-facing)?
**Recommended default:** None offered — this is a genuine scope decision with
real legal/compensation implications; building ahead of an answer would be
inventing business logic.
**Blocks:** All of `13_AGENCY_WORKFLOW_STATUS.md`.

## Decision G — What is Hermes?
**Question:** An exact specification: what system does Hermes live in
(internal tool, third-party SaaS, a protocol spec)? What API surface, auth
model, and data does it expose? What should OOH Earth actually call it for?
**Recommended default:** None — there is nothing in this repository to
default to. This needs a real spec, not an assumption.
**Blocks:** All of `12_HERMES_STATUS.md`.

## Decision H — Business-intelligence use case
**Question:** Is there a specific BI view wanted (e.g. "total documented
exposure per corporation," "most-reported sector this month"), or is the
existing per-location/per-brand exposure sufficient for now?
**Recommended default:** Existing exposure is sufficient absent a named use
case — building a dashboard for no specified question risks becoming the
"giant CRM" the mission explicitly said not to build.
**Blocks:** Nothing currently — this is opportunity-sizing, not a blocker.

## Decision I — Commercial relicensing
**Question:** The codebase is AGPL-3.0 (strong copyleft — a SaaS competitor
using this code would likely be required to open-source their modifications).
Does any commercialization plan require different licensing terms (e.g. a
dual-license or a more permissive license for parts of the stack)?
**Recommended default:** None offered — this is a legal/business decision
explicitly outside engineering's authority to make.
**Blocks:** Nothing today; matters only if/when commercialization plans
solidify. See `15_LICENSING_STATUS.md`.
