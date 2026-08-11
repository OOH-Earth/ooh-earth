<!-- Thanks for contributing to OOH Earth. Keep PRs focused — one concern each. -->

## What & why

<!-- What does this change, and why? Link any related issue (e.g. Closes #12). -->

## How I tested it

<!-- How do you know it works? -->

## Checklist

- [ ] Build passes: `npm run build` → `BUILD EXIT: 0`
- [ ] `npm run lint` and `npm run typecheck` pass (CI enforces both — see CI_PIPELINE.md)
- [ ] Proven on the **BACKUP/sandbox** environment first if it's risky or touches data
- [ ] No secrets, keys, tokens, or `.env` files committed
- [ ] User-facing copy matches the campaign-page voice (punchy, direct, not corporate)
- [ ] Commit messages follow [Conventional Commits](../RELEASE_PROCESS.md) (`feat:`, `fix:`, `chore:`, …)
- [ ] My contribution is released under AGPL-3.0 (code) / CC BY-SA 4.0 (content)

CI also runs Playwright smoke + accessibility tests, a Prettier check, a bundle-size report, and a dependency audit — see the PR summary comment for results. Prettier is informational; the dependency audit blocks only on high/critical findings (see CI_PIPELINE.md).

## Production / data impact

<!-- Anything a maintainer needs to know to sequence the deploy safely?
     Migrations, data changes, env vars, connected services touched, etc.
     Write "none" if there's no production impact. -->
