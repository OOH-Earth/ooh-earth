# Release Reliability System

The repository release system records evidence; it does not infer runtime
truth from a successful command exit code.

## State machine

The valid forward path is:

`CANDIDATE → CI_QUALIFIED → BACKUP_DEPLOYED → BACKUP_VERIFIED →
PRODUCTION_APPROVED → PRODUCTION_DEPLOYED → PRODUCTION_VERIFIED → CERTIFIED`

Failure paths are explicit: `DEGRADED`, `ROLLBACK_REQUIRED`, `ROLLED_BACK`, or
`UNKNOWN`. The implementation is in `scripts/release-state.mjs`; invalid
transitions fail closed. Production requires both `release_state=BACKUP_VERIFIED`
and `backup.state=BACKUP_VERIFIED`. Certification requires
`production.state=PRODUCTION_VERIFIED`.

## Commands

```sh
npm run release:status
npm run release:plan -- --target backup
npm run release:manifest -- release-manifest.json
npm run release:transition -- --manifest release-manifest.json --to CI_QUALIFIED
npm run release:backup -- --manifest release-manifest.json       # dry run
npm run release:backup -- --manifest release-manifest.json --execute
npm run release:production -- --manifest release-manifest.json   # gated dry run
npm run test:release
```

`status` and `plan` are read-only. Deploy commands require `--execute`, verify
the current HEAD matches the manifest candidate, and deploy only the existing
Base44 site artifact. Deployment success is still only `*_DEPLOYED`; a separate
certification step must record runtime and browser evidence.

## Manifest truth

`ooh-earth.release-manifest.v2` separates `git_sha`/candidate identity from
`runtime_revision`, which is `UNKNOWN` unless Base44 exposes verified runtime
metadata. It contains no secrets, payloads, or user data. `previous_known_good`
is a release reference, not permission to mutate Production.

## Automation boundary

`.github/workflows/release-reliability.yml` is intentionally a read-only,
workflow-dispatch release planner. It validates the state machine, generates a
manifest artifact, and prints the target plan. Repository policy prohibits
live Base44 credentials in CI, so deploy and runtime certification remain in
the authenticated operator release procedure until a protected, approved
credential/session mechanism exists.

GitHub workflow concurrency serializes release plans. Production mutation is
never triggered by `status`, `plan`, PR CI, or a push to `main`.

## Threat model and mitigations

| Risk | Mitigation |
| --- | --- |
| Wrong/stale candidate | Manifest SHA must equal current HEAD before deploy. |
| Production before BACKUP | State-machine gate rejects it. |
| CI/deploy conflation | Separate states and evidence fields. |
| Base44 partial deploy | Deployment is recorded as attempted/deployed only; certification is separate. |
| Credential leakage | No secrets in manifests, logs, tests, or GitHub workflow. |
| Concurrent releases | Workflow concurrency group; operator must use one manifest. |
| Destructive schema change | v1 manifest declares changes; this frontend command deploys site only. |
| Failed Production certification | Records `ROLLBACK_REQUIRED`; automatic rollback is not enabled. |
| Rollback damage | Previous-known-good redeploy is explicit; additive schemas are not removed. |
| Unsafe smoke tests | Certification probes are read-only and must not create charges or business records. |

## Rollback

Rollback is a human-authorized redeploy of the previous known-good candidate,
followed by BACKUP/Production verification. Do not delete additive schemas or
business data. The system records `ROLLBACK_REQUIRED` rather than silently
rolling back Production.

## Current platform boundary

Base44 native logs and runtime SHA exposure remain runtime-dependent. The
release system can prove repository/CI state and operator-recorded deployment
evidence; it cannot manufacture runtime identity or authenticated browser
evidence without a safe session mechanism.
