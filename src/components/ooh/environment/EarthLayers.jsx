import { useEffect, useMemo, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useObservations, OBS_GROUPS, OBS_MIN_ZOOM, describeAge } from './useObservations';

// Shared environmental context for every public LocationMap and Globe3D consumer. No entity writes.
// Rivers are a static, generalised reference; observations are dated records, never habitat claims.
const SOURCE = 'ooh-earth-reference';
const LINE = 'ooh-earth-rivers';
const NAMES = 'ooh-earth-river-names';
const POINT_SOURCE = 'ooh-earth-observations';
const POINT_LAYER = 'ooh-earth-observation-pins';
const EMPTY = { type: 'FeatureCollection', features: [] };
let geography;
const loadRivers = () =>
  (geography ||= import('./data/naturalEarthRivers.json').then((m) => m.default));

function readViewport(map, engine) {
  const b = map.getBounds();
  return {
    zoom: map.getZoom(),
    bounds: { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() },
    engine,
  };
}

function recordContent(p) {
  // Provider text is never interpreted as HTML; a source URL was allowlisted by the adapter.
  const box = document.createElement('div');
  box.style.cssText = 'max-width:240px;font-size:12px;line-height:1.5';
  for (const text of [
    p.name,
    `${OBS_GROUPS[p.group].label} · dated community observation`,
    p.scientific,
    `Observed: ${describeAge(p.observedOn)}`,
    `Position accuracy: ${p.accuracy === null ? 'unknown; not an exact location' : `±${p.accuracy} m`}`,
    `Retrieved: ${p.retrievedAt}`,
    `Licence: ${p.license || 'not specified'}`,
  ]) {
    const line = document.createElement('p');
    line.textContent = text;
    box.append(line);
  }
  if (p.uri) {
    const link = document.createElement('a');
    link.href = p.uri;
    link.textContent = 'View on iNaturalist';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    box.append(link);
  }
  return box;
}

function EarthLayers({ map, engine, interactive = true }) {
  const [rivers, setRivers] = useState(true);
  const [groups, setGroups] = useState([]);
  const [viewport, setViewport] = useState(null);
  const [moving, setMoving] = useState(false);
  const [open, setOpen] = useState(false);
  const [riverError, setRiverError] = useState(false);
  const panelRef = useRef(null);
  const popupRef = useRef(null);
  const obs = useObservations(viewport, groups, moving);
  const pointsRef = useRef(obs.points);
  pointsRef.current = obs.points;

  useEffect(() => {
    if (!map) return undefined;
    const start = () => {
      setMoving(true);
      popupRef.current?.remove?.();
    };
    const end = () => {
      setMoving(false);
      setViewport(readViewport(map, engine));
    };
    map.on('movestart', start);
    map.on('moveend', end);
    end();
    return () => {
      map.off('movestart', start);
      map.off('moveend', end);
    };
  }, [map, engine]);

  useEffect(() => {
    if (panelRef.current && engine === 'leaflet') {
      L.DomEvent.disableClickPropagation(panelRef.current);
      L.DomEvent.disableScrollPropagation(panelRef.current);
    }
  }, [engine, open]);

  useEffect(() => {
    let disposed = false;
    let layer;
    let onZoom;
    if (!map || !rivers) return undefined;
    loadRivers()
      .then((data) => {
        if (disposed) return;
        if (engine === 'leaflet') {
          layer = L.geoJSON(data, {
            style: { color: '#4D8DFF', weight: 2, opacity: 0.85 },
            onEachFeature: (feature, item) => {
              const label = document.createElement('span');
              label.textContent = `${feature.properties.name} · Natural Earth reference (generalised)`;
              item.bindTooltip(label, { sticky: true });
            },
          });
          const show = () => {
            if (map.getZoom() < 6) layer.addTo(map);
            else if (map.hasLayer(layer)) map.removeLayer(layer);
          };
          onZoom = show;
          map.on('zoomend', show);
          show();
        } else {
          map.addSource(SOURCE, {
            type: 'geojson',
            data,
            attribution: 'Natural Earth (public domain)',
          });
          map.addLayer({
            id: LINE,
            type: 'line',
            source: SOURCE,
            maxzoom: 6,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#4D8DFF', 'line-width': 1.8, 'line-opacity': 0.85 },
          });
          if (map.getStyle().glyphs)
            map.addLayer({
              id: NAMES,
              type: 'symbol',
              source: SOURCE,
              minzoom: 2.2,
              maxzoom: 6,
              layout: {
                'symbol-placement': 'line',
                'text-field': ['get', 'name'],
                'text-size': 12,
                'text-font': ['Open Sans Regular'],
                'symbol-spacing': 200,
              },
              paint: {
                'text-color': '#91B8FF',
                'text-halo-color': '#080C14',
                'text-halo-width': 1.5,
              },
            });
          // Rivers stay behind advertising and observation pins.
          const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
          if (firstSymbol) map.moveLayer(LINE, firstSymbol);
        }
      })
      .catch(() => {
        if (!disposed) setRiverError(true);
      });
    return () => {
      disposed = true;
      if (engine === 'leaflet' && layer) {
        map.off('zoomend', onZoom);
        map.removeLayer(layer);
      } else if (engine !== 'leaflet' && !map._removed) {
        if (map.getLayer(NAMES)) map.removeLayer(NAMES);
        if (map.getLayer(LINE)) map.removeLayer(LINE);
        if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      }
    };
  }, [map, engine, rivers]);

  useEffect(() => {
    if (!map) return undefined;
    if (engine === 'leaflet') {
      const layer = L.layerGroup(
        obs.points.map((p) =>
          L.circleMarker([p.lat, p.lng], {
            radius: 7,
            color: '#080C14',
            weight: 2,
            fillColor: OBS_GROUPS[p.group].color,
            fillOpacity: 0.95,
          }).bindPopup(recordContent(p)),
        ),
      ).addTo(map);
      return () => {
        map.removeLayer(layer);
      };
    }
    map.addSource(POINT_SOURCE, { type: 'geojson', data: EMPTY });
    map.addLayer({
      id: POINT_LAYER,
      type: 'circle',
      source: POINT_SOURCE,
      paint: {
        'circle-radius': 7,
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#080C14',
        'circle-stroke-width': 2,
      },
    });
    const click = async (e) => {
      const p = pointsRef.current.find((item) => item.id === e.features?.[0]?.properties?.id);
      if (!p) return;
      const { Popup } = await import('maplibre-gl');
      if (map._removed || !pointsRef.current.some((item) => item.id === p.id)) return;
      popupRef.current?.remove();
      popupRef.current = new Popup({ offset: 12, maxWidth: '260px' })
        .setLngLat([p.lng, p.lat])
        .setDOMContent(recordContent(p))
        .addTo(map);
    };
    map.on('click', POINT_LAYER, click);
    return () => {
      popupRef.current?.remove();
      if (map._removed) return;
      map.off('click', POINT_LAYER, click);
      if (map.getLayer(POINT_LAYER)) map.removeLayer(POINT_LAYER);
      if (map.getSource(POINT_SOURCE)) map.removeSource(POINT_SOURCE);
    };
    // Leaflet markers update through this effect; MapLibre data updates without recreating its handlers.
  }, [map, engine, engine === 'leaflet' ? obs.points : null]);

  useEffect(() => {
    if (engine === 'leaflet') return;
    map?.getSource(POINT_SOURCE)?.setData({
      type: 'FeatureCollection',
      features: obs.points.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: p.id, color: OBS_GROUPS[p.group].color },
      })),
    });
  }, [map, engine, obs.points]);

  const message = useMemo(() => {
    if (!groups.length)
      return rivers ? 'Major rivers · reference geography' : 'Environmental layers off';
    if (moving) return 'Map moving; observations load after it settles.';
    if (obs.status === 'zoom') return `Zoom in to load observations (zoom ${OBS_MIN_ZOOM}+).`;
    if (obs.status === 'error') return 'iNaturalist unavailable. No observations loaded.';
    if (obs.status === 'loading') return 'Loading dated observations…';
    return `${obs.points.length} dated observations; not a wildlife census.`;
  }, [groups.length, obs.status, obs.points.length, rivers, moving]);

  if (!interactive) return null;
  return (
    <div
      ref={panelRef}
      data-testid="earth-layers"
      data-engine={engine}
      data-observations={obs.points.length}
      className="absolute bottom-12 left-3 z-[900] max-w-[min(18rem,calc(100%-5.5rem))] border border-slate2 bg-void/90 p-2 text-silver backdrop-blur-md"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="min-h-11 text-left font-mono text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
      >
        Earth layers
      </button>
      {open && (
        <div className="max-h-52 space-y-1 overflow-y-auto" data-testid="earth-layer-options">
          <button
            type="button"
            aria-pressed={rivers}
            onClick={() => setRivers((v) => !v)}
            className="block min-h-11 text-[11px]"
          >
            Major rivers · reference
          </button>
          {Object.values(OBS_GROUPS).map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={groups.includes(g.id)}
              onClick={() =>
                setGroups((current) =>
                  current.includes(g.id) ? current.filter((id) => id !== g.id) : [...current, g.id],
                )
              }
              className="block min-h-11 text-[11px]"
              style={{ color: g.color }}
            >
              {g.label} · observations
            </button>
          ))}
          <p className="text-[10px]">
            Natural Earth: generalised major rivers, not exact channels. At zoom 6+ use the detailed
            Rivers map. iNaturalist: research-grade records from the last 180 days, at most 100 per
            group. Location accuracy varies. No photos or private locations. On activation,
            iNaturalist receives the viewed map bounds and network metadata; no OOH account
            identifiers are sent.
          </p>
          <a href="/rivers" className="inline-block min-h-11 py-3 text-[11px] underline">
            Detailed rivers and observed stations
          </a>
          <a href="/ecology" className="inline-block min-h-11 py-3 text-[11px] underline">
            Ecology records and source details
          </a>
        </div>
      )}
      <p role="status" className="max-w-64 text-[10px]">
        {message}
        {obs.note && ` ${obs.note}`}
        {riverError && ' River reference unavailable.'}
      </p>
    </div>
  );
}

export function LeafletEarthLayers() {
  const map = useMap();
  return <EarthLayers map={map} engine="leaflet" />;
}
export function GlobeEarthLayers({ map, interactive }) {
  return <EarthLayers map={map} engine="maplibre" interactive={interactive} />;
}
