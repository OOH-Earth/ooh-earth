# OOH Earth Reliability Constitution

Reliability engineering exists to protect product value. The control plane is
small, evidence-driven, and subordinate to the product and intelligence
planes.

## Three planes

**Control plane:** CI, security checks, release reliability, OperationalHealth,
Production Truth, Mission Control, certification, and rollback intelligence.

**Product plane:** Home, Map, Report, Discovery, field workflows, accounts,
store, and payments.

**Intelligence plane:** geospatial, field, visual, temporal, discovery, data
quality, search, and recommendations. This is where future differentiation
should primarily accrue.

The control plane protects the product plane; it does not become the product.

## Infrastructure decision test

New infrastructure requires at least one demonstrated justification:

- measured reliability or performance problem;
- security or compliance requirement;
- proven scale requirement;
- material developer/operator toil;
- material user-facing capability; or
- a provider limitation that cannot be safely mitigated within the current stack.

The proposal must state the failure mode, measurable outcome, cost, attack
surface, operational owner, and removal path. Existing Base44, GitHub Actions,
repository-native code, browser APIs, and small internal abstractions are the
default.

## Explicit defaults

No microservices without a service-boundary problem. No Kubernetes without an
orchestration problem. No Kafka without an event-throughput or durability
problem. No Redis without a measured cache or coordination requirement. No
Postgres/PostGIS migration without a proven Base44 limit. No vector database
without a retrieval problem. No event warehouse without an analysis need. No
paid observability without a measured observability failure. No LLM for a
deterministic problem. No autonomous Production agent with general write
authority. No second frontend state framework. No infrastructure because a
large technology company uses it.

## Current sufficiency decision

The existing control plane is **SUFFICIENT FOR CURRENT PRODUCT SCALE**:
release identity, CI/security qualification, BACKUP-first gating, Production
certification, bounded operational state, conservative Production Truth, and
read-only reasoning are all present. Transaction write-path and successful
payment lifecycle evidence remain explicitly bounded limitations, not reasons
to add infrastructure.

Future control-plane expansion requires new evidence: a measured failure,
measured scale/toil threshold, or a concrete product/security requirement.
The next investment should be product and intelligence capability, beginning
with deterministic geospatial data quality and coverage.

## Operating constitution

Facts require provenance. Missing evidence is not health. Stale health means
last known healthy/current state unknown. Observability persistence fails open;
authorization and release decisions fail closed. Production mutations require
human-gated workflows. Public UI changes require a separate product decision.
