# OOH Earth architecture and incremental engineering plan

Status: verified snapshot

Verified: 2026-10-11 against `origin/main` at `e1b979d`, repository source, package scripts, CI/release files, and the read-only Lynxie harness source. PR #356 was rechecked separately against GitHub; it is still open at live head `90466b8`, not the historical candidate `17c22ac`.

This document describes the current system and proposes small follow-up slices. It is guidance, not authorization for a refactor, dependency migration, backend/schema/RLS change, merge, deployment, or release-certification change. The active first-user release remains the priority.

## 1. Current architecture map

### Runtime and ownership

The application is a single React 18/Vite SPA. `src/main.jsx` mounts `src/App.jsx`; `src/App.jsx` owns the router, global providers, lazy page loading, authentication gates, the suspense fallback, and the application-wide error boundary.

| Boundary | Current owner | Responsibility |
| --- | --- | --- |
| Browser entry | `src/main.jsx`, `index.html` | Mount the SPA into `#root`; `index.html` is the true static entry. |
| App shell | `src/App.jsx` | BrowserRouter, route declarations, provider composition, lazy loading, auth boot state, and not-found handling. |
| Authentication | `src/lib/AuthContext.jsx`, `src/components/ProtectedRoute.jsx`, `src/components/InvestorRoute.jsx` | Base44 auth bootstrap, login redirects, registered-user handling, and protected route boundaries. |
| Base44 client | `src/api/base44Client.js`, `src/lib/app-params.js` | SDK construction plus shared Location pagination, viewport queries, in-flight deduplication, and bounded read retry. |
| Environment identity | `src/lib/appEnv.js`, `src/components/ooh/StageBanner.jsx` | Build-baked stage/live classification and the visible BACKUP warning. |
| UI pages | `src/pages/` | Route-level screens. Naming is PascalCase, normally one default component per file. |
| Feature components | `src/components/ooh/<feature>/` and `src/components/ooh/` | Reusable feature UI, interaction, and some direct data calls. Feature subfolders exist for map, report, gallery, lab, campaign, environment, portals, and support. |
| Shared primitives | `src/components/ui/` | Radix/shadcn-style JSX primitives. Do not turn this into a new design system during first-user qualification. |
| Hooks | `src/hooks/` | React lifecycle/state adapters such as auth-gated subscriptions, locations, offline sync, persistent state, and device behavior. Hook names use `useX`. |
| Business rules/adapters | `src/lib/` | Testable pure rules, normalization, caching, retry/deduplication, environment resolution, evidence, release truth, and provider adapters. Tests sit beside modules as `*.test.js`, `*.test.mjs`, or `*.test.ts`. |
| Base44 resources | `base44/entities/*.jsonc`, `base44/functions/<name>/entry.ts` | Entity schemas and Deno function entrypoints. Function handlers and shared helpers are colocated with the function. No schema or RLS change is proposed here. |
| Release controls | `scripts/`, `.github/workflows/`, `docs/harness/`, `RELEASE_*.md` | Build identity, evidence, CI, BACKUP/production gates, rollback state, and qualification records. |

The repository currently contains 91 page files, 348 component files, 18 hooks, 88 library files, 24 entity schemas, 41 function directories, and 137 E2E/support files. These counts are inventory evidence, not a reason to reorganize by themselves.

### Routes and user journeys

The route registry is explicit in `src/App.jsx`; there is no separate route manifest or filesystem discovery. All page imports are lazy except shell components and selected guards. The main journeys are:

1. Public discovery: `/` → `/map` → `/location/:id`, with supporting `/about`, `/guides`, `/categories`, `/regions`, `/blog`, and public portals.
2. First contribution: `/report` → location/geolocation or manual pin → photo upload/identification → submit or local queue → review-status messaging. The active PR #356 improves truthfulness and findability in this path; requalify from its current head before any follow-up.
3. Account and recovery: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/oauth/consent` → protected `/dashboard` and `/account`.
4. Field and creative tools: `/field-id`, `/field-route`, `/scan`, `/trash`, `/ar`, `/lab/*`, and device/camera surfaces.
5. Operations/admin/investor: protected `/mission-control`, `/portal/ops`, `/agency/*`, admin routes, and `InvestorRoute`-guarded `/investor`, `/console`, and investor/client portals.

Route-level code splitting is already present through `lazy()`/`Suspense`. A future route registry change must preserve direct discovery in `App.jsx`, route guards, SEO behavior, and the lazy fallback.

### Data flow and state ownership

- Local UI state: component `useState`/`useReducer`; modal visibility, step selection, transient form state, and interaction state belong to the component or feature hook.
- URL state: React Router path/params and auth return handling; use `src/lib/authReturnTo.js` for validated return paths rather than copying query handling.
- Server state: `@tanstack/react-query` is available through `src/lib/query-client.js`, but usage is mixed with direct SDK calls. Default query retry is `1`; mutation retries must remain explicit and safe.
- Persistent client state: `localStorage` is used for preferences/cache and `sessionStorage` for short-lived field/investor state. `src/lib/offlineQueue.js` owns the IndexedDB queue used by `useOfflineSync`.
- Server data: Base44 entities and functions. Realtime Location updates are gated by `useAuthGatedSubscribe`; ordinary reads and writes are spread across pages/components.
- Release state: `release-manifest.json`/generated `dist/release-manifest.json` and `scripts/release-state.mjs` own candidate/verification transitions. They are evidence records, not runtime truth by themselves.

Do not introduce a global store. First prefer local state, then an existing hook, then React Query for server reads, and only then a narrowly named adapter when at least two real consumers need the same behavior.

### Base44 boundaries

`src/api/base44Client.js` is the shared SDK client and currently contains the strongest cross-cutting read protections: Location pagination, a bounded retry policy from `src/lib/withRetry.js`, and in-flight deduplication from `src/lib/dedupeInFlight.js`. The SDK methods in use are `auth`, `entities`, `functions.invoke`, and `integrations.Core.UploadFile`/`InvokeLLM`.

The frontend has 108 modules that import or use the shared Base44 client, and 106 modules with direct Base44 calls. That is a verified coupling map, not a mandate to wrap every call. New code should prefer a focused adapter when it crosses a meaningful provider boundary, such as report submission, upload, map reads, or a function with a stable application-facing result. Keep provider payloads inside the adapter and return explicit application data plus typed failure states.

Backend functions use Deno and read secrets with `Deno.env.get()`. Entity schemas live in `base44/entities`; function handlers are usually split into `entry.ts` and `handler.ts`. Functions should validate input, enforce auth/RLS expectations, bound external requests, return safe errors, and make mutation idempotency explicit where retries are possible.

## 2. Naming and folder conventions

- React components/pages: PascalCase filenames and component names (`Report.jsx`, `ProtectedRoute.jsx`).
- Hooks: `useX.js`/`useX.jsx`; hook-specific pure helpers may live beside the hook or in `src/lib` when they have non-React consumers.
- Pure business rules/adapters: descriptive lower camel case (`locationQuality.js`, `mapViewportQueries.js`, `productionTruth.js`).
- Tests: colocated `*.test.js`/`*.test.mjs`/`*.test.ts`; E2E tests live in `e2e/` and use `.spec.ts`.
- Base44 functions: lower camel case directory names with `entry.ts`; shared backend code belongs in `base44/functions/_shared/` only when it has multiple function consumers.
- Schemas: existing PascalCase entity filenames are preserved. Do not rename entities casually because names are runtime resources.
- Feature-local organization is preferred for new report/map/gallery behavior under existing feature folders. Shared code must have multiple real consumers and a stable contract.

Proposed target shape for future additions, without moving existing files merely for appearance:

```text
src/
  features/<feature>/   # only for a new or actively touched cohesive feature
    components/
    hooks/
    <feature>.js        # pure rules/normalizers
    <feature>.test.js
  api/                  # provider clients and focused adapters
  components/ui/        # existing shared primitives
  hooks/                # existing cross-feature hooks
  lib/                  # existing cross-feature pure rules and contexts
  pages/                # existing route screens
```

Any move must name its import impact, route-discovery impact, test/tooling impact, and Base44 convention impact before it is approved.

## 3. Ranked findings

### P0 — Preserve and requalify the first-user release

PR #356 is open at live head `90466b8`; the historical candidate `17c22ac` is not the current candidate. GitHub showed lint/typecheck, Prettier, build, dependency checks, CodeQL, dependency review, and desktop/mobile Playwright passing at the final recheck. This is release evidence, not a substitute for checking the final run again before merge. Do not stack architecture changes into that qualification.

### P1 — Read failures are collapsed into empty/seed data

Verified in `src/hooks/useLocations.js` and the contract comments in `src/api/base44Client.js`: an unreachable/failed Location read becomes the static seed or an empty result, and several page-level calls use `.catch(() => [])`. This protects rendering but can tell a contributor that the map has no live data when the service is unavailable. It directly affects the useful-contribution journey and operational diagnosis.

Proposed treatment: add an explicit `{status: 'loading'|'ready'|'empty'|'unavailable'}` result at the first shared read boundary, then update only the map/report surfaces first. Preserve seed fallback as an intentional offline/empty presentation, but label it and provide recovery. Do not change retry policy in the same slice.

### P1 — Provider calls are distributed through UI components

Verified by the 108-module import/call inventory. Upload, entity writes, function invocations, geolocation, and persistence are often orchestrated directly in components. This increases the chance of inconsistent validation, error text, cancellation, and state transitions in the report path. It is a maintenance risk, not proof that all direct calls are wrong.

Proposed treatment: extract only the first-user report submission/upload boundary into a focused adapter/hook after #356. Leave unrelated lab/admin/investor surfaces alone.

### P2 — Route ownership is centralized but broad

Verified in `src/App.jsx`: public, protected, lab-gated, investor-gated, auth, admin, and creative routes are all declared in one file with manual lazy imports. This is easy to discover today but makes route edits collision-prone and encourages route metadata drift. It is not an immediate user blocker.

Proposed treatment: document route ownership and add a small route metadata/test helper only when a real route bug requires it. Do not split the registry as a cosmetic refactor.

### P2 — Environment identity has a safe release gate but an unsafe unknown-id posture

Verified in `src/lib/app-params.js` and `src/lib/appEnv.js`: production is the fallback app id, stage is build-selected, and unknown ids default to live posture. The release scripts separately keep the app id and `dist/index.html` artifact gate explicit. This is deliberate fail-open UI posture for unknown hosts, but it can conceal a misconfigured build from operators.

Proposed treatment: a later configuration-validation slice may fail CI for unknown app IDs while preserving the public production fallback and the existing `dist/index.html` gate. Do not blindly replace embedded IDs: they are runtime target identifiers, while other occurrences are documentation/static references.

### P3 — Mixed server-state conventions

Verified: React Query exists with a shared client, but many reads are direct SDK calls and many query failures are locally collapsed. This is a consistency opportunity, not authorization for a query-framework migration. Writes must not inherit automatic retries.

### P3 — Error handling is intentionally noisy in some places and silent in others

Verified by the number of `catch {}`/`.catch(() => [])` sites and by the bounded offline-sync implementation. Some silent catches are appropriate for optional telemetry/cache cleanup; others cross user-visible boundaries. Future work should classify catches by boundary instead of doing a repository-wide rewrite.

## 4. Keep / refactor / remove / defer

| Decision | Current item | Evidence | Recommendation |
| --- | --- | --- | --- |
| Keep | `src/api/base44Client.js` Location pagination, dedupe, and selective retry | Shared client comments and `withRetry` tests describe observed session-readiness/fan-out failures. | Preserve; add status reporting around it later. |
| Keep | `src/lib/offlineQueue.js` + `src/hooks/useOfflineSync.js` bounded replay and manual retry for failed items | Queue state distinguishes pending/failed; automatic flush does not retry terminal failures. | Preserve retry/deduplication protections; add tests only when touching the report boundary. |
| Keep | `src/lib/app-params.js`, `src/lib/appEnv.js`, `StageBanner`, release manifest/gates | Build identity and BACKUP/production separation are explicit; `scripts/release.mjs` requires a matching manifest and `dist/index.html`. | Keep as release controls; document, do not replace. |
| Refactor later | Report upload/submit orchestration | `src/pages/Report.jsx` and `src/components/ooh/report/*` mix rendering, SDK uploads, geolocation, and submission state. | One focused adapter/hook slice after #356. |
| Refactor later | Map read result contract | `src/hooks/useLocations.js`, `src/pages/Map.jsx`, and direct Location reads collapse failure to seed/empty. | Introduce explicit unavailable/empty distinction in the map journey first. |
| Refactor only on need | Route declaration | `src/App.jsx` is broad but explicit and discoverable. | Do not move without a route bug or metadata requirement. |
| Remove only after proof | Any apparently unused page/component/function/entity | The app has manual routes, dynamic imports, Base44 runtime resources, and branch-specific work. | Require import, route, runtime caller, and resource checks; preserve uncertain candidates. |
| Defer | Global store, new API framework, schema/RLS changes, dependency migration, design-system rewrite | None is required to support 5–10 first users; current release controls prohibit broad scope. | Separate approval and separate PR. |

## 5. Reliability rules

At important boundaries, represent these states distinctly: loading, empty, permission denied, queued, failed, and confirmed saved. A fallback may preserve usability, but it must not claim success or live availability.

- Authentication: use `AuthContext`/route guards; surface registration/auth failures; clear rejected tokens through `clearAccessToken`; never bypass auth boundaries.
- Reads: bounded requests, cancellation where an adapter supports it, selective retry only for diagnosed transient cases, and no silent conversion of failure to authoritative empty data.
- Writes: no automatic query retries for provisioning, payment, uploads, or contributions unless the operation has a safe idempotency contract. Preserve existing offline queue and manual retry semantics.
- Uploads: validate file type/size before `UploadFile`, show upload failure separately from entity-save failure, and do not discard a local queued contribution without an explicit user-visible result.
- Geolocation: distinguish unsupported, denied, timeout, and unavailable; allow manual coordinates where the journey supports them; never imply location precision that was not obtained.
- Lazy loading/rendering: keep the `Suspense` fallback and `ErrorBoundary`; a future error UI should offer a safe retry or route recovery without leaking provider details.
- Secrets/privacy: browser `VITE_*` values are public build configuration. Backend secrets are Base44 environment secrets read with `Deno.env.get()`; never add them to source, docs, logs, fixtures, or client bundles. Do not send private coordinates or contribution data to research providers.

## 6. Environment and release controls

`base44/config.jsonc` uses `npm install`, `npm run build`, `npm run dev`, and `./dist` as the site contract. `npm run build` also prerenders metadata and writes `dist/release-manifest.json`. The frontend reads `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL`, and `VITE_BASE44_FUNCTIONS_VERSION`; production app ID is a public routing fallback, not a secret.

The two embedded app IDs have actual runtime use in `src/lib/app-params.js`, `src/lib/appEnv.js`, backend operational-state helpers, and release scripts: BACKUP `6a6748e009b947cb29591871`, production `6a62213cff3ccbca88c04ff5`. Other appearances in portal/status/docs are static display or evidence. Classification must precede any replacement.

Release proof remains: candidate SHA → CI → BACKUP deploy/verification → pre-production evidence → production approval/deploy/verification, with the release state machine in `scripts/release-state.mjs`. `scripts/release.mjs` refuses a mismatched manifest and checks `dist/index.html` before an executable deploy. Do not weaken or rewrite this gate as part of architecture work.

Rollback is evidence/state-driven: `ROLLBACK_REQUIRED` → `ROLLED_BACK`, with the previous known-good candidate retained in release evidence. A documentation PR must not alter release state, production data, authentication sessions, test identities, or deployed artifacts.

## 7. Testing and release gates

Verified commands from `package.json` include:

```text
npm run lint
npm run typecheck
npm run build
npm run format:check
npm run test:e2e
npm run test:a11y
npm run test:release
npm run test:release-utils
npm run test:release-evidence
npm run test:server-functions
```

CI is defined in `.github/workflows/ci.yml`, with lint/typecheck, format, build, desktop/mobile Playwright, dependency audit, and dependency review. CI intentionally has no live Base44 credentials; Base44 errors in offline artifacts must be distinguished from app crashes. BACKUP/pre-production evidence is separate from mocked CI and is recorded under `docs/harness/` and release evidence files.

For a later implementation slice, acceptance should include the narrow unit tests for the new rule, the affected E2E journey, `npm run typecheck`, `npm run lint`, `npm run build`, and the relevant release evidence check. Do not claim live or production verification from a mocked test.

## 8. Harness loading: verified behavior

The repository Markdown file is an instruction source only when the calling agent/harness reads it. This was checked against the local Lynxie source, not inferred from the existence of a file:

- `/home/hiker123/hermes-agent-oci/lynxie/brain/INDEX.md` states that the project root `AGENTS.md`, root `CLAUDE.md`, and the Lynxie Brain index are always loaded; topic files are routed by task.
- `/home/hiker123/hermes-agent-oci/lynxie/scripts/lynxie-brain-check.mjs` validates that a target repo contains root `AGENTS.md`/`CLAUDE.md` plus the Brain files; it does not itself load arbitrary repository instructions into every agent.
- `/home/hiker123/hermes-agent-oci/lynxie/config/knowledge-sources.json` declares an OOH Earth allowlist for selected documents, including `AGENTS.md`, and `/home/hiker123/hermes-agent-oci/lynxie/apps/control-api/src/oohEarthEvidenceAdapter.ts` enforces a smaller exact content allowlist and labels returned repository text `UNTRUSTED_REPOSITORY_CONTENT`.

Conclusion: adding this document and linking it from `AGENTS.md` improves discoverability for agents that read the repository instructions. It does not configure persistent memory, change the Lynxie harness, or prove that every automation path loads it. The exact integration change needed for a guarantee in Lynxie would be a separate, approved edit to `/home/hiker123/hermes-agent-oci/lynxie/apps/control-api/src/providerPromptBuilder.ts`: add a fixed-template instruction for the provider to read the target checkout's root `AGENTS.md` and, for relevant engineering work, `docs/engineering/ARCHITECTURE.md`, while keeping those files inside the owned checkout and treating arbitrary repository text as untrusted task data. The corresponding provider-prompt test would need to assert the instruction. No harness code change is made in this documentation-only PR.

## 9. Small implementation slices after the active release

### Slice 1 — truthful map read states (recommended first)

Scope: add a small, testable result contract around the existing Location read path; update `useLocations` and the primary `/map` surface to distinguish loading, live-ready, valid-empty, seed/offline, and unavailable; preserve current retry, dedupe, subscription, and seed behavior.

Risks: changing fallback rendering can expose pre-existing latency or fixture assumptions; realtime subscription behavior may be coupled to `live`.

Tests: unit tests for result classification; existing Location/map tests; one E2E assertion for unavailable versus valid-empty; desktop/mobile smoke for `/map` and `/report`.

Acceptance: a failed read is visibly recoverable and never reported as confirmed live data; a valid empty response remains distinguishable; no mutation retry or backend change; current map happy path remains green.

### Slice 2 — report boundary adapter

Scope: extract upload, geolocation result normalization, contribution payload validation, and final submit into one focused application-facing adapter/hook under the existing report feature. Keep components responsible for rendering and interaction.

Risks: accidental changes to anonymous submission, RLS-visible status, offline queue, or duplicate submission behavior.

Tests: adapter unit tests for denied/unsupported/timeout/upload/save failures; existing report E2E and privacy tests; explicit duplicate-submit guard test.

Acceptance: the report UI has separate queued, failed, and submitted-for-review states; provider payload shape is not spread across components; PR #356 behavior remains unchanged.

### Slice 3 — configuration validation at build time

Scope: validate the build-selected app ID against the known environment map in a CI/build-only check, while retaining the documented production fallback and preserving static/documentation IDs.

Risks: custom-domain/PWA builds that intentionally omit `VITE_BASE44_APP_ID`; accidental blocking of legitimate local development.

Tests: table-driven environment tests, build with stage/live/unknown inputs, and release-manifest/dist entry assertions.

Acceptance: an unknown deployment target fails before release certification; the runtime app ID remains provable from the actual `dist/index.html` path; no secret is introduced.

### Slice 4 — targeted server-state convergence

Scope: choose one high-value read family (map or dashboard), move its reads to the existing query client or a focused adapter, and define cache/account invalidation explicitly.

Risks: cached data crossing accounts/environments, accidental query retries on writes, and a large unrelated diff.

Tests: cache isolation, auth transition, stale/error/empty states, and affected E2E journey.

Acceptance: one bounded family has one documented owner; no global store or dependency migration; writes retain explicit non-retry behavior.

## 10. Future-change checklist

- Read `AGENTS.md`, this document, and the relevant release/engineering evidence before changing architecture.
- Recheck active PRs and current HEAD; never rely on a historical candidate SHA.
- Identify the user journey and the smallest owner boundary before moving code.
- State whether data is local UI, URL, server, persistent draft, queued, or release evidence.
- Preserve auth/RLS, privacy, bounded requests, dedupe, retry, and account/environment isolation.
- Keep loading, empty, denied, queued, failed, and confirmed-saved states distinct.
- Do not wrap mutations in automatic retries without idempotency evidence.
- Use focused adapters for meaningful provider boundaries; do not add generic service layers.
- Test the changed rule and journey, then run the applicable package checks.
- For release work, prove candidate SHA, CI, BACKUP, pre-production, production, and rollback evidence separately.
- Record uncertain dead-code candidates for review; do not delete pending work or historical evidence.
- Keep documentation claims labeled as verified, inferred, historical, or proposed.
