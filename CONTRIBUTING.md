# Contributing to OOH Earth

Thanks for helping reclaim public space. This is a live civic platform with real users and real donor funds behind it, so we work carefully. Read this before you open a PR.

## First principles

- **Copyleft is non-negotiable.** By contributing, you agree your code is released under AGPL-3.0 and your content/design under CC BY-SA 4.0. We can't accept contributions that aren't compatible with those licences.
- **Community first.** This platform exists to serve the movement, not to be sold, and not to extract from the people using it. Contributions that pull in the other direction won't land, however clever.
- **Honest pushback is welcome.** If something in the codebase or a decision conflicts with the ethos, say so in an issue.

## The BACKUP-first rule

There are two app environments: **production** (the live app real people use) and a **BACKUP/sandbox** environment for proving changes.

**Nothing risky touches production until it's proven on BACKUP first.** New functions, migrations, data-touching fixes, anything with blast radius — prove it on the sandbox, confirm it works, *then* promote. This applies to the deploy/connect process itself, not just to code.

If you're not sure whether something is "risky," treat it as risky.

## Working with the app safely

- **Confirm your target before any write.** A single mistyped app identifier has caused an accidental edit to production before. Always confirm which environment you're operating on before a write or edit, and preview complex edits (dry-run) before applying them.
- **Secrets live in the environment, never in code.** Access them with `Deno.env.get("SECRET_NAME")` in backend functions. Never hardcode keys, tokens, webhook URLs, or credentials. Never commit a `.env` file. If you spot a committed secret, see [SECURITY.md](./SECURITY.md).
- **Mind pagination.** `entity.list()` defaults can silently undercount large collections. When you need accurate totals or full sweeps, paginate explicitly with `(sort, pageSize, skip)` — don't trust the first page.

## Build-verify before every PR

```bash
npm run build > /tmp/b.log 2>&1; echo "BUILD EXIT: $?"; tail -3 /tmp/b.log
npm run lint
npm run typecheck
```

`BUILD EXIT: 0`, plus lint and typecheck clean, or it doesn't merge. CI enforces the same checks — see [CI_PIPELINE.md](./CI_PIPELINE.md) for the full pipeline (Playwright, accessibility, bundle size, dependency audit) and exactly which gates block a merge. Run these locally first — it's faster for everyone.

## Pull requests

1. Branch from `main` with a short, descriptive name (`fix/map-marker-drift`, `feat/objection-generator-copy`) — see [BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md).
2. Keep PRs focused — one concern per PR is easier to review and safer to revert.
3. Title the PR using [Conventional Commits](./RELEASE_PROCESS.md) (`feat: …`, `fix: …`, `chore: …`) — squash merges use the PR title as the commit message, and that's what drives automatic versioning and changelog generation.
4. Fill in the PR template. Say what changed, why, and how you tested it.
5. Confirm the build, lint, and typecheck all pass.
6. Note any production/data implications explicitly so a maintainer can sequence the deploy.

See [ENGINEERING.md](./ENGINEERING.md) for how the engineering system fits together end to end.

## Style & tone

Copy in the app has a voice: punchy, direct, anarchist-inflected — never corporate. The [campaign page](https://oohearth.app/campaign) is the reference. When you write user-facing text, match it.

## Conduct

Be decent. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). The short version: the movement is for everyone reclaiming public space, and there's no room here for harassment or for turning the work against the people it's meant to serve.

Questions: open an issue or reach us at hello@outofhell.org.
