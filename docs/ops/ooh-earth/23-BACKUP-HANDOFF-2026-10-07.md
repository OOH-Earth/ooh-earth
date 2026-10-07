# Place research BACKUP handoff — 2026-10-07

## Candidate and authority

BACKUP source: `b57cc4645592f6e696f917fc860d672c397895b0` in #336. It contains the reconciled pilot and #344's interaction correction through ordinary merge `141ed244`. The final test-only change scopes the USGS error status independently of BACKUP's stage banner; the actual outage/error assertion remains.

Production remains frozen at `a1868f122aa965fd96ab023492bed62470fb1106`. No deployment, main merge, backend/schema/permission/entity change or production promotion is implied by this document. #342 and #343 remain separate candidates/checkpoints.

Owner WSL `npx --yes base44@0.1.14 whoami` reports the owner logged in. This resolves availability/authentication in that terminal. It does not authenticate the agent workspace or the Base44 connector sandbox. No new owner login, token copying, or CLI upgrade is needed. Use the existing pinned CLI.

## Evidence and failures retained

- #344 exact head `13bffde`: CI and CodeQL pass. Desktop 438 passed / one skipped / no flaky results reported. Controlled prior-hook baseline reproduces focus loss; corrected code passes 30/30 serial repeated interactions with zero retries.
- #336 historical `df43402`: Ecology selection failed then passed on retry. This is not an established product root cause. The readiness/focus/selected-state assertions improve diagnosis.
- #343 historical `ffc3cbe`: manual-coordinate truncation failed then passed on retry. The controlled-frame test proves a delayed-autofocus defect, without claiming every historic truncation has that cause.
- Initial no-deploy handoff workflow `37640377790`: 10/12 passed. Both failures were the unscoped provider-status locator also matching `Stage · not production`, rather than a missing provider error. Fixed in the final source head; do not erase the failed workflow evidence.
- Fresh final-source full CI, CodeQL, repeated interactions and guarded handoff validation must be checked by exact head. Prepared builds and previous green heads do not certify a deployment.

## Sequential next actions

1. Finish exact-head qualification for #336 and validate #345's handoff. The script checks source CI `37641011927`, CodeQL `37641012186` and repeated interactions `37641012022` before any deploy. Pending checks are polled for at most 20 minutes. Failed/cancelled/mismatched runs, an advanced PR head, timeout or API rate limit stop it. Offline gate tests exercise these transitions without invoking Base44 or a real network.
2. In the owner's authenticated terminal, run the pinned script from #345. Default `validate` does not run a browser, invoke Base44 or contact BACKUP. `deploy` asks for `BACKUP` and invokes only `base44@0.1.14 site deploy --no-build --yes --app-id 6a6748e009b947cb29591871` from a fresh isolated source clone.
3. Compare the live homepage entry, every JavaScript chunk and manifest with that build. Run 12 serial zero-retry rendered checks against deployed BACKUP bytes: place research desktop/mobile plus capture viewports/focus and Ecology keyboard selection. QA imports are adjusted only in the disposable test checkout. Entity/provider fixtures remain mocked, activity logging is absorbed locally, unmatched non-GET requests fail closed, and production runtime targeting/page errors fail the tests. Screenshots, traces and network-guard attachments are retained.
4. Review the evidence directory before marking BACKUP qualified. Mocked providers do not establish current upstream availability, natural live entity behaviour, physical-phone coverage, or production readiness. A natural live preview and provider check must be recorded separately if claimed.
5. Reconcile harness state, plan and release evidence against the observed result. Any later merge/source change needs qualification of that new head. Do not replace the frozen production candidate or deploy production as a side effect.

The script preserves the owner's dirty weather checkout and unpublished local documentation commits by using a fresh clone. Evidence is printed before operations and on failure. A pre-deploy entry reference is retained, but is not called a qualified rollback artifact. A classifier denial remains a STOP/report checkpoint; never retry through another tool, host or encoding.

## Result: BACKUP qualified for `b57cc46` (2026-10-07, run from the owner's authenticated WSL)

State vocabulary: **merged** (in `main`), **CI-qualified** (exact-head required checks green), **BACKUP-qualified** (deployed to BACKUP, bytes verified, rendered checks pass), **production-shipped**.

| Item | State |
|---|---|
| `b57cc46` (#336) | CI-qualified (CI `37641011927`, CodeQL `37641012186`, interactions `37641012022`); **BACKUP-qualified**; **not merged**; **not production-shipped** |
| `bd2ce4c` (#345 handoff script) | CI-qualified after re-run (CI `37642225772` attempt 2, CodeQL `37642225766` attempt 2); **not merged** |
| Production | frozen at `a1868f122aa965fd96ab023492bed62470fb1106`, untouched |

- Script commit `bd2ce4c` ran `deploy` with Base44 CLI 0.1.14 (`whoami`: owner logged in, no new login). Evidence directory (local): `/tmp/q/evidence/ooh-place-backup.ol8f2Z`.
- Build proof: entry `/assets/index-BucNanu3.js`, SHA-256 `af7aac7545e29b023e1a3dea6294ff9f792f54e612302497866b985191260ab0`, identical to the owner's earlier validate run; BACKUP app id only, manifest identities all `b57cc46`.
- Deploy: `base44@0.1.14 site deploy --no-build --yes --app-id 6a6748e009b947cb29591871` reported success. Live homepage entry, every JavaScript chunk and the manifest matched the pinned build.
- Browser: 12/12 passed against the deployed bytes, serial, zero retries, write guards on (activity logs absorbed, unmatched non-GET blocked, production runtime target fails the test).
- Bounded real-USGS check (separate; library-level, 2 requests): Tokyo returned 5 real events (latest M4.5 near Satte, 2026-10-01), London a real empty result.

### Failures retained, not erased
- #345 head `bd2ce4c` attempt 1: CodeQL analysis completed and the failure was at the SARIF upload step; the CI run recorded no failed job (two skipped Playwright jobs). Attempt 2 of both passed without a code change. Treated as GitHub infrastructure, evidenced in `/tmp/q/evidence-345`.

### Limits
Mocked providers and entities: this does not establish current live-source behaviour on the deployed page, physical-phone coverage, or production readiness. BACKUP carries the pre-#346 lockfile (production audit: 2 findings, low and moderate, neither reachable: moment is not bundled, dompurify's affected option is unused); see doc 24 on #346.
