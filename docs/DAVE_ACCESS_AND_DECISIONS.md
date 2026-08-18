# Dave — Access & Decisions Required

Only things that genuinely need Dave (or someone with access/authority he designates). Nothing here is engineering work waiting on a rubber stamp — each blocks real progress without it. Engineering continues on everything else in parallel; nothing below is blocking buildable work.

## Access

| Item | Why it's needed | What unblocks it |
|---|---|---|
| Render/Base44 dashboard access | The live `oohearth.app` site is serving different content than this repo's `main` branch (different tagline/description — see `docs/BASE44_ARCHITECTURE_AND_ACCESS.md`). Cannot determine why from inside the repo. | Confirm which environment is actually live and why it's out of sync |
| Base44 subscription/plan details | Determines what's actually possible for staging, serverless functions, or a bot-detection metadata proxy | Clarifies which of this pass's "requires external access" items are even feasible on the current plan |
| GitHub org Settings access | PR #63 / release 1.3.0 blocked on a branch-protection rollup gap, unrelated to this pass | A human with org admin rights |
| Framer access (if a Framer-embedded showcase is wanted) | No Framer project exists in this repo; nothing to audit | Only relevant if Dave wants the showcase embedded there |
| Press/media distribution accounts (if pursued) | No press infrastructure exists yet | Scope first — see below |
| Signal/Telegram ownership (if pursued) | No automation exists or was built — explicitly out of scope this pass per instruction | A decision on whether this is wanted at all |

## Decisions

| Item | What Dave must decide |
|---|---|
| Final copy / brand positioning | The live site and this repo currently disagree on the product's own tagline. Which is current? |
| Hermes specification | What it is, its API/auth surface, what it's for — zero references anywhere in this codebase |
| NFT chain/custody/gas | Which chain (Base/Solana, both already modeled), who pays gas, whether the app should ever custody keys |
| Agency/legal worker classification | Employee/contractor/volunteer — real legal weight, needed before any agency workflow can be built |
| E-signature approach | Vendor, or a simpler acknowledgment flow, for agency workflow |
| Licensing/commercial decisions | Whether/how to relicense any part of the codebase — audit-only so far, correctly untouched |

Do not block engineering unnecessarily — everything not listed above is either shipped, being worked, or genuinely optional. See `delivery/dave-completion/06_DECISIONS_REQUIRED.md` for the fuller Dave-completion-specific decision set (agency, NFT, Hermes, BI/fundraising dashboards, release access).
