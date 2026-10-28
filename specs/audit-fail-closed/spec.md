# audit-fail-closed — spec (proposal; no workflow change made)
Owner: engineering (unassigned) · Status: draft · Date: 2026-10-28 · Evidence baseline: `ci.yml` on `origin/main` and `origin/maintenance/production-2026-10-02` (audit step identical on both)

## Problem and intended outcome
The "Dependency audit (fails on high/critical only)" step runs `npm audit --omit=dev --json > audit-report.json || true`, then reads `r.metadata?.vulnerabilities || {}` and fails only if `high + critical > 0`. The guide (v1.1 §B) inferred this can pass on an error-shaped report. **Reproduced offline** with `specs/audit-fail-closed/reproduce.sh` (fixtures in `fixtures/` (`.fixture` so Prettier skips the deliberately malformed file), run as GitHub runs it: `bash -e -o pipefail`; no network, no `npm audit`):

| Fixture | Current step | Correct |
|---|---|---|
| clean | pass | pass |
| high/critical advisories | **fail** | fail |
| valid npm error JSON (`{"error":{...}}`, no `metadata`) | **PASSES (fail-open)** | fail |
| malformed JSON | fail (only by accident: `node` throws, `-e` aborts) | fail |
| empty file / failed invocation | fail (same accident) | fail |

Finding: the fail-open is real but **narrower than the guide stated** — only a *parseable error report* passes. It is a reproduction of the step's logic on fixtures, not a reproduced CI bypass on a real run, and the real `npm audit` error shape on a registry outage is assumed from npm's documented `error` object (ASSUMPTION).

## In scope / explicit non-goals
In: a focused fix so the step requires `metadata.vulnerabilities` with numeric fields, treats any `error` key or missing structure as an operational failure (distinct message from "advisories found"), and keeps the high/critical-only policy. Out: changing #384 or any release branch; changing which severities fail; workflow-permission changes (guide §C, separate); new dependencies.

## Requirements
| ID | Requirement (observable) | Status |
|---|---|---|
| R1 | Valid error JSON fails the step with "audit could not run" | proposed |
| R2 | Clean, moderate-only and high/critical fixtures keep today's outcomes | proposed |
| R3 | Malformed and empty reports fail deliberately, not by accident | proposed |
| R4 | The five fixtures run offline in an existing test command (no network) | proposed |
| R5 | Applied to `main` first; `maintenance/**` via normal PR (CI there now runs full checks) | proposed |

## Approval gates
Engineering review; it edits `ci.yml`, which the offline workflow guard (#374/#375) also inspects, so run it. No owner gate beyond normal review; separate PR from #384 and from this documentation PR.
