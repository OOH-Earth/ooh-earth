# Dependency audit reconciliation — 2026-10-07

## The discrepancy
The owner's `npm ci` printed **10 vulnerabilities (1 low, 3 moderate, 6 high)**. CI's "Dependency audit (fails on high/critical only)" passed. Both are correct: they audit different scopes.

| Scope | Command | Candidate `b57cc46` (lockfile identical to `main` at `fe31907`) | After this PR |
|---|---|---|---|
| Production only (what CI gates on) | `npm audit --omit=dev` | **2**: dompurify (low), moment (moderate) | **0** |
| Everything incl. dev (what `npm ci` prints) | `npm audit` | **10**: 1 low, 3 moderate, 6 high | **7**: 2 moderate, 5 high |

Evidence: `npm audit --package-lock-only --json` run locally for both scopes matches the CI `audit-report` artifact of run `37641011927` (`dompurify,moment`, 0 high/critical).

## Affected packages
| Package | Advisory | Range | Path | Runtime / build exposure | Action |
|---|---|---|---|---|---|
| moment 2.30.1 | GHSA-4p3w-j4w9-5jqw path traversal, crafted locale name (moderate) | >=2.29.2 <2.31.0 | direct dependency | Not imported by `src/` and not in `dist/` (no `_isAMomentObject`). Installed only. | bumped to 2.31.0 (in range) |
| dompurify 3.4.13 | GHSA-p98j-92pf-mc4p, GHSA-6688-9rhm-gjv2 `IN_PLACE` (low) | <=3.4.15 | jspdf 4.2.1 | Bundled as the lazy `purify.es` chunk for jsPDF. The advisories need the `IN_PLACE` option; the app calls no `jsPDF.html()`. | bumped to 3.4.16 (in range) |
| source-map-js 1.2.1 | GHSA-68fv-2mgg-jv7q event-loop DoS via source-map section offsets (high) | >=1.0.0 <1.2.2 | postcss | Build-time (PostCSS), not in `dist/` | bumped to 1.2.2 (in range) |
| braces 3.0.3 | GHSA-vfj7-8cjw-p6xm stack exhaustion on deeply nested patterns (high) | <=3.0.3 | tailwindcss 3 -> chokidar/micromatch | **No patched release exists** (3.0.3 is the latest). Build/dev-server only, input is the repo's own content globs. Not in `dist/`. | none possible |
| micromatch 4.0.8, fast-glob 3.3.3, chokidar 3.6.0 (high) | inherit braces | | tailwindcss 3 | same as braces | none possible |
| tailwindcss 3.4.19 (high), postcss-nested, postcss-selector-parser <7.1.6 (moderate, GHSA-rj75-hqrm-r3gf quadratic selector parsing) | inherited | | direct devDependency | Build-time only. Input is the repo's own CSS/templates. | fix is a Tailwind 3 -> 4 major migration: out of scope |

## Not done, deliberately
- No `npm audit fix --force`, no override of `postcss-selector-parser` into Tailwind 3 (unverified API compatibility), no reclassification of dependencies, no change to the CI gate.
- Remaining 7 are devDependency findings on trusted build input. An owner decision is needed on whether to schedule the Tailwind 4 migration; until then they are accepted and documented here.

## Verification
lint, typecheck, prettier, production build green; the PDF library loads and renders a PDF in Node with the bumped versions. Lockfile-only change (`package.json` untouched).
