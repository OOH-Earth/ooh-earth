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
