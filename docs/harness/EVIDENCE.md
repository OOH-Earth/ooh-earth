# Evidence index

- Pilot contract and source review: `docs/ops/ooh-earth/15-PLACE-RESEARCH-PILOT.md`.
- Historical qualified head: `7b0dbdac860e6d2293799bd2a9f5e04f243bda53`.
- Historical exact-head CI: [37514379683](https://github.com/OOH-Earth/ooh-earth/actions/runs/37514379683).
- Historical CodeQL: [37514386087](https://github.com/OOH-Earth/ooh-earth/actions/runs/37514386087).
- Historical BACKUP preview: `https://ooh-earth-backup.base44.app/location/6ab1971df0ddd54d900955b1`.
- Historical live artifact SHA-256: `efda238a1ae821ddbec48903582a5c73a7de0c46f80c1670e5f64793be5a70c0`.
- Historical QA: adapter 7/7; focused desktop 3/3; focused mobile 3/3; fixture zero requests; repeated live activation one USGS request per fresh page.
- Historical audit: zero high/critical; remaining 1 low and 2 moderate (`dompurify`, `fflate`, `moment`) were not claimed fixed.

Reconcile this index against fresh CI and live evidence after the merge. Do not treat historical BACKUP evidence as proof of the new head.

## 2026-10-08 reconciliation
- Merge SHAs: #346 `beadb98`, #336 `7877f05`, #342 `4d7db21`, #343 `9adcf92550245eb2401601380532e1eb77a5433f`.
- b57cc46 BACKUP (historical, script-reported): entry `/assets/index-BucNanu3.js`, SHA-256 `af7aac7545e29b023e1a3dea6294ff9f792f54e612302497866b985191260ab0`; evidence directory `/tmp/q/evidence/ooh-place-backup.ol8f2Z` (not independently reviewed by the agent after the classifier denial).
- Audit reconciliation: doc 24. CI infrastructure incidents retained: #345 CodeQL upload failure and CI run with no failed job (re-run passed); #343 mobile Playwright job cancelled after 6 h at "Install Playwright OS deps" (re-run).

- 2026-10-08 BACKUP qualification of `4fb6cad`: attempt 1 `/tmp/q/evidence/ooh-place-backup.JTYEhL` (35 passed / 1 failed), attempt 2 `/tmp/q/evidence/ooh-place-backup.rNU5AO` (36/36); both retained. Full table in doc 23.
