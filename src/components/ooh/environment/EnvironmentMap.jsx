import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import '@/lib/maplibreWorkerSetup';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Crosshair, Info, Loader2, TriangleAlert, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useMapStyle } from '@/lib/mapStyleContext';
import {
  ENVIRONMENT_LAYERS,
  TRUST,
  NE_ATTRIBUTION,
  NE_SOURCE_ID,
  VECTOR_ATTRIBUTION,
  VECTOR_MIN_ZOOM,
  VECTOR_SOURCE_ID,
  VECTOR_TILEJSON,
  providerFor,
  waterwayKind,
  waterwayLabel,
} from './environmentLayers';

const REF_SOURCE = 'ooh-env-ref';
const REF_LAYER = 'ooh-env-ref-points';
const TILE_TIMEOUT_MS = 12000;

function TrustBadge({ kind }) {
  const t = TRUST[kind] || TRUST.reference;
  return (
    <span
      title={t.hint}
      className="border border-slate2 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-darkgray"
    >
      {t.label}
    </span>
  );
}

// A MapLibre map for environmental reference layers. It owns its legend, load/error/no-coverage
// states, attribution and a keyboard-reachable way to inspect features, because a canvas alone
// is invisible to keyboards and screen readers.
export default function EnvironmentMap({
  projection = 'globe',
  layers = [],
  referencePoints = [],
  referenceLegend = null,
  selectedPointId = null,
  onSelectPoint = null,
  noun = 'River',
  initialView = { center: [15, 25], zoom: 1.6 },
}) {
  const { style: mapStyle } = useMapStyle();
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const loadedRef = useRef(false);
  const inspectBtnRef = useRef(null);
  const cardRef = useRef(null);
  const openedByKeyboardRef = useRef(false);
  const onSelectPointRef = useRef(onSelectPoint);
  onSelectPointRef.current = onSelectPoint;

  const [ready, setReady] = useState(false);
  const [gpuUnavailable, setGpuUnavailable] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [partialFailure, setPartialFailure] = useState(false);
  const [view, setView] = useState({ zoom: initialView.zoom, segments: 0, names: 0 });
  const [selection, setSelection] = useState(null); // { type: 'waterway' | 'point', ... }
  const [legendOpen, setLegendOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches,
  );

  const activeDefs = useMemo(
    () => layers.map((id) => ENVIRONMENT_LAYERS[id]).filter(Boolean),
    [layers],
  );
  const activeKey = activeDefs.map((d) => d.id).join('|');
  const queryLayers = useMemo(() => activeDefs.flatMap((d) => d.queryLayers || []), [activeDefs]);
  const measureLayers = useMemo(
    () =>
      activeDefs.flatMap((d) => d.layers.filter((l) => /major|minor/.test(l.id)).map((l) => l.id)),
    [activeDefs],
  );

  const inspectAt = useCallback(
    (point, radius, lngLat) => {
      const map = mapRef.current;
      if (!map || !queryLayers.length) return false;
      const present = queryLayers.filter((id) => map.getLayer(id));
      if (!present.length) return false;
      const box = [
        [point.x - radius, point.y - radius],
        [point.x + radius, point.y + radius],
      ];
      const hits = map.queryRenderedFeatures(box, { layers: present });
      if (!hits.length) return false;
      const props = hits[0].properties || {};
      const name = waterwayLabel(props);
      setSelection({
        type: 'waterway',
        name,
        kind: waterwayKind(props),
        provider: providerFor(hits[0].layer?.id),
        lngLat: lngLat || map.unproject(point),
      });
      return true;
    },
    [queryLayers],
  );

  // Map lifecycle. Re-created when the base style changes (the style owns its own sources).
  useEffect(() => {
    if (!containerRef.current) return undefined;
    let map;
    loadedRef.current = false;
    setReady(false);
    setStatus('loading');
    setPartialFailure(false);
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle.glStyle,
        center: /** @type {[number, number]} */ (initialView.center),
        zoom: initialView.zoom,
        pitch: 0,
        maxPitch: 60,
        attributionControl: { compact: true },
      });
    } catch (error) {
      if (!(error instanceof maplibregl.GPUInitializationError)) throw error;
      setGpuUnavailable(true);
      return undefined;
    }
    mapRef.current = map;

    const timeout = setTimeout(() => {
      if (!loadedRef.current) setStatus('error');
    }, TILE_TIMEOUT_MS);

    const applyProjection = () => {
      try {
        map.setProjection({ type: projection === 'globe' ? 'globe' : 'mercator' });
      } catch {
        /* projection change is cosmetic; the map still works */
      }
    };
    const refresh = () => {
      const zoom = Math.round(map.getZoom() * 10) / 10;
      let segments = 0;
      const names = new Set();
      const present = measureLayers.filter((id) => map.getLayer(id));
      if (present.length) {
        for (const f of map.queryRenderedFeatures({ layers: present })) {
          segments += 1;
          const n = waterwayLabel(f.properties || {});
          if (n) names.add(n);
        }
      }
      setView({ zoom, segments, names: names.size });
      // Below the detail zoom no CARTO tile is requested, so there is nothing to wait for.
      if (zoom < VECTOR_MIN_ZOOM) setStatus((st) => (st === 'loading' ? 'ready' : st));
    };

    map.on('load', () => {
      applyProjection();
      map.on('style.load', applyProjection);
      if (!map.getSource(VECTOR_SOURCE_ID)) {
        map.addSource(VECTOR_SOURCE_ID, {
          type: 'vector',
          url: VECTOR_TILEJSON,
          minzoom: VECTOR_MIN_ZOOM,
          attribution: VECTOR_ATTRIBUTION,
        });
      }
      if (!map.getSource(NE_SOURCE_ID)) {
        map.addSource(NE_SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          attribution: NE_ATTRIBUTION,
        });
        // Bundled and lazy: only the Rivers page ever downloads this chunk.
        import('./data/naturalEarthRivers.json').then((m) => {
          /** @type {any} */ (map.getSource(NE_SOURCE_ID))?.setData(m.default);
        });
      }
      // Keep base-map labels above our overlays.
      const firstSymbol = map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
      for (const def of Object.values(ENVIRONMENT_LAYERS)) {
        for (const spec of def.layers) {
          if (!map.getLayer(spec.id)) {
            map.addLayer(
              /** @type {any} */ ({
                ...spec,
                layout: { ...(spec.layout || {}), visibility: 'none' },
              }),
              firstSymbol,
            );
          }
        }
      }
      map.addSource(REF_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: REF_LAYER,
        type: 'circle',
        source: REF_SOURCE,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 5, 8, 8],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#000',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.95,
        },
      });
      setReady(true);
    });

    map.on('sourcedata', (e) => {
      // Ready means a real tile reached the 'loaded' state. Metadata-only events (the TileJSON)
      // and errored tiles also fire sourcedata, and must not turn a failure into 'ready'.
      const tile = /** @type {any} */ (e).tile;
      if (e.sourceId === VECTOR_SOURCE_ID && tile?.state === 'loaded') {
        loadedRef.current = true;
        setPartialFailure(false);
        setStatus('ready');
      }
    });
    map.on('error', (e) => {
      if (/** @type {any} */ (e)?.sourceId !== VECTOR_SOURCE_ID) return;
      if (loadedRef.current) setPartialFailure(true);
      else setStatus('error');
    });
    map.on('idle', refresh);
    map.on('zoomend', refresh);
    map.on('click', REF_LAYER, (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (id != null) onSelectPointRef.current?.(String(id));
    });
    map.on('click', (e) => {
      const hitRef = map.getLayer(REF_LAYER)
        ? map.queryRenderedFeatures(e.point, { layers: [REF_LAYER] }).length
        : 0;
      if (hitRef) return;
      if (!inspectAt(e.point, 8, e.lngLat))
        setSelection((s) => (s?.type === 'waterway' ? null : s));
    });
    map.on('mousemove', (e) => {
      const present = [...queryLayers, REF_LAYER].filter((id) => map.getLayer(id));
      const over = present.length
        ? map.queryRenderedFeatures(
            [
              [e.point.x - 6, e.point.y - 6],
              [e.point.x + 6, e.point.y + 6],
            ],
            { layers: present },
          ).length
        : 0;
      map.getCanvas().style.cursor = over ? 'pointer' : '';
    });

    return () => {
      clearTimeout(timeout);
      mapRef.current = null;
      map.remove();
    };
    // Map is intentionally rebuilt only when the base style or projection engine changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle.id, projection]);

  // Layer visibility follows the `layers` prop.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    for (const def of Object.values(ENVIRONMENT_LAYERS)) {
      const on = activeDefs.includes(def);
      for (const spec of def.layers) {
        if (map.getLayer(spec.id))
          map.setLayoutProperty(spec.id, 'visibility', on ? 'visible' : 'none');
      }
    }
  }, [ready, activeKey, activeDefs]);

  // Highlight the selected waterway (all loaded segments sharing its name).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    for (const def of activeDefs) {
      for (const id of def.selectedLayers || []) {
        if (!map.getLayer(id)) continue;
        const name = selection?.type === 'waterway' ? selection.name : null;
        map.setFilter(id, ['==', ['get', 'name'], name || '\u0000']);
      }
    }
  }, [ready, selection, activeDefs]);

  // Reference points (illustrative samples) and their selection.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const src = map.getSource(REF_SOURCE);
    src?.setData({
      type: 'FeatureCollection',
      features: referencePoints.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: String(p.id), color: p.color || '#B2B2B2' },
      })),
    });
  }, [ready, referencePoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const p = referencePoints.find((x) => String(x.id) === String(selectedPointId));
    if (!p) {
      setSelection((s) => (s?.type === 'point' ? null : s));
      return;
    }
    setSelection({ type: 'point', point: p, lngLat: { lat: p.lat, lng: p.lng } });
    map.flyTo({ center: [p.lng, p.lat], zoom: 7, duration: 900 });
  }, [ready, selectedPointId, referencePoints]);

  // Detail surface: Escape closes it; keyboard-opened details take focus and give it back.
  useEffect(() => {
    if (!selection) return undefined;
    if (openedByKeyboardRef.current) cardRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setSelection(null);
      if (openedByKeyboardRef.current) inspectBtnRef.current?.focus();
      openedByKeyboardRef.current = false;
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selection]);

  const inspectCentre = () => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getContainer();
    const point = { x: c.clientWidth / 2, y: c.clientHeight / 2 };
    openedByKeyboardRef.current = true;
    if (!inspectAt(point, 48, map.getCenter())) {
      setSelection({ type: 'none', lngLat: map.getCenter() });
    }
  };

  const closeSelection = () => {
    setSelection(null);
    if (openedByKeyboardRef.current) inspectBtnRef.current?.focus();
    openedByKeyboardRef.current = false;
    onSelectPointRef.current?.(null);
  };

  if (gpuUnavailable) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-void p-6 text-center">
        <p className="max-w-xs font-mono text-[11px] uppercase tracking-[0.2em] text-dim">
          // The interactive map needs WebGL, which this browser cannot provide. The list shows the
          same reference data.
        </p>
      </div>
    );
  }

  const primary = activeDefs[0];
  // Only claim "no coverage" where the detailed network should exist (zoomed in).
  const noCoverage = status === 'ready' && primary && view.zoom >= 6 && view.segments === 0;
  const showHint = status === 'ready' && view.zoom < VECTOR_MIN_ZOOM && !noCoverage;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={`${noun} map`}
      data-testid="env-map"
      data-status={status}
      data-segments={view.segments}
      data-names={view.names}
      data-zoom={view.zoom}
      data-projection={projection}
      className="relative h-full w-full bg-void"
    >
      {/* MapLibre's stylesheet sets its container to position:relative, so the sizing wrapper is a
          separate element. Otherwise the map collapses to zero height inside flex layouts. */}
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Status */}
      <div
        className="absolute left-3 top-14 z-[900] flex max-w-[calc(100%-5rem)] flex-col gap-1"
        aria-live="polite"
      >
        <span className="flex w-fit items-center gap-1.5 border border-slate2 bg-void/85 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-darkgray backdrop-blur-md">
          {status === 'loading' && <Loader2 className="h-3 w-3 animate-spin text-ozone" />}
          {status === 'error' && <TriangleAlert className="h-3 w-3 text-flare" />}
          {primary?.label || noun}: {status === 'loading' && 'loading'}
          {status === 'ready' &&
            (noCoverage
              ? 'no coverage in view'
              : `${view.segments} segment${view.segments === 1 ? '' : 's'} · ${view.names} named in view`)}
          {status === 'error' && 'unavailable'}
        </span>
        {status === 'error' && (
          <span className="w-fit max-w-xs border border-flare/50 bg-void/90 px-2 py-1 text-[10px] leading-snug text-silver">
            The detailed river network could not be loaded. Showing major rivers only.
          </span>
        )}
        {partialFailure && status === 'ready' && (
          <span className="w-fit max-w-xs border border-slate2 bg-void/90 px-2 py-1 text-[10px] text-darkgray">
            Some map tiles failed to load. Pan or zoom to retry.
          </span>
        )}
        {showHint && (
          <span className="w-fit border border-slate2/60 bg-void/80 px-2 py-1 text-[10px] text-dim">
            Showing major rivers. Zoom in for the detailed network.
          </span>
        )}
        {noCoverage && (
          <span className="w-fit max-w-xs border border-slate2 bg-void/90 px-2 py-1 text-[10px] leading-snug text-darkgray">
            NO COVERAGE here: no waterways are mapped in this view (open water, desert, or not
            loaded yet). That is not a measurement of the environment.
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="absolute right-3 top-3 z-[900] flex flex-col gap-1.5">
        {[
          { label: 'Zoom in', Icon: ZoomIn, fn: () => mapRef.current?.zoomIn() },
          { label: 'Zoom out', Icon: ZoomOut, fn: () => mapRef.current?.zoomOut() },
        ].map(({ label, Icon, fn }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={fn}
            className="flex h-11 w-11 items-center justify-center border border-slate2 bg-void/85 text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        {queryLayers.length > 0 && (
          <button
            ref={inspectBtnRef}
            type="button"
            aria-label={`Inspect the ${noun.toLowerCase()} nearest the map centre`}
            title="Inspect nearest waterway to the map centre"
            onClick={inspectCentre}
            className="flex h-11 w-11 items-center justify-center border border-slate2 bg-void/85 text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          aria-label={legendOpen ? 'Hide legend' : 'Show legend'}
          aria-expanded={legendOpen}
          onClick={() => setLegendOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center border border-slate2 bg-void/85 text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      {legendOpen && !selection && (
        <div
          data-testid="env-legend"
          className="absolute bottom-3 left-3 z-[900] max-w-[min(18rem,calc(100%-5.5rem))] space-y-2 border border-slate2 bg-void/90 p-2.5 backdrop-blur-md"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Legend</p>
          {activeDefs.map((d) => (
            <div key={d.id} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-5" style={{ background: d.swatch }} />
                <span className="text-[11px] font-bold text-silver">{d.label}</span>
                <TrustBadge kind={d.trust} />
              </div>
              <p className="text-[10px] leading-snug text-darkgray">{d.description}</p>
            </div>
          ))}
          {referenceLegend && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-flare" />
                <span className="text-[11px] font-bold text-silver">{referenceLegend.label}</span>
                <TrustBadge kind={referenceLegend.trust} />
              </div>
              <p className="text-[10px] leading-snug text-darkgray">
                {referenceLegend.description}
              </p>
            </div>
          )}
          <p className="border-t border-slate2/60 pt-1.5 text-[9px] leading-snug text-dim">
            Sources: {NE_ATTRIBUTION}; {VECTOR_ATTRIBUTION}. Reference geography, not a live
            reading.
          </p>
        </div>
      )}

      {/* Detail */}
      {selection && (
        <section
          ref={cardRef}
          tabIndex={-1}
          aria-label={
            selection.type === 'point'
              ? `${selection.point.label} details`
              : `${selection.name || 'Unnamed waterway'} details`
          }
          data-testid="env-detail"
          className="absolute bottom-3 left-3 right-16 z-[950] max-w-sm border border-slate2 bg-card/95 p-3 backdrop-blur-md focus:outline-none sm:right-auto"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {selection.type === 'waterway' && (
                <>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                    {selection.kind}
                  </p>
                  <h3 className="font-display text-base font-bold leading-tight text-silver">
                    {selection.name || 'Unnamed waterway'}
                  </h3>
                </>
              )}
              {selection.type === 'point' && (
                <>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                    {selection.point.subtitle}
                  </p>
                  <h3 className="font-display text-base font-bold leading-tight text-silver">
                    {selection.point.label}
                  </h3>
                </>
              )}
              {selection.type === 'none' && (
                <h3 className="font-display text-base font-bold leading-tight text-silver">
                  No {noun.toLowerCase()} near the map centre
                </h3>
              )}
            </div>
            <button
              type="button"
              aria-label={`Close ${noun.toLowerCase()} details`}
              onClick={closeSelection}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate2 text-silver transition-colors hover:border-flare hover:text-flare focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <dl className="mt-2 space-y-1 text-[11px]">
            {selection.type === 'waterway' && (
              <>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-dim">Data type</dt>
                  <dd className="text-silver">
                    <TrustBadge kind="reference" /> map geography
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-dim">Source</dt>
                  <dd className="text-silver">{selection.provider}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-dim">Live readings</dt>
                  <dd className="text-darkgray">
                    Unknown. No current measurements are connected for this waterway.
                  </dd>
                </div>
              </>
            )}
            {selection.type === 'point' &&
              selection.point.rows?.map((r) => (
                <div key={r.label} className="flex gap-2">
                  <dt className="w-24 shrink-0 text-dim">{r.label}</dt>
                  <dd className="text-silver">{r.value}</dd>
                </div>
              ))}
            {selection.type === 'point' && (
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-dim">Data type</dt>
                <dd className="text-silver">
                  <TrustBadge kind={selection.point.trust || 'illustrative'} />{' '}
                  {selection.point.trustNote}
                </dd>
              </div>
            )}
            {selection.lngLat && (
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-dim">Position</dt>
                <dd className="font-mono text-silver">
                  {selection.lngLat.lat.toFixed(3)}, {selection.lngLat.lng.toFixed(3)}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
