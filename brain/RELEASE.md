# RELEASE — compact gates

Adapt order when a change is already deployed but not yet merged (git
reconciliation only — skip straight to the drift check).

## FRONTEND
```
fresh origin/main
→ isolated worktree
→ focused tests, lint, typecheck, format, build
→ prove target app id in the TRUE entry file (dist/index.html's real ref,
  not any index-*.js glob match)
→ deploy to BACKUP
→ rendered browser QA (real getSource()/queryRenderedFeatures()-style
  checks where rendering is the question, not just HTTP 200s)
→ production build, prove target app id again
→ deploy to production (human-authorized if anything beyond a bounded,
  behavior-preserving frontend change)
→ rendered production QA
→ PR → CI → merge → fresh-fetch main → drift check (empty diff expected
  if the artifact was already live)
```

## FUNCTION
```
source diff (production vs BACKUP vs origin/main content, not just filenames)
→ security review (auth checks, input validation, error sanitization)
→ tests
→ BACKUP deploy if the function isn't already correct there
→ confirm the deploy source uses the CLI's recognized entry file
  (entry.ts/entry.js, or check function.jsonc for an override)
→ STOP for explicit production authorization — always, no exception
→ deploy
→ re-pull and diff/hash the deployed artifact against the intended source
→ safe runtime verification (existence/OPTIONS checks; avoid triggering
  real side effects on a mutating function without separate authorization)
→ git reconciliation (confirm origin/main already has this source, or PR it)
```

## ENTITY
```
fresh authoritative production snapshot (GET .../entity-schemas, never the
  Monaco/Code-tab editor)
→ whole-folder semantic diff against the intended change
→ rollback artifact (full snapshot + checksums + restore procedure)
→ BACKUP push + verify
→ STOP for explicit human production authorization
→ whole-folder push
→ authoritative API re-read
→ semantic verification (exactly the intended fields changed, nothing else)
```

## Sandbox denials
Treat any classifier denial (e.g. "Merge Without Review", a blocked deploy
command) as a stop-and-report checkpoint. Never retry via a different tool,
smaller batch, or rephrased command to reach the same outcome. Record the
exact command a human needs to run instead.
