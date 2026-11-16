# Evidence record template (copy into docs/design/UI-Fixes.md under the next free section; one ledger only)

| Field | Value |
| --- | --- |
| Surface / route / owning component | |
| Source SHA, tree hash, artifact (`release-manifest.json` git_sha, entry file) | |
| Target (local preview / BACKUP window id / production) and bytes verified how | |
| Browser + version | |
| Input method | real pointer / real keyboard / **emulated** touch (not a physical device) |
| Viewport x DPR | 320x640, 390x844, 844x390, 1280x800 |
| User | anonymous (isolated context) / MEMBER / mock |
| Screenshots (paths, which are whole-screen) | |
| Measurements (probe, selector, value) | |
| Baseline (live SHA, same viewport/state) | |
| Defects: id, reproduction numbers, scoped fix, regression spec + the first failure on the old build | |
| Caught / fixed / not checked | |
| Limitations (emulation, physical-device gate, data differences, mocks) | |
| Unresolved ownership (e.g. UI-012 shared header) | |
