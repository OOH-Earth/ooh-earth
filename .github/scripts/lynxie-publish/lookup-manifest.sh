#!/usr/bin/env bash
# Looks up request_id in the manifest committed on the TRUSTED checkout
# only (the immutable workflow/default-branch revision this run started
# from) — never the mutable target PR branch. The target PR branch's own
# copy of these paths, if any, is never read by this script; a forged
# manifest/patch on the target branch has zero effect on the entry this
# prints. Prints the manifest entry as JSON on stdout on success.
set -euo pipefail
trusted_root="${1:?trusted checkout root required}"
rid="${2:?request_id required}"

manifest="${trusted_root}/.github/lynxie-patches/manifest.json"
patch_file="${trusted_root}/.github/lynxie-patches/${rid}.patch"

if [ ! -f "$manifest" ]; then
  echo "::error::no manifest committed on the trusted revision"
  exit 1
fi
if [ ! -f "$patch_file" ]; then
  echo "::error::no patch file for request_id ${rid} on the trusted revision"
  exit 1
fi

node -e "
  const m = JSON.parse(require('fs').readFileSync('$manifest', 'utf8'));
  const e = m['$rid'];
  if (!e) { process.exit(1); }
  console.log(JSON.stringify(e));
" || { echo "::error::request_id ${rid} not present in manifest"; exit 1; }
