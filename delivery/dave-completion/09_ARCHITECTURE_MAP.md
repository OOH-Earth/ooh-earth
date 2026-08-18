# Architecture Map

High-level, evidence-based — file paths are real, not illustrative.

## Stack
React 18 + Vite, React Router v7, Tailwind CSS, Framer Motion. Backend: Base44
SDK (`@base44/sdk`) — no live backend in this dev sandbox, all e2e tests mock
the REST surface. Maps: Leaflet + `react-leaflet` (2D, `LocationMap.jsx`) and
MapLibre GL (3D globe, `Globe3D.jsx`). Testing: Playwright.

## Core adbusting journey
```
/report (Report.jsx)              /ar (ArLens.jsx)
   └─ FieldReport.jsx                 └─ camera+GPS+capture
       └─ ReportScanner.jsx               └─ scanAd (same AI call)
           └─ scanAd function                  └─ Location.create/update
               └─ Location.create/update
                        │
                        ▼
              /map (Map.jsx) ?highlight=<id>
                        │
                        ▼
              /location/:id (LocationDetail.jsx)
                 ├─ AdvertiserInfo.jsx (brand/agency/parent/operator/sector)
                 └─ RelatedLocations.jsx (nearby + same-brand + same-parent-corp)
```

## Data model (no migrations this pass)
`Location` (`base44/entities/Location.jsonc`) is the single source of truth
for both adbusting reports and brand/corporate intelligence — free-text
fields `brand_name`, `parent_corp`, `ad_agency`, `ooh_operator`,
`industry_sector`, plus `harm_tags`/`action_flags`/`adbust_type` for the
subversion-specific fields. `Mint` (NFT prep), `DigitalBust` (digital/social
platform takeovers, separate from physical billboard AR), `QuestCompletion`,
`CareerRoleStatus` round out the entities actually touched this pass.

## Map/intelligence layer stack
```
Map.jsx (page)
 ├─ filtered/layerFiltered (brand+parent_corp search, PR #93)
 ├─ LocationMap.jsx (Leaflet wrapper)
 │    ├─ ClusteredMarkers (real pins, screen-grid clustering)
 │    ├─ FitBounds / FlyTo (existing)
 │    └─ LayerManager.jsx
 │         └─ HeatLayer.jsx (leaflet.heat, PR #92; click-to-report, PR #96)
 └─ MapBottomSheet (mobile detail sheet, driven by selectedId/detailItem)
```

## Brand intelligence
`BrandBadge.jsx` (60+ real advertiser/operator/agency marks, icon lookup) +
`advertiserRegistry.js` (parent-corp → sector inference) + `RelatedLocations.jsx`
(cross-referencing) — all client-side, all built on the existing `Location`
free-text fields. No `Brand`/`Organisation` entity exists or was needed.

## NFT/Web3
`useWallet.jsx` (real MetaMask/Phantom connect + server-verified signature) →
`MintLocationPanel.jsx` (metadata build/upload, `Mint` entity `status:
'prepared'`) → external hand-off to `zora.co/create` → self-reported "mark
minted." `NftCreator`/`NftStudioPanel` (`/lab/nft`) is a separate, freeform
trading-card visual studio (3D slab viewer), gated by `LabAccessRoute`.

## Gamification
`useGamification.js` (real XP from contribution counts) → `gamification.js`
(13 badges, level curve, quests) → `OperativeProfile.jsx` (`/profile`).
Disconnected from the NFT studio (see Decision E).

## Agency
`ClientPortal.jsx` (`/portal/client`) — UI shell only, every data row
explicitly labeled `'sample'` in source, no backend.
