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
| `BrandMark.jsx` — accept-but-unused `spinning` prop | 1 | The mark's orbit rings already animate unconditionally via `<animateTransform>` — there's no non-spinning state to gate on. Documented as intentionally inert rather than wiring a fake conditional. |
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
