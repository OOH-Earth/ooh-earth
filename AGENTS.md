# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Ground Rules

Cited elsewhere in this repo's docs as "CLAUDE.md rule #N" (`CI_PIPELINE.md`, `BRANCHING_STRATEGY.md`, `ENGINEERING.md`) — written down here since `CLAUDE.md` itself just points to this file. Numbering matches those existing citations.

1. **Base44 is the runtime source of truth.** GitHub is a two-way mirror of production-grade engineering work, not a competing deploy target — `main` should always reflect what's safe to be live, not where the app actually runs from.
2. **Secrets live in the environment only.** Access them with `Deno.env.get("SECRET_NAME")` in backend functions — never hardcoded, never committed. See `SECURITY.md` if you find one that's leaked.
3. **No direct commits, pushes, or PRs against `main` without explicit instruction in that session** — human or agent, no exceptions. Every change goes through a PR (`BRANCHING_STRATEGY.md`).
4. **CI workflows never require or use repository secrets or live backend credentials.** See `CI_PIPELINE.md` for what that means in practice (offline-artifact console noise is expected and not treated as a failure).

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.
