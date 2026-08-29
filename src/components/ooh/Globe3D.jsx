import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { ZoomIn, ZoomOut, Compass, RotateCw } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import GlobeHud from '@/components/ooh/GlobeHud';
import FieldStatsHud from '@/components/ooh/FieldStatsHud';
import { motion } from 'framer-motion';

import { thumbHTML, metaFor } from '@/components/ooh/map/LocationThumb';
import { drawGlyph, GLYPH_COLORS, PIN_TYPES } from '@/components/ooh/map/pinGlyphs';
import GlobeLayerManager from '@/components/ooh/map/layers/GlobeLayerManager';
import { useMapStyle } from '@/lib/mapStyleContext';
import { getStatusDotColor } from '@/lib/statusBadge';

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// Canvas-drawn field pin for the globe symbol layer — yellow disc,
// category-specific glyph (from the shared pinGlyphs library), micro-badge +
// status dot, pink radial glow.
function makePinIcon(type, selected, verified) {
  const S = 64;
  const badgeColor = GLYPH_COLORS[type] || GLYPH_COLORS.other;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const cx = S / 2,
    cy = S / 2;
  // pink radial highlight
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, S / 2);
  g.addColorStop(0, selected ? 'rgba(255,72,118,0.55)' : 'rgba(255,72,118,0.22)');
  g.addColorStop(1, 'rgba(255,72,118,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // disc
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#EDFF00';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  if (selected) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FF5C00';
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.stroke();
  }
  // category glyph (billboard, digital, transit, mural, etc.)
  drawGlyph(ctx, type, cx, cy, 16);
  // micro badge bottom-right
  const bx = cx + 14,
    by = cy + 14;
  ctx.beginPath();
  ctx.arc(bx, by, 8.5, 0, Math.PI * 2);
  ctx.fillStyle = badgeColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bx, by, 2.6, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  // status dot top-left
  ctx.beginPath();
  ctx.arc(cx - 14, cy - 14, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = verified ? '#39FF14' : '#FF5C00';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  return c;
}

function popupHTML(m) {
  const type = metaFor(m.type).label;
  const status = m.status || 'pending';
  return `
    <div style="width:220px;font-family:'Inter Tight',sans-serif">
      ${thumbHTML(m)}
      <div style="padding:10px 12px 12px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;font-weight:700;color:#EDFF00">${esc(type)}</span>
          <span style="width:5px;height:5px;border-radius:999px;background:${getStatusDotColor(status)}"></span>
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:hsl(var(--muted-foreground))">${esc(status)}</span>
        </div>
        <div style="font-weight:700;font-size:15px;color:hsl(var(--foreground));line-height:1.25">${esc(m.title)}</div>
        <div style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:4px;line-height:1.4">${esc(m.address || '')}</div>
        <div style="font-size:9px;color:hsl(var(--muted-foreground));margin-top:4px;font-family:monospace;opacity:0.8">${Number(m.lat).toFixed(4)}, ${Number(m.lng).toFixed(4)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}" target="_blank" rel="noreferrer" class="ooh-popup-btn ooh-popup-btn--flare">Directions ↗</a>
          <a href="/location/${esc(m.id)}" class="ooh-popup-btn ooh-popup-btn--ozone">Page ↗</a>
          ${m.link && /^https?:\/\//i.test(m.link) ? `<a href="${esc(m.link)}" target="_blank" rel="noreferrer" class="ooh-popup-btn ooh-popup-btn--ghost">OOH.EARTH ↗</a>` : ''}
        </div>
      </div>
    </div>`;
}

function buildFC(markers, selectedId) {
  return {
    type: 'FeatureCollection',
    features: markers
      .filter((m) => isFinite(m.lat) && isFinite(m.lng))
      .map((m) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
        properties: {
          id: m.id,
          title: m.title,
          type: m.type,
          address: m.address,
          status: m.status,
          image: m.image,
          link: m.link,
          lat: m.lat,
          lng: m.lng,
          selected: m.id === selectedId,
        },
      })),
  };
}

export default function Globe3D({
  markers,
  selectedId = null,
  hoverId = null,
  onSelect = null,
  userLoc = null,
  activeLayers = [],
  interactive = true,
  spin = false,
  scrollZoom = true,
  flyTo = null,
  onError = null,
  onCounts = null,
}) {
  const mapStyle = useMapStyle().style;
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const readyRef = useRef(false);
  const dataRef = useRef({ type: 'FeatureCollection', features: [] });
  const onSelectRef = useRef(onSelect);
  const userCenteredRef = useRef(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onCountsRef = useRef(onCounts);
  onCountsRef.current = onCounts;

  const [ready, setReady] = useState(false);
  const [spinning, setSpinning] = useState(spin);
  const [, setCounts] = useState({ spots: 0, clusters: 0, leads: 0, verified: 0 });

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetNorth = () => mapRef.current?.resetNorth();

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !spinning) return;
    let raf;
    let last = performance.now();
    const tick = (t) => {
      const dt = t - last;
      last = t;
      map.setBearing(map.getBearing() + dt * 0.01);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, spinning]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle.glStyle,
      center: [100.55, 13.746],
      zoom: 1.6,
      pitch: 25,
      maxPitch: 85,
      attributionControl: { compact: true },
      interactive,
    });
    mapRef.current = map;
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '260px',
    });

    if (!scrollZoom) {
      map.scrollZoom.disable();
      map.boxZoom.disable();
    }

    // Fail-fast: if the style fails to load (network/CORS), fall back to flat map
    let styleFailed = false;
    map.on('error', (e) => {
      // MapLibre fires error events for non-fatal things too; only bail if the
      // style itself hasn't loaded within a reasonable window.
      if (!readyRef.current && !styleFailed && e?.error?.status === 404) {
        styleFailed = true;
        onErrorRef.current?.();
      }
    });

    // Safety net: if the map hasn't fired "load" after 12s, the style URL is
    // unreachable — switch to the flat Leaflet map instead of a black void.
    const loadTimeout = setTimeout(() => {
      if (!readyRef.current) {
        onErrorRef.current?.();
      }
    }, 12000);

    const applyGlobe = () => {
      try {
        map.setProjection({ type: 'globe' });
      } catch (e) {}
      try {
        // Ported from the old (non-existent on installed maplibre-gl
        // 5.24.0) setFog() call -- SkySpecification's real field set is
        // smaller (confirmed against this repo's own installed
        // @maplibre/maplibre-gl-style-spec types, not guessed): no
        // range/star-intensity/space-color equivalent exists in this
        // version's sky API, so those are dropped rather than faked.
        // space-color (deep void) -> sky-color; high-color (dim
        // near-horizon tone) -> horizon-color; horizon-blend -> the
        // directly-equivalent sky-horizon-blend. atmosphere-blend has no
        // prior value to port from -- kept low (default is 0.8) to match
        // the original's understated, mostly-dark intent rather than a
        // bright default glow.
        map.setSky({
          'sky-color': '#000000',
          'horizon-color': '#1a1a1a',
          'sky-horizon-blend': 0.12,
          'atmosphere-blend': 0.3,
        });
      } catch (e) {}
    };
    map.on('load', () => {
      applyGlobe();
      map.on('style.load', applyGlobe);
      map.addSource('ooh-markers', {
        type: 'geojson',
        data: /** @type {GeoJSON.GeoJSON} */ (dataRef.current),
        cluster: true,
        clusterRadius: 52,
        clusterMaxZoom: 14,
      });
      PIN_TYPES.forEach((t) => {
        const a = makePinIcon(t, false, false);
        map.addImage(`ooh-pin-${t}`, a.getContext('2d').getImageData(0, 0, a.width, a.height), {
          pixelRatio: 1,
        });
        const b = makePinIcon(t, true, false);
        map.addImage(`ooh-pin-${t}-sel`, b.getContext('2d').getImageData(0, 0, b.width, b.height), {
          pixelRatio: 1,
        });
      });
      // cluster discs — dark core, ozone ring, live count (military-grade)
      map.addLayer({
        id: 'ooh-clusters',
        type: 'circle',
        source: 'ooh-markers',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 25, 100, 30],
          'circle-color': '#0a0a0a',
          'circle-stroke-color': '#EDFF00',
          'circle-stroke-width': 2,
          'circle-blur': 0.08,
        },
      });
      map.addLayer({
        id: 'ooh-cluster-count',
        type: 'symbol',
        source: 'ooh-markers',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 13,
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#EDFF00', 'text-halo-color': '#000', 'text-halo-width': 1.5 },
      });
      // individual field pins (unclustered only)
      map.addLayer({
        id: 'ooh-markers',
        type: 'symbol',
        source: 'ooh-markers',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': [
            'case',
            ['==', ['get', 'selected'], true],
            ['concat', 'ooh-pin-', ['get', 'type'], '-sel'],
            ['concat', 'ooh-pin-', ['get', 'type']],
          ],
          'icon-size': ['case', ['==', ['get', 'selected'], true], 0.95, 0.78],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });

      map.on('click', 'ooh-markers', (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        const coords = /** @type {GeoJSON.Point} */ (f.geometry).coordinates.slice();
        popupRef.current.setLngLat(coords).setHTML(popupHTML(p)).addTo(map);
        onSelectRef.current?.(p.id);
      });
      map.on('mouseenter', 'ooh-markers', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'ooh-markers', () => {
        map.getCanvas().style.cursor = '';
      });

      // cluster click → expand to reveal contained pins
      map.on('click', 'ooh-clusters', (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const cid = f.properties.cluster_id;
        /** @type {import("maplibre-gl").GeoJSONSource} */
        const src = /** @type {any} */ (map.getSource('ooh-markers'));
        const coords = /** @type {[number, number]} */ (
          /** @type {GeoJSON.Point} */ (f.geometry).coordinates
        );
        if (src && src.getClusterExpansionZoom) {
          src
            .getClusterExpansionZoom(cid)
            .then((z) => {
              map.flyTo({ center: coords, zoom: Math.max(z, map.getZoom() + 1), duration: 700 });
            })
            .catch(() => {
              map.flyTo({ center: coords, zoom: map.getZoom() + 2, duration: 700 });
            });
        } else {
          map.flyTo({ center: coords, zoom: map.getZoom() + 2, duration: 700 });
        }
      });
      map.on('mouseenter', 'ooh-clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'ooh-clusters', () => {
        map.getCanvas().style.cursor = '';
      });

      readyRef.current = true;
      setReady(true);
      /** @type {import("maplibre-gl").GeoJSONSource} */ (map.getSource('ooh-markers')).setData(
        /** @type {GeoJSON.GeoJSON} */ (dataRef.current),
      );
    });

    return () => {
      clearTimeout(loadTimeout);
      readyRef.current = false;
      map.remove();
    };
  }, []);

  // Toggle ad-spot layer visibility based on "ads" in activeLayers
  useEffect(() => {
    const map = mapRef.current;
    if (!readyRef.current || !map) return;
    const vis = activeLayers.some((l) => l === 'ads' || l === 'adbusting' || l === 'graffiti')
      ? 'visible'
      : 'none';
    ['ooh-markers', 'ooh-clusters', 'ooh-cluster-count'].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
    });
  }, [activeLayers, ready]);

  useEffect(() => {
    dataRef.current = buildFC(markers, selectedId);
    const map = mapRef.current;
    if (readyRef.current && map && map.getSource('ooh-markers')) {
      /** @type {import("maplibre-gl").GeoJSONSource} */ (map.getSource('ooh-markers')).setData(
        /** @type {GeoJSON.GeoJSON} */ (dataRef.current),
      );
    }
    if (selectedId && readyRef.current && map) {
      const m = markers.find((x) => x.id === selectedId);
      if (m && isFinite(m.lat) && isFinite(m.lng)) {
        map.flyTo({ center: [m.lng, m.lat], zoom: Math.max(map.getZoom(), 6), duration: 700 });
        popupRef.current.setLngLat([m.lng, m.lat]).setHTML(popupHTML(m)).addTo(map);
      }
    }
  }, [markers, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!readyRef.current || !map || !hoverId || hoverId === selectedId) return;
    const m = markers.find((x) => x.id === hoverId);
    if (m && isFinite(m.lat) && isFinite(m.lng)) {
      map.flyTo({
        center: [m.lng, m.lat],
        zoom: Math.max(map.getZoom(), 13),
        duration: 900,
        essential: true,
      });
    }
  }, [hoverId, selectedId, markers, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!readyRef.current || !map) return;
    const recompute = () => {
      try {
        const cl = map.queryRenderedFeatures({ layers: ['ooh-clusters'] });
        const all = markers;
        const leads = all.filter((m) => !m.image && m.status !== 'verified').length;
        const verified = all.filter((m) => m.status === 'verified').length;
        const c = { spots: all.length, clusters: cl.length, leads, verified };
        setCounts(c);
        onCountsRef.current?.(c);
      } catch (e) {}
    };
    recompute();
    map.on('moveend', recompute);
    map.on('zoomend', recompute);
    map.on('sourcedata', recompute);
    return () => {
      map.off('moveend', recompute);
      map.off('zoomend', recompute);
      map.off('sourcedata', recompute);
    };
  }, [ready, markers]);

  // Geocode fly-to from the search bar (nonce re-triggers on re-select)
  useEffect(() => {
    const map = mapRef.current;
    if (!readyRef.current || !map || !flyTo || !flyTo.nonce) return;
    map.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: Math.max(map.getZoom(), 5),
      duration: 1200,
      essential: true,
    });
  }, [flyTo, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!userLoc || !readyRef.current || !map || userCenteredRef.current) return;
    userCenteredRef.current = true;
    const pt = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [userLoc.lng, userLoc.lat] },
      properties: {},
    };
    if (!map.getSource('ooh-user')) {
      map.addSource('ooh-user', { type: 'geojson', data: pt });
      map.addLayer({
        id: 'ooh-user',
        type: 'circle',
        source: 'ooh-user',
        paint: {
          'circle-radius': 8,
          'circle-color': '#1F51FF',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-blur': 0.2,
        },
      });
    } else {
      map.getSource('ooh-user').setData(pt);
    }
    map.flyTo({
      center: [userLoc.lng, userLoc.lat],
      zoom: Math.max(map.getZoom(), 12),
      duration: 800,
    });
  }, [userLoc, ready]);

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        className={`h-full w-full ${mapStyle.tint ? 'ooh-globe-style-matrix' : ''}`}
        style={{ background: mapStyle.bg }}
      />
      {!ready && (
        <div
          className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center"
          style={{ background: mapStyle.bg }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate2 border-t-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
              Initializing globe…
            </span>
          </div>
        </div>
      )}

      {/* military-grade surveillance grid overlay */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ozone/10" />
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ozone/[0.06]" />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'conic-gradient(from 0deg, rgba(237,255,0,0.10), transparent 22%)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute left-3 top-3 h-4 w-4 border-l border-t border-ozone/40" />
        <div className="absolute right-3 top-3 h-4 w-4 border-r border-t border-ozone/40" />
        <div className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-ozone/40" />
        <div className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-ozone/40" />
      </div>

      {interactive && (
        <div className="pointer-events-none absolute bottom-12 left-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 border border-slate2/70 bg-void/85 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray backdrop-blur-sm">
            <span className="text-ozone/80">⊙</span>
            <span>
              {scrollZoom
                ? 'drag · scroll to zoom · click a marker'
                : 'drag to rotate · click marker · + / − keys zoom'}
            </span>
          </div>
          {!scrollZoom && (
            <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">
              <span className="rounded-sm border border-slate2/60 px-1 py-0.5 text-silver/70">
                +
              </span>
              <span className="rounded-sm border border-slate2/60 px-1 py-0.5 text-silver/70">
                −
              </span>
              <span>click globe first, then zoom</span>
            </div>
          )}
        </div>
      )}
      {interactive && (
        <div className="absolute bottom-12 right-3 z-[1000] flex flex-col gap-1.5">
          <button
            onClick={zoomIn}
            aria-label="Zoom in"
            className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/80 font-mono text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={zoomOut}
            aria-label="Zoom out"
            className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/80 font-mono text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={resetNorth}
            aria-label="Reset north"
            className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/80 font-mono text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
          >
            <Compass className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSpinning((s) => !s)}
            aria-label="Auto-spin"
            className={`flex h-9 w-9 items-center justify-center border bg-void/80 font-mono backdrop-blur-md transition-colors ${spinning ? 'border-ozone text-ozone' : 'border-slate2 text-darkgray hover:border-ozone hover:text-ozone'}`}
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      )}
      {ready && mapRef.current && (
        <GlobeLayerManager map={mapRef.current} activeLayers={activeLayers} />
      )}
      {ready && <GlobeHud map={mapRef.current} />}
      {ready && <FieldStatsHud />}
    </div>
  );
}
