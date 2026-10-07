# Ordered queue

1. Reconcile PR #336 with current `origin/main`; preserve the qualified pilot and audit fixes. Acceptance: every conflict reviewed, local regressions pass, exact-head CI/CodeQL green.
2. If source changes, rebuild and redeploy BACKUP frontend only; reconcile target/artifact and repeat desktop/mobile focused QA. Acceptance: fixture zero USGS requests, repeated live activation remains bounded, rendered evidence recorded.
3. Update PR and release memory; keep production candidates and #322 separate. Acceptance: merge only under repository rules; no production deployment.
4. Advance the next explicitly authorised independent priority from the release queue, one bounded item at a time. Do not invent work when no eligible item remains.

Dependencies: PR #336 reconciliation precedes any new qualification; BACKUP requalification is required only when the final source/artifact differs from `7b0dbda`.
