# Engineering Workflow: Base44 ↔ GitHub

How product work in Base44 and engineering work in GitHub fit together without fighting each other. See `ENGINEERING.md` for the technical stack and `GITHUB_ENGINEERING_PIPELINE.md` for the full CI/CD architecture — this doc is the short, people-facing version of the division of labor.

## The split

**Dave — Base44, product, UX, content, fundraising.**
Rapid prototyping, product ideas, UX/copy experiments, new feature concepts, fundraising and partner-facing work. Base44 stays the fast, low-friction space for trying things — nothing about this workflow slows that down or asks Dave to file a PR for every idea.

**Engineering (GitHub) — reviewed production code, tests, security, CI/CD, releases.**
GitHub is where a change becomes accountable: reviewed, tested, security-scanned, and versioned before it's treated as production-grade. This owner is responsible for CI health, dependency hygiene, CodeQL findings, release cadence, and keeping `main` in a state that's always safe to be live.

Base44 remains the **runtime source of truth** — the app actually runs from Base44, and GitHub is a two-way mirror, not a competing deployment target (`CLAUDE.md` rule #1, unchanged by any of this). This workflow doesn't relitigate that; it just makes explicit which side of the mirror has the review gate.

## The loop

```
Dave prototypes in Base44
        │
        ▼
Something needs to become production-grade
(a real fix, a launch-critical feature, anything with real blast radius)
        │
        ▼
It moves into this repo as a branch (feat/…, fix/…, chore/…, docs/…)
        │
        ▼
Pipeline validates it: lint, typecheck, build, Playwright, accessibility,
dependency/security scans — no live backend or secret required for any of it
        │
        ▼
Dave (or whoever's reviewing) reads the PR's CI summary comment, approves
        │
        ▼
Squash-merge to main
        │
        ▼
main reflects the change — release-please tracks it toward the next
versioned release (RELEASE_PROCESS.md)
        │
        ▼
Syncing the merged change back into the live Base44 app depends on Base44's
own two-way mirror mechanics, which aren't visible from inside this repo —
confirm the actual sync behavior with Base44's docs/support rather than
assuming a direction here
```

This is a **gate on the production-engineering side of the loop**, not a replacement for Base44 prototyping. Nothing here asks Dave to stop using Base44, learn Git internals, or route every idea through a PR before trying it.

## When something moves from Base44 into GitHub

Not every Base44 experiment needs to land here — only things with real blast radius: anything touching money (Stripe, donations, the on-chain treasury), user data, auth, or anything meant to actually ship and stay shipped. The trigger is "this needs to be trusted," not "this exists."

When it does move:

1. Open a branch off `main`, named for what it does (`fix/…`, `feat/…`).
2. Bring the Base44 change over as real code — reviewed the same way any other change is, not pasted in wholesale and assumed correct.
3. Let the pipeline run (`CI_PIPELINE.md` has the full job list — lint, typecheck, build, Playwright smoke + accessibility, dependency audit, dependency review, CodeQL).
4. PR review and squash-merge, same as any other change (`BRANCHING_STRATEGY.md`, `CONTRIBUTING.md`).
5. Engineering (not Base44) is now the record of what that change actually is — if it needs to change again, the next change goes through the same loop, not a fresh Base44 edit that silently diverges from what GitHub has reviewed.

## Why this avoids fighting Base44

The two systems aren't in competition for the same job. Base44 is optimized for speed and iteration; GitHub is optimized for review, testing, and auditability. Treating Base44 output as a **draft** that becomes authoritative only after it passes through GitHub's gate — rather than treating GitHub as a second copy of Base44 that needs to be kept in sync by hand — is what keeps this sustainable as the team grows past one person.

## Who owns what, concretely

| Area | Owner |
|---|---|
| Base44 experimentation, product direction, UX, copy, fundraising | Dave |
| `.github/` workflows, CI/CD health, branch protection, CODEOWNERS | Engineering |
| Test coverage (Playwright, accessibility), typecheck/lint gates | Engineering |
| Dependency hygiene (Dependabot, `npm audit`, CodeQL findings) | Engineering |
| Release cadence (`release-please`, `CHANGELOG.md`) | Engineering |
| What actually runs in production (Base44 runtime) | Base44 / Dave, per `CLAUDE.md` |
| What's reviewed and trusted as "this is what the code does" | GitHub / Engineering |
