# Transaction integrity

This document records what OOH Earth can prove about offline submissions and
Stripe processing. It is a bounded contract, not a request log or a claim of
distributed transactionality.

## Offline submissions

The browser assigns a `client_operation_id` and IndexedDB enforces a unique
queue index. `submitOffline` accepts only `Location` and `FieldCheck`, validates
the operation ID, strips identity/provider fields, looks up an existing record,
and returns that record on replay. A network failure leaves the capture queued
for retry.

The defensible guarantee is **at-least-once delivery with idempotent replay**.
Exactly-once delivery is not guaranteed. The lookup-before-create sequence is
not a provider-proven atomic transaction across concurrent Base44 instances;
cross-instance uniqueness is therefore **RUNTIME-DEPENDENT**. A successful
boundary or replay test does not prove that a real user write will always
complete.

| State | Meaning |
| --- | --- |
| CREATED | client payload has an operation identity |
| QUEUED | payload is retained locally for retry |
| SUBMITTED | request was sent to `submitOffline` |
| ACKNOWLEDGED | server returned a record |
| REPLAYED | server returned the existing logical record |
| FAILED_RETRYABLE | network/provider/persistence failure may be retried |
| FAILED_TERMINAL | validation, allowlist, or identity failure must not be retried |

Production write-path certification is **NOT VERIFIED** here because no real
user record may be created for a probe and no safe disposable cleanup contract
has been demonstrated. Existing deterministic security tests verify boundary,
identity stripping, allowlisting, replay behavior, and sanitized failures.

## Payments

Checkout pricing and metadata are server-owned. `stripeWebhook` requires a
valid Stripe signature, records a bounded `StripeEvent` ledger row, derives a
business key for checkout sessions, suppresses repeated event/session effects,
and marks dependency failures retryable. Business transitions are staged in
the ledger, so partial failure remains visible for retry/reconciliation.

| State | Meaning |
| --- | --- |
| CHECKOUT_CREATED | server created a provider checkout request |
| WEBHOOK_RECEIVED | provider request arrived |
| SIGNATURE_VERIFIED | signed raw event passed verification |
| EVENT_LEDGERED | bounded provider event was recorded |
| BUSINESS_TRANSITION_APPLIED | required business stage was applied |
| REPLAY_DETECTED | event or checkout business key already completed |
| RECONCILIATION_REQUIRED | ledger/business stages disagree after failure |
| FAILED_RETRYABLE | provider or persistence dependency failed |
| FAILED_TERMINAL | malformed or unauthenticated input was rejected |

Verified security/replay tests do **not** prove successful Production payment
processing. No real charge, subscription, refund, or Stripe configuration
change is permitted. `PAYMENT_SECURITY_BOUNDARY`, replay, and ledger behavior
may be reported as verified from deterministic tests; successful payment
processing remains **NOT VERIFIED** unless an isolated provider test lifecycle
is later proven.

## Failure semantics

Telemetry and operational-state persistence fail open for product traffic.
Validation, authorization, payment signatures, and release gates fail closed.
Uncertainty in Production Truth remains UNKNOWN/INSUFFICIENT_DATA rather than
being converted to health.

## Scope and cost

OperationalHealth remains bounded state. No request/event warehouse, payload
store, PII store, payment-body store, or new external service was added.
There is no new external service or subscription.
