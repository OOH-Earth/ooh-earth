# JARVIS v2 / Continuous Reliability Intelligence

JARVIS v2 is a deterministic, read-only reasoning layer over bounded
OperationalHealth snapshots and release metadata. It is not a log warehouse,
analytics system, LLM, or Production mutation surface.

## Evidence model

Every conclusion retains its source, environment, observed time, verification
classification, and limitations. `CURRENT` means an interactive observation is
no older than 15 minutes. `STALE` means the last observation is known but the
current state is not established. Missing or future-dated observations are
`UNKNOWN`. Release certification evidence uses a separate 24-hour policy.

The v2 manifest separates build identity, deployment intent, deployment
evidence, certification evidence, runtime identity, and current-main drift.
`runtime_sha` remains `UNKNOWN` because Base44 does not expose a verified
runtime revision.

## Coverage and attention

The initial catalog identifies `fieldStats`, `submitOffline`, `stripeWebhook`,
Map, and authentication as service domains. Only `fieldStats` is instrumented
by the OperationalHealth pilot. Uninstrumented core services prevent JARVIS
from claiming whole-system health. They appear as missing coverage and produce
bounded attention items rather than fabricated healthy states.

Release drift is `ALIGNED`, `MAIN_AHEAD`, `PRODUCTION_AHEAD`, or `UNKNOWN`.
Inequality alone is not sufficient; ancestry relation evidence is required.
Attention priorities are explicit (`P0`, `P1`, `P2`) and carry a reason,
evidence, and read-only next action.

## Evidence synchronization

`npm run release:evidence` writes a bounded, secret-free certification artifact
from a v3 manifest. It requires an exact candidate SHA and explicit deployment,
smoke, operational-health, and certification results. This artifact is the
machine-readable post-deployment evidence channel; the static public manifest
remains a build-time artifact and does not claim runtime identity.

## Boundaries

Mission Control is protected and read-only. Native Base44 log retrieval and
gateway correlation propagation remain runtime-dependent. Authenticated hosted
Mission Control browser certification requires a safe short-lived test identity
that is not currently available. No new external service, subscription,
database, logging platform, or AI provider is introduced.
