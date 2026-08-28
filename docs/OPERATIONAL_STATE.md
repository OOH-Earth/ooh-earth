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
