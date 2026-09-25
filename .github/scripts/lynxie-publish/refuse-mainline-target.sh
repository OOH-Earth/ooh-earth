#!/usr/bin/env bash
# This capability only ever targets an existing, non-mainline PR head
# branch — never the protected default branch.
set -euo pipefail
tb="${1:?target_branch required}"
if [ "$tb" = "main" ] || [ "$tb" = "master" ]; then
  echo "::error::target_branch may never be main or master — this capability only ever targets an existing, non-mainline PR head branch"
  exit 1
fi
