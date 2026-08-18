# Base44 Architecture & Access

What's actually verifiable from this repository and from the live site, as of `main` @ `644110f`. Nothing below is guessed — each claim states its evidence. Where the honest answer is "unknown without Dave/Base44 access," it says so instead of assuming.

## What this repo actually is

A Vite + React 18 SPA (`vite.config.js`), built with `@base44/vite-plugin` (`^1.0.30`) and talking to the backend through `@base44/sdk` (`^0.8.41`) via `src/api/base44Client.js`. There is no server-side rendering, no prerender plugin, and no framework like Next/Remix — `npm run build` is a plain `vite build` (now followed by a small static-metadata step, see below). This is **verified by reading `vite.config.js` and `package.json` directly**, not inferred.

## Environment / auth model

`src/lib/app-params.js` resolves `appId`, `token`, `functionsVersion`, and `appBaseUrl` from URL query params (persisted to `localStorage` under `base44_*` keys) with `import.meta.env.VITE_BASE44_*` build-time fallbacks. `base44Client.js` creates the SDK client with `requiresAuth: false` at the client level — actual auth is handled per-request/per-entity by the Base44 backend, not gated in this file.

**In this sandbox, `VITE_BASE44_APP_BASE_URL` is unset** — there is no live backend connection here. Every verification claim in this repository's delivery/testing docs (e2e tests, regression counts) is against a **mocked** backend (`e2e/fixtures/mockBase44.ts`, network-layer REST mocking), not a live Base44 database. This has been true for the entire engineering pass that produced `delivery/dave-completion/`.

## Live production hosting — verified via direct HTTP request

`curl -I https://oohearth.app/` (run from this sandbox, which has outbound internet access) returns:

```
server: cloudflare
x-render-origin-server: uvicorn
rndr-id: ...
```

This means the live site is served from **Render.com** (`rndr-id` header) running a **Python/uvicorn** origin, behind **Cloudflare**. It is not a plain static-file host (no S3/Netlify/Vercel/GitHub Pages signature) — some server process is in front of the built assets.

**Important, unexpected finding:** the live production page's `<meta name="description">` and `<meta property="og:title">` content do **not** match this repository's current `index.html` or `main` branch. The live copy reads "A high-altitude, architectural platform curating and executing global public-space advertising experiences with precision and scale" — a different positioning from this repo's current "OOH Street Art & Adbusting Maps... reclaiming the visual commons" framing. This was discovered incidentally while verifying the metadata fix below, not assumed. **It means the live `oohearth.app` deployment is not currently running this repository's `main` branch (or at least not this version of `index.html`).** Why — a stale deploy, a different Base44 environment/app pointing at the same domain, a deploy pipeline that hasn't run recently — is not determinable from inside this repository. This needs Dave or whoever owns the Base44/Render dashboard to explain.

## What was fixed this pass (verified, not claimed)

**The problem:** every route's raw HTML (what a non-JS-executing social-preview bot sees — Facebook, Twitter/X, LinkedIn, Slack, Discord, iMessage) was identical, because the only per-route metadata system (`src/lib/seoContext.jsx`, applied via `useSeo()` in `App.jsx`) runs entirely in a `useEffect` — it only updates `document.head` after React hydrates. Confirmed empirically: `curl` against a built-and-served `dist/` returned the same `<title>` for `/`, `/map`, `/report`, and `/lab/nft` before this fix; a headless-browser check confirmed the client-side system itself was working correctly post-hydration the whole time.

**The fix:** `scripts/prerender-meta.mjs`, run automatically as part of `npm run build` (now `vite build && node scripts/prerender-meta.mjs`). It reads the built `dist/index.html` as a template and, for every static route in `src/lib/routeMeta.js`'s `META` table (57 routes), writes a `dist/<route>/index.html` with the real title/canonical/OG/Twitter tags already baked into the raw HTML — no JS execution required to see them. Also fixed a real title/description drift between the static `index.html` defaults and `routeMeta.js`'s `'/'` entry (two different taglines existed for the homepage; now one source of truth).

**What this does NOT cover:** dynamic entity routes (`/location/:id`, `/store/:id`, `/blog/:id`, `/bus-stop/:id`) — their metadata depends on live Base44 data that doesn't exist at build time in this repo (no backend connection here, and even with one, prerendering every location would need a full data export step). They still get correct metadata *after* hydration (a real browser or Googlebot sees it fine), just not in the raw HTML a social bot fetches.

**What is verified vs. unverified:**
- Verified (via `curl` and Playwright's non-JS `request` fixture against a locally built + served `dist/`): the generated files are byte-correct and are served correctly for the `/route/` (trailing slash) and `/route/index.html` forms.
- **Unverified:** whether the actual production host resolves the bare, no-trailing-slash form (`https://oohearth.app/map`, the form a shared link actually uses) to the generated file, or falls straight to the SPA catch-all. This project's own `vite preview` server does **not** resolve the bare form (confirmed by testing) — only `/map/` and `/map/index.html` work under it. Most real static hosts (Netlify, Vercel, Cloudflare Pages, S3+CloudFront with directory-index config, Nginx `try_files`) do resolve the bare form, either via redirect or internal rewrite — but this repo's live host is a Render/uvicorn origin, not one of those, and its exact static-serving behavior is unknown from here.

## Exact Dave access required to close this out

1. **Confirm which Base44/Render environment is actually live at `oohearth.app`**, and why its content differs from `main` — this is the single most important unknown surfaced this pass.
2. **Access to the Render service (or Base44's deploy config)** to check whether the uvicorn origin serves an exact-path static file ahead of its SPA fallback, or needs a small server-side rule added (a one-line addition in most frameworks: check the request path against the prerendered directory before falling back to `index.html`).
3. If the uvicorn origin is a **custom app** (not just a static-file server), a very small addition there — "does `dist/<path>/index.html` exist? Serve it. Otherwise serve `dist/index.html`" — would make the fix in this PR fully effective in production without any further engineering. This can't be written blind without seeing that server's source, which lives outside this repository.

## Staging / preview capability

No `netlify.toml`, `vercel.json`, or other deploy-preview config exists in this repository. There is no evidence of a staging environment distinct from the `oohearth.app` production domain. Whether Base44/Render offers a preview-per-PR or per-branch deployment is a platform capability question for Dave to confirm — **not invented here**.
