# Technical Debt Register

_Branch: `engineering/baseline`. Scope: `npm install` / `npm run lint` / `npm run typecheck` / `npm run build` only — no feature or content changes. Every number below was produced by actually running the command, not estimated._

## Status

| Command | Before | After |
|---|---|---|
| `npm install` | ✅ clean | ✅ clean |
| `npm run lint` | ❌ 7 errors | ✅ 0 errors |
| `npm run typecheck` | ❌ 1,153 errors | ✅ **0 errors** |
| `npm run build` | ✅ clean (with a size warning) | ✅ clean (same warning) |

All three command gates (lint, typecheck, build) are green. Verified live after every batch of fixes: Playwright pass with no console/page crashes against 10 routes on the built app (`/`, `/map`, `/inhome`, `/register`, `/dashboard`, `/investor-access`, `/kit`, `/support`, `/careers`, `/store`) — before/after, not just "the code looks right."

---

## Fixed — historical debt cleared

### Lint (7 → 0)

| File | Issue | Fix |
|---|---|---|
| `NavMenu.jsx`, `About.jsx`, `AgencyNewsroom.jsx`, `Dashboard.jsx`, `TrueCost.jsx` | Unused imports (`Rocket`, `Crosshair`, `Building2`, `MapPin`, `AlertCircle`) | Removed (`eslint --fix`) |
| `InvestorAccess.jsx` | `useAuth()` called inside an IIFE/`try`/`catch` — violates rules-of-hooks | Verified `/investor-access` is always rendered inside `<AuthProvider>` (`App.jsx`); replaced with a direct `const auth = useAuth();` |
| `Support.jsx` | `allowpaymentrequest` on the Donorbox iframe flagged as unknown DOM property | Real HTML5 iframe attribute (Payment Request API) — added to `eslint.config.js`'s existing ignore list, same pattern as `cmdk-input-wrapper`/`toast-close` |

### Typecheck (1,153 → 0)

**Structural fixes (removed ~950 errors with a handful of root-cause changes):**

| Fix | Errors removed | What / why |
|---|---|---|
| `npm i -D @types/leaflet @types/three` | 724 | Without type packages, `tsc` was parsing raw UMD source out of `node_modules` line by line. |
| `// @ts-nocheck` on 61 files under `src/components/ui/`, `src/lib/`, `src/api/` | 86 | `jsconfig.json` already excludes these dirs, but `exclude` only controls root-file discovery — `tsc` still opens files transitively imported by checked code. The pragma is what actually honors the exclude list's intent. |
| `src/types/base44-client.d.ts` — declaration merge for `base44.listAllLocations()` | 12 | Real runtime method (see comment in `base44Client.js`) the SDK's own `Base44Client` interface doesn't declare. Zero runtime change. |
| Proper JSDoc `@type` prop annotations on ~25 shadcn UI primitives (`Button`, `Label`, `Input`, `Image`, `Dialog*`, `Select*`, `Textarea`, `InputOTP*`, `AlertDialog*`, `Tabs*`, `Accordion*`, `Popover`, `Tooltip`, `Toggle`, `Sheet*`, `Separator`, `Skeleton`, `Toast*`) | ~340 | These are plain `React.forwardRef` components with no type annotations, so `checkJs` couldn't infer real prop shapes and collapsed every one to `RefAttributes<any>` (no custom props allowed) — the single largest error category. Added one JSDoc `@type` per component matching its actual Radix/native-element prop type (e.g. `React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & React.RefAttributes<...>`). Pure type annotations, zero behavior change — verified via the same live Playwright pass. |
| `Reveal.jsx`, `Nav.jsx`, `SiteFooter.jsx`, `CopyField.jsx`, `ZoraMarketPanel`'s `Stat`, `StatusTag.jsx`, `Pin.jsx`, `HeroConsole`'s `Stat`, `TreasuryBalances`' `Stat`, `OnChain`'s `SideTile`, `AtariPortfolio`'s `Holding`, `CityGrid`'s `Group`, `FdePortal`'s `Stat`, `XpBar.jsx`, `AuthLayout.jsx`, `MapAlertTicker.jsx`, `ClaimLeadDialog.jsx`, `Globe3D.jsx`, `LocationMap.jsx`, `PortalShell.jsx`, `Dashboard`'s `Row` — optional props given real defaults instead of implicit `undefined` | ~90 | Every one individually verified safe before touching: each prop is either conditionally rendered (`{x && ...}`), called with optional chaining (`fn?.()`), or falls back via `\|\|` — so a destructured prop with no default was already a no-op when omitted at ~50 call sites across the app. Two defaults (`Pin`'s and `Globe3D`/`LocationMap`'s `onSelect`) needed the default function to accept an argument, not `() => {}` — those components call `onSelect(id)`, and a 0-arg default would have made the *real* callers (`setSelectedId`, a React `Dispatch`) fail a genuine type check. Caught by rerunning typecheck after each change, not assumed. |
| InvokeLLM result narrowing (`AdSpendDamage`, `OffenderRegistry`, `UnitFinder`, `MapAlertTicker`, `useFloraData`, `useMushroomData`, `useWarZoneData`, `useNewsHeadlines`, `TrueCost`) | ~10 | `base44.integrations.Core.InvokeLLM()`'s SDK type is `string \| object`; every one of these calls passes `response_json_schema`, which guarantees an object at runtime. Cast at the single access point per file (`/** @type {{ field?: any[] }} */ (res)`), not at the declaration (an earlier attempt to type the whole `res` declaration failed — TS correctly rejects narrowing a union at the assignment itself, since `string` genuinely isn't assignable to an object shape; a cast at first use is the correct mechanism). |
| `Key` type coercions (`CapitalLead.jsx`, `Console.jsx`, `InvestorDashboard.jsx`) | 3 | `key={l}` where `l` came from a `[string, string, boolean][]`-shaped array literal without `as const`, so TS widened each tuple to `(string \| boolean)[]`. Wrapped with `String(l)` — matches actual runtime values (always strings), no behavior change. |
| `gamification.js` (`Date - Date` → `.getTime() - .getTime()`), `SkyIntel.jsx` (`isNaN(date)` → `isNaN(date.getTime())`) | 3 | Standard, equivalent idioms — `Date - Date` and `isNaN(date)` both already coerce via `.valueOf()`/`.getTime()` internally in JS; made it explicit. |
| `RiverLayer.jsx` (cast `coords` to `[number, number][]`) | 1 | River coordinate arrays are plain `number[][]` literals without tuple typing; Leaflet's `Polyline` wants `LatLngTuple[]`. |
| `NavMenu.jsx` ×2, `Sitemap.jsx` (documented `any` cast on a polymorphic `Link`-or-`div` component picker) | 3 | `const Wrap = to ? Link : "div"` — TS can't reconcile the divergent prop shapes of a component chosen at runtime. This is the one place `any` was used without a narrower alternative; documented inline per the "avoid `any` unless unavoidable" rule. |
| `InfoTip.jsx` (JSDoc param type for `side`) | 1 | Default `"top"` widened to plain `string`; Radix's `TooltipContent.side` wants a 4-value literal union. |
| `src/types/react-dom-attrs.d.ts` — `IframeHTMLAttributes` module augmentation for `allowpaymentrequest` | 1 | Same real attribute as the lint fix above, this time at the `@types/react` level. |
| `UiKit.jsx` — stale `spinning` prop on `BrandMark` renamed to `animate` | 1 | `BrandMark` was reworked upstream to gate its `<animateTransform>` behind a real `animate` prop (default `true`); this call site still used the old `spinning` name from before that rename. Renamed at the call site — same intended behavior (explicit spin-on), no fabricated logic. |
| `Globe3D.jsx` — removed dead `projection: "globe"` constructor option; cast `getSource()`/`f.geometry` to their real MapLibre/GeoJSON types at each access | 8 | `projection` isn't a `MapOptions` constructor field in the installed maplibre-gl (5.24.0) — verified against the package's own `.d.ts`. The real mechanism, `map.setProjection({type:"globe"})`, was already being called elsewhere in the same file (`applyGlobe()`), so the constructor option was inert. The other 7 were narrowing `Source`→`GeoJSONSource` and `Geometry`→`Point` at the exact call sites where the source is genuinely always GeoJSON/Point (the only source this component ever adds). |
| `Globe3D.jsx` — `@ts-expect-error` on `map.setFog(...)`, **verified real bug, not just a type gap** | 1 | `setFog` does not exist on maplibre-gl 5.24.0's `Map` class (confirmed against the installed package's `.d.ts` — only `setSky(SkySpecification)` exists now). This call throws at runtime today and is silently swallowed by the surrounding `try/catch`, meaning **the globe's space-fog/atmosphere effect is currently non-functional in production.** Not fixed here — restoring it means porting to `setSky()` or a style-level fog property and verifying the visual result, a product/design call. Flagged below. |
| `DigitalScene.jsx` — typed `stateRef`/`dataRef`/`useRef` initial values, cast `Object3D`→`Mesh` and `Material`→`MeshStandardMaterial` at known-safe access points | 8 | Same "ref initialized with a narrow literal, assigned a wider shape later" pattern as `Globe3D`'s `dataRef`, plus two spots where Three.js's base `Object3D`/`Material` types don't expose subclass-specific members (`geometry`, `material`, `emissiveIntensity`) that this scene always uses on `Mesh`/`MeshStandardMaterial` instances specifically (verified by checking what actually constructs them earlier in the same file). |

All fixes verified: `npm run lint` (0), `npm run typecheck` (0), `npm run build` (clean), and a live Playwright pass against 10 routes on the built app.

---

## Not fixed — real findings that need a founder decision

Nothing here was touched. These are genuine product/design questions, not type debt.

### 1. Globe's space-fog effect is silently broken (verified, not guessed)

`Globe3D.jsx` calls `map.setFog({...})` to render the black-void/star-field atmosphere around the globe. That method **does not exist** on the installed maplibre-gl version (5.24.0) — confirmed by reading the package's own type declarations, not inferred from the type error alone. The call throws at runtime and is caught by a `try/catch`, so there's no crash, just a missing visual effect that's presumably part of the intended "Orbital Perspective" design. Restoring it needs someone to port to `map.setSky(...)` or a style-level fog property and confirm the result looks right — a design call, not a type fix.

### 2. Shadcn UI primitive typing is now done for every component actually in use

All ~25 primitives imported anywhere in `src/` are now properly typed (see table above). If new shadcn components get added later (there are ~35 more scaffolded but unused files under `src/components/ui/` still behind `// @ts-nocheck`), they'll need the same one-JSDoc-per-component treatment the first time something imports them with props beyond `children`.

### 3. Bundle size (build passes, but with a warning)

`dist/assets/index-*.js` is ~4.3 MB uncompressed / ~1.2 MB gzipped — Vite's own build output flags this, unchanged by this branch. Fixing it means route-level code-splitting (`React.lazy` + `manualChunks`), which changes load-time behavior across the whole app and deserves its own tested PR.

### 4. `useLocations.js`'s two marker shapes are genuinely different, not just loosely typed

Seed markers (`mapSeed.js`) carry a `notes` field; live markers (`toMarker()` in `markerUtils.js`) carry a `status` field instead. The hook can return either shape depending on whether the live feed or the fallback seed is active — real, pre-existing inconsistency, typed loosely (`Record<string, any>`) to reflect reality rather than silently picking one shape and hiding the other's absence.

---

## Server function type coverage (2026-08-23) — closed the `base44/functions/*.ts` gap

`jsconfig.json`'s `typecheck` script only ever covered `src/` — the 28 Base44 server functions in `base44/functions/*/entry.ts` (Deno runtime, `npm:` specifiers) had **zero automated type coverage**, identified as a follow-up in this session's earlier audit pass.

**Why `tsc` can't be pointed at them:** `tsc`/`jsconfig.json` don't understand Deno's `npm:` module specifiers or Deno's global APIs (`Deno.serve`, `Deno.env`) — attempting to include these files in the existing `jsconfig.json` would either fail to resolve imports or silently type them as `any` via `skipLibCheck`-style fallbacks, giving false confidence. The correct tool is Deno's own `deno check`, which understands `npm:` specifiers natively and resolves them against the real npm registry.

**Verified runnable in this environment:** the `deno` npm package (published by the Deno company) downloads a real platform binary on `npm install` — added as a pinned devDependency (`deno@2.9.5`, exact version, matching this repo's pin-exact convention). `npm run typecheck:functions` (`cd base44/functions && deno check --node-modules-dir=none */entry.ts`) runs entirely offline against locally-resolved npm packages after the first run generates `base44/functions/deno.lock` (committed, same rationale as `package-lock.json`).

**Baseline found:** first clean run against all 28 functions surfaced **92 real type errors** — two mechanical, repeated classes (43× implicit-`any` parameters, 21× accessing `.message` on a `catch`-block variable typed `unknown`) plus 6 genuine ones.

**Config decision:** `base44/functions/deno.json` sets `noImplicitAny: false` and `useUnknownInCatchVariables: false`, matching `jsconfig.json`'s existing (non-`strict`) behavior for the frontend — same risk tolerance across both type-checked surfaces, not a new one invented for this. That alone reduced 92 → 6 errors with zero code changes.

**The remaining 6, fixed with real TS type annotations (not JSDoc — these are genuine `.ts` files, so `@type` comments are not honored the way they are under the frontend's `checkJs`, confirmed by testing both):**

| File | Issue | Fix |
|---|---|---|
| `cachedIntel/entry.ts` | `REGISTRY.skyIntel.model: 'gemini_3_flash'` widened to `string`, didn't satisfy `InvokeLLMParams.model`'s literal union | `as const` at the declaration |
| `captureLead/entry.ts` | `rec.created_by_id = caller.id` assigned onto an object literal with no such field in its inferred type | explicit inline type annotation on `rec` including `created_by_id?: string` |
| `personaCtl/entry.ts` (×4 errors, 1 root cause) | `const patch = {}` then `patch.role =` / `.access =` / `.agency =` — same class as `captureLead` | explicit inline type annotation on `patch` |

**What is and isn't covered:** `deno check` gives real type/syntax checking for all 28 functions using the same lenient rules the frontend already accepts. It does **not** verify runtime behavior against Base44's actual deployed Deno version (unknown from this repo, unverifiable without live Base44 access) — it's a static check on a current, independently-obtained Deno 2.9.5 toolchain. Not yet wired into CI (`.github/workflows/ci.yml`) — recommended as a follow-up `informational` check first (matching how Prettier and dependency-audit were introduced), promoted to required once proven stable, per `BRANCHING_STRATEGY.md`'s existing pattern.

Verified: `npm run typecheck:functions` exits 0 across all 28 functions; frontend `npm run lint` / `npm run typecheck` / `npm run build` / `npm audit` (full + prod) all still pass unaffected.

---

## R-05 rate limiting (2026-08-23) — shipped as caching, not a per-IP throttle

`opsIntel`'s own risk register and `PortalOps.jsx`'s roadmap both named this "per-IP throttle on fieldStats/cryptoWatch/fetchMapLocations." Investigated before implementing anything, per this session's mandate not to build a rate limiter merely because a checklist named one.

**Investigation:**
- **Call sites:** all three are invoked from live, frequently-rendered components — `fieldStats` from `HeroConsole`, `MetroKit`, `Campaign`, `Dashboard`; `cryptoWatch` from `DonationMomentum`, `TreasuryBalances`, `AtariPortfolio`, `campaign/DonationWatcher`. `fetchMapLocations` has **no live call site anywhere in `src/`** despite being documented as reachable from `/campaign` — either stale docs or a direct-URL-only exposure; lower urgency than the other two, but a public Base44 function is invocable by URL regardless of frontend wiring, so still worth covering.
- **Auth:** all three are fully public, no auth check, by design (public trust/HUD data).
- **Base44's own mechanism:** checked the official docs (`docs.base44.com`) directly rather than assuming — confirmed no built-in rate limiting, abuse protection, or response caching exists for custom backend functions (Base44's only published rate-limit docs are for its own Monitoring/Audit-Logs management APIs, unrelated). Confirmed via `docs.base44.com/developers/backend/resources/backend-functions/overview.md`.
- **Existing entity patterns:** `AccessLog` is role-change-audit-only, wrong shape/purpose to repurpose. `cachedIntel/entry.ts` already solves the *identical* structural problem (expensive work re-done per visitor) using a generic `IntelCache` entity (`cache_key`, `period_key`, `payload`) keyed by a day-granularity window — directly reusable with a shorter window, no new entity needed.
- **The real risk, re-examined:** R-05's stated concern is public functions "redoing expensive work" (DB scans, 3-4 external API calls per `cryptoWatch` hit, up to 10 scraped pages per `fetchMapLocations` fallback) — a cost/reliability risk, not specifically an identity-based abuse risk. A **shared cache caps the real work at once per window regardless of caller count or identity**, which addresses the stated risk more directly than counting requests per IP would.
- **Why not a per-IP counter:** would need a new entity, a read-then-conditional-write per request (a race identical in kind to `claimLead`'s own acknowledged non-atomic check), and — critically — **cannot be verified in this environment** (no live Base44 backend). Worse, all three functions are called by legitimate traffic on nearly every pageview; a wrongly-tuned threshold could silently throttle real users, and I have no way to test that live. A caching bug's worst case is "always computes live" (today's exact behavior, zero regression); a rate-limiter bug's worst case is "blocks real users" — asymmetric risk that favors caching.
- **Fail-open, not fail-closed:** every cache read/write is wrapped in try/catch that swallows errors and falls through to the normal live computation — a broken cache can only ever degrade to today's behavior, never break a response.

**Implemented** (`fieldStats` 30s window, `cryptoWatch` 60s, `fetchMapLocations` 120s — chosen per function based on how expensive/volatile its underlying data is): each function checks `IntelCache` for a hit on `(cache_key, period_key)` before doing its real work, and best-effort writes the result back on a miss. `cryptoWatch` only caches a fully-healthy result (a transient per-chain RPC failure retries next request instead of staying stuck for a minute); `fetchMapLocations` only caches a non-empty result for the same reason. Verified with `npm run typecheck:functions` (0 errors) and a full manual trace of every return path in all three files.

**Known limitations, stated plainly rather than glossed over:**
- This is **not** literal per-IP throttling — raw request *volume*/bandwidth against these endpoints is still unbounded; what's now bounded is the expensive work each request could trigger. If Base44 bills or limits by raw function-invocation count, that's a separate, unaddressed concern.
- **Unbounded `IntelCache` row growth**: under constant traffic, worst case is roughly one new row per window per function (~5,000 rows/day combined across all three if hit continuously) — there is no cleanup/TTL mechanism anywhere in this codebase. Needs a follow-up pruning function (or a Base44-side TTL feature, unknown/unverified from this repo) before this runs unattended for months.
- **A benign, bounded race at window boundaries**: concurrent requests arriving in the same window before the first cache write completes can each independently do the expensive work once — bounded by that one burst, not unlimited, and never worse than today's uncached behavior.
- **UNVERIFIED — requires live Base44 access**: actual cache hit rate, real latency improvement, and whether `IntelCache.create`/`.filter()` behave under real concurrent load exactly as assumed here. Static type-checking and manual trace-through are as far as this environment can verify.

`opsIntel/entry.ts`'s R-05 register entry and `PortalOps.jsx`'s `PROPOSED`/`FNS` lists were updated to reflect what actually shipped, so the in-app ops dashboard doesn't keep advertising a stale roadmap item.
