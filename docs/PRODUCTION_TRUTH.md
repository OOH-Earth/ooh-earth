# Production Truth

Read-only forensic audit of what this repository actually says about production, cross-checked against a live HTTP request to `oohearth.app`. Every claim below is evidence-scoped: KNOWN means directly observed (a file in this repo, or a live HTTP response), PROBABLE means a strong inference from KNOWN facts, UNKNOWN means genuinely not determinable from here.

## KNOWN

- **Build/output contract, straight from the repo's own deploy config** (`base44/config.jsonc`, committed):
  ```json
  { "site": { "installCommand": "npm install", "buildCommand": "npm run build", "serveCommand": "npm run dev", "outputDirectory": "./dist" } }
  ```
  If Base44's platform runs this file's `buildCommand` and serves `outputDirectory`, then PR #102's build-time metadata prerender (which writes into `dist/`) is inside the declared production output path.
- **No SSR/prerender framework.** `vite.config.js` uses only `@base44/vite-plugin` + `@vitejs/plugin-react`; `npm run build` was, until PR #102, a plain `vite build`. No Next/Remix/vite-plugin-ssg.
- **No deploy configuration exists in this repository for any specific host.** No `Dockerfile`, `docker-compose.yml`, `render.yaml`, `wrangler.toml`, `_headers`/`_redirects`, `netlify.toml`, or `vercel.json` anywhere in the tree.
- **No GitHub Actions deploy workflow exists.** `.github/workflows/` contains only `ci.yml`, `codeql.yml`, `release-please.yml` — no `deploy.yml` or equivalent. If `main` pushes trigger a production deploy, that trigger lives outside this repository (a Base44-side webhook/GitHub App, or a manual "publish" action), not in a committed workflow file.
- **Backend is bundled into Base44, per this repo's own migration-planning doc.** `BASE44_MIGRATION_PLAN.md`: "hosting for a real database and function runtime (currently bundled into Base44)." Auth, database, realtime, and the 14 Deno functions in `base44/functions/` all run "inside Base44," per `.env.example`'s own header comments — their secrets are "never here and never committed... real values live in Base44 Secrets."
- **`vite.config.js`'s `visualEditAgent` flag** is, per `BASE44_MIGRATION_PLAN.md`, "the bridge that makes [the Base44 visual editor] work at all" — confirming Base44 has its own in-platform editing/publish workflow distinct from a plain git-push pipeline.
- **Live HTTP response from `https://oohearth.app/`** (verified via direct `curl -I` from this sandbox, which has outbound internet access):
  ```
  server: cloudflare
  x-render-origin-server: uvicorn
  rndr-id: ...
  ```
  Cloudflare in front, a Render-hosted origin behind it, running a Python/uvicorn process (not a plain static-file server signature).
- **The live site's content does not match this repository's `main` branch.** Live `<meta name="description">`/`<meta property="og:title">` read "A high-altitude, architectural platform curating and executing global public-space advertising experiences with precision and scale" — this repo's current copy is "OOH Street Art & Adbusting Maps... reclaiming the visual commons." Different positioning entirely, not a copy-editing variance.
- **This sandbox has no live Base44 backend connection** (`VITE_BASE44_APP_BASE_URL` unset). Every test/verification claim in this repo's delivery docs is against a mocked backend, not live production.

## PROBABLE

- **Render is Base44's own infrastructure choice, not something Dave manages directly.** The `rndr-id`/`x-render-origin-server` headers, combined with "hosting... currently bundled into Base44," strongly suggest Base44-the-platform runs on Render under the hood, and a customer's actual control surface is Base44's dashboard/CLI/visual editor — not a separate Render account Dave logs into. This is an inference, not confirmed; Base44 could also be a thin proxy in front of a Render service Dave does control separately.
- **The uvicorn origin is not a plain static-file server** — it's serving a Python app. If that app has its own routing logic, it may or may not check for an exact-path static file (like the `dist/map/index.html` PR #102 now generates) before falling back to the SPA's `index.html`. Whether it does is unknown; if it doesn't, PR #102's fix produces correct build output but has no effect on what a crawler actually sees at `oohearth.app` until that origin's routing is confirmed or adjusted.
- **The live/main content mismatch is most likely one of:** (a) the live Base44 app hasn't been redeployed since before this repo's current `index.html` copy was written, (b) a separate Base44 "app" or environment is bound to the `oohearth.app` domain than the one this GitHub repo syncs to, or (c) Base44's deploy trigger requires a manual action that hasn't happened recently. All three are plausible from the evidence; none is confirmed.

## UNKNOWN — cannot be determined from this repository or an unauthenticated HTTP request

1. Whether pushing to `main` on GitHub actually triggers a Base44 deploy, and if so, how (webhook? polling? manual sync?).
2. Whether the uvicorn origin resolves `/map` (no trailing slash) to `dist/map/index.html`, or falls straight to the SPA catch-all — this is the single fact that determines whether PR #102 has any real-world effect.
3. Why the live site's content differs from `main` — genuinely requires someone with Base44 dashboard access to explain.
4. Whether a staging/preview environment exists at all.
5. What production environment variables are actually set (this repo only documents what each one is *for*, per `.env.example`'s own header — it explicitly does not and cannot contain real values).
6. Whether `oohearth.app`'s DNS points at Base44 directly or at a separate Cloudflare/Render setup Dave configured independently of Base44.

## Verification commands (already run, reproducible)

```bash
# Confirms no deploy config exists in-repo
find . -maxdepth 2 -iname "Dockerfile*" -o -iname "render.yaml" -o -iname "netlify.toml" -o -iname "vercel.json"

# Confirms live hosting fingerprint
curl -sI https://oohearth.app/

# Confirms live-vs-main content mismatch
curl -s https://oohearth.app/ | grep -oE '<meta[^>]*name="description"[^>]*>'
grep -A2 'name="description"' index.html
```

## Risks

- **Shipping more engineering on the assumption that `main` = production is unverified and could be wrong.** Everything built this pass (PR #102's metadata fix included) is proven correct *in this repository's own build output* — not proven live, because the live site may not even be running this code.
- **Continuing to build product features without closing this gap risks a growing, invisible drift** between what's tested/demoed from this repo and what real users/crawlers actually see at `oohearth.app`.
- **No rollback/staging visibility** means any future production-facing change (this one included) cannot be verified end-to-end without Base44/Render access — only build-output-level verification is possible from inside this repo today.
