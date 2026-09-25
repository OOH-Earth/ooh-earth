import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// maplibre-gl resolves its worker script by string-appending
// "maplibre-gl-worker.mjs" next to its own bundled chunk's import.meta.url
// (see maplibre-gl's util/web_worker.ts:defaultWorkerUrl) -- a literal
// filename that Vite's content-hashed build output never produces, so the
// GeoJSONSource's worker actor 404s and every setData() call hangs forever
// (_isUpdatingWorker stays true, source.loaded() never becomes true, no
// error is ever surfaced -- markers silently never render).
//
// A plain `?url` import copies the file byte-for-byte as a static asset
// without parsing it, which leaves the worker's own internal
// `import ... from "./maplibre-gl-shared.mjs"` unrewritten -- that sibling
// chunk is never emitted under that literal name either, so the worker
// script loads but then fails to import ITS OWN dependency (a second,
// silent failure with the same "hangs forever, no console error" shape).
// `?worker&url` tells Vite to treat the file as a genuine worker entry --
// it parses the file, bundles its internal import graph correctly, and
// hands back the URL of that self-contained, working chunk.
maplibregl.setWorkerUrl(maplibreWorkerUrl);
