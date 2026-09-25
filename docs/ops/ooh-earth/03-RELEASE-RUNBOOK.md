# Release Runbook

The discipline established across this whole engagement. Follow it for every fix, no exceptions.

```
OBSERVE
  → REPRODUCE
  → TRACE
  → EXPLAIN
  → PATCH IN ISOLATION
  → TEST
  → DIFF
  → BACKUP/ROLLBACK
  → HUMAN AUTHORIZATION
  → DEPLOY NARROWLY
  → VERIFY
  → RECORD EVIDENCE
  → ADVANCE
```

## Non-negotiables

- **No "probably fixed" releases.** A hypothesis is not a root cause. Confidence must be HIGH with cited evidence before writing a patch.
- **No production PASS without evidence.** "Source-verified" and "runtime-verified" are different claims — never conflate them. See `00-CURRENT-STATE.md`'s label conventions.
- **No broad `entities push` while unexplained differences exist.** Every entity file in a push's local folder must be accounted for — either "unchanged from production's current content" or "an approved, diffed, explained change." If anything is unexplained, the release is BLOCKED, not shipped anyway.
- **Isolated worktrees only for fix work.** Never touch the dirty checkout (`feat/weather-context-v1`) or any pre-existing worktree not explicitly named for this task.
- **Single-function/single-entity-file deploys preferred over broad ones.** `base44 functions deploy <name>` and a fully-diffed `entities push` mirror are both narrower and safer than `deploy` (which pushes everything at once).
- **Rollback artifact before any write.** Pre-change source + checksums + the exact one-command restore procedure, saved before the write happens — not reconstructed after the fact.
- **Human authorization is scoped to exactly what was asked.** A green light for one function/entity is not a green light for others, even adjacent ones found in the same investigation.
- **Runtime behavioral claims about production require an actual, safely-authorized runtime observation.** Reading source code proves what the code says; it does not prove what's currently executing unless the "preview vs. prod" execution-environment question (see `00-CURRENT-STATE.md`) has been resolved for that specific change.

## Standard evidence bar for "root cause confirmed"

- A specific file:line (or a small number of them) that plausibly produces the observed symptom.
- A reproduction that is consistent with that code path (ideally: toggling/simulating the condition changes the symptom).
- An explanation for *every* reported symptom, not just the most convenient one (e.g., if mobile-specific behavior is reported, the explanation must account for why mobile specifically, not just "the map is buggy").
- Explicit statement of what would falsify the hypothesis, and confirmation that wasn't observed.

## When BACKUP is available for a fix

Test on BACKUP before proposing a production write whenever the architecture permits (i.e., the affected code path exists identically there). Record exactly what was changed on BACKUP and re-run the relevant golden-journey tests (see `05-TEST-MATRIX.md`) — do not silently leave BACKUP in a different state than before without recording it in `06-EVIDENCE-LOG.md`.

## Permanent release lessons (retain indefinitely — do not let these regress)

1. **Entity schema persistence is verified via the authoritative `GET /api/apps/{id}/entity-schemas` API, never the Base44 Code-tab/Monaco editor.** The Code tab does not reliably reflect the runtime schema store — proven via a real false-negative during Phase 2 (2026-09-22).
2. **A Base44 function deploy's source must use the CLI-recognized `entry.ts`/`entry.js` layout** (`ENTRY_FILE_GLOB = "entry.{js,ts}"`), unless a local `function.jsonc` in that function's directory explicitly names a different entry file. A hand-placed `main.ts` (or any other filename) is silently ignored otherwise — check `ls` on the function directory and, if unsure, trace the CLI's own `readAllFunctions` logic before deploying.
3. **Frontend BACKUP/production builds must explicitly set `VITE_BASE44_APP_ID` (or whatever mechanism injects the target app id) and then verify it landed in the built artifact — never rely on the fallback.** A bare `npm run build` silently falls back to a hardcoded production app id (`src/lib/app-params.js`'s `LIVE_APP_ID`), which is safe for a production build by coincidence but actively wrong for a BACKUP build — this caused a real, self-caught incident on 2026-09-22 (first BACKUP deploy of the P0.1 realtime mitigation served BACKUP's domain with production's app id embedded, until caught and corrected before further verification). Before any frontend deploy: build with the target env var set, `grep` the actual entry file referenced by `dist/index.html` (not just any `index-*.js` glob match — a build can contain multiple chunks whose names start with `index-`) for the expected app id, and confirm the unwanted app id is absent from that same file.
4. **A successful CLI message ("deployed successfully", "pushed successfully") is not sufficient evidence of the resulting runtime state.** Always follow with an independent, authoritative verification: for entities/functions, the `entity-schemas` API or a fresh `functions pull`; for a frontend site deploy, confirm the live `index.html`'s referenced entry script matches the artifact just built (content-hashed filenames make an exact match a strong proof, not just a plausible one) and exercise the actual behavior change live (DevTools) rather than trusting the deploy command's own success message alone.
