# Tailwind 3 -> 4 migration plan (isolated; not part of any current release candidate)

Status: **plan only.** No code change, no dependency change, no acceptance of the findings. Written 2026-10-08 against `main` after #346.

## Why (facts, confirmed 2026-10-08)
After #346 the full `npm audit` has 7 findings (5 high, 2 moderate), all in the Tailwind 3 build chain, none in `dist/`, production audit 0.
- `braces` GHSA-vfj7-8cjw-p6xm: vulnerable range `<=3.0.3`; **3.0.3 is the latest release**, so no patched version exists. `micromatch`, `fast-glob`, `chokidar` and `tailwindcss@3` inherit it.
- `postcss-selector-parser` GHSA-rj75-hqrm-r3gf (`<7.1.6`) reaches the tree through `tailwindcss@3` / `postcss-nested`, which pin the 6.x API.
- `npm audit` offers only `tailwindcss@4.3.3` (semver-major) as the fix.
- Simulated, lockfile-only (`tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3`, `tailwindcss-animate` replaced by `tw-animate-css@1.4.0`, in a scratch copy): **0 findings in both scopes**. `tailwindcss@4` has no runtime dependencies; `@tailwindcss/vite` depends on `@tailwindcss/node` and `@tailwindcss/oxide` and supports Vite 5-8 (repo: Vite 6). This proves the advisory outcome, not build compatibility.
- Do not force it with `overrides`: pinning `postcss-selector-parser@7` under Tailwind 3 is an unverified API mismatch and `braces` cannot be overridden to a fixed version.

## Current footprint
- 528 JS/JSX files; `tailwind.config.js` (109 lines: `darkMode: ['class']`, content globs, extended colours using `rgb(var(--c-*) / <alpha-value>)`, a custom `borderRadius` scale, `tailwindcss-animate` plugin); `postcss.config.js` (`tailwindcss`, `autoprefixer`); `src/index.css` 1,656 lines with `@tailwind base/components/utilities`, `@layer base/utilities`, `@apply` (used for `border-border`, `bg-background text-foreground font-body`).
- Utilities whose meaning changes in v4 (class-attribute occurrences): `outline-none` 80, `space-x/y-*` 167, `blur-sm` 27, `bg-gradient-to-*` 24, `divide-*` 13, `rounded-sm` 7, `shadow-sm` 5, `ring-offset-*` 4, bare `ring` 3, bare `blur` 10, bare `shadow` 1. Removed v3 utilities not found: `bg-/text-/border-opacity-*`, `flex-shrink/grow-*`, `overflow-ellipsis`, `decoration-slice`.
- No visual-regression snapshots exist (`toHaveScreenshot` unused); the e2e suite asserts behaviour and geometry only.

## Risks specific to this repo
1. **Browser baseline.** v4 targets modern evergreen engines (Safari 16.4+, Chrome 111+, Firefox 128+) and relies on `@property`, `color-mix()` and cascade layers. Confirm against the audience's real device mix before starting; older iOS devices are the risk for a field/mobile product.
2. **Default changes:** default border colour is `currentColor` (was gray-200); default `ring` width 3px -> 1px; `outline-none` -> `outline-hidden`; renamed `shadow/blur/rounded` scale (`-sm` -> `-xs`, bare -> `-sm`). The custom `borderRadius` scale (`sm` = `lg` = `var(--radius)`) interacts with the rename and must be mapped explicitly.
3. **Accessibility:** `outline-none` -> `outline-hidden` changes forced-colours behaviour; 80 focus styles must keep a visible indicator (WCAG 2.4.7). The existing a11y baseline (`e2e/a11y.spec.ts`, `a11y-baseline.json`) is the guard.
4. **`@layer`/`@apply`:** the v4 `@apply`/`@layer` semantics and `@tailwind` directives change to `@import "tailwindcss"` + `@theme`; the 1,656-line stylesheet has ordering and specificity assumptions, plus an `@import url()` for Google Fonts at the top that must stay first.
5. **Plugin:** `tailwindcss-animate` is a v3 JS plugin; the v4 equivalent is `tw-animate-css` (CSS) with different class availability; every `animate-*` / `data-[state=*]:` usage (shadcn/Radix components) needs a pass.
6. **Dark mode:** `darkMode: ['class']` -> `@custom-variant dark (&:where(.dark, .dark *))`.
7. **Content detection** changes from explicit globs to automatic detection; confirm nothing relies on dynamic class strings.

## Plan (each step its own PR, behind full CI, not combined with any release candidate)
0. **Gate: decide the browser baseline** (owner) and record the real device mix. Stop if unacceptable.
1. **Safety net first (no migration yet).** Add Playwright screenshot baselines (`toHaveScreenshot`) for ~12 representative routes at 360x800, 844x390, 1440x900 on the v3 build, committed as the reference; capture the computed-style budget (bundle CSS size). Merge on main so baselines pre-date the migration.
2. **Automated pass** on a branch: `npx @tailwindcss/upgrade` (v4.3.3) to produce the first diff; review every changed file; keep `tailwind.config.js` via `@config` initially to isolate renames from config changes.
3. **Plugin and tokens:** swap `tailwindcss-animate` -> `tw-animate-css`; move colours/radius to `@theme` only after step 2 is green.
4. **Build integration:** `@tailwindcss/vite` replaces the `tailwindcss` PostCSS plugin; drop `autoprefixer` only if the browser baseline allows.
5. **Verify:** lint, typecheck, build; full desktop and mobile e2e at zero retries; a11y spec against baseline; screenshot diff review at all three viewports (any diff above threshold is reviewed by a human, not auto-updated); CSS size compare; `npm audit` both scopes expected 0.
6. **BACKUP-only qualification** as a separate candidate (never combined with feature work), then owner review on real phones.

## Rollback
Pure revert of the migration PR(s) restores `tailwindcss@3`, `postcss.config.js`, `tailwind.config.js` and `src/index.css`; the lockfile returns to the #346 state. No data, schema or backend change is involved, so rollback is a frontend redeploy of the previous build. Keep the v3 screenshot baselines (step 1) permanently; they are the rollback verification.

## Out of scope
Any change to the current release candidate, force-resolutions, dependency reclassification, or recording these findings as accepted.
