# Current state

- Task: reconcile and requalify PR #336.
- Worktree: `/home/hiker123/oohearth/.worktrees/place-research-pilot`; branch `feat/place-research-pilot-local`.
- Qualified historical head: `7b0dbdac860e6d2293799bd2a9f5e04f243bda53`; BACKUP artifact and UX evidence are historical references.
- Reconciliation baseline: remote pilot head `bff4e34fd1f768402c56a901139049d293ff64d0` merged locally with main `fe319072f47c756e4e6d936b7b621baafb045feb` on 2026-10-07 without conflicts. The final published SHA and its CI must be checked live rather than inferred from this file.
- PR: [#336](https://github.com/OOH-Earth/ooh-earth/pull/336), open; previously conflicting against main. No active local helper processes.
- Last qualified CI: CI `37514379683`, CodeQL `37514386087`, both green at the historical head.
- Last BACKUP artifact: exact hash match to local build; preview was qualified at the historical head.
- Dirty weather checkout `/home/hiker123/oohearth` is preserved and out of scope.
- Present: `brain/PRODUCT.md`, `brain/INVARIANTS.md`, `brain/QUEUE.md`. Check `plan.md` at resumption rather than assuming presence or absence.
- Local reconciled-source checks: adapter 7/7, typecheck, lint, build and security boundary checks passed. Build was a compilation check without an app ID, not a deployable qualified artifact. Browser discovery is not browser execution.
- Remaining pilot gates: fresh exact-head CI/CodeQL, then BACKUP targeting, artifact and rendered desktop/mobile qualification. Historical preview is not proof of this source.
- Frozen production candidate: `a1868f122aa965fd96ab023492bed62470fb1106` (contains #322/#325/#327/#328/#333; excludes Hackers Club). No deployment or candidate change in this pass.
- GitHub connector reads work here. Invalid `gh` credentials in another checkout do not establish a repository-wide access outage. Base44 timeout is connectivity evidence, not an authentication diagnosis.
- #342 head `8900b7c91d4a283166439ba6e49715ec7154e6ba`: CI 37569108920 and CodeQL 37569108960 successful; open, unmerged at inspection.
- #343 head `4ab2ee56723ad7a116e3025dfe44afbb155cb084`: CI 37570427957 and CodeQL 37570427925 successful; open, unmerged at inspection. Its opt-in generated coordinate layers still need alignment with the no-LLM-map-data invariant.
- Local unpublished commits `281e251` and `528686c` were reported by the owner but were not available for inspection here. Preserve and reconcile them; do not force-reset the owner's checkout.
