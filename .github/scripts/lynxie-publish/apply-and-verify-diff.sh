#!/usr/bin/env bash
# Applies the TRUSTED patch inside the TARGET checkout only, then verifies
# the resulting diff exactly matches what was approved. patch_file is
# resolved to an absolute path BEFORE changing into target_dir, since the
# patch always lives under the trusted/ checkout, never under target/.
set -euo pipefail
target_dir="${1:?target checkout dir required}"
patch_file="${2:?patch_file required}"
expected_diff_sha="${3:?expected diff sha256 required}"

patch_file_abs=$(readlink -f "$patch_file")

cd "$target_dir"
git apply --check "$patch_file_abs"
git apply "$patch_file_abs"

actual_diff_sha=$(git diff | sha256sum | cut -d' ' -f1)
if [ "$actual_diff_sha" != "$expected_diff_sha" ]; then
  echo "::error::resulting working-tree diff does not match the approved diff digest"
  git diff --stat
  exit 1
fi
echo "diff-verified=true"
