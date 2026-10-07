# Reliability model

Checkpoint 2 establishes facts without inventing historical percentages.
`OperationalHealth` is a bounded snapshot, not an event or request database.

| SLI | Success | Failure | Source | Policy target |
| --- | --- | --- | --- | --- |
| fieldStats availability | HTTP 2xx with the aggregate response contract | HTTP 5xx or dependency failure | `OperationalHealth` pilot snapshot plus endpoint probes | 99.5% / 30 days |
| submitOffline success | Valid operation is acknowledged or an existing operation is returned | 5xx or non-retryable rejection for valid input | future pilot snapshot; business response today | 99.0% / 30 days |
| Stripe webhook processing | Signature-valid event reaches a safe terminal ledger state | retryable processing failure or unavailable ledger | `StripeEvent` plus future snapshot | 99.9% / 30 days |

Targets are policy, not observed performance. Until a complete measurement
window exists, consumers must display `INSUFFICIENT_DATA`. `HEALTHY` means the
latest recorded operation succeeded; `DEGRADED` means the latest recorded
operation failed; `UNKNOWN` means no evidence exists.

The pilot writes at most once per minute per fixed service/environment key per
runtime, and suppresses same-status writes using the stored `updated_at`. A
status transition is written immediately. Base44 does not provide a
transactional uniqueness primitive in this path, so cross-runtime duplicate
creation remains runtime-dependent and is monitored rather than hidden.
