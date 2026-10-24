# Review checklist

Use for human review and for an **advisory** independent AI review (give the reviewer `spec.md`, the diff and test evidence; ask for prioritized findings with file:line, not approval). Record reviewer identity and the exact SHA reviewed. AI review never replaces required human review.

- [ ] **Requirements**: every `R#` in the spec is covered by code and a check; stated non-goals are untouched; no scope creep.
- [ ] **Correctness / errors**: loading, empty, invalid, denied, failed and recovery states handled; failures are visible, not swallowed.
- [ ] **Security / privacy / permissions**: authz is server-side; no secrets, personal data or exploit detail in code, logs, docs or CI; untrusted input treated as untrusted.
- [ ] **Mutations**: no blind retries; idempotency and de-duplication where repeatable; account isolation preserved; no unbounded loops.
- [ ] **UI**: keyboard + focus visible, accessible names, ≥44px primary targets, responsive at 320/390/768/1280, no new horizontal scroll, measured not just eyeballed.
- [ ] **Dependencies / cost**: no unrelated updates; lockfile-only when that is the fix; no new service, subscription or billable resource.
- [ ] **Runtime target**: right environment and app-id; frontend/backend/function pairing and rollback artifact identified.
- [ ] **Rollback / observability**: how to undo; what signal shows it failed; no new always-on infrastructure.
- [ ] **Claims / evidence**: no unsupported product claim; each "verified" has a SHA/tree, command and environment; local vs mock vs CI vs BACKUP vs production kept separate; limitations stated.
- [ ] **CI**: exact-head `pull_request` run is green (not an ancestor, not a manual dispatch unless noted); negative control exists where a check is new.
