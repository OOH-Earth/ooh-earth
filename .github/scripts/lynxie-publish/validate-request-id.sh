#!/usr/bin/env bash
# Defense in depth against path traversal: request_id is used to build a
# filesystem path (.github/lynxie-patches/<request_id>.patch), so it must
# never contain "/", "..", or any shell/glob-meaningful character.
set -euo pipefail
rid="${1:?request_id required}"
if ! [[ "$rid" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "::error::request_id must match [a-zA-Z0-9_-]+ only — refusing"
  exit 1
fi
