# Technical Blockers

Only genuine blockers — things that cannot be resolved by engineering effort
alone. Cross-referenced to the decision/access items that unblock them.

| # | Blocker | Area | What's actually missing | Unblocked by |
|---|---|---|---|---|
| 1 | Release 1.3.0 / PR #63 stuck "Action required" | Release | A `workflow_dispatch` re-trigger mechanism (PR #64) produces real, passing check-runs on the correct commit SHA, but those check-runs never link into the PR's own `statusCheckRollup` (the thing branch protection actually reads) — confirmed via direct GitHub Checks API + GraphQL rollup query, not guessed. This is a gap in that fix, not a new problem. | A human with GitHub org/repo **Settings** access — see `14_RELEASE_STATUS.md` for the exact single action |
| 2 | No on-chain NFT minting in-app | NFT/Web3 | Deploying/using a smart contract requires a chain (Base vs. Solana — `Mint.jsonc` already models both), a funded deployer wallet, and a decision on who bears gas costs | Dave's decision + external wallet/contract infrastructure — see `11_NFT_WEB3_STATUS.md` |
| 3 | No Hermes integration | Advanced ops | No specification exists anywhere in this repository — nothing to build against | An exact spec from Dave (what system, what API, what auth) — see `12_HERMES_STATUS.md` |
| 4 | No agency/freelance backend | Agency workflow | Timesheets/clock-in-out/signed-documents imply real employment-classification and e-signature integrations, not just UI | Dave's scope decision — see `13_AGENCY_WORKFLOW_STATUS.md` |

## Explicitly NOT blockers (verified, not assumed)

- **react-leaflet upgrade** — `react-leaflet@5.0.0` hard-requires React 19
  (confirmed via `npm view react-leaflet@5.0.0 peerDependencies`); this repo
  is on React 18. Not touched, per explicit instruction to leave dependency
  upgrades alone this pass — documented here only so it isn't mistaken for a
  blocker on anything above (it blocks nothing in this pass's scope).
- **zod** — confirmed genuinely unused anywhere in `src/`/`base44/`
  (zero imports). Not a blocker on anything.
