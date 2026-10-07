# JARVIS Reliability Autopilot v1

Autopilot v1 is deterministic, bounded, and read-only. It consumes
OperationalHealth snapshots and release evidence; it does not scrape logs,
accept arbitrary prompts, execute shell, or mutate Production.

## Capability coverage

The initial capability catalog is Public Web, Map data, Field statistics,
Offline submission, and Payment webhook. `fieldStats` was already instrumented.
`submitOffline`, `stripeWebhook`, and the Map data path now record only fixed-key
OperationalHealth snapshots. Invalid payment signatures are a security-boundary
rejection, not evidence of successful payment processing.

## Reasoning

The engine distinguishes current verified evidence from stale, missing, and
unverified evidence. It correlates Production and BACKUP only as hypotheses:
environment-specific and shared-path conditions are possible, but correlation
never becomes causation. Diagnosis includes supporting evidence, unknowns, and
one next discriminating check.

Rollback recommendations require verified degradation, release correlation,
and previous-known-good evidence. Otherwise the result is `INVESTIGATE` or
`NOT INDICATED`.

## Authority boundary

The action simulator classifies proposed steps as `READ_ONLY_SAFE`,
`SAFE_VERIFICATION`, `REQUIRES_APPROVAL`, or `PROHIBITED`. Production deploy,
rollback, Stripe operations, data deletion, schema destruction, auth changes,
secret retrieval, arbitrary shell, and arbitrary mutation are prohibited in
this layer. No command in JARVIS has mutation authority.

No LLM, new dependency, external service, event warehouse, or recurring service
cost is introduced.
