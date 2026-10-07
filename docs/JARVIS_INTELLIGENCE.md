# JARVIS Intelligence v1

JARVIS is a read-only deterministic reasoning layer inside protected Mission
Control. It consumes the bounded `operationalHealth` response and the static,
non-secret `release-manifest.json` emitted during the production build. It does
not call an LLM, accept arbitrary prompts, execute commands, or mutate Base44.

## Evidence model

Normalized service evidence contains only an allowlisted service/environment,
bounded status and verification values, observed timestamp, freshness,
duration, release field, and evidence source. Cross-environment snapshots are
discarded from conclusions and surfaced as an explicit limitation.

Freshness is conservative: observations within 15 minutes are `CURRENT`, older
observations are `STALE`, and missing or future timestamps are `UNKNOWN`. A
stale healthy observation becomes `LAST KNOWN HEALTHY / CURRENT STATE UNKNOWN`.

## Reasoning contract

The pure engine emits `HEALTHY`, `DEGRADED`, or `UNKNOWN` status; explainable
`LOW`, `ATTENTION`, `ELEVATED`, or `UNKNOWN` risk; bounded attention items; a
read-only recommendation; rollback advice that never executes rollback; and
candidate SHA/release state separately from runtime revision.

No historical uptime, traffic, incident, latency, attack, user, revenue, or
confidence values are invented. Missing evidence remains visible as
`UNKNOWN`, `NOT_VERIFIED`, or `INSUFFICIENT_DATA`.

## Runtime boundaries

The authenticated Mission Control route and `operationalHealth` endpoint remain
authoritative. Base44 runtime revision exposure, native log retrieval, gateway
correlation propagation, and authenticated browser certification remain
runtime-dependent limitations. The static manifest identifies the deployed
frontend artifact; it does not assert the Base44 backend runtime revision.

The future language adapter boundary is intentionally inactive: any future
language model may explain deterministic conclusions, but cannot become the
source of operational truth or gain mutation authority.
