#!/usr/bin/env bash
# workflow_dispatch inputs are checked AGAINST the trusted manifest entry,
# never trusted alone — this is what stops a caller from dispatching valid
# manifest bookkeeping (request_id) against a different pr_number/branch/sha
# than what was actually reviewed and recorded.
set -euo pipefail
: "${ENTRY:?ENTRY (manifest entry JSON) required}"
: "${EXPECTED_REMOTE_SHA:?required}"
: "${CANDIDATE_SHA:?required}"
: "${PR_NUMBER:?required}"
: "${TARGET_BRANCH:?required}"

node -e "
  const entry = JSON.parse(process.env.ENTRY);
  const fail = (why) => { console.error('::error::' + why); process.exit(1); };
  if (entry.expectedParentSha !== process.env.EXPECTED_REMOTE_SHA) fail('expected_remote_sha does not match manifest');
  if (entry.candidateSha !== process.env.CANDIDATE_SHA) fail('candidate_sha does not match manifest');
  if (entry.prNumber !== Number(process.env.PR_NUMBER)) fail('pr_number does not match manifest');
  if (entry.targetBranch !== process.env.TARGET_BRANCH) fail('target_branch does not match manifest');
"
