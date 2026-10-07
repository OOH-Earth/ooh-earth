# Ordered queue

1. Reconcile PR #336 with current `origin/main`; preserve the qualified pilot and audit fixes. Acceptance: every conflict reviewed, local regressions pass, exact-head CI/CodeQL green.
2. If source changes, rebuild and redeploy BACKUP frontend only; reconcile target/artifact and repeat desktop/mobile focused QA. Acceptance: fixture zero USGS requests, repeated live activation remains bounded, rendered evidence recorded.
3. Update PR and release memory; preserve frozen candidate `a1868f122aa965fd96ab023492bed62470fb1106`. Acceptance: merge only under repository rules; no production deployment; unpublished owner commits preserved.
4. Advance the next explicitly authorised independent priority from the release queue, one bounded item at a time. Do not invent work when no eligible item remains.

Dependencies: PR #336 reconciliation precedes any new qualification; BACKUP requalification is required only when the final source/artifact differs from `7b0dbda`.

Next independent priorities, after pilot qualification:
- #343: stop plotting generated mushroom/flora/conflict coordinates, including opt-in paths. Labelling alone does not satisfy `brain/INVARIANTS.md`. Reuse Ecology observations for ecology; retain an unavailable state until conflict data has a reviewed licensed source.
- #342: verify browser test totals separately from unit totals and projects before merge; the reported 65/65 cannot be inferred from 21 unit + 20 observed + 21 Rivers + 23 Ecology. Discovery is not execution.
- Investigate the queued manual-coordinate keystroke-loss reproduction on slow devices before expanding release confidence; do not hide it with retries or weaker assertions.
- Keep Open-Meteo commercial eligibility, licensed conflict data and sample provenance as owner decisions. Do not purchase, self-host or publish uncertain provenance automatically.
