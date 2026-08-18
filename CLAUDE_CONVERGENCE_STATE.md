# OOH EARTH — CONVERGENCE STATE

Read this first each session; verify against the repo/live evidence before
trusting any claim below — the repo wins on conflict. Rewritten (not
appended) each meaningful loop to stay compact. Last compressed: 2026-08-18
(Dave Completion Mission — closed out).

`main` @ `43bfe9d`. Independently post-merge verified: `git status` clean,
lint/typecheck/prettier/build all clean, `npm audit --omit=dev` 0
vulnerabilities, 14/14 combined regression tests passing (fresh build,
fresh server — see the stale-server lesson below).

## Final Dave delivery package — this pass (2026-08-18)

A second, more granular pass rebuilt the delivery package from scratch
against `43bfe9d`: 19-item completion matrix (was 13), a founder-friendly
`README_FOR_DAVE.md`, a static visual showcase with 6 real screenshots
embedded, a freshly re-verified `EVIDENCE_INDEX.md` and
`PR_COMMIT_MANIFEST.md` (two stale SHAs from the prior pass caught and
fixed), and `FINAL_MESSAGE_TO_DAVE.md`. Packaged as
`OOH_Earth_Dave_Product_Delivery.zip` in the session scratchpad (not
committed to the repo). See `delivery/dave-completion/` for all of it.

## Dave Completion Mission — closed out, 8 PRs merged this pass

A complete evidence-based audit + delivery report exists at
`delivery/dave-completion/` (17 files + `DAVE_COMPLETION_CHECKLIST.md`),
covering all 13 requirement areas Dave named, kept current with the final
merged state. **Read that directory before re-auditing anything below.**

Merged this pass: #91, #92, #93, #95, #96, #97, #98, #99 — all
independently CI-verified and post-merge verified.

- **#97** — the delivery package itself.
- **#98** — connects earned merit badges (`/operative`) to the NFT studio
  (`/lab/nft?badge=<id>` prefill).
- **#99** — extends CI job-summary triage (PR #85's pattern) to
  Lint/Typecheck/Prettier/Build.

**Checklist tally as of this merge**: DONE 6, VERIFIED EXISTING 3, PARTIAL 3,
BLOCKED 4, NOT STARTED 2 (of 13 areas — some rows carry two statuses by
design, see the checklist file for why).

## ⚠️ Stale local preview-server lesson (learned the hard way this pass)

`playwright.config.ts`'s `webServer.reuseExistingServer: !process.env.CI` —
**locally this is `true`**. A `npm run preview` process started earlier in a
long session (e.g. during an earlier `git stash push`/`pop` cycle, while a
feature was temporarily reverted) **stays running in the background** and
gets silently **reused** by every subsequent `npx playwright test` call,
even after the source is fixed and rebuilt. This produced a false "2/3 tests
failing" result on PR #98 *after* it had already merged and been CI-verified
green — the code was correct the whole time; a leftover server from earlier
in the session was serving stale JS.

**Before trusting any local Playwright failure, especially after a `git
stash` operation earlier in the same session:**
```bash
pkill -9 -f "vite preview"; pkill -9 -f "npm run preview"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/   # must be 000
rm -rf dist && npm run build                                       # fully clean, not incremental
```
Only then rerun the test. A failure that disappears under this discipline
was never a real regression.

## Settled findings from this pass (don't re-investigate)

- **Hermes**: exhaustive repo-wide grep → zero matches anywhere in the
  product repo. `delivery/dave-completion/12_HERMES_STATUS.md`.
- **Agency workflow**: `ClientPortal.jsx` confirmed still an honest,
  sample-labeled scaffold. Zero real timesheet/clock-in infrastructure.
  `delivery/dave-completion/13_AGENCY_WORKFLOW_STATUS.md`.
- **NFT/Web3**: precise per-capability audit — wallet/signing/metadata/
  mint-prep REAL; on-chain minting EXTERNAL (Zora), NOT IMPLEMENTED in-app
  by design; ownership self-reported, not chain-verified.
  `delivery/dave-completion/11_NFT_WEB3_STATUS.md`.
- **Licensing**: AGPL-3.0 (code) / CC BY-SA 4.0 (content), unchanged, audit
  only.
- **PR #63 / release 1.3.0**: still blocked on the same previously-diagnosed
  GitHub Settings/branch-protection-rollup gap. Not re-investigated.

## Real bugs found and fixed via testing this pass (not assumed away)

1. Heat canvas 0×0 sizing (CSS reset colliding with Leaflet's unsized
   overlay pane) — PR #92
2. Heat layer starved of data in one layer-toggle combination — PR #92
3. CI-only TypeScript error (effect destructor return type) — PR #96
4. `ci-tool-summary.mjs`'s own prettier parser initially mistook the npm
   script header + its own summary line for filenames — caught before
   merge, fixed — PR #99
5. False "regression" on PR #98 post-merge — root-caused to the stale
   preview-server issue above, not a code defect. No fix needed to the
   feature itself.

## Open, not part of this pass's decision-independent scope

Dependabot PRs #20, #23, #35, #36, #37, #39, #87, #88, #89, #90 — deliberately
untouched. PR #63 (release, blocked).

## Next highest-value action

1. Mobile layer-toggle UI gap (`MapLayerToggle` is `hidden lg:block` — no
   mobile way to toggle any map layer) — found incidentally, small and
   decision-independent, not yet fixed.
2. Everything else requires a Dave decision or external access — see
   `delivery/dave-completion/06_DECISIONS_REQUIRED.md`.
