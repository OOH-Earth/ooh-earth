# Operational state

`OperationalHealth` contains one bounded snapshot per service/environment
state key. It is admin-readable only; functions write through
`asServiceRole`. It is not a request log and does not accept caller-provided
state keys, correlation IDs, payloads, PII, Stripe data, prompts, or raw errors.

The `fieldStats` pilot records successful and failed outcomes with bounded
duration and allowlisted error codes. Persistence is fail-open: an entity
read/write failure cannot change the `fieldStats` response. Writes are
throttled to one minute per fixed key per warm runtime, with immediate writes
for status transitions. The stored timestamp provides a second cross-runtime
throttle check, although Base44 does not expose a transaction/unique-key
guarantee, so concurrent first writes remain runtime-dependent.

Environment resolution uses an explicit `OOH_EARTH_ENVIRONMENT` value when
provided, then the Base44 app ID/request host. If neither is trustworthy, the
state is labeled `unknown`; it is never guessed as Production.

## Runtime certification — 2026-08-28

Deployment candidate `368a8982303db78f8fb0ff4af244b413af28a02a` is the merged
PR #159 revision. Base44 source pulls verified the function-local bundles in
both environments. `OperationalHealth` was pushed additively and
`fieldStats` plus `operationalHealth` were deployed individually to BACKUP and
Production.

BACKUP and Production authenticated probes both returned the expected
PII-free `fieldStats` aggregate response and created a single fixed snapshot:

| Environment | Status | Evidence | Last duration | Successes | Release |
| --- | --- | --- | ---: | ---: | --- |
| backup | `HEALTHY` | `VERIFIED` | 202 ms | 1 | `unknown` |
| production | `HEALTHY` | `VERIFIED` | 381 ms | 1 | `unknown` |

Two additional successful invocations in each environment left the row count
at one and did not increment the stored window counters, demonstrating the
one-minute same-status write throttle for this runtime path. This is runtime
evidence for the pilot, not a global transaction guarantee.

The authenticated collaborator/operator read of `operationalHealth` returned
the bounded snapshot in both environments. An unauthenticated request returned
the sanitized failure response. `runtimeHealth` returned its bounded success
response for the recognized operator. No runtime SHA was asserted: release
identity was `unknown`.

Classification: repository and CI **VERIFIED**; BACKUP and Production
operational state **VERIFIED**; global cross-runtime uniqueness,
Base44-native log retrieval, and gateway correlation-header propagation remain
**RUNTIME-DEPENDENT / NOT VERIFIED**.
