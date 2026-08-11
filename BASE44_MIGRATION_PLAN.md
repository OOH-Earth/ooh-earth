# OOH Earth — Base44 → GitHub-Native Engineering Migration Plan

**Status:** Proposal. Nothing in this document has been implemented. No branches have been merged, no infrastructure has been changed, no code in this plan has been written.

**Audit method:** every number below came from grepping the actual repository on `fix/phase1-runtime` and reading the actual unmerged engineering docs on `engineering/baseline` / `feature/engineering-pipeline`. Nothing is estimated.

---

## The one decision that changes everything else

This plan has two independent tracks, and they should not be confused with each other:

- **Track A — Engineering *workflow* migration.** How code moves from idea to production: branches, CI, code review, testing, releases. Base44 stays exactly what it is today — the runtime source of truth. This is low-risk, mostly already built, and can start immediately.
- **Track B — Platform *runtime* migration.** Actually moving auth, the database, realtime, serverless functions, and hosting off Base44 onto GitHub-native infrastructure (Vercel/Cloudflare/a real Postgres/etc.). This is a multi-month undertaking with real cost and real risk to a live app holding donor funds, and it should only happen for a real business reason — not because "GitHub-native" sounds more serious than "Base44."

Track A is worth doing regardless of what happens with Track B. Track B is optional and this document does not recommend starting it without a founder-level reason (cost, vendor lock-in, a scaling ceiling, or losing confidence in Base44 as a platform) — none of which are visible from the repository itself.

---

## Part 1 — What actually depends on Base44 today (the audit)

| Surface | Count | Detail |
|---|---|---|
| Entities (database schemas) | **12** | `AccessLog, BlogPost, DigitalBust, FundingLead, IntelCache, LeadClaim, Location, Mint, Operative, QuestCompletion, StoreItem, User` |
| Serverless functions | **14** | `base44/functions/*/entry.ts` — 5 of these call real third-party APIs (see below), the rest are pure Base44 CRUD/auth logic |
| Frontend files importing the Base44 client | **68** | Everything routes through `src/api/base44Client.js` |
| Files using `base44.auth.*` | **14** | Login, register, OTP, OAuth, logout, token management |
| Files using `base44.entities.*` (CRUD) | **33** | list/create/get/filter/update |
| Files using realtime `.subscribe()` | **11**, across **6 entities** | `DigitalBust, FundingLead, LeadClaim, Location, Operative, StoreItem` |
| Files using `Core.UploadFile` / `Core.InvokeLLM` | **15** | File storage and LLM calls proxied through Base44 |
| Files calling custom functions (`base44.functions.invoke`) | **20** | Calls into the 14 functions above |

### The 5 functions with real external dependencies (not Base44-specific)

| Function | External service |
|---|---|
| `createDonationCheckout`, `createProductCheckout`, `stripeWebhook` | Stripe |
| `cryptoWatch` | Solana RPC, Blockchair (Ethereum), Polygon RPC, CoinGecko |
| `n8nPing` | n8n webhook |

These three integrations aren't Base44 dependencies at all — they'd need to be ported to wherever functions run, but the Stripe/crypto/n8n logic itself is portable as-is.

### Auth is the most deeply coupled piece

`src/lib/AuthContext.jsx` doesn't just call `base44.auth.me()` — it hand-builds a raw `axios` client (`createAxiosClient`, imported directly from `@base44/sdk`, bypassing the app's own `base44Client.js` wrapper) to hit a Base44-specific endpoint (`/api/apps/public/prod/public-settings/by-id/{appId}`) that determines whether the whole app requires login before any user-level check runs. This is Base44's own app-gating model, not a generic auth pattern — it has no equivalent in a typical auth provider and would need to be redesigned, not ported.

### The build itself is Base44-aware, not just the runtime

`vite.config.js` registers `@base44/vite-plugin` with `legacySDKImports`, `hmrNotifier`, `navigationNotifier`, `analyticsTracker`, and **`visualEditAgent`** — that last option is the bridge that makes Base44's visual editor work against this codebase at all. Moving off Base44 entirely means giving up the visual editor, not just the backend. That's a real workflow change for anyone who currently edits the app that way, separate from the engineering question.

### There is already one real leverage point

`src/api/base44Client.js` is a single choke point — all 68 consuming files import `base44` from there, not from `@base44/sdk` directly. It's not a real adapter today (it's a decorated SDK instance, not an interface with swappable implementations), and `AuthContext.jsx` bypasses it for the public-settings check. But it's the one place a future migration would start, and hardening it into a real interface is useful even if a full migration never happens — it's just better architecture.

---

## Part 2 — Track A: adopt the GitHub-native engineering workflow

**Most of this is already built.** Two branches — `engineering/baseline` and `feature/engineering-pipeline` — were prepared from the same fork point as this stabilization work and cover almost everything a "GitHub-native workflow" needs. This plan does not re-derive them; it recommends adopting them and explains what's missing.

### What already exists, unmerged

| Piece | Where | What it does |
|---|---|---|
| CI pipeline | `feature/engineering-pipeline`: `.github/workflows/ci.yml` | lint+typecheck / build / Playwright (e2e + a11y) blocking; Prettier + `npm audit` informational; one aggregated PR comment |
| Static analysis | `.github/workflows/codeql.yml` | Weekly + on every push/PR, covers both the Vite frontend and the Deno functions |
| Dependency updates | `.github/dependabot.yml` | Weekly npm + Actions PRs (known gap: no equivalent to this repo's `.npmrc` `min-release-age` supply-chain cooldown — documented, not solved) |
| Semantic releases | `.github/workflows/release-please.yml` + config | Conventional-Commits-driven semver, auto-generated CHANGELOG.md, GitHub Releases |
| Branch strategy | `BRANCHING_STRATEGY.md` | Trunk-based, `main` always deployable, short-lived `feat/`/`fix/`/`chore/`/`docs/` branches, squash merge, no direct commits to `main` |
| Testing | `e2e/smoke.spec.ts`, `e2e/a11y.spec.ts`, `e2e/a11y-baseline.json` | Playwright smoke test + an axe-core accessibility **regression gate** (fails only on new/worse violations, not on the 2 pre-existing ones) |
| Contributor guide | `CONTRIBUTING.md` | The "BACKUP-first" rule (nothing risky touches production until proven on the sandbox), build-verify-before-PR checklist, PR conventions |
| Security policy | `SECURITY.md` | Private disclosure process, secrets handling, treasury contact |
| Process docs | `CI_PIPELINE.md`, `RELEASE_PROCESS.md`, `ENGINEERING.md` | Full reasoning for every gate, including a Decision Register of what's deliberately not blocking yet and why |

### What's genuinely missing (not covered by the existing branches)

1. **Branch protection settings on GitHub itself.** Documented in `BRANCHING_STRATEGY.md` with exact settings to enable, but never applied — that needs a human with GitHub admin access in the Settings UI, not something any agent session has had.
2. **`CODEOWNERS` has placeholder content**, not real usernames — needs at least one more regular contributor before it enforces anything.
3. **A real reconciliation between three overlapping branches.** This is the part that actually blocks adoption — see below.

### The real blocker: three branches, one fork point, overlapping fixes

`engineering/baseline`, `feature/engineering-pipeline`, and this session's `fix/phase1-runtime` all diverge from the same commit. They are **not** cleanly stackable:

- `engineering/baseline` and `fix/phase1-runtime` **both independently fixed the same bugs** in some cases (e.g., the missing `@types/leaflet`/`@types/three` causing 724+ phantom typecheck errors; the `Support.jsx` Donorbox `allowpaymentrequest` attribute) — convergent, reassuring, but means a naive three-way merge will conflict on those exact lines.
- `fix/phase1-runtime` also independently found and **fixed** the `Globe3D.jsx` `setFog()` → `setSky()` bug that `engineering/baseline` found and **explicitly left unfixed** as a founder decision. Merging both branches as-is will conflict on that file, and whoever resolves it needs to know `fix/phase1-runtime`'s version is the more complete fix.
- `fix/phase1-runtime` has substantial work `engineering/baseline`/`feature/engineering-pipeline` don't: the Command Center CTA fix, sitemap.xml, structured data, code-splitting, iframe sandboxing, the `LiveActivityFeed` fabrication removal, and CI lint/typecheck gates on `build.yml` (which `feature/engineering-pipeline`'s `ci.yml` is designed to supersede, not run alongside).

**Recommended merge order for Track A:**

1. `engineering/baseline` first — it's the narrowest (typecheck/lint debt only, no feature changes) and everything else assumes a clean baseline.
2. `fix/phase1-runtime` second, with its overlapping files (`Globe3D.jsx`, `Support.jsx`, any shared shadcn typing) reconciled by hand against what `engineering/baseline` already did — not re-applied blindly.
3. `feature/engineering-pipeline` third, with its `ci.yml` replacing `build.yml` (which `fix/phase1-runtime` extended with lint+typecheck — `ci.yml` already does that and more, so this is a clean supersession, not a conflict) and its `e2e/a11y-baseline.json` updated to reflect that `fix/phase1-runtime` already fixed the `aria-hidden-focus` violation it recorded as pre-existing debt.
4. Apply branch protection settings by hand once all three are in and `main` is green.

No agent session should attempt this three-way reconciliation unsupervised — it touches the same files three different ways and deserves a human reviewing the actual diffs, not just the summaries above.

### Timeline

Once merge order is agreed and someone with GitHub admin access is available: **1–2 weeks**, almost entirely review time, not engineering time. Nothing here requires new infrastructure, new spend, or touching the live app.

---

## Part 3 — Track B: gradual platform migration off Base44 (optional)

This section is a shape, not a commitment. It exists because it was asked for, not because the audit in Part 1 surfaces a reason to do it. If pursued, every stage below runs in parallel with the live Base44 app — nothing cuts over until it's proven, the same "BACKUP-first" discipline `CONTRIBUTING.md` already establishes for ordinary fixes, just applied at platform scale.

| Stage | What | Why this order |
|---|---|---|
| **0. Decide why** | Founder articulates the actual driver — cost, vendor lock-in, a scaling ceiling, loss of confidence in the platform, or a specific missing capability. | Everything after this is wasted effort without a real reason, and the reason determines which stages matter most. |
| **1. Harden the adapter** | Turn `base44Client.js` into a real interface (`auth`, `data`, `realtime`, `functions`, `storage` as defined contracts) that all 68 consuming files call through, with `AuthContext.jsx`'s direct-SDK bypass closed. | Worth doing regardless of whether Track B continues — it's the only way any later stage can swap an implementation without touching 68 files again. |
| **2. Parallel auth** | Stand up a replacement auth provider behind the same interface, feature-flagged, proven on BACKUP with test accounts before any production user sees it. | Auth is the most Base44-specific surface (the custom public-settings gate has no off-the-shelf equivalent) — start with the hardest, most isolated piece while there's no time pressure. |
| **3. Parallel data layer** | Mirror the 12 entity schemas into a real database (e.g. Postgres), dual-write during a transition window, cut reads over entity by entity, starting with the ones with no realtime listeners. | Entities without `.subscribe()` (6 of 12) are strictly simpler to migrate first — proves the pattern before tackling realtime. |
| **4. Realtime** | Replace Base44's `.subscribe()` on the 6 realtime entities with a WebSocket-based equivalent. | Usually the hardest piece to replace cleanly — deliberately staged after the data layer is already proven, not first. |
| **5. Functions** | Port the 14 Deno functions to a GitHub-native runtime (Vercel Functions, Cloudflare Workers, etc.), keeping the Stripe/crypto-RPC/n8n integration logic unchanged since none of it is Base44-specific. | Independent of auth/data — can happen in parallel with stages 2–4. |
| **6. Storage & LLM** | Replace `Core.UploadFile`/`Core.InvokeLLM` with direct object storage (S3/R2) and a direct LLM API call. | Same reasoning as functions — independent, can run in parallel. |
| **7. Cutover** | Flip the adapter's implementation flag, monitor, keep Base44 read-only as a rollback path for a defined window, then decommission. | Only after every earlier stage has been proven on real (if limited) production traffic, not just BACKUP. |

**What this costs beyond engineering time:** hosting for a real database and function runtime (currently bundled into Base44), and — explicitly — the Base44 visual editor stops working, since `visualEditAgent` in `vite.config.js` is the bridge that makes it work at all. Anyone who edits the app that way today would need to move fully to code and pull requests. That's a real workflow change for the team, not just a technical one, and belongs in the "why" conversation in Stage 0.

**Timeline, if pursued:** months, not weeks — this is a genuine platform migration for a live app with real donor funds and real user data, not a refactor.

---

## Part 4 — Non-disruption principle

Track A ships without touching the live app at all — it's entirely GitHub-side tooling. Track B, if it happens, is designed so the live app keeps running on Base44, unchanged, through every stage until an explicit, monitored cutover. Ongoing feature work on Base44 (or via Claude Code on GitHub) isn't blocked by either track — they run alongside normal development, not instead of it.

---

## Founder decisions this plan surfaces

1. **Merge order for the three unmerged branches** — recommended order above, but someone needs to actually review the reconciled diffs on `Globe3D.jsx` and `Support.jsx`, not just accept the recommendation.
2. **GitHub admin access** — needed to apply branch protection; no session so far has had it.
3. **Whether Track B happens at all**, and if so, why — Stage 0 above. Nothing in this audit finds a technical reason it's urgent.
4. **If Track B proceeds: budget and timeline** for real infrastructure (database, function hosting) that Base44 currently provides bundled, and a decision on what replaces the visual-editing workflow for non-engineering contributors.
