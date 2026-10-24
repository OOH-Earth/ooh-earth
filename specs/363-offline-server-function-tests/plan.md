# 363 plan
**Reuse:** existing `npm run test:server-functions` script, the Deno binary from `node_modules`, the *Lint & Typecheck* job, the `Hydro adapter unit tests (offline)` step pattern, the merged *Workflow guard* step.
**Files (exactly):** `.github/workflows/ci.yml` (+2 lines: a step "Server function tests (offline, no credentials)" running `npm run test:server-functions`, placed after the Hydro step); `package.json` (1 line: the `test:server-functions` command as authored in #363).
**Alternatives:** (a) separate CI job — rejected: new check name, would need a branch-protection change (not authorized); (b) keep `security.test.ts` only — possible narrower scope, pending Q1; (c) add `deno check` — out of scope.
**Data/permission impact:** none. **Rollout:** merge via normal review; no deploy (CI-only). **Rollback:** revert the two edits. **Cost/burden:** ~14 s per PR run on existing free runners; no new services.
**Update method:** rebase the single #363 commit onto current `main` (force-with-lease on its own branch), verify the diff is still those two edits, run the suite, obtain exact-head `pull_request` CI.
