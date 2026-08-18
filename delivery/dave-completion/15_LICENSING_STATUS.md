# Licensing Status

**Audit only — nothing changed, per explicit instruction not to modify
licensing without Dave's authorization.**

## Current state (verified this pass, direct file reads)

| Asset class | License | Source |
|---|---|---|
| Source code | **GNU AGPL-3.0** | `LICENSE` (full text present, standard AGPLv3) |
| Non-code content (written content, documentation, design assets, project data) | **CC BY-SA 4.0** | `LICENSE-CONTENT.md` |
| `package.json` | `"private": true` | — |

## What this means practically

AGPL-3.0 is strongly copyleft, including the network-use clause: anyone who
runs a **modified** version of this code as a network service (not just
someone who redistributes it) is required to make their modified source
available to users of that service. This is more restrictive than plain GPL
and specifically closes the "SaaS loophole."

## The decision this creates (Decision I in `06_DECISIONS_REQUIRED.md`)

If any commercialization plan involves:
- A closed-source hosted version, or
- Selling access without disclosing modifications, or
- Licensing the codebase (or parts of it) to a third party under different terms

...then the current AGPL-3.0 license would need to change, or the
commercial offering would need to be built as a genuinely separate,
non-AGPL codebase. This is a legal/business decision, not something this
session has the authority to resolve or recommend a default for.

## What was explicitly not done this pass

No license file was modified. No `package.json` license field was added or
changed. No relicensing analysis was performed beyond confirming current
state — a real relicensing decision needs qualified legal input, not an
engineering session's judgment call.
