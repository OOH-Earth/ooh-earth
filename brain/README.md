# brain/ — operating protocol

`brain/` is the small, current, working-memory layer for this repo.
`docs/ops/ooh-earth/` is the detailed historical evidence archive — every
root-cause trace, every deploy gate, every decision rationale ever recorded.
`brain/` does not replace it; `brain/` is an index into it, kept small enough
to read every session without burning context on closed history.

## What to read, and when

**Every session, read these four first, nothing else:**

1. `brain/NOW.md` — current state of everything that changes
2. `brain/QUEUE.md` — what's next, in priority order
3. `brain/INVARIANTS.md` — hard rules that must never regress
4. `brain/HANDOFF.md` — exactly where the last session stopped and why

Read the rest of `brain/` (`ENVIRONMENTS.md`, `RELEASE.md`, `TEST.md`,
`DECISIONS.md`, `KNOWN-ISSUES.md`, `DAVE.md`) only when the task at hand
touches that topic.

**Read the full `docs/ops/ooh-earth/` archive only when:**

- a `brain/` file explicitly links to it for detail
- evidence in `brain/` looks disputed, stale, or internally inconsistent
- the task involves security/schema/function history that needs the full trace
- a rollback or past release's exact evidence is needed
- a new incident appears to contradict what `brain/` currently says

## The one rule that overrides all of this

**Live source and live systems always win.** `brain/` is a cache of the last
session's verified findings, not a live feed. If `git fetch`, a live
`entity-schemas` read, a live function pull, or a real browser check
contradicts what `brain/` says, trust the live evidence, fix `brain/` to
match, and note in `brain/HANDOFF.md` that a stale entry was corrected —
don't silently keep working from the stale value, and don't silently
overwrite the correction without saying so.

## Maintenance contract

Update `brain/NOW.md`, `brain/QUEUE.md`, and `brain/HANDOFF.md` after every
material task — not just at the end of a session. Update
`docs/ops/ooh-earth/` only when something durable/historical happened
(a root cause found, a deploy executed, a decision made) — not for routine
status changes, which belong in `brain/` alone.
