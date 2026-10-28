# DevOps reference — reconciliation of guide v1.1 (proposed)

Status: **PROPOSED reference, reconciled 2026-10-28.** Source: "OOH Earth DevOps & Reliability Operating Guide v1.1" (PDF, 28 Oct 2026, prepared for David and Adil); the PDF is not committed here (owner to decide whether it is). It is a researched proposal, not evidence that its practices are implemented. Repository instructions (`AGENTS.md`, `docs/engineering/CONSTITUTION.md`, `WORKFLOW.md`) stay authoritative; this file links them and adds no competing rules. Labels: VERIFIED (observed, with date) · REPORTED · PROPOSED · UNKNOWN.

## Existing canonical homes (link, do not duplicate)
Release procedure `docs/ops/ooh-earth/03-RELEASE-RUNBOOK.md`, `brain/ENVIRONMENTS.md` · decisions `docs/ops/ooh-earth/07-DECISION-LOG.md` · evidence `06-EVIDENCE-LOG.md` · architecture `docs/BASE44_ARCHITECTURE_AND_ACCESS.md` · reliability `docs/RELIABILITY_CONSTITUTION.md` · CI `CI_PIPELINE.md` · specs `specs/` · mapping detail `specs/devops-reference-adoption/spec.md`.

## Practice / evidence / gap / owner / acceptance
| Practice (guide §) | Evidence (date) | Label | Gap | Owner | Acceptance check |
|---|---|---|---|---|---|
| Release identity independent of branch tip (§6) | 2026-10-28: #384 merged `1dbddda`, tree `dd50ba6c…` == qualified tree; production served manifest `git_sha 1dbddda`, entry `index-CJWCp393.js`, 373/373 assets matched the build | VERIFIED | Verification scripts not in version control (`SPEC.md`) | engineering | Scripts committed or runbook step listed |
| Qualify on BACKUP, reserve, check inactivity (§6) | Reservation + 371/371 non-sitemap asset match + Windows-Chrome checks, record `~/ooh-release-records/2026-10-28/` | VERIFIED (local record) | Release records live on one machine | engineering | Records summarised in `06-EVIDENCE-LOG.md` |
| Rollback artifact matches live (§6) | Live f63fdb1 bytes saved before deploy, 373/373 vs recorded hashes | VERIFIED | Frontend only; no data/function/config restore | David + engineering | Separate drill (below) |
| Recovery beyond frontend (§6, §10) | None recorded | UNKNOWN | No restore drill; vendor export/restore undocumented | David | Isolated restore drill recorded; never called "rehearsed" before |
| Deploy/recovery access owners (§3) | None recorded | UNKNOWN | Names, recovery delegate, last verification | David | Private register, tested by each person; no secrets in Git |
| Anonymous expensive integration (§10, §12 Next) | #384 body (2026-10-26): `InvokeLLM` accepts anonymous calls | REPORTED | No control; removing call sites is not protection; no production probing authorised | David + engineering | Separate approved plan; unauthorised call refused in isolation |
| #384 request evidence (§8) | Baseline control Home 5 / Map 4 `InvokeLLM`; candidate 0 on BACKUP and on production (Home, /map, /ecology, /warzones, in-app navigation) on 2026-10-28 | VERIFIED (requests only) | No post-release provider sample | David (dashboard) | Settled, comparable sample, lag and test traffic stated |
| Credit ledger (§8) | Dated samples exist in the usage ledger; guide cites production 319.31 (AI 240, functions 79.31) at 2026-10-25 18:56 UTC | REPORTED | **Correction:** earlier samples exist. Missing: a comparable **post-release** sample | David | Same dashboard surface/app/cycle, AI and function credits separate |
| Dependency audit fails closed (§B) | `specs/audit-fail-closed/` reproduction 2026-10-28 | VERIFIED (fixtures) | Valid error JSON passes (narrower than guide: malformed/empty already fail by accident) | engineering | R1–R5 in that spec |
| Least-privilege workflow tokens (§C) | Guide reports workflow-level `pull-requests:write`, `checks:write`; not re-verified here | REPORTED | Not reviewed | engineering | Separate PR keeping check names and fork behaviour |
| Semantic monitoring of public content (§D) | See traced list below | UNKNOWN | Provenance of several figures unverified | David (claims) + engineering | Each item traced to source and deployed SHA |
| Core contribution journey evidence (§7) | Prior BACKUP security tests (decision log); no production test identity | REPORTED | Submit→persist→review not evidenced end-to-end now | engineering | Fixture tests, then separately authorised isolated run |
| Safe founder experiment (§9) | `specs/founder-experiment-process/spec.md` | PROPOSED | App not created | David | Spec approved before any app |
| Architecture claims (§A) | Corrected in `BASE44_ARCHITECTURE_AND_ACCESS.md` (2026-10-28) | VERIFIED | Meta-description mismatch not re-investigated | engineering | Re-observe against deployed artifact |
| DORA measures (§11) | None | UNKNOWN | No release ledger with timestamps | engineering | Ledger from existing release records; missing stays missing |

## Public-data observations to trace (guide §D; do not assume #384 covers them)
Deployed SHA at check: `1dbddda` (production). #384 withdrew: the generated ad-spend figures with the "live web search" sourcing claim (the claim no longer exists in source; only code comments mention it), flora/mushroom/conflict layers, the alert ticker. **Not** covered and **not** verified: estimated energy/carbon quantities (e.g. `CarbonCounter.jsx`, kWh figures), UN SDG labels (`CampaignAtlas.jsx`, `Mandate.jsx`), reach values, streak/completion illustrations, record/member counters (seeds vs pending vs genuine contributors undefined). Each needs: source file, data origin, and a keep/relabel/withdraw decision by David. Globe-unavailable fallback: a probe should test the Map link, not mark the service down on WebGL absence.

## Not adopted / out of scope
OSIRIS (osirisai.live, provisional identity match to the supplied reference): **documentation-structure reference only** — no Docker, Next.js, OSINT features or integrations. Supabase/OCI: evaluated, not approved. No new infrastructure, vendors, dependencies, tracking or scheduled jobs; Agent OS freeze preserved; no billing or security-setting change. The weekly ledger review and uptime/SLO targets are proposals only; no uptime, compliance, savings or ROI claim is made.
