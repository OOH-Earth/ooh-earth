# Testing & Release: what each layer proves

## The incident this document exists because of

On 2026-09-17, Dave reported that the Ad Scanner's multi-photo feature was
broken in Production: uploading a cover plus several extra photos, running
detection, and cataloging always left the published location showing only
one photo. PR #251 (the feature that introduced multi-photo cataloging) had
shipped with green CI — the hermetic Playwright suite passed, including a
test that explicitly asserted the extra photos stayed hidden after
cataloging.

Root cause: `PhotoGallery.jsx` filtered `LocationPhoto` rows to
`status === 'verified'` on top of `LocationPhoto.jsonc`'s own RLS rule
(`verified OR created_by_id === caller OR role:admin`). RLS already grants
the creator read access to their own pending rows; the client discarded
them anyway. Every fresh multi-photo submission looked like a single-photo
one to the very person who just uploaded it.

The test suite didn't catch it because `e2e/fixtures/mockBase44.ts` had no
concept of RLS at all — every mocked viewer, authenticated or not, saw
every `LocationPhoto` row regardless of `status` or `created_by_id`. The
PR #251 test that asserted "pending photos stay hidden" passed for the
wrong reason: nothing in the mock could ever disagree with a client-side
bug that duplicated (incorrectly) what should have been the backend's job.
CI was green and Production was broken, and nothing in the pipeline would
have told anyone before a real user did.

Fixed in PR #256 (client fix) and PR #257 (a related double-submit defect
found while adversarially testing the fix). This document, and the test
layers it describes, are the structural response — not a retrospective, a
mechanism meant to make a repeat of this exact failure shape structurally
harder.

## Two layers, and what each one proves

**Layer A — Hermetic (`e2e/*.spec.ts`, `playwright.config.ts`)**

Every existing spec file runs against a locally built `dist/` served by
`vite preview`, with all Base44 network traffic intercepted by
`e2e/fixtures/mockBase44.ts`. Fast (a full run is under two minutes),
deterministic, free, and required on every PR. It proves the *application
code* behaves correctly given a *specified* set of backend responses.

**It does not prove Base44 actually behaves the way the mock assumes.**
That gap is exactly what caused the incident above. Two things now close
part of it structurally:

- `e2e/fixtures/rlsEngine.ts` derives `LocationPhoto` (and, in the contract
  tests, every moderated entity's) read visibility from the *actual*
  `base44/entities/*.jsonc` RLS block, not a hand-copied description of it.
  If someone edits an entity's RLS shape, the mock's behavior changes with
  it automatically.
- `e2e/contracts/entityRls.spec.ts` is a hermetic contract test: it asserts
  a creator/other-user/anonymous/admin × pending/verified/rejected golden
  matrix against that real, parsed `.jsonc` rule for every moderated entity,
  plus an end-to-end check that `mockBase44.ts`'s `LocationPhoto` route
  handler actually enforces what the engine says it should. If this file
  goes red, either the RLS shape changed incompatibly or the engine's
  interpretation of it is wrong — either way, something that gates real
  user data visibility changed, and CI now says so.

This still cannot prove Base44's *server* actually implements its own RLS
block the way the schema describes it (a platform bug, a query planner
quirk, a shape the evaluator doesn't handle). Nothing hermetic can prove
that — that's what Layer B is for.

**Layer B — Real-backend (`e2e/preprod/*.spec.ts`, `playwright.preprod.config.ts`)**

Runs against the actually-deployed BACKUP Base44 app
(`https://ooh-earth-backup.base44.app`). No interception of Base44 entity
traffic anywhere in this layer (the one narrow exception —
`ad-scanner-multiphoto.spec.ts` mocking only the `scanAd` LLM call — is
explained in that file and below). Authenticates as real BACKUP-only test
identities (creator / other user / admin) via Base44's own
`?access_token=` mechanism. This is the layer that would have caught the
actual incident: it creates a real pending `LocationPhoto` row as the
creator identity and asserts, against the real backend, that the creator
sees it and a different identity does not.

It is slower, depends on BACKUP being reachable and correctly deployed, and
needs credentials Layer A doesn't. It runs deliberately (`workflow_dispatch`
with the candidate SHA to verify), not on every push — see "Release
gating" below for exactly where it sits in the pipeline.

**Never treat Layer A passing as evidence for Layer B's claims.** A green
hermetic run proves the code does what the mock says the backend does. It
is not evidence the backend actually does that.

## Pre-production test identities

**Auth strategy: runtime login, not long-lived bearer tokens.** An earlier
version of this document described extracting a session token from
localStorage after a one-time manual login and storing that token itself as
a GitHub secret. That's been replaced: `e2e/preprod/fixtures/preprodAuth.ts`
now performs a real login through the app's own `/login` form
(`base44.auth.loginViaEmailPassword`) at the start of every test run, using
an email + password pair. The session token Base44 issues is read back from
localStorage immediately after, held only in memory for that test process,
and discarded — never written to disk, logged, or stored anywhere. A leaked
or rotated password is trivially revocable by the account owner; a
long-lived bearer token sitting in GitHub for the workflow's entire
deployment lifetime is a materially larger standing risk. This was a
deliberate design change, not an oversight — see the `AUTH_STRATEGY` field
in this project's own activation report for the reasoning.

`e2e/preprod/*` needs three real, disposable BACKUP-only accounts. Their
emails are plain, non-secret constants in `preprodAuth.ts`; only the
passwords are GitHub Environment secrets on the `preprod` environment:

| Secret | Identity (email) | Used for |
|---|---|---|
| `PREPROD_CREATOR_PASSWORD` | `runner@ooh.earth` | Read/write as the record owner |
| `PREPROD_OTHER_USER_PASSWORD` | `casper@advertisersanonymous.org` | Confirms cross-user denial |
| `PREPROD_ADMIN_PASSWORD` | `gonzo@ooh.earth` (`role: admin` on BACKUP) | Confirms admin visibility + used by `cleanup.mjs` |

**This repository has no way to create these accounts itself, and nothing
here bypasses that.** Investigated, in order:

- `base44 auth --help` / MCP: no Base44 MCP server is connected to this
  environment (confirmed via tool discovery — there is no such capability
  available, contrary to an earlier assumption). The CLI itself only
  exposes *app-level* auth configuration (enabling password/social/SSO
  login for the app as a whole, `base44 auth pull`/`push`), never per-user
  account creation or token issuance.
- `base44 auth pull --app-id 6a6748e009b947cb29591871` (read-only against
  BACKUP, config flags only — no user data) confirmed BACKUP has real
  username/password signup enabled.
- `@base44/sdk`'s own `register()` (`src/pages/Register.jsx`) requires
  **email OTP verification** — a 6-digit code sent to the real inbox —
  before an account becomes usable. `inviteUser()` and the password-reset
  flow are similarly email-token-gated. There is no email-reading
  capability in this session, and using a third-party disposable-inbox
  service to fake one would not be a legitimate account — it would be
  exactly the kind of workaround this project was told not to attempt.

**This is the one irreducible human step.** Everything downstream of an
account existing (logging in, promoting to admin, running the suite,
cleanup) is automated; creating the account is not, because Base44's own
signup flow requires it not to be.

**A separate, already-logged-in Base44 CLI session (`~/.base44/auth/`) is
NOT the same credential type as one of these accounts** — it authenticates
a developer to the Base44 *platform* (workspace/app management, `base44
exec`, `base44 deploy`, …), not as an end-user of the deployed BACKUP
*application* with a `User` entity record and a `role`/`access`. Do not
reuse it here, and do not reuse any real person's own account either (that
account may hold real privileges elsewhere).

To provision:

1. ~~**Create the three accounts** at `https://ooh-earth-backup.base44.app/register`~~
   **Done.** All three exist on BACKUP (independently re-confirmed via a
   privileged, read-only `base44 exec` query against BACKUP's `User`
   entity): `runner@ooh.earth`, `casper@advertisersanonymous.org`,
   `gonzo@ooh.earth`. `preprodAuth.ts` and `cleanup.mjs` are hardcoded to
   these exact addresses.
2. ~~**Tell me each account's email once created**~~ **Done.** `gonzo@ooh.earth`
   was promoted to `role: admin` on BACKUP via a privileged `base44 exec
   --app-id 6a6748e009b947cb29591871 --privileged` call, targeting that one
   record by id after confirming its email matched. `runner@ooh.earth` and
   `casper@advertisersanonymous.org` were left untouched (re-confirmed
   `role: user` by an independent re-query after the write). No password
   was shared or needed for this step.
3. ~~**Create the `preprod` GitHub Environment**~~ **Done.** It exists,
   with `deployment_branch_policy` restricted to `main`. What's still
   outstanding is the three secrets themselves — `PREPROD_CREATOR_PASSWORD`,
   `PREPROD_OTHER_USER_PASSWORD`, `PREPROD_ADMIN_PASSWORD` — confirmed
   empty as of this writing (`gh api
   repos/OOH-Earth/ooh-earth/environments/preprod/secrets` lists none). The
   account owner adds them directly: repo Settings → Environments →
   `preprod` → Environment secrets → New environment secret, once per name
   above, pasting the corresponding account's password as the value. Using
   an Environment (not repo-level secrets) scopes them to jobs that
   explicitly declare `environment: preprod` — `.github/workflows/preprod.yml`'s
   jobs already do. (This can also be done via `gh secret set --env
   preprod <NAME>` by whoever has repo admin access, without ever putting
   a password value in a chat or a shell history that gets logged — `gh
   secret set` reads from stdin or a prompt, not a command-line argument.)
4. **Recommended: "Required reviewers."** Deployment-branch restriction
   (to `main`) is already set. Required-reviewer approval needs a specific
   GitHub username/team to name as the reviewer, which isn't unambiguous
   from inside this repo — add one via the Environment's settings if
   desired. Not strictly required for the fork-PR-exfiltration threat this
   workflow is already immune to (see "Security model" below), but adds
   real defense-in-depth against a compromised or careless dispatch.

Until the environment and secrets exist, `.github/workflows/preprod.yml`'s
`check-secrets` job fails fast with an explicit error — it will never
silently skip and report green.

## Security model — why an untrusted PR can't reach these secrets

- `preprod.yml` triggers **only** on `workflow_dispatch` — never
  `pull_request` or `pull_request_target`. A PR, including one from an
  untrusted fork, cannot cause this workflow to run at all; only a human
  with write access, manually dispatching it, can.
- Even if a fork PR *modified* `preprod.yml` to add a `pull_request`
  trigger, GitHub evaluates `pull_request`-triggered workflows using the
  workflow file as it exists on the **base** branch, not the fork's — a
  fork can't smuggle in a new trigger this way. It would need to be
  reviewed and merged first, same as any other change to `main`.
- Both jobs declare `environment: preprod`; secrets are scoped to that
  Environment and only released to jobs that reference it, whether or not
  protection rules are also configured.
- `permissions: contents: read` at the workflow level — no write scope
  anywhere, on any job.
- The checked-out `ref` is `inputs.candidate_sha`, a `workflow_dispatch`
  input only a trusted dispatcher controls — never derived from PR content.
- Only official, SHA-pinned `actions/*` actions are used; no third-party
  Actions.
- **Trace capture is deliberately `off`** in `playwright.preprod.config.ts`
  (unlike the hermetic config). Every authenticated request in this suite
  carries a real `Authorization: Bearer <token>` header (`@base44/sdk`
  attaches it to every API call) — Playwright's trace format records full
  request/response headers for every network call, so a `trace.zip`
  artifact from this suite would put a live token into a file downloadable
  by anyone with read access to the workflow run. Video and screenshots
  stay on (rendered pixels only — no header/network data) for failure
  diagnosis.

## Test data safety on BACKUP

Every record `e2e/preprod/*` creates is tagged with a unique
`[e2e_run_id:<runId>]` string in its `notes` field (see `preprodTag()` in
`e2e/preprod/fixtures/preprodAuth.ts`). Each spec file's own `afterAll()`
deletes what it created; `e2e/preprod/cleanup.mjs --run-id <runId>` is a
standalone sweep for anything left behind by a crashed run (wired into
`preprod.yml` as an `if: always()` step). The cleanup script:

- **Refuses to run without an explicit `--run-id`.**
- Only ever deletes a record whose `notes` field contains that exact tag
  string — never a broad status/date/title heuristic.
- Has no Production app id anywhere in it. It is structurally incapable of
  touching Production, not just instructed not to.

**No Production cleanup mechanism exists, and none should be added.**

## AI-contract cost isolation

`e2e/preprod/ad-scanner-multiphoto.spec.ts` intercepts only the `scanAd`
function call with a fixed response — everything else (uploads, `Location`,
`LocationPhoto`, RLS) is real. Running the real LLM behind `scanAd` on
every pipeline execution would spend real external money on every merge
and make the test's pass/fail depend on a nondeterministic AI response
instead of persistence and visibility, which is what this file actually
tests. If scanAd's *response contract* (shape, required fields) ever needs
its own live-AI check, that belongs in a separate, deliberately-run,
cost-aware test — not folded silently into every pipeline run.

## Release gating

```
candidate (PR merged to main)
  → CI_QUALIFIED           (hermetic CI green: Layer A + contracts)
  → BACKUP_DEPLOYED        (npm run release:backup -- --execute)
  → BACKUP_VERIFIED        (automated: public smoke + runtimeHealth SHA match)
  → PREPROD_E2E_VERIFIED   (.github/workflows/preprod.yml passes for this exact SHA,
                             then npm run release:record-preprod-e2e -- --manifest ... --sha <candidate>)
  → PRODUCTION_APPROVED    (human authorization -- now REQUIRES the evidence above)
  → PRODUCTION_DEPLOYED
  → PRODUCTION_VERIFIED    (automated: same smoke/health checks against Production)
```

**This is a real, enforced gate, not just documented practice.**
`assertProductionGate()` (`scripts/release-state.mjs`) refuses to let
`deploy:production` or a `transition --to PRODUCTION_APPROVED` proceed
unless `manifest.evidence.PREPROD_E2E_VERIFIED.candidate_sha` exactly
equals the manifest's own `git_sha` — `BACKUP_VERIFIED` alone is no longer
sufficient (see `scripts/release-state.test.mjs`'s "Production gate
requires a real-backend preprod E2E pass for this exact candidate" for the
three cases this proves: no evidence at all, evidence for a stale/different
SHA, and evidence for the exact right one). `docs/RELEASE_RELIABILITY_SYSTEM.md`'s
own guidance (prefer an evidence gate over unnecessary state-machine
complexity) is why this is a required *evidence key*, not a new
`RELEASE_STATES` entry — the ordered state machine itself is unchanged.

Because `preprod.yml` runs in an ephemeral GitHub Actions runner with no
manifest of its own (deploy/certification/evidence recording deliberately
stay in the authenticated operator's local session — see
`docs/RELEASE_RELIABILITY_SYSTEM.md`'s "Automation boundary"), recording
the evidence is a separate, explicit step the operator runs locally after
confirming the workflow run passed (`gh run list --workflow=preprod.yml`
or the Actions UI) — not something the workflow does to the operator's
manifest automatically. Until that step runs, the candidate simply cannot
reach `PRODUCTION_APPROVED`, regardless of how green everything else looks.

`preprod.yml` also verifies BACKUP is actually serving the candidate SHA it
was asked to test *before* running anything against it
(`release-manifest.json` check) — the same "don't test SHA A and imply SHA
B is safe" principle `release-certification.mjs` already applies to
Production certification, and the same principle `assertProductionGate()`
now applies to the evidence itself.

## Debugging a failure

Every Playwright job (hermetic and preprod) uploads a report artifact on
failure: HTML report, `test-results/` (screenshots + `trace.zip` on
first-retry/failure + video on failure), and for preprod, the same via
`playwright-report-preprod`. `npx playwright show-trace <trace.zip>`
replays the failure step-by-step locally, including network requests —
this is almost always enough to diagnose a CI-only failure without a local
repro.

## Adding a regression test after a Production incident

1. Reproduce the bug hermetically if the root cause is in application
   code + a specified backend response (most bugs). Write the test so it
   fails against the pre-fix code and passes against the fix — verify
   both, don't just add an assertion and trust it.
2. If the root cause involves the mock disagreeing with real Base44
   behavior (RLS, response shape, error format), fix the mock's fidelity
   first (ideally by deriving behavior from a real source of truth, as
   `rlsEngine.ts` does for RLS) — a passing hermetic test against a wrong
   mock is exactly the failure mode this document exists to prevent.
3. If the bug is only reproducible against the real backend (a genuine
   Base44 behavior difference, not just an unfaithful mock), it belongs in
   `e2e/preprod/`, following the tag/cleanup convention above.
4. Keep the regression test's comment pointing at the specific incident
   (production record id, PR number) it guards against — the next person
   reading a two-year-old test benefits from knowing why it exists.
