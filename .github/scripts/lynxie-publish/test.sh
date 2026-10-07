#!/usr/bin/env bash
# Regression coverage for the lynxie-publish-pr-head executor's trust
# logic, run entirely offline against local git fixtures — no GitHub API
# calls, no real dispatch, no network. Exercises the exact scripts the
# workflow itself calls (single source of truth, no duplicated logic to
# drift out of sync). Run: bash .github/scripts/lynxie-publish/test.sh
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PASS=0
FAIL=0

expect_ok() {
  local desc="$1"; shift
  if "$@" >"$WORK/out.log" 2>&1; then
    echo "  ok  - $desc"
    PASS=$((PASS + 1))
  else
    echo "FAIL  - $desc (expected success, got failure)"
    sed 's/^/        /' "$WORK/out.log"
    FAIL=$((FAIL + 1))
  fi
}

expect_fail() {
  local desc="$1"; shift
  if "$@" >"$WORK/out.log" 2>&1; then
    echo "FAIL  - $desc (expected failure, got success)"
    sed 's/^/        /' "$WORK/out.log"
    FAIL=$((FAIL + 1))
  else
    echo "  ok  - $desc"
    PASS=$((PASS + 1))
  fi
}

# --- Build a base "target PR" git repo + a matching good patch/manifest ---
build_fixture() {
  local fixture_root="$1"
  mkdir -p "$fixture_root"

  # Base commit: what the PR head is currently at.
  local base="$fixture_root/base-origin"
  git init -q "$base"
  git -C "$base" config user.email test@example.com
  git -C "$base" config user.name test
  printf 'hello\n' > "$base/app.txt"
  git -C "$base" add app.txt
  git -C "$base" commit -q -m base
  BASE_SHA=$(git -C "$base" rev-parse HEAD)

  # Candidate commit in a throwaway clone, used only to generate the patch.
  local candidate="$fixture_root/candidate-clone"
  git clone -q "$base" "$candidate"
  printf 'hello world\n' > "$candidate/app.txt"
  git -C "$candidate" add app.txt
  git -C "$candidate" -c user.email=test@example.com -c user.name=test commit -q -m "candidate change"
  CANDIDATE_SHA=$(git -C "$candidate" rev-parse HEAD)
  git -C "$candidate" diff HEAD~1 HEAD > "$fixture_root/good.patch"
  PATCH_SHA256=$(sha256sum "$fixture_root/good.patch" | cut -d' ' -f1)

  # approvedDiffSha256: apply the patch fresh and hash the resulting diff —
  # identical procedure to what apply-and-verify-diff.sh does for real.
  local diffcheck="$fixture_root/diff-check-clone"
  git clone -q "$base" "$diffcheck"
  git -C "$diffcheck" apply "$fixture_root/good.patch"
  APPROVED_DIFF_SHA256=$(git -C "$diffcheck" diff | sha256sum | cut -d' ' -f1)
  rm -rf "$diffcheck"

  # trusted/: manifest.json + good.patch, as they'd exist on main.
  mkdir -p "$fixture_root/trusted/.github/lynxie-patches"
  cp "$fixture_root/good.patch" "$fixture_root/trusted/.github/lynxie-patches/nav-aria-fix.patch"
  cat > "$fixture_root/trusted/.github/lynxie-patches/manifest.json" <<EOF
{
  "nav-aria-fix": {
    "prNumber": 201,
    "targetBranch": "feature/target",
    "expectedParentSha": "$BASE_SHA",
    "candidateSha": "$CANDIDATE_SHA",
    "patchSha256": "$PATCH_SHA256",
    "approvedDiffSha256": "$APPROVED_DIFF_SHA256",
    "description": "test fixture"
  }
}
EOF

  # target/: a fresh checkout of the PR branch at the base commit — the
  # ACTUAL PR head has never seen the patch or the manifest.
  git clone -q "$base" "$fixture_root/target"
}

echo "=== A. target PR has no manifest/patch, trusted checkout does -> valid dry run succeeds ==="
F="$WORK/a"; build_fixture "$F"
entry=$(bash "$HERE/lookup-manifest.sh" "$F/trusted" nav-aria-fix)
expect_ok "A1: lookup-manifest succeeds from trusted/ even though target/ has none" true
ENTRY="$entry" EXPECTED_REMOTE_SHA="$BASE_SHA" CANDIDATE_SHA="$CANDIDATE_SHA" PR_NUMBER=201 TARGET_BRANCH=feature/target \
  expect_ok "A2: verify-inputs-match-manifest passes" bash "$HERE/verify-inputs-match-manifest.sh"
expect_ok "A3: verify-patch-digest passes for the trusted patch" \
  bash "$HERE/verify-patch-digest.sh" "$F/trusted/.github/lynxie-patches/nav-aria-fix.patch" "$PATCH_SHA256"
pr_json=$(node -e "console.log(JSON.stringify({state:'OPEN',headRefName:'feature/target',headRefOid:'$BASE_SHA'}))")
expect_ok "A4: verify-remote-pr-state passes for an unmoved, open, matching PR" \
  bash "$HERE/verify-remote-pr-state.sh" "$pr_json" feature/target "$BASE_SHA" "$F/target"
expect_ok "A5: apply-and-verify-diff applies cleanly and matches approved digest" \
  bash "$HERE/apply-and-verify-diff.sh" "$F/target" "$F/trusted/.github/lynxie-patches/nav-aria-fix.patch" "$APPROVED_DIFF_SHA256"
if [ "$(cat "$F/target/app.txt")" = "hello world" ]; then
  echo "  ok  - A6: the patch landed in target/, not trusted/"
  PASS=$((PASS + 1))
else
  echo "FAIL  - A6: patch did not land in target/ as expected"
  FAIL=$((FAIL + 1))
fi
if [ "$(sha256sum "$F/trusted/.github/lynxie-patches/nav-aria-fix.patch" | cut -d' ' -f1)" = "$PATCH_SHA256" ]; then
  echo "  ok  - A7: trusted/ is untouched by the target-side patch apply"
  PASS=$((PASS + 1))
else
  echo "FAIL  - A7: trusted/ was mutated — must never happen"
  FAIL=$((FAIL + 1))
fi

echo "=== B. target PR contains a forged manifest/patch -> ignored; trusted copy remains authoritative ==="
F="$WORK/b"; build_fixture "$F"
mkdir -p "$F/target/.github/lynxie-patches"
cat > "$F/target/.github/lynxie-patches/manifest.json" <<'EOF'
{ "nav-aria-fix": { "prNumber": 201, "targetBranch": "feature/target", "expectedParentSha": "0000000000000000000000000000000000000000", "candidateSha": "forged", "patchSha256": "forged", "approvedDiffSha256": "forged", "description": "FORGED — must never be read" } }
EOF
printf 'forged patch content that must never be applied\n' > "$F/target/.github/lynxie-patches/nav-aria-fix.patch"
forged_entry=$(bash "$HERE/lookup-manifest.sh" "$F/trusted" nav-aria-fix)
if [ "$(echo "$forged_entry" | node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).expectedParentSha)")" = "$BASE_SHA" ]; then
  echo "  ok  - B1: lookup-manifest(trusted, ...) returns the TRUSTED entry, unaffected by target/'s forged copy"
  PASS=$((PASS + 1))
else
  echo "FAIL  - B1: forged target-branch manifest influenced the resolved entry — trust boundary broken"
  FAIL=$((FAIL + 1))
fi

echo "=== C. expected remote SHA mismatch (GitHub-side) -> refusal ==="
F="$WORK/c"; build_fixture "$F"
pr_json=$(node -e "console.log(JSON.stringify({state:'OPEN',headRefName:'feature/target',headRefOid:'$BASE_SHA'}))")
expect_fail "C: verify-remote-pr-state refuses when caller's expected_remote_sha disagrees with live PR head" \
  bash "$HERE/verify-remote-pr-state.sh" "$pr_json" feature/target "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef" "$F/target"

echo "=== D. target branch main/master -> refusal ==="
expect_fail "D1: refuse-mainline-target refuses 'main'" bash "$HERE/refuse-mainline-target.sh" main
expect_fail "D2: refuse-mainline-target refuses 'master'" bash "$HERE/refuse-mainline-target.sh" master
expect_ok "D3: refuse-mainline-target allows a real PR branch name" bash "$HERE/refuse-mainline-target.sh" feature/target

echo "=== E. unknown request_id -> refusal ==="
F="$WORK/e"; build_fixture "$F"
expect_fail "E: lookup-manifest refuses a request_id absent from the manifest" \
  bash "$HERE/lookup-manifest.sh" "$F/trusted" does-not-exist

echo "=== F. patch digest mismatch -> refusal ==="
F="$WORK/f"; build_fixture "$F"
expect_fail "F: verify-patch-digest refuses when the trusted patch file's hash disagrees with the manifest" \
  bash "$HERE/verify-patch-digest.sh" "$F/trusted/.github/lynxie-patches/nav-aria-fix.patch" "0000000000000000000000000000000000000000000000000000000000000000"

echo "=== G. resulting diff digest mismatch -> refusal ==="
F="$WORK/g"; build_fixture "$F"
expect_fail "G: apply-and-verify-diff refuses when the resulting diff doesn't match approvedDiffSha256" \
  bash "$HERE/apply-and-verify-diff.sh" "$F/target" "$F/trusted/.github/lynxie-patches/nav-aria-fix.patch" "0000000000000000000000000000000000000000000000000000000000000000"

echo "=== H. target PR moved after approval (local checkout disagrees with the expected SHA) -> refusal ==="
F="$WORK/h"; build_fixture "$F"
git -C "$F/target" commit --allow-empty -q -m "branch moved after approval"
MOVED_SHA=$(git -C "$F/target" rev-parse HEAD)
pr_json=$(node -e "console.log(JSON.stringify({state:'OPEN',headRefName:'feature/target',headRefOid:'$MOVED_SHA'}))")
# GitHub-side head now reports MOVED_SHA, but the request was approved
# against BASE_SHA — this must be refused even though the caller
# (hypothetically) also updated expected_remote_sha to match what GitHub
# now reports, because the LOCAL checkout no longer matches the ORIGINAL
# approval. We simulate the real refusal path: expected_remote_sha stays
# pinned to the originally-approved BASE_SHA, so both the GitHub-state
# check and the local-checkout check must refuse.
expect_fail "H: verify-remote-pr-state refuses once the target branch has moved past the originally-approved SHA" \
  bash "$HERE/verify-remote-pr-state.sh" "$pr_json" feature/target "$BASE_SHA" "$F/target"

echo "=== I. dry_run: zero commit / zero push (static check on the real workflow file) ==="
WORKFLOW="$HERE/../../workflows/lynxie-publish-pr-head.yml"
if grep -q 'if: \${{ inputs.dry_run != .true. && inputs.dry_run != true }}' "$WORKFLOW" \
  && awk '/name: Commit and push/,/^$/' "$WORKFLOW" | grep -q 'git commit' \
  && awk '/name: Commit and push/,/^$/' "$WORKFLOW" | grep -q 'git push'; then
  echo "  ok  - I1: the only step containing git commit/push is gated by dry_run != true"
  PASS=$((PASS + 1))
else
  echo "FAIL  - I1: could not confirm commit/push is gated behind dry_run != true"
  FAIL=$((FAIL + 1))
fi
non_gated_commits=$(awk '
  /^      - name:/ { step=$0; gated=0 }
  /if: .*dry_run != .true. && inputs.dry_run != true/ { gated=1 }
  /git (commit|push)/ && !gated { print step }
' "$WORKFLOW")
if [ -z "$non_gated_commits" ]; then
  echo "  ok  - I2: no git commit/push call exists outside the dry_run-gated step"
  PASS=$((PASS + 1))
else
  echo "FAIL  - I2: found a git commit/push call outside the dry_run gate: $non_gated_commits"
  FAIL=$((FAIL + 1))
fi
# And functionally: every script-level test above (A-H) never invoked git
# commit or git push at all — apply-and-verify-diff.sh only ever calls
# `git apply`/`git diff`, matching dry-run's own "apply, inspect, stop"
# contract exactly.
if ! grep -Eq 'git (commit|push)' "$HERE/apply-and-verify-diff.sh"; then
  echo "  ok  - I3: apply-and-verify-diff.sh (used for both dry and real runs) never itself commits or pushes"
  PASS=$((PASS + 1))
else
  echo "FAIL  - I3: apply-and-verify-diff.sh must never commit or push"
  FAIL=$((FAIL + 1))
fi

echo "=== J. real mode still structurally has no force-push path (static check) ==="
if grep -Eq -- '--force|(^|[^A-Za-z])-f([^A-Za-z]|$)|\+refs/' "$WORKFLOW"; then
  echo "FAIL  - J1: found a force-push-shaped flag/refspec in the workflow"
  FAIL=$((FAIL + 1))
else
  echo "  ok  - J1: no --force/-f flag or '+' force-refspec anywhere in the workflow"
  PASS=$((PASS + 1))
fi
if grep -q 'git push origin "HEAD:refs/heads/\${TARGET_BRANCH}"' "$WORKFLOW"; then
  echo "  ok  - J2: the push line is the exact expected plain, non-force, single-branch form"
  PASS=$((PASS + 1))
else
  echo "FAIL  - J2: push line does not match the expected exact non-force form"
  FAIL=$((FAIL + 1))
fi

echo "=== Trust-boundary static checks ==="
if grep -q 'ref: \${{ github.sha }}' "$WORKFLOW" && grep -q 'path: trusted' "$WORKFLOW"; then
  echo "  ok  - trusted checkout is pinned to github.sha (immutable), not a mutable branch name"
  PASS=$((PASS + 1))
else
  echo "FAIL  - trusted checkout is not pinned to github.sha"
  FAIL=$((FAIL + 1))
fi
if grep -A2 'path: trusted' "$WORKFLOW" | grep -q 'persist-credentials: false'; then
  echo "  ok  - trusted checkout never persists push credentials"
  PASS=$((PASS + 1))
else
  echo "FAIL  - trusted checkout should set persist-credentials: false"
  FAIL=$((FAIL + 1))
fi

echo "=== Script-injection hardening (static): free-form string inputs never interpolated inside a run: block ==="
# The four free-form workflow_dispatch string inputs may appear as
# ${{ inputs.x }} ONLY where GitHub Actions treats the value as data, not
# as shell text: the job-level `env:` assignment (4 occurrences) and the
# TARGET checkout's `ref:` action input (1 occurrence). Any OTHER
# occurrence means a run: block is interpolating untrusted input directly
# into bash text again — the exact class of bug this hardening closes.
total_occurrences=$(grep -c 'inputs\.\(request_id\|target_branch\|expected_remote_sha\|candidate_sha\)' "$WORKFLOW" || true)
if [ "$total_occurrences" -eq 5 ]; then
  echo "  ok  - exactly the 5 expected safe occurrences (4 job-env assignments + 1 checkout ref) — none inside a run: block"
  PASS=$((PASS + 1))
else
  echo "FAIL  - expected exactly 5 occurrences of the free-form inputs, found $total_occurrences — a run: block may be interpolating untrusted input again"
  FAIL=$((FAIL + 1))
fi

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
