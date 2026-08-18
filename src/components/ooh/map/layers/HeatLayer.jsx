import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

// Screen-pixel search radius for "click a hotspot" -> nearest report. Pixels
// (not meters) so the hit area feels the same size on screen at any zoom.
const CLICK_HIT_RADIUS_PX = 32;

// Report-density heat map -- a Leaflet canvas layer built directly from the
// same marker data already loaded for the pins (no new entity, no backend
// query). Answers "where is activity concentrated" at a glance; the existing
// pins remain untouched underneath so a user can still open any individual
// report. Toggled through the same activeLayers mechanism as every other
// map layer (see LayerManager.jsx / MapLayerToggle.jsx).
//
// The heat canvas itself has no click handling of its own (leaflet.heat is a
// pure visualization) -- clicking it was previously a dead end. A map click
// near a real point now opens that report the same way tapping its pin
// directly already does (onExpandPin -- selects it, flies to it, and opens
// the mobile detail sheet), so a hotspot is a way *into* the data, not just
// a picture of it.
export default function HeatLayer({ pins = [], onExpandPin }) {
  const map = useMap();

  useEffect(() => {
    if (!onExpandPin) return undefined;
    const handleClick = (e) => {
      const clickPt = map.latLngToContainerPoint(e.latlng);
      let nearest = null;
      let nearestDist = Infinity;
      for (const m of pins) {
        if (!isFinite(m.lat) || !isFinite(m.lng)) continue;
        const p = map.latLngToContainerPoint([m.lat, m.lng]);
        const d = Math.hypot(p.x - clickPt.x, p.y - clickPt.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = m;
        }
      }
      if (nearest && nearestDist <= CLICK_HIT_RADIUS_PX) onExpandPin(nearest);
    };
    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, pins, onExpandPin]);

  useEffect(() => {
    /** @type {[number, number, number][]} */
    const points = pins
      .filter((m) => isFinite(m.lat) && isFinite(m.lng))
      .map((m) => [m.lat, m.lng, 0.6]);
    if (!points.length) return undefined;

    // leaflet.heat sizes its canvas from map.getSize() at creation time --
    // if the container's size hasn't been cached yet (e.g. this layer is
    // toggled on immediately after the map mounts), that can be zero,
    // producing a canvas with no layout box. invalidateSize() forces Leaflet
    // to recompute it first; cheap no-op if already correct. The same class
    // of stale-size issue is already guarded against for flyTo in
    // LocationMap.jsx's safeFlyTo().
    map.invalidateSize({ animate: false });

    const heat = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 16,
      gradient: { 0.2: '#1F51FF', 0.5: '#EDFF00', 0.8: '#FF5C00', 1.0: '#FF0040' },
    }).addTo(map);

    // A legend as a Leaflet control keeps it inside the map's own responsive
    // layout (works on mobile for free) instead of a separate absolutely
    // positioned DOM element layered on top of Map.jsx.
    // @types/leaflet only declares `L.control` as a namespace of static
    // factories (L.control.layers, etc.), not as a call signature of its
    // own -- even though it's a real, documented Leaflet factory function
    // at runtime. Cast to bypass the type-only gap.
    const controlFactory = /** @type {unknown} */ (L.control);
    const legend = /** @type {(opts: L.ControlOptions) => L.Control} */ (controlFactory)({
      position: 'bottomleft',
    });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'ooh-heat-legend');
      div.style.cssText =
        'background:rgba(10,10,10,0.85);border:1px solid rgba(237,255,0,0.3);padding:6px 9px;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:#EDFF00;pointer-events:none';
      div.innerHTML =
        '<div style="margin-bottom:3px">Report density</div>' +
        '<div style="width:100px;height:6px;background:linear-gradient(90deg,#1F51FF,#EDFF00,#FF5C00,#FF0040);border:1px solid #000"></div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:2px;color:#999;font-size:7px">' +
        '<span>Low</span><span>High</span></div>' +
        '<div style="margin-top:4px;color:#999;font-size:7px;normal-case">Click a hotspot to open the nearest report</div>';
      return div;
    };
    legend.addTo(map);

    return () => {
      map.removeLayer(heat);
      legend.remove();
    };
  }, [map, pins]);

  return null;
}
