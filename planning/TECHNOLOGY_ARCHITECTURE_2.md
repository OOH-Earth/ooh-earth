# OOH Earth Technology Architecture 2.0

**Status:** P0 observability slice implemented locally for qualification; AI gateway, domain events, spatial aggregates, and agents remain future architecture
**Evidence date:** 2026-08-27
**Source of truth:** repository code, committed schemas, CI configuration, and previously recorded BACKUP/Production verification. Claims below are labelled where runtime evidence is incomplete.

## A. Executive assessment

OOH Earth is a capable React/Vite + Base44 application with a broad civic data model, public map/reporting flows, protected operational tools, Stripe commerce, offline submission, and several intelligence functions. The foundation work materially improved input validation, authorization, replay handling, viewport retrieval, and CI confidence.

The limiting factor is no longer feature volume. It is the absence of a coherent operational plane around a growing system: logs are mostly ad-hoc console output, function outcomes are not consistently correlated, AI calls have no common budget/audit boundary, and domain events are implicit in entity writes. Base44 remains the correct system of record for the near term, but should be surrounded by small, explicit server-side seams rather than hidden behind a new platform.

The recommended direction is an incremental **Jarvis layer**: structured telemetry and correlation first; a narrow AI gateway second; append-only domain-event recording and operational views next; spatial intelligence and bounded agents only after those foundations produce trustworthy data. No new infrastructure is justified until the first observability slice proves the need.

**P0 implementation note:** the repository now contains a dependency-free, fail-open telemetry helper used by `submitOffline`, `stripeWebhook`, `fieldStats`, plus an admin-only bounded `runtimeHealth` function. Local behavioral/type/lint checks pass. Production deployment and Base44 log queryability for these new events remain runtime-dependent until the functions are deployed and observed.

## B. Current system map

### User and data flow

```text
Browser (React 18, React Router, TanStack Query)
  ├─ public routes: Home, Map, Report, About, Store
  ├─ protected routes: Dashboard, Lab/admin, account/operations
  ├─ IndexedDB offline queue (client_operation_id)
  └─ Base44 SDK client (RLS-aware, optional auth)
          │
          ├─ Base44 entities: Location, FieldCheck, LeadClaim, DigitalBust,
          │  FundingLead, Purchase, Subscription, QuestCompletion, IntelCache…
          └─ Base44 server functions (Deno): validation, service-role work,
             Stripe, LLM, n8n, moderation, imports, stats
```

### Frontend

- Vite builds a React application with route-level lazy loading and a large component/page surface.
- TanStack Query is the data-fetching/cache layer; Base44 entity methods are called from pages and hooks.
- The Map has flat and globe modes, viewport-bounded Location queries, projected fields, FieldCheck freshness, clustering/marker transforms, and a split-query workaround for Base44 dateline behavior.
- Offline work is queued in IndexedDB, carries a stable operation ID, and is replayed through `submitOffline`.
- Styling is Tailwind plus `src/index.css`; the previous release removed owned CSS parser warnings.
- Heavy optional modules include MapLibre, Three.js, PDF/HTML rendering, Zora, and charting. They are already mostly split into chunks; the initial entry was reduced from roughly 834 kB to roughly 646 kB.

### Backend and security

- Base44 Deno functions use `createClientFromRequest`, with `asServiceRole` reserved for controlled server work.
- `_shared/auth.ts` normalizes role/access/agency semantics for privileged paths.
- Hardened functions include checkout handlers, Stripe webhook processing, `submitOffline`, `fieldStats`, `cachedIntel`, `scanAd`, `n8nPing`, `claimQuest`, `personaCtl`, account deletion, and image migration.
- StripeEvent is a durable best-effort event ledger; it improves replay handling but does not provide distributed transactions or uniqueness unless Base44 enforces them at runtime.
- RLS is defined per entity. Some public entities intentionally allow anonymous create/read of limited records; server functions constrain sensitive fields and ownership.

### Delivery and operations

- GitHub Actions run type, lint, format, build, dependency/security, and Playwright jobs.
- Base44 is the runtime deployment source of truth. Repository schemas and functions require explicit Base44 deployment.
- Current operations are CLI/dashboard driven. `opsIntel` exposes configuration/status hints; there is no complete incident, trace, metric, or alerting system.

## C. Technology inventory

| Area | Current technology | Observed role | Assessment |
|---|---|---|---|
| UI | React 18, React Router 7, Tailwind | routes, forms, map and portals | Retain; improve boundaries selectively |
| Data fetching | TanStack Query 5 + Base44 SDK | caching, dedupe, invalidation | Retain; standardize query policy |
| Runtime data | Base44 entities/RLS | source of truth and CRUD | Retain near term; document limits |
| Functions | Deno + `@base44/sdk` | auth, validation, integrations | Retain; add shared seams |
| Maps | MapLibre, Leaflet/heat, Three.js globe | viewport, markers, heat/globe | Retain; add server-side aggregates later |
| Commerce | Stripe Checkout/webhooks | donations, products, plans | Retain; reconcile through events |
| AI | Base44 `Core.InvokeLLM` | cached intel, scan/moderation-like flows | Put behind a gateway |
| Automation | n8n webhook bridge | operations forwarding | Retain as an outbound adapter, not a source of truth |
| Offline | IndexedDB + `submitOffline` | retry/replay | Retain; measure queue health |
| CI | GitHub Actions, Playwright, Deno checks | release confidence | Retain; add production-safe smoke telemetry |
| Observability | console logs, Base44 logs, release dashboard | partial diagnosis | Highest current gap |

## D. Production limitations

The last certification found a healthy deployment with documented limits: targeted production logs were empty while broad retrieval timed out; server HTML metadata can differ from hydrated metadata; `cleanupIntelCache` has an inactive, unverified cron expression; Base44 geographic operator behavior required a repository correction; and distributed uniqueness/transaction semantics remain runtime-dependent. These are architectural signals: operational conclusions must carry correlation IDs, timestamps, environment, and explicit confidence.

## E. Observability architecture (Jarvis foundation)

### Minimal first slice

Add a dependency-free server helper that emits one structured JSON event per function request and outcome. Fields should be deliberately low-cardinality and non-sensitive:

```json
{
  "event": "function.completed",
  "function": "submitOffline",
  "request_id": "opaque-random-id",
  "operation_id": "validated-client-operation-id-or-null",
  "environment": "backup|production|unknown",
  "status": "success|rejected|failed",
  "duration_ms": 42,
  "error_code": "VALIDATION|AUTH|DEPENDENCY|INTERNAL|null",
  "release": "git-or-deployment-revision"
}
```

Never log tokens, webhook bodies, payment details, prompts, uploaded URLs, email addresses, or raw user notes. Hash or omit identifiers unless an operator needs a stable correlation key.

### Collection path

```text
Function / browser telemetry
  → structured Base44-safe log record
  → bounded log query/export
  → dashboard and alert rules
```

Start with Base44 logs if retention/query APIs are adequate. If not, add one external error/metrics sink behind an environment-only adapter. Do not introduce a full OpenTelemetry collector until sampling, retention, and cost are measured.

### Frontend telemetry

Capture release, route, request class, duration bucket, and sanitized error code. Use `navigator.sendBeacon` or a server function only after consent/privacy review. Sample successes heavily; retain failures and Web Vitals only when measured correctly.

### Health and alerts

Expose a non-sensitive health function covering deployment revision, dependency reachability, cache age, and queue backlog. Alert on error-rate/latency thresholds, webhook retryable events, offline replay failures, and sustained Map query failures. Alerts must link to a request/event ID and an operator runbook.

## F. AI gateway architecture

Existing LLM calls are in `cachedIntel`, `scanAd`, and related intelligence functions, using Base44's server-side `Core.InvokeLLM`. They have server-owned prompts and some caching, but no common accounting, schema, or evaluation boundary.

```text
Feature request
 → aiGateway(requestType, boundedInput, actorContext)
 → policy: allowlist, size/rate/budget checks
 → cache lookup (key = prompt_version + normalized input)
 → model route (cheap / standard / premium)
 → timeout + bounded retry
 → structured schema validation
 → redaction + audit record
 → feature response
```

Gateway contract:

- Server-owned prompt templates with version identifiers; clients send intent and bounded data, never prompts or model names.
- Zod-like validation is desirable, but avoid adding a dependency until the existing runtime can justify it; small JSON-schema validators or explicit guards are sufficient first.
- Return typed `ok`, `result`, `error_code`, and `cached` fields. Never return provider errors or chain-of-thought.
- Enforce per-user/IP and global budgets, max input bytes, timeout, and concurrency. Cache deterministic/public intelligence; do not cache private or sensitive prompts without a policy.
- Record model class, prompt version, latency, token/cost estimate when available, cache hit, and outcome—never raw prompt content.
- Evaluation hooks should replay a redacted fixture set offline before prompt/model changes.

## G. Geospatial intelligence architecture

### Near term (Base44-compatible)

- Keep viewport-bounded Location retrieval and split dateline queries.
- Normalize coordinates at write time; reject non-finite values and clamp latitude to ±90/longitude to a canonical range.
- Add query-result metadata: viewport key, record count, truncation flag, freshness timestamp.
- Use client clustering for rendering, with a hard marker/result cap and an explicit dense-area indicator.
- Add a small server function for aggregate counts by coarse geohash/tile only if measured Map payloads or query latency require it. Store summaries as replaceable cache rows, not authoritative locations.

### Later, if scale proves it

Move spatial aggregation/search to a PostGIS-backed or managed geospatial service while Base44 remains the transactional source. Synchronize through events and reconciliation, never dual-write silently. The trigger is measured cardinality/latency, not fashion.

Potential products: density maps, coverage gaps, freshness/quality scores, campaign opportunity ranking, and “next best field check.” All recommendations must expose freshness and confidence.

## H. Event architecture

Base44 writes currently encode events implicitly. Introduce a small append-only `DomainEvent` entity only after retention and access policy are approved. Minimum fields: `event_id`, `event_type`, `aggregate_type`, `aggregate_id`, `occurred_at`, `actor_type`, `actor_id_hash`, `correlation_id`, `schema_version`, `payload_summary`, `delivery_status`.

Initial events:

`location.discovered`, `field_check.submitted`, `lead.claimed`, `quest.completed`, `purchase.completed`, `subscription.changed`, `payment.webhook_received`, `offline.operation_replayed`.

Use events for analytics, reconciliation, and automation. Do not make user-facing writes depend synchronously on every consumer. Consumers must be idempotent and replayable. Keep raw payment/webhook bodies out of the event store.

## I. Operations control plane

Build a protected, read-mostly Operations Console using existing Base44 functions/entities first:

- release/environment and health status;
- function error/latency rates;
- StripeEvent processing and retryable states;
- offline queue/replay failures;
- AI calls, cache hit rate, budget consumption;
- IntelCache age and cleanup backlog;
- Map query truncation/failure rate;
- location/FieldCheck freshness;
- links to runbooks and deployment revision.

Every mutation (retry, replay, role change, repair) requires explicit permission, reason, confirmation, idempotency key, and audit record. Read-only diagnosis is the default. Avoid a dashboard that directly exposes service-role CRUD.

## J. Agent architecture

Agents are bounded workflows, not general-purpose operators.

| Agent | Safe initial tools | Human approval |
|---|---|---|
| Data-quality | read Location/FieldCheck, propose anomalies | required for edits |
| Field intelligence | read viewport, summarize trends via AI gateway | none for summaries |
| Payment reconciliation | read StripeEvent/Purchase, produce candidate matches | required for refunds/entitlement changes |
| Content intelligence | classify bounded public text/images | required for publication/moderation |
| Operations assistant | read health/log aggregates, draft runbooks | required for retries/role changes |

Each tool has an allowlist, actor scope, input/output schema, rate/budget limit, correlation ID, and audit record. No agent receives raw service-role credentials. Destructive actions are separate endpoints with human approval and replay protection.

## K. Data architecture

Keep Base44 as the authoritative transactional store. Improve consistency through:

- explicit ownership and lifecycle fields;
- documented retention classes (financial, public evidence, operational cache, personal data);
- additive indexes/uniqueness only when Base44 supports them;
- bounded list/pagination for every growing entity;
- event IDs and operation IDs for replay;
- reconciliation reports for partial failures;
- schema contract tests against BACKUP before promotion.

Do not turn IntelCache into an analytics warehouse. Export redacted events/aggregates to an analytical store only when volume or query cost demonstrates the need.

## L. Security threat model and controls

| Threat | Control |
|---|---|
| Prompt injection | treat user text/images as data; fixed prompts; output schema; no tool access from model text |
| Agent privilege escalation | server-owned tool registry; least privilege; separate approval endpoints |
| PII leakage | field minimization, redaction, retention policy, no raw prompts/logs |
| Cost amplification | auth/rate limits, per-actor/global budgets, cache, max bytes/tokens |
| Replay/webhook abuse | signatures, event/business keys, durable ledger, retry states |
| Client-controlled rewards/pricing | server lookup and eligibility recomputation |
| Malicious uploads | MIME/size/host validation, isolated provider processing |
| Admin compromise | normalized roles, audit logs, last-admin safeguards, short-lived sessions |
| Data exfiltration via map | RLS, projections, bounded viewport responses, no broad sensitive fields |
| Denial of wallet | provider timeouts, amount bounds, idempotency, alerting |

Threat-model review is required before any AI tool can mutate production. Base44's distributed race/transaction limits remain an explicit residual risk.

## M. Technology evaluation matrix

| Capability | Problem solved | Recommendation | Complexity/cost | Base44 compatibility / rollback |
|---|---|---|---|---|
| Structured logs + error codes | logs cannot be correlated | small internal helper first | low / low | additive; remove call sites safely |
| Error tracking SaaS | browser stack traces and alerts | evaluate after log baseline | low-medium / recurring | adapter; disable via env |
| OpenTelemetry | cross-service traces | defer until multiple services/latency evidence | high / medium | sidecar/exporter later |
| Metrics store | rates, latency, queue depth | derive bounded aggregates first; adopt managed metrics if needed | medium | read-only integration |
| DomainEvent | implicit business events | small Base44 entity after retention approval | medium | additive; consumers off by default |
| AI gateway | inconsistent model/cost/security policy | small server abstraction | medium / provider cost | functions remain callable during migration |
| Vector search | semantic discovery | defer; current map/entity filters suffice | medium-high | external index would need sync |
| PostGIS/geospatial SaaS | spatial scale/analytics | trigger only on measured limits | high | dual-read migration + rebuild |
| Queue/workflow service | durable async retries | defer; use ledger/outbox pattern first | medium-high | additive worker later |
| Feature flags | controlled rollout | small SiteSetting/admin abstraction | low | fail-safe defaults |
| n8n | back-office workflows | retain as adapter, formalize signed events | low-medium | disable route without source loss |

## N. Build-vs-buy decisions

- **Use existing OOH Earth code:** React/TanStack Query, Base44 RLS/entities/functions, current Map stack, Stripe, IndexedDB, GitHub CI.
- **Use Base44 primitives:** additive operational entities, bounded server functions, service-role writes behind authorization, runtime logs where queryable.
- **Add small internal abstractions:** telemetry envelope, AI gateway contract, event envelope, query-policy constants, feature flags.
- **Adopt an external service later:** error/metrics sink, analytical store, PostGIS/vector search, or durable queue only after measured limits and a data-export/rollback plan.
- **Defer:** unrestricted agents, event bus platform, warehouse, and multi-region architecture.

## O. AI economics

Repository evidence confirms LLM invocation and cache paths but does not provide production token, frequency, or cost telemetry. Therefore no numeric usage estimate is asserted. The gateway should measure:

- calls by function, actor class, model tier, prompt version;
- cache hit/miss and duplicate suppression;
- input/output size and latency;
- provider failure and retry counts;
- estimated cost when provider metadata exists.

Budget classes:

1. **Cheap automation:** deterministic parsing/classification, strict per-request cap.
2. **Standard intelligence:** cached public summaries and bounded vision; daily/project budget.
3. **Premium reasoning:** explicit operator/user opt-in, high cost confirmation, no mutation tools.
4. **Human approval:** moderation publication, payment repair, role/data changes.

## P. Target architecture

```text
USER → React/TanStack Query → Base44 SDK/RLS → server function → Base44 data
                                  │                  │
                                  │                  ├→ telemetry envelope
                                  │                  ├→ DomainEvent (append-only)
                                  │                  └→ AI gateway (when needed)

DomainEvent → analytics aggregates / automation adapters / operations console

AI feature → AI gateway → policy + budget → model → schema validation → cache → audit

Production → telemetry → health aggregates → alert rules → protected operations console
```

The synchronous user path stays small. Events and telemetry are best-effort unless a specific business operation requires a durable ledger. Every consumer is replay-safe.

## Q. Migration strategy

1. Instrument one representative function (`submitOffline` or `stripeWebhook`) with request/correlation IDs and sanitized outcome codes.
2. Establish dashboards and retention/PII rules using existing Base44 logs or a reversible adapter.
3. Standardize query/cache/error policies in the frontend and functions.
4. Introduce the AI gateway behind compatibility wrappers; migrate one cached public feature first.
5. Add DomainEvent for two high-value events and build a read-only operations view.
6. Add spatial aggregates only after Map cardinality/latency thresholds are measured.
7. Introduce bounded agents over read-only tools; add approval workflows before mutations.

Each step is independently deployable, feature-flagged where possible, and validated on BACKUP first.

## R. Rollback strategy

- Telemetry: disable emission or sink adapter; application behavior remains unchanged.
- AI gateway: retain per-feature fallback to existing function path and cache; revert wrapper without deleting cache records.
- Domain events: stop consumers; preserve append-only records for replay; do not delete events.
- Spatial index: dual-read behind a flag, compare results, fall back to Base44 viewport queries.
- Operations console: revoke access/disable routes; it must never be required for user flows.
- Agents: revoke tool grants and approval endpoints; preserve audit records.
- Additive schemas remain during code rollback unless a proven migration issue exists; never remove operational evidence as a rollback shortcut.

## S. P0–P4 roadmap

| Priority | Deliverables | Value | Risk/complexity |
|---|---|---:|---:|
| **P0 Foundation** | structured telemetry, release/environment IDs, bounded health endpoint, log query runbook, retention policy | very high | low-medium |
| **P1 High leverage** | AI gateway compatibility wrapper, query/cache policy, DomainEvent for payment/offline events, read-only ops console | high | medium |
| **P2 Intelligence** | AI evaluation fixtures, cost dashboard, freshness/quality scores, coarse spatial aggregates | high | medium |
| **P3 Advanced automation** | durable outbox/queue if required, n8n signed event consumers, approval workflows, read-only agents | medium-high | high |
| **P4 Experimental** | PostGIS/vector search, campaign recommender, agent-assisted operations with approvals | uncertain/high | high |

## T. Explicitly not to build now

1. An unrestricted autonomous production agent.
2. A bespoke event-bus platform before event volume is measured.
3. A warehouse/vector database that duplicates Base44 without a query/scale trigger.
4. A global client-side Map hydration rewrite or server clustering invention.
5. A second state-management/data-fetching library.

## U. First recommended engineering mission

**P0: Production observability slice — structured function telemetry plus a bounded health/read-only diagnostics path.** This slice is implemented in the repository; BACKUP and Production qualification remain deployment steps.

This directly addresses the certification’s largest runtime limitation, requires no production schema change if existing logs can carry JSON, and has a reversible fallback. Start with `submitOffline`, `stripeWebhook`, and `fieldStats`; add correlation IDs, outcome/error codes, duration, release, and environment. Add a small local parser/test fixture and a runbook/dashboard view. Do not log payloads or PII.

## V. Success metrics

The first mission succeeds when:

- ≥99% of sampled function requests emit a parseable outcome record in local/BACKUP tests;
- every failure has a stable function, release, correlation ID, and bounded error code;
- no secrets, payment data, prompts, or PII appear in captured records;
- operators can query each target function in a bounded time window without a broad-request timeout;
- health output identifies revision and dependency status without user data;
- browser smoke failures can be correlated to a route/release/request class;
- telemetry adds <1% median server-function latency in local measurement (or the measured overhead is documented);
- disabling the sink leaves user flows and function responses unchanged;
- a replayed Stripe/offline operation remains diagnosed without creating a duplicate logical record.

## W. Estimated implementation sequence

1. **Week 1:** telemetry envelope, redaction rules, tests, three pilot functions, local parser.
2. **Week 2:** BACKUP verification, bounded log queries, health endpoint, operator runbook.
3. **Weeks 3–4:** production rollout with sampling/alerts and release dashboard integration.
4. **Weeks 5–6:** AI gateway wrapper for one cached feature, cost/cache metrics, evaluation fixtures.
5. **Following cycle:** DomainEvent pilot and read-only operations console.

Estimates are engineering sequencing, not commitments; Base44 dashboard/API availability may change the schedule.

### Architecture decision summary

OOH Earth should evolve by adding explicit seams around the existing Base44 system, not by replacing it prematurely. Observability is the first implementation because it converts today’s runtime unknowns into measurable evidence, improves every subsequent AI/geospatial/event decision, and carries the lowest product risk.
