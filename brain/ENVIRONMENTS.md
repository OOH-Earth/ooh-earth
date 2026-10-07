# ENVIRONMENTS — facts needed repeatedly

## Production
- URL: `https://oohearth.app`
- App id: `6a62213cff3ccbca88c04ff5`
- Build target env var: `VITE_BASE44_APP_ID=6a62213cff3ccbca88c04ff5`

## BACKUP
- URL: `https://ooh-earth-backup.base44.app`
- App id: `6a6748e009b947cb29591871`
- Build target env var: `VITE_BASE44_APP_ID=6a6748e009b947cb29591871`

## Git
- Repo: `OOH-Earth/ooh-earth` (GitHub), remote `origin`.
- Merge style: **squash-merge exclusively** — `git branch --merged` (ancestor
  check) cannot detect already-shipped branches here; cross-reference
  `gh pr list --state merged/closed` by branch name instead.
- Working directory (`/home/hiker123/oohearth`) sits on `feat/weather-context-v1`
  — a **dirty, user-owned branch, read-only, never touched**. Real work
  happens in fresh worktrees off `origin/main`.

## CLI
- Base44 CLI pinned at `0.1.14` — do not casually upgrade.
- Auth token: `~/.base44/auth/auth.json` (`accessToken` field) — read-only
  use for the authoritative schema API; never log or write it elsewhere.

## Authoritative schema endpoint
`GET https://app.base44.com/api/apps/{app_id}/entity-schemas`
(Bearer token from the CLI's own stored auth file.)

## Known build/deploy commands (all require explicit human authorization for
production; BACKUP is qualification-only, not itself a production write)
```
# Build for a specific target (always set explicitly, never rely on fallback)
VITE_BASE44_APP_ID=<app id> npm run build

# Frontend deploy
npx base44@0.1.14 site deploy --no-build --yes --app-id <app id>

# Function deploy (single function, name matches base44/functions/<name>/)
npx base44@0.1.14 functions deploy <name> --app-id <app id>

# Function pull (read-only, one name at a time, into a linked project dir)
npx base44@0.1.14 functions pull <name> --app-id <app id>

# Function list (read-only, no project link needed beyond --app-id)
npx base44@0.1.14 functions list --app-id <app id>

# Entity push (pushes the WHOLE entities/ folder — build from a fresh diff)
npx base44@0.1.14 entities push
```

## Browser QA
Local Chromium already installed by this repo's own Playwright/e2e setup:
`~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`
```
chrome --headless=new --remote-debugging-port=9223 \
  --remote-debugging-address=127.0.0.1 --no-sandbox --disable-gpu \
  --user-data-dir=<scratch dir>
```
Then chrome-devtools MCP connects automatically via its `--browserUrl` mode.

No secrets, tokens, or API keys are recorded in this file or in `brain/`
generally — see the live auth file paths above instead.
