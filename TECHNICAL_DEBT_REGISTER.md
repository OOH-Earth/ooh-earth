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

## Dependabot triage (2026-08-23, corrected 2026-08-24)

**2026-08-24 correction:** #94 and #87 (2 of the original 3 "safe to merge" picks below) were auto-closed by Dependabot overnight, superseded by fresh grouped-update PRs #132 and #133 respectively — Dependabot does this when a newer version lands before the old PR merges. Re-verified live rather than trusting yesterday's numbers: **#90, #132, #133 are the current 3 low-risk, ready-to-merge PRs** (all `mergeStateStatus: CLEAN`, 10/10 CI checks green, re-checked 2026-08-24):

| PR | Bump | Notes |
|---|---|---|
| #90 | `github/codeql-action/{init,analyze}` 4.37.6→4.37.7 | CI infra only, patch |
| #132 | `@axe-core/playwright` 4.12.1→4.13.0, `baseline-browser-mapping` 2.11.12→2.11.14, `eslint-plugin-react-refresh` 0.5.3→0.5.4 | dev-only, patch |
| #133 | `@base44/sdk` 0.8.41→0.8.42, `react-hook-form` 7.84.0→7.85.0, `sonner` 2.0.7→2.0.8 | `@base44/sdk` is a patch bump but worth a beat of extra attention given how central it is (every entity/function call goes through it) — still CI-green including full Playwright, no evidence of an issue |

Not merged — this session doesn't merge to `main` without explicit instruction, per `AGENTS.md` rule 3. If this list is read again later, re-verify live: Dependabot may have superseded these too by then.

**Deliberately NOT recommended for a blind merge — every one of the other 8 is a major-version bump, not a routine update.** 2026-08-24 update: checked actual usage breadth in `src/` for each (not just the version-jump size), which meaningfully changes the risk picture from a pure "major = risky" read:

| PR | Bump | Actual blast radius (verified via grep, not assumed) | Risk |
|---|---|---|---|
| #88 + #39 | `react` 18.3.1→19.2.8, `react-dom` (paired) | Every component in the app; `react-router-dom` v7, `framer-motion`, Radix UI, `react-leaflet`, `recharts`, `react-hook-form`, `react-day-picker` all must be React-19-compatible. Already uses `createRoot` (not the legacy `ReactDOM.render`), one real blocker already cleared | **Highest** — full-app surface |
| #20 | `react-leaflet` 4.2.1→5.0.0 | 14 files import it; the map is a P0 journey | **High** — broad + consequential |
| #36 | `react-day-picker` 8.10.1→10.0.1 | Only 1 file imports it (v8→v9 was a real breaking rewrite, v9→v10 less so) | **Medium** — real breaking-change surface, narrow blast radius |
| #89 | `@eslint/js` 9.39.2→10.0.1 | Dev-tooling only, zero production risk — but CI is currently failing on this PR (see below), meaning the new rule set likely already trips something real | **Medium** — contained, but not free |
| #37 | `@stripe/react-stripe-js` 3.10.0→6.8.1 | **Corrected finding, differs from this row's original framing:** grepped for `@stripe/react-stripe-js`, `@stripe/stripe-js`, `loadStripe`, and `Elements` across all of `src/` — **zero real imports found** (the one `Elements` hit is prose copy in `guildBookData.js`, unrelated). `StripeDonate.jsx` confirmed to do a plain `window.location.href = res.data.url` redirect to a server-created Stripe Checkout Session — the embedded Elements library this package provides isn't used anywhere in the actual checkout flow | **Low** — likely near-zero actual risk despite the major version number; still worth a CI-green + smoke-test pass on `/support`/`/plans` before merging, simply because it's still a major bump, but not the highest-consequence item on this list the way its version number suggests |
| #35 | `zod` 3.25.76→4.4.3 | Grepped all of `src/` for any `zod` import (direct or via `@hookform/resolvers`) — **zero usage found anywhere**, frontend or backend (backend absence already noted in this session's security recon) | **Lowest** — appears to be an entirely unused dependency; the bump itself is closer to a no-op than a migration. Worth asking whether it should just be removed instead of upgraded |
| #23 | `date-fns` 3.6.0→4.4.0 | Not re-audited this pass — usage breadth unknown, flagged for next investigation before scheduling | **Unknown** — needs its own quick usage check |

**Failing CI on 6 of the 8 majors (#89, #88, #39, #37, #23, #20)** as of 2026-08-23 — Lint & Typecheck / Prettier / Build / Dependency audit showed `FAILURE`. Not yet root-caused per-PR (would mean starting the actual migration).

**Revised recommended migration order** (by actual verified risk, not version-number optics): 1) `zod` (#35) — confirm truly unused, then either take the bump for free or remove the dependency entirely, either way a same-day task; 2) `@stripe/react-stripe-js` (#37) — verify CI-green + a manual smoke pass on the two checkout pages, low effort given confirmed non-usage; 3) `react-day-picker` (#36) — narrow, one file, but needs to actually read v9/v10's migration notes given the real API rewrite; 4) `date-fns` (#23) — usage-audit first; 5) `@eslint/js` (#89) — see what new rules actually fire, fix or configure around them; 6) `react-leaflet` (#20) — dedicated PR, full map-page regression pass; 7) `react` + `react-dom` (#88+#39) — its own sprint, not a slot in a triage pass, do last so every other dependency it might interact with is already current.
