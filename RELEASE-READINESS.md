# Release Readiness — PR #1: `rebuild/docs-base44-github-migration-plan` → `main`

Snapshot from 2026-08-12, after admin access was granted and used to harden repo security, resync this branch against `origin/main`'s current tip, and fix the governance/documentation gaps found during audit. Every number below was produced by actually running the command or hitting the API today — not carried forward from yesterday's version of this file.

## Repository health

- 2 collaborators, both Admin: `AdilQuantum` (verified, engineering owner) and `oohearth` (org/service account). No second active human reviewer yet — shapes several decisions below.
- No existing GitHub rulesets. Default branch: `main`.
- Working branch is fully synced: `git rev-list --left-right --count origin/main...HEAD` → `0 <ahead>` — zero commits behind `origin/main`'s tip.

## CI health (real GitHub Actions runs, not local-only)

Latest run on the synced branch (`bf0769f`, triggered automatically via the open PR): **overall SUCCESS.**

| Check | Result |
|---|---|
| Lint & Typecheck | ✅ Success |
| Build | ✅ Success |
| Playwright (smoke + accessibility) | ✅ Success — 18 chromium tests |
| Dependency audit (fails on high/critical only) | ✅ Success |
| Dependency Review | ✅ **Success** — was failing before today; fixed by enabling repo security features (below), confirmed by isolating the change and re-running before touching anything else |
| Analyze (javascript-typescript) — CodeQL | ✅ Success |
| PR summary comment | ✅ Success — posted |
| Prettier (informational) | ❌ Fails (443-file pre-existing backlog) — `continue-on-error: true` by design, does not block the run |

Every gate that's supposed to block a merge now genuinely does, and genuinely passes.

## Security health

**Repo-level settings — changed today, all additive/reversible:**

| Setting | Before | After |
|---|---|---|
| Vulnerability alerts | disabled | **enabled** |
| Dependabot security updates | disabled | **enabled** |
| Secret scanning | disabled | **enabled** |
| Secret scanning push protection | disabled | **enabled** |

**Dependabot alert reconciliation** (first scan surfaced "14 vulnerabilities, 7 high/6 moderate/1 low" — investigated rather than taken at face value):

| Status | Count | Detail |
|---|---|---|
| Genuinely open | 4 | `quill` (medium, XSS), `react-router`×2 (medium), `react-router-dom` (medium) — matches `npm audit` exactly, already tracked in `KNOWN_ISSUES.md` #18 |
| **Likely stale / false positive — left open per explicit instruction, not dismissed** | 10 | `nanoid`×2, `js-yaml`×2, `postcss`×2, `socket.io-parser`, `dompurify`×2 (all originally reported "high" or "medium") |

Evidence for the 10: each installed version, checked directly against `package-lock.json`, is already **at or past** the advisory's own patched-version boundary (e.g. `socket.io-parser@4.2.7` installed; GHSA-2m8v-j782-fhvr's vulnerable range is `< 4.2.7` — 4.2.7 *is* the fix). GitHub's own system already auto-dismissed 2 near-identical `brace-expansion` alerts for the same reason, which is what surfaced the pattern. **Left open on file as of this audit** — revisit after GitHub's next Dependabot rescan; do not treat the "7 high" headline as current risk without re-checking the installed version first.

**Other findings:**
- `npm audit --omit=dev`: 4 moderate, 0 high/critical (consistent with the Dependabot reconciliation above).
- Secret scan across `src/`/`base44/`: clean, no matches. No `.env` tracked.
- `investorAccess/entry.ts` fails closed (503) when secrets are unset — verified in current source.
- `LeadClaim` entity: the only one of 21 Base44 entities with an unconditionally public `create` rule (no auth required at all). Traced full path: `ClaimLeadDialog.jsx` → `base44.entities.LeadClaim.create()`, no login gate, no rate limiting, no moderation function. Classified **C — public write, insufficiently constrained**. Fixed the concrete hygiene gap (added `maxLength: 1000` to the `note` field, matching the entity's own convention) without touching who can write. **Whether unauthenticated create itself is intentional is a founder decision** — see below.
- No CSP (`KNOWN_ISSUES.md` #19) — real, pre-existing, not addressed here; needs per-integration allow-listing (Stripe/Donorbox/Fonts/3 RPC chains/CoinGecko/OSM/Base44-WebSocket), scoped engineering work.
- GitHub Actions workflow permissions confirmed least-privilege across `ci.yml`/`codeql.yml`/`release-please.yml`. No workflow-injection risk found (no untrusted PR input interpolated into a `run:` block).

## Dependency health

4 moderate advisories, 0 high/critical (see Security health). `npm ci` clean, 668 packages.

## Accessibility

4 routes baselined in `e2e/a11y-baseline.json` (`/`, `/about`, `/report`, `/location/:id`), regression-gated not zero-violations. Pre-existing `color-contrast` debt only; `/about`'s `aria-hidden-focus` already fixed upstream. `CommandCenter`/`NavMenu`/`QuickCapture` overlays still lack a real focus-trap (`KNOWN_ISSUES.md` #14) — deliberately deferred, a bare `role="dialog"` without matching keyboard behavior is a known anti-pattern.

## E2E coverage

27/27 Playwright tests pass (18 chromium + 9 mobile-chromium), verified today with `CI=true` (matches GitHub Actions' `workers: 1` exactly) after the branch resync — the newly-merged Careers/LabAdmin product code didn't break anything.

## Build health

Clean, `npm run build` exit 0. `dist/assets` totals 6.5 MB uncompressed. Largest chunks: `index` (1.09 MB), `maplibre-gl` (1.05 MB), `three.module` (486 KB) — all inherent to the 3D map/globe libraries themselves, already route-level lazy-loaded (Phase 7 fix), further reduction would need plugin-level splitting.

## Performance

Not separately profiled this session — see Build health for bundle-size evidence; no Lighthouse/Web Vitals run was part of this audit's scope.

## Deployment/release process

`release-please.yml` configured, untested (no qualifying Conventional Commit has merged to `main` yet to trigger a release PR). `package.json` at `0.0.0`; first release tag (`0.1.0` vs `1.0.0`) is an open decision (`RELEASE_PROCESS.md`).

## Branch protection

**Not yet applied** — proposal prepared and shown for approval, not executed (exact required-check names verified against a live check-runs API response, not guessed from YAML). See the proposal shared earlier in this session. Two embedded decisions await sign-off: `enforce_admins` true/false, and required-approving-review count (proposed 0 for now — single active reviewer).

## Secrets/environment management

No repository secrets required by any current workflow (`ci.yml`/`codeql.yml`/`release-please.yml`/`dependabot.yml` all run on the automatic `GITHUB_TOKEN` only). No live Base44 backend in CI by design.

## Documentation

`ADMIN-ACCESS-REQUIREMENTS.md`, `ENGINEERING-WORKFLOW.md` (now includes a stage-by-stage pipeline diagram), `CODEOWNERS` (real handle: `@AdilQuantum`), `AGENTS.md` (now contains the "Ground Rules" three other docs already cited as "CLAUDE.md rule #N" — those numbers didn't exist anywhere until today), `ENGINEERING.md`/`CI_PIPELINE.md` (corrected stale ancestry and error-count claims), `KNOWN_ISSUES.md` (#4 and #25 re-verified and marked Fixed — both were already resolved product-side).

## Team onboarding

`ENGINEERING-WORKFLOW.md`'s new pipeline diagram plus the existing `CONTRIBUTING.md`/`BRANCHING_STRATEGY.md`/`ENGINEERING.md` trio cover clone → install → branch → PR → CI → merge → release end to end. `CODEOWNERS` now names a real reviewer.

## Known risks (not fixed here, tracked)

- `main` currently has **1,543 typecheck errors** (verified live, isolated worktree) — invisible until now because `main`'s only historical gate (`build.yml`) never ran `tsc`. This PR's tree is 0 errors; merging it is what actually closes this gap on `main`.
- `quill`/`react-quill` XSS — needs an editor-replacement decision (founder).
- `react-router`/`react-router-dom` moderate CVEs — needs a v7 migration PR (engineering, no product input needed).
- No CSP — scoped engineering work, not started.
- `LeadClaim`'s public-write model — founder decision (see Security health).
- Prettier backlog — 443 files, informational only.
- No branch protection yet — proposal ready, awaiting your go/no-go.

## Founder decisions still required

1. `LeadClaim`: keep unauthenticated public create as-is, or require login / add rate-limiting?
2. `quill`/`react-quill`: accept the pre-1.0 downgrade, or plan an editor replacement?
3. First release tag: `0.1.0` or `1.0.0`?
4. Branch protection: `enforce_admins` true or false?

## Exact recommended next action

1. You confirm the branch protection proposal (or adjust it).
2. Apply branch protection.
3. Final pre-merge check: re-confirm CI is still green on the current tip, no unexpected diff.
4. Merge PR #1 via squash (repo's documented merge method) — **only after explicit go-ahead**, not automatically because it's technically mergeable.
5. Post-merge: `git fetch origin --prune`, verify `origin/main`'s new tip, confirm `build-verify`/CI still runs cleanly on `main` directly, do not delete any branches without asking.

No merge, force-push, branch deletion, or security-alert dismissal has been made — those remain gated on your explicit approval, per your standing instruction.
