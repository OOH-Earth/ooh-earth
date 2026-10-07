#!/usr/bin/env bash
# Content-addressed integrity: the patch file (from the TRUSTED checkout)
# must exactly match the digest recorded in the trusted manifest entry.
set -euo pipefail
patch_file="${1:?patch_file required}"
expected="${2:?expected sha256 required}"

actual=$(sha256sum "$patch_file" | cut -d' ' -f1)
if [ "$actual" != "$expected" ]; then
  echo "::error::patch file digest mismatch: expected $expected, got $actual"
  exit 1
fi
