# Build dependency scope — 2026-10-05

## Finding

PR #331 CI audit run 37286158770, artifact 11335010161 reports six high-severity dependency entries. Root advisory GHSA-vfj7-8cjw-p6xm concerns braces <=3.0.3; the official advisory currently lists no patched version. Chokidar/micromatch/fast-glob/Tailwind and tailwindcss-animate inherit this finding. This is not six independent vulnerabilities and was not introduced by the portal (no package changes).

## Classification correction

`tailwindcss-animate` is required only in tailwind.config.js. Tailwind runs in postcss.config.js to generate static CSS; neither is imported by application or backend source. Tailwind is already a devDependency, but the animate plugin's production peer dependency caused the entire build-tool chain to be classified as production in the lockfile. Move the plugin to devDependencies and regenerate dependency classification. No versions, integrity hashes, registry URLs or package set change. No audit allowlist or workflow/gate changes.

## Remaining risk

This does NOT patch braces. Full development audit retains the high findings. Build inputs remain repository-controlled Tailwind config/source/glob patterns; do not add remotely supplied or user-uploaded glob patterns to build jobs. A supported upstream patch or separate, fully qualified Tailwind migration is still needed to remove the vulnerable development dependency. This classification is not a claim of zero overall vulnerabilities.

## Evidence

Local production-scope audit: zero high/critical, one low DOMPurify and one moderate Moment. Lock comparison confirms identical package set, versions, integrity hashes and resolved URLs. Fresh npm ci --ignore-scripts succeeded. Build/asset comparison and exact-head CI must qualify the correction before merge. No deployment or application-source changes.
