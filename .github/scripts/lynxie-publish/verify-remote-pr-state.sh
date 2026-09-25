#!/usr/bin/env bash
# Server-side, live GitHub state re-verified immediately before acting —
# never trusts the workflow_dispatch inputs alone, and never trusts a
# stale snapshot. pr_json is passed in (already fetched by the caller via
# `gh pr view`) so this check is a pure function of its inputs and can be
# exercised with a fixture PR-state JSON in tests without any network call.
set -euo pipefail
pr_json="${1:?pr_json required}"
target_branch="${2:?target_branch required}"
expected_remote_sha="${3:?expected_remote_sha required}"
target_dir="${4:?target checkout dir required}"

state=$(echo "$pr_json" | node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).state)")
head_branch=$(echo "$pr_json" | node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).headRefName)")
head_sha=$(echo "$pr_json" | node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).headRefOid)")

[ "$state" = "OPEN" ] || { echo "::error::PR is not OPEN (state=$state)"; exit 1; }
[ "$head_branch" = "$target_branch" ] || { echo "::error::PR head branch mismatch: expected $target_branch, got $head_branch"; exit 1; }
[ "$head_sha" = "$expected_remote_sha" ] || { echo "::error::remote head has moved since this request was approved: expected $expected_remote_sha, got $head_sha"; exit 1; }

checked_out=$(git -C "$target_dir" rev-parse HEAD)
[ "$checked_out" = "$expected_remote_sha" ] || { echo "::error::target/ checkout HEAD does not match expected SHA"; exit 1; }
