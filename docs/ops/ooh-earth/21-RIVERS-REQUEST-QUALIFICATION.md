# Rivers request qualification — 2026-10-07

PR #342 was inspected at `8900b7c91d4a283166439ba6e49715ec7154e6ba`. Its reported 65 browser tests are 21 observed-station + 21 Rivers + 23 Ecology tests for the Chromium project, verified by discovery. The PR body previously listed the observed suite as 20; 65 is not the combined unit/browser total. Discovery here is not a new execution pass.

## Gaps corrected

- A shared operation previously used the first caller's AbortSignal. That caller leaving could cancel a surviving consumer, including a shared EA national-readings request. Operations now own their signal; each consumer can leave independently; the last cancellation aborts upstream and permits a fresh request.
- Completed cache entries previously had no size limit or expiry sweep. The cache now prunes expired entries and retains at most 64 completed entries with least-recently-used eviction. Retrieval timestamps remain those of the original fetch.
- Clearing the cache prevents an older pending operation from repopulating it or deleting a newer operation for the same key.
- Provider requests explicitly omit credentials and use `no-referrer`. Providers still see connecting network metadata and the public viewport/station query; this is not anonymous networking.
- `test:hydro` now selects test files explicitly instead of relying on Node's directory-argument handling (the old command failed on Node 24 in this environment). The offline suite is now part of CI's lint/typecheck job rather than only a local check.

## Verification and release boundary

Local hydro tests: 26/26, including five new regression cases for consumer abandonment, last-consumer cancellation/recovery, capacity/expiry, clear/replacement races, and already-aborted consumers. Browser discovery: 65 tests in three files for Chromium; no local browser execution claimed. A changed head requires new CI/CodeQL and BACKUP qualification before promotion. The earlier green head and historical real-network evidence do not certify this change.

No provider purchases, dependency versions, Base44 schemas, permissions, entities, production candidate or deployment changed. Provider attribution, observation timestamps, freshness thresholds, coverage/error distinctions and reference/legacy separation remain intact. This is bounded read-request sharing, not an exactly-once delivery guarantee.
