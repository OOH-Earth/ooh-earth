# BACKUP handoff and qualification record

State vocabulary: **merged** (in `main`) / **CI-qualified** (exact-head required checks green) / **BACKUP-qualified** (deployed to BACKUP, bytes verified, rendered checks pass) / **production-shipped**.

Production remains frozen at `a1868f122aa965fd96ab023492bed62470fb1106`. Nothing here authorizes a production deployment, main merge, backend/schema/permission/entity change or paid-service decision.

## Current candidate (combined; pinned in `scripts/release/place-research-backup.sh`)

`4fb6cad3c2c908be7f9d559ea825e363f9a9e240`, the `main` tip after #346 `beadb98`, #336 `7877f05`, #342 `4d7db21`, #343 `9adcf92` and the state reconciliation #350. Application source is identical to `9adcf92`; only docs differ.

Required exact-head qualification, all discovered by commit SHA (not by PR) and checked by the script before any deploy: `CI` and `CodeQL` (push to main) and `Interaction regression (zero retries)` (workflow_dispatch on main). The script also requires the commit to be on `main`, every merge above to be an ancestor, the lockfile to carry moment 2.31.0 / dompurify 3.4.16 / source-map-js 1.2.2, and the mushroom hook to contain no model call.

State: **merged**; exact-head CI/CodeQL/interaction regression pending at time of writing; **not BACKUP-qualified**; not production-shipped. This section is updated only with observed evidence.

Browser gate: 36 serial zero-retry tests in 5 files (place research, manual-coordinate capture, Ecology keyboard selection, observed Rivers, Main Map generated-layer controls) against the deployed BACKUP bytes, mocked providers/entities, write guards on. A separate bounded real-provider browser check (USGS Water Data, UK Environment Agency; 2 page loads, GET only) is recorded in `real-provider-browser.json` and never changes the qualification result.

## Historical candidate `b57cc4645592f6e696f917fc860d672c397895b0` (preserved, not re-certified)

- #336 head before the 2026-10-07/08 merges. Deployed to BACKUP on 2026-10-07 by the pinned script from the owner's authenticated WSL: entry `/assets/index-BucNanu3.js`, SHA-256 `af7aac7545e29b023e1a3dea6294ff9f792f54e612302497866b985191260ab0`, BACKUP app id `6a6748e009b947cb29591871`.
- **Script-reported only:** live homepage entry, every JavaScript chunk and the manifest matched, and 12 serial zero-retry mocked browser checks passed. The agent did not independently review the deploy log or `results.json` after a classifier denial (below). Evidence directory (local): `/tmp/q/evidence/ooh-place-backup.ol8f2Z`.
- Adapter-only real USGS result (Tokyo 5 events, London 0 via the library, 2 requests) is separate and says nothing about the deployed page against a live provider.
- It does not contain #342, #343 or the dependency fixes and cannot certify the current candidate. The BACKUP deployment it produced is superseded only once the new candidate is deployed and verified.

## Classifier checkpoint (retained)

During that deployment a log-wait command was denied by the auto-mode classifier: Bash `until grep -qE "Live homepage, all JavaScript|Exit:|Aborted|denied|Propagation deadline|Browser gate failed" /tmp/q/deploy-run.log; do sleep 10; done; grep -vE "^\s*$" /tmp/q/deploy-run.log | tail -25 ...`. Stated reason: "The server-side auto mode classifier judged this action dangerous (it gave no explanation)." The evidence was not reopened, copied or read through another tool. Smallest owner review:

```
node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/q/evidence/ooh-place-backup.ol8f2Z/results.json','utf8')).stats)"
```

## Infrastructure failures retained
- #345 head `bd2ce4c` attempt 1: CodeQL finished analysis and failed at SARIF upload; the CI run recorded no failed job. Attempt 2 of both passed with no code change (`/tmp/q/evidence-345`).
- #343 head `208f509`: the mobile Playwright job was cancelled after 6 h at "Install Playwright OS deps" (no `timeout-minutes` on `ci.yml` jobs); re-run passed (`/tmp/q/evidence-343`).

## Limits
Mocked providers and entities in the deployed browser suite; real-provider evidence is a separate bounded check; physical-phone testing has not been performed and remains outstanding. BACKUP and production are different apps: never deploy production from this script.

## Owner-terminal steps
`bash scripts/release/place-research-backup.sh validate` (no browser, no Base44, no deploy), then `deploy` (asks for `BACKUP`; frontend only; `base44@0.1.14 site deploy --no-build --yes --app-id 6a6748e009b947cb29591871` from a fresh isolated clone). Any classifier denial is a STOP/report checkpoint; never retry through another tool, host or encoding.
