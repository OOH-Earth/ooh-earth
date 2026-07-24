# OOH Earth — Backlog & Decision Log

_Last updated: 2026-07-24_

A living log of open items, decisions, and things still to address. Strike items as they're resolved.

---

## Decisions (locked)

- **Orbital Perspective design system** — black canvas, High-Vis Yellow `#EDFF00` / Neon Orange `#FF5C00`, Inter Tight.
- **Command Center** tactical slide-out replaces 17+ Linktree links.
- **Viewfinder cursor** + scroll-linked horizon progress line.
- **Real-field OOH Earth photography** in atlas plates / hero.
- **Out Of Hell™ V3.1** brand guidelines (sentence-case, Union Made copy).
- **Crypto / on-chain** surfaced as a primary section with live subproject grid.
- **/kit** route hosts the UI library + brand assets, one-click copy.
- **Global menu** restructured into grouped sitemap (Command, Field Ops, Field Tools, Intel & Support).
- **/guides** Field Manual with user journey + capability matrix.
- **/field-id** printable credential generator.
- **/card** NFC Union Card landing page.
- **Map locations** sourced via server-side KML importer (`importKmlLocations`).
- **London transit map** imported: 705 verified transit locations from Google My Maps (mid `1JE50Oz1sEg8Cugs9O-fBdxOkCvSZOosk`).
- **Access keys** referenced on the Map via ooh.earth/access-keys/ (4-Way Utility, H60, JCD Superlock, etc.).

---

## Open — Data & Imports

- [ ] **Capture map legend metadata** — London map legend encodes orientation (pavement-facing vs road-facing) and verification (star = confirmed, question = to-double-check / has lock) via style colour. Not currently stored. Needs: confirmed legend mapping before extending importer; dedupe strategy (re-import would duplicate 705 records).
- [ ] **Feed remaining map sources** — user to provide each map's viewer URL / `mid=`, surface type, and verified-vs-pending status. Importer is reusable.
- [ ] **Per-location `access_key` value** — field now exists on Location entity; existing records default to `none`. Populate as sources are classified.
- [ ] **Backfill London records** with `access_key` where known.

---

## Open — UI / Features

- [ ] **Access-key filter** on the Map toolbar (now that the `access_key` field exists) — filter units by key type.
- [ ] **Error / empty states** for external data modules — NomadPulse, crypto ticker, maps.
- [ ] **FieldIdGenerator** — print / PDF export validation.
- [ ] **Mobile QA** on UI components (cards, map toolbar, command center, field-id).
- [ ] **Refresh SuperCard network stats** — "50 Sites logged" is stale (now 755+ after London import). Re-run once all sources are loaded for final totals.

---

## Open — Commerce & Crypto

- [ ] **Fill Polygon / USDC treasury addresses** (currently empty slots).
- [ ] **Verify donation checkout end-to-end** on published HTTPS (Stripe live mode claimed; checkout blocked inside preview iframe — gate on publish).
- [ ] **Stripe products/prices** — none configured yet; create product + price for donations/field card if charging.

---

## Open — Field Tools (gated on HTTPS deploy)

- [ ] **TrueCost / TrashId camera scans** — only work on full HTTPS, blocked in preview iframe. Test after publish.
- [ ] **Decide anonymous vs. logged-in reporting policy** — currently no login required.

---

## Open — Data Integrity

- [ ] **Audit dashboard stats for inflation** — ImpactLedger, OperativeNetwork modules (SuperCard already corrected to live counts).

---

## Known Issues / Limits

- Internal `SendEmail` does **not** deliver to external addresses (e.g. `hello@ooh.earth`) — registered app users only.
- SiteGround bot-protection blocks backend fetch of ooh.earth data — seeded static data instead.
- Private key / transaction hash paste is intentionally blocked (fund-safety).