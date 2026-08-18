# Release / Deployment Status

**This is a previously diagnosed blocker, re-stated here per the mission's
own instruction not to repeatedly rediscover it. Not re-investigated this
pass.**

## Current state

- App version on `main`: **1.2.0**
- PR #63 (`chore(main): release 1.3.0`, release-please's auto-generated
  release PR) is **open**, showing "Action required" / blocked status

## The exact diagnosis (from prior investigation this session)

PR #64 (merged) added a `workflow_dispatch` re-trigger mechanism so CI/CodeQL
would run on release-please's release PRs (they don't trigger normal `push`/
`pull_request` events the same way). That mechanism works — confirmed via a
direct GitHub Checks API query that all check-runs exist and pass on the
correct commit SHA.

**The gap:** those `workflow_dispatch`-triggered check-runs do not
automatically link into the PR's own `statusCheckRollup` — the thing branch
protection actually reads to decide if a PR is mergeable. Confirmed via a
GraphQL query showing only CodeQL present in PR #63's rollup, despite all 10
checks existing and passing at the commit-SHA level via the REST API. This is
a genuine gap in PR #64's own fix, not caught in its original verification.

## The single smallest action that unblocks this

**A human with GitHub organization/repository Settings access** needs to
either:
- Adjust the branch protection rule's required-check linkage so it accepts
  `workflow_dispatch`-triggered runs into the rollup, or
- Manually re-trigger the checks via a mechanism that does populate the
  rollup (e.g. a fresh commit/push to the PR branch, which release-please
  itself would need to do, or a maintainer pushing an empty commit)

This is **not** an engineering task solvable from within the repository —
it requires elevated GitHub permissions this session does not have.

## What was explicitly not done

Per repeated instruction across this session: no code changes, no workflow
changes, no repository setting changes, no merge/approve/bypass of PR #63.
