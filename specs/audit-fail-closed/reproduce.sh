#!/usr/bin/env bash
# Offline reproduction of the CURRENT "npm audit (fail on high/critical only)" step logic in
# .github/workflows/ci.yml (main and maintenance/production-2026-10-02 are identical). No network and
# no `npm audit` call: each fixture stands in for audit-report.json. The step body is run the way
# GitHub Actions runs a default `run:` block on Linux: `bash -e -o pipefail`.
cd "$(dirname "$0")"
for f in fixtures/*.fixture; do
  work=$(mktemp -d); cp "$f" "$work/audit-report.json"
  ( cd "$work" && bash -e -o pipefail -c '
    HIGH=$(node -e "const r=require(\"./audit-report.json\"); const m=r.metadata?.vulnerabilities||{}; console.log((m.high||0)+(m.critical||0))")
    echo "High/critical vulnerabilities: $HIGH"
    if [ "$HIGH" -gt 0 ]; then exit 1; fi' >/dev/null 2>&1 ); rc=$?
  printf '%-34s step exit=%s  (%s)\n' "$(basename "$f" .fixture)" "$rc" "$([ $rc -eq 0 ] && echo PASSES || echo FAILS)"
  rm -rf "$work"
done
