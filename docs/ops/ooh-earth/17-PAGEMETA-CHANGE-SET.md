# PageMeta five-row change set and metadata procedure (PREPARED — NOT APPLIED)

Date: 2026-10-22. Status: **NOT PASSED.** No production data was written. Current values were read from production (`exec --data-env prod`, read-only) on 2026-10-22 and saved in `~/ooh-release-records/2026-10-21/pagemeta-5rows-current-2026-10-22.json`; rows were unchanged since 2026-08-07.

## What each layer controls (observed, not assumed)
| Output | Evidence 2026-10-22 | Source of the value |
|---|---|---|
| Browser DOM after hydration (`document.title`, `og:title`, description, canonical) | `/about` → "About — OOH Earth"; `/campaign` → "Fund the Offensive — OOH Earth"; descriptions equal the PageMeta rows | **PageMeta rows** (they outrank repo `routeMeta` in `seoContext.resolveMeta`); repo values only matter where no row exists |
| Server/crawler HTML (normal UA and `Twitterbot` UA) for subroutes | `<title>About \| OOH Earth</title>`, `Campaign \| OOH Earth`, `Map \| OOH Earth`, `Report \| OOH Earth`; no `og:*` or description found on those routes | **Neither** PageMeta nor repo `routeMeta` (different separator/wording). Source unidentified; consistent with a platform-generated per-route title. |
| Home `/` server HTML | `OOH Earth — Street Art & Adbusting Maps` (matches PageMeta and repo) | repo/prerender or PageMeta — indistinguishable |

Consequence: editing the five PageMeta rows would very likely fix what browsers (and any crawler that executes JavaScript) see, but **there is no evidence it changes the platform-generated crawler HTML**. Do not claim previews are fixed from a row edit alone.

## Supported refresh procedure — UNVERIFIED
No documented CLI/API for crawler-snapshot refresh was found (`base44 --help` has no SEO/prerender command). Candidate paths to confirm with Base44 support or the dashboard SEO/page settings (`base44 dashboard`): (1) per-page SEO settings in the app dashboard, (2) a re-publish/snapshot trigger. Until one is identified, treat crawler output as owner-unreachable.

## Verification required before status can change to PASSED
1. Browser DOM matches the proposed values on all five routes (Playwright, desktop + mobile).
2. `curl -sL -A "Twitterbot/1.0" https://oohearth.app/<route>/` and a normal UA show the proposed `<title>`, `og:title`, `og:description`, `og:image`, canonical.
3. A real preview debugger (Facebook Sharing Debugger / LinkedIn Post Inspector, run by the owner) shows the new text. Platform caches can retain old previews.

## Change set (titles unchanged; description edits only; `og_image`, `noindex=false`, `og_generated=true` untouched)
Revalidate every "current" value immediately before any write; abort if any row's `updated_date` differs from the one below.

### `/` — row `6a75a3b5114f3f9bb7c09e90`
- updated_date at read: `2026-08-07T09:48:49.671000`
- title (unchanged): `OOH Earth — Street Art & Adbusting Maps`
- description CURRENT / ROLLBACK VALUE: `An open-source, community-funded app reclaiming the visual commons. Mapping every corporate advertis`
- description PROPOSED: `OOH Earth is an open-source, community-funded adbusting platform that documents outdoor advertising and supports community-led creative resistance.`

### `/about` — row `6a75a45d5efd2848335c83de`
- updated_date at read: `2026-08-07T09:24:45.694000`
- title (unchanged): `About — OOH Earth`
- description CURRENT / ROLLBACK VALUE: `OOH Earth is an open-source, community-funded platform reclaiming the visual commons through mapping`
- description PROPOSED: `OOH Earth documents outdoor advertising and supports community-led adbusting, research, photography, and creative remixes.`

### `/campaign` — row `6a75a501e42b7f999298e379`
- updated_date at read: `2026-08-07T09:34:35.344000`
- title (unchanged): `Fund the Offensive — OOH Earth`
- description CURRENT / ROLLBACK VALUE: `Community-funded treasury for adbusting, mapping, and creative resistance. Support the offensive.`
- description PROPOSED: `Support OOH Earth’s community-funded work documenting outdoor advertising and developing creative adbusting tools.`

### `/map` — row `6a75a33399b1a15fe61fc135`
- updated_date at read: `2026-08-07T09:27:17.580000`
- title (unchanged): `Field Atlas — OOH Earth`
- description CURRENT / ROLLBACK VALUE: `Interactive global map of every billboard, digital screen, and advertising surface.`
- description PROPOSED: `An interactive atlas of documented outdoor advertising and public-space records, with moderation status shown where available.`

### `/report` — row `6a75a4fc1d78e358e4b7d169`
- updated_date at read: `2026-08-07T09:34:30.532000`
- title (unchanged): `Field Report — OOH Earth`
- description CURRENT / ROLLBACK VALUE: `Log a billboard, digital screen, or advertising offense. Photo, location, access key, and notes — on the public record.`
- description PROPOSED: `Document a billboard, digital screen, or advertising surface with a photo, location, and notes. A submission is a record for review, not proof of ownership or permission.`

## Rollback
Restore each `description` to the CURRENT value above (full JSON snapshot in the release-records file). No other field is touched, so rollback is a five-field update. A snapshot of all 66 rows should be taken immediately before the write.

## Open wording question for David
`/campaign` title "Fund the Offensive" is unchanged (live today and consistent with the page); say if it should be neutralised too.
