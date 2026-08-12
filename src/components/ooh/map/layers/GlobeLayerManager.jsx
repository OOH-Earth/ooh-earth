import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMushroomData } from './useMushroomData';
import { useFloraData } from './useFloraData';
import { useWarZoneData } from './useWarZoneData';
import { riversToGeoJSON, riverSourcesToGeoJSON, POLLUTION_META } from './riverData';
import { RADIO_STATIONS } from '@/components/ooh/radio/radioStations';
import { useRadio } from '@/lib/radioContext';

// GlobeLayerManager — adds/removes MapLibre GL sources and layers on the 3D
// globe based on which layer IDs are active. Must receive the ready map instance.
//
// Layer IDs: "rivers" | "mushrooms" | "flora" | "war"
// Each layer manages its own source + render layers + popup handlers.
// Event handlers are stored so they can be properly removed on cleanup.

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// Module-level handler storage — allows remove functions to off() handlers
const handlers = {};

function removeLayerAndSource(map, layerId, sourceId) {
  if (!map || map._removed) return;
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

// ---- Rivers ----
function addRivers(map, popup) {
  const rivers = riversToGeoJSON();
  const sources = riverSourcesToGeoJSON();

  map.addSource('ooh-rivers', { type: 'geojson', data: rivers });
  map.addLayer({
    id: 'ooh-river-lines',
    type: 'line',
    source: 'ooh-rivers',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#39FF14', 'line-width': 2.5, 'line-opacity': 0.7 },
  });

  map.addSource('ooh-river-sources', { type: 'geojson', data: sources });
  map.addLayer({
    id: 'ooh-river-source-markers',
    type: 'circle',
    source: 'ooh-river-sources',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'wqi'], 0, 12, 50, 9, 100, 7],
      'circle-color': ['get', 'color'],
      'circle-stroke-color': '#000',
      'circle-stroke-width': 2,
      'circle-opacity': 0.7,
    },
  });

  handlers.rivers = {
    click: (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties;
      const meta = POLLUTION_META[p.pollution] || { color: '#B2B2B2', label: 'Unknown' };
      popup
        .setLngLat(f.geometry.coordinates.slice())
        .setHTML(
          `
        <div style="width:200px;font-family:'Inter Tight',sans-serif">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:${meta.color};font-weight:700">${meta.label} Pollution</span>
          </div>
          <div style="font-weight:700;font-size:14px;color:hsl(var(--foreground));line-height:1.25">${esc(p.name)}</div>
          <div style="font-size:11px;color:hsl(var(--muted-foreground));margin-top:2px">${esc(p.river)} · Source Monitoring Station</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
            <div style="border:1px solid rgba(241,241,241,0.1);padding:4px 6px">
              <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.15em;color:hsl(var(--muted-foreground))">WQI</div>
              <div style="font-size:16px;font-weight:700;font-family:monospace;color:${meta.color}">${p.wqi}</div>
            </div>
            <div style="border:1px solid rgba(241,241,241,0.1);padding:4px 6px">
              <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.15em;color:hsl(var(--muted-foreground))">pH</div>
              <div style="font-size:16px;font-weight:700;font-family:monospace;color:hsl(var(--foreground))">${p.ph}</div>
            </div>
            <div style="border:1px solid rgba(241,241,241,0.1);padding:4px 6px">
              <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.15em;color:hsl(var(--muted-foreground))">Turbidity</div>
              <div style="font-size:16px;font-weight:700;font-family:monospace;color:hsl(var(--foreground))">${p.turbidity}<span style="font-size:8"> NTU</span></div>
            </div>
            <div style="border:1px solid rgba(241,241,241,0.1);padding:4px 6px">
              <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.15em;color:hsl(var(--muted-foreground))">Status</div>
              <div style="font-size:10px;font-weight:700;color:${meta.color};text-transform:uppercase">${meta.label}</div>
            </div>
          </div>
          <div style="font-size:10px;color:hsl(var(--foreground));margin-top:8px;line-height:1.45;opacity:0.85">${esc(p.notes)}</div>
          <div style="font-size:8px;color:hsl(var(--muted-foreground));margin-top:8px;text-transform:uppercase;letter-spacing:0.15em">Benchmarked: WHO Drinking Water · SDG 6.3</div>
        </div>
      `,
        )
        .addTo(map);
    },
    mouseenter: () => {
      map.getCanvas().style.cursor = 'pointer';
    },
    mouseleave: () => {
      map.getCanvas().style.cursor = '';
    },
  };

  map.on('click', 'ooh-river-source-markers', handlers.rivers.click);
  map.on('mouseenter', 'ooh-river-source-markers', handlers.rivers.mouseenter);
  map.on('mouseleave', 'ooh-river-source-markers', handlers.rivers.mouseleave);
}

function removeRivers(map) {
  if (!map || map._removed) return;
  if (handlers.rivers) {
    map.off('click', 'ooh-river-source-markers', handlers.rivers.click);
    map.off('mouseenter', 'ooh-river-source-markers', handlers.rivers.mouseenter);
    map.off('mouseleave', 'ooh-river-source-markers', handlers.rivers.mouseleave);
    handlers.rivers = null;
  }
  removeLayerAndSource(map, 'ooh-river-source-markers', 'ooh-river-sources');
  removeLayerAndSource(map, 'ooh-river-lines', 'ooh-rivers');
}

// ---- Mushrooms ----
function mushroomPopupHTML(p) {
  return `
    <div style="width:180px;font-family:'Inter Tight',sans-serif">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:#FF5C00;font-weight:700">Mushroom Index</span>
      </div>
      <div style="font-weight:700;font-size:14px;color:hsl(var(--foreground))">${esc(p.region || 'Unknown')}</div>
      <div style="font-size:11px;color:#FF5C00;margin-top:4px;font-style:italic">${esc(p.species)}</div>
      ${p.habitat ? `<div style="font-size:10px;color:hsl(var(--muted-foreground));margin-top:4px"><span style="text-transform:uppercase;letter-spacing:0.1em;font-weight:700;font-size:8">Habitat</span><br/>${esc(p.habitat)}</div>` : ''}
      ${p.note ? `<div style="font-size:10px;color:hsl(var(--muted-foreground));margin-top:4px;line-height:1.4">${esc(p.note)}</div>` : ''}
    </div>`;
}

function mushroomFC(spots) {
  return {
    type: 'FeatureCollection',
    features: spots
      .filter((s) => isFinite(s.lat) && isFinite(s.lng))
      .map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: { species: s.species, habitat: s.habitat, note: s.note, region: s.region },
      })),
  };
}

function addMushrooms(map, popup, spots) {
  map.addSource('ooh-mushrooms', { type: 'geojson', data: mushroomFC(spots) });
  map.addLayer({
    id: 'ooh-mushroom-markers',
    type: 'circle',
    source: 'ooh-mushrooms',
    paint: {
      'circle-radius': 7,
      'circle-color': '#FF5C00',
      'circle-stroke-color': '#000',
      'circle-stroke-width': 2,
      'circle-opacity': 0.65,
    },
  });

  handlers.mushrooms = {
    click: (e) => {
      const f = e.features?.[0];
      if (!f) return;
      popup
        .setLngLat(f.geometry.coordinates.slice())
        .setHTML(mushroomPopupHTML(f.properties))
        .addTo(map);
    },
    mouseenter: () => {
      map.getCanvas().style.cursor = 'pointer';
    },
    mouseleave: () => {
      map.getCanvas().style.cursor = '';
    },
  };

  map.on('click', 'ooh-mushroom-markers', handlers.mushrooms.click);
  map.on('mouseenter', 'ooh-mushroom-markers', handlers.mushrooms.mouseenter);
  map.on('mouseleave', 'ooh-mushroom-markers', handlers.mushrooms.mouseleave);
}

function removeMushrooms(map) {
  if (!map || map._removed) return;
  if (handlers.mushrooms) {
    map.off('click', 'ooh-mushroom-markers', handlers.mushrooms.click);
    map.off('mouseenter', 'ooh-mushroom-markers', handlers.mushrooms.mouseenter);
    map.off('mouseleave', 'ooh-mushroom-markers', handlers.mushrooms.mouseleave);
    handlers.mushrooms = null;
  }
  removeLayerAndSource(map, 'ooh-mushroom-markers', 'ooh-mushrooms');
}

// ---- Flora ----
function floraPopupHTML(p) {
  return `
    <div style="width:180px;font-family:'Inter Tight',sans-serif">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:#39FF14;font-weight:700">Flora Index</span>
      </div>
      <div style="font-weight:700;font-size:14px;color:hsl(var(--foreground))">${esc(p.region || 'Unknown')}</div>
      <div style="font-size:11px;color:#39FF14;margin-top:4px;font-style:italic">${esc(p.species)}</div>
      ${p.ecosystem ? `<div style="font-size:10px;color:hsl(var(--muted-foreground));margin-top:4px"><span style="text-transform:uppercase;letter-spacing:0.1em;font-weight:700;font-size:8">Ecosystem</span><br/>${esc(p.ecosystem)}</div>` : ''}
      ${p.note ? `<div style="font-size:10px;color:hsl(var(--muted-foreground));margin-top:4px;line-height:1.4">${esc(p.note)}</div>` : ''}
    </div>`;
}

function floraFC(spots) {
  return {
    type: 'FeatureCollection',
    features: spots
      .filter((s) => isFinite(s.lat) && isFinite(s.lng))
      .map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: { species: s.species, ecosystem: s.ecosystem, note: s.note, region: s.region },
      })),
  };
}

function addFlora(map, popup, spots) {
  map.addSource('ooh-flora', { type: 'geojson', data: floraFC(spots) });
  map.addLayer({
    id: 'ooh-flora-markers',
    type: 'circle',
    source: 'ooh-flora',
    paint: {
      'circle-radius': 7,
      'circle-color': '#39FF14',
      'circle-stroke-color': '#000',
      'circle-stroke-width': 2,
      'circle-opacity': 0.55,
    },
  });

  handlers.flora = {
    click: (e) => {
      const f = e.features?.[0];
      if (!f) return;
      popup
        .setLngLat(f.geometry.coordinates.slice())
        .setHTML(floraPopupHTML(f.properties))
        .addTo(map);
    },
    mouseenter: () => {
      map.getCanvas().style.cursor = 'pointer';
    },
    mouseleave: () => {
      map.getCanvas().style.cursor = '';
    },
  };

  map.on('click', 'ooh-flora-markers', handlers.flora.click);
  map.on('mouseenter', 'ooh-flora-markers', handlers.flora.mouseenter);
  map.on('mouseleave', 'ooh-flora-markers', handlers.flora.mouseleave);
}

function removeFlora(map) {
  if (!map || map._removed) return;
  if (handlers.flora) {
    map.off('click', 'ooh-flora-markers', handlers.flora.click);
    map.off('mouseenter', 'ooh-flora-markers', handlers.flora.mouseenter);
    map.off('mouseleave', 'ooh-flora-markers', handlers.flora.mouseleave);
    handlers.flora = null;
  }
  removeLayerAndSource(map, 'ooh-flora-markers', 'ooh-flora');
}

// ---- War Zones ----
function warPopupHTML(z) {
  const critical = z.severity === 'critical';
  const color = critical ? '#FF0040' : '#FF5C00';
  return `
    <div style="width:200px;font-family:'Inter Tight',sans-serif">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:${color};font-weight:700">${critical ? 'Critical Zone' : 'Advisory'}</span>
      </div>
      <div style="font-weight:700;font-size:14px;color:hsl(var(--foreground));line-height:1.25">${esc(z.title)}</div>
      ${z.region ? `<div style="font-size:11px;color:hsl(var(--muted-foreground));margin-top:3px">${esc(z.region)}</div>` : ''}
      ${z.advisory ? `<div style="font-size:10px;color:hsl(var(--foreground));margin-top:6px;line-height:1.45;opacity:0.85">${esc(z.advisory)}</div>` : ''}
      ${z.source ? `<div style="font-size:8px;color:hsl(var(--muted-foreground));margin-top:8px;text-transform:uppercase;letter-spacing:0.15em">Src: ${esc(z.source)}</div>` : ''}
    </div>`;
}

function warFC(zones) {
  return {
    type: 'FeatureCollection',
    features: zones
      .filter((z) => isFinite(z.lat) && isFinite(z.lng))
      .map((z) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [z.lng, z.lat] },
        properties: {
          title: z.title,
          region: z.region,
          advisory: z.advisory,
          severity: z.severity,
          source: z.source,
        },
      })),
  };
}

function addWarZones(map, popup, zones) {
  map.addSource('ooh-warzones', { type: 'geojson', data: warFC(zones) });
  map.addLayer({
    id: 'ooh-warzone-markers',
    type: 'circle',
    source: 'ooh-warzones',
    paint: {
      'circle-radius': ['case', ['==', ['get', 'severity'], 'critical'], 13, 9],
      'circle-color': ['case', ['==', ['get', 'severity'], 'critical'], '#FF0040', '#FF5C00'],
      'circle-stroke-color': '#000',
      'circle-stroke-width': 2,
      'circle-opacity': ['case', ['==', ['get', 'severity'], 'critical'], 0.55, 0.4],
    },
  });

  handlers.war = {
    click: (e) => {
      const f = e.features?.[0];
      if (!f) return;
      popup
        .setLngLat(f.geometry.coordinates.slice())
        .setHTML(warPopupHTML(f.properties))
        .addTo(map);
    },
    mouseenter: () => {
      map.getCanvas().style.cursor = 'pointer';
    },
    mouseleave: () => {
      map.getCanvas().style.cursor = '';
    },
  };

  map.on('click', 'ooh-warzone-markers', handlers.war.click);
  map.on('mouseenter', 'ooh-warzone-markers', handlers.war.mouseenter);
  map.on('mouseleave', 'ooh-warzone-markers', handlers.war.mouseleave);
}

function removeWarZones(map) {
  if (!map || map._removed) return;
  if (handlers.war) {
    map.off('click', 'ooh-warzone-markers', handlers.war.click);
    map.off('mouseenter', 'ooh-warzone-markers', handlers.war.mouseenter);
    map.off('mouseleave', 'ooh-warzone-markers', handlers.war.mouseleave);
    handlers.war = null;
  }
  removeLayerAndSource(map, 'ooh-warzone-markers', 'ooh-warzones');
}

// ---- Radio Beacons ----
function radioPopupHTML(p) {
  const color = p.category === 'news' ? '#FF5C00' : '#EDFF00';
  return `
    <div style="width:200px;font-family:'Inter Tight',sans-serif">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:${color};font-weight:700">${p.category === 'news' ? '// News Signal' : '// Music Signal'}</span>
      </div>
      <div style="font-weight:700;font-size:14px;color:hsl(var(--foreground));line-height:1.25">${esc(p.name)}</div>
      <div style="font-size:11px;color:hsl(var(--muted-foreground));margin-top:3px">${esc(p.city)}, ${esc(p.country)}</div>
      <div style="font-size:10px;color:${color};margin-top:4px">${esc(p.genre)}</div>
      <div style="font-size:9px;color:hsl(var(--muted-foreground));margin-top:8px;text-transform:uppercase;letter-spacing:0.15em">▶ Click to tune in</div>
    </div>`;
}

function radioFC() {
  return {
    type: 'FeatureCollection',
    features: RADIO_STATIONS.filter((s) => isFinite(s.lat) && isFinite(s.lng)).map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      properties: {
        id: s.id,
        name: s.name,
        city: s.city,
        country: s.country,
        genre: s.genre,
        category: s.category,
      },
    })),
  };
}

function addRadio(map, popup, selectStation) {
  map.addSource('ooh-radio', { type: 'geojson', data: radioFC() });
  map.addLayer({
    id: 'ooh-radio-markers',
    type: 'circle',
    source: 'ooh-radio',
    paint: {
      'circle-radius': ['case', ['==', ['get', 'category'], 'news'], 8, 7],
      'circle-color': ['case', ['==', ['get', 'category'], 'news'], '#FF5C00', '#EDFF00'],
      'circle-stroke-color': '#000',
      'circle-stroke-width': 2,
      'circle-opacity': 0.65,
    },
  });

  handlers.radio = {
    click: (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties;
      popup.setLngLat(f.geometry.coordinates.slice()).setHTML(radioPopupHTML(p)).addTo(map);
      selectStation(p.id);
    },
    mouseenter: () => {
      map.getCanvas().style.cursor = 'pointer';
    },
    mouseleave: () => {
      map.getCanvas().style.cursor = '';
    },
  };

  map.on('click', 'ooh-radio-markers', handlers.radio.click);
  map.on('mouseenter', 'ooh-radio-markers', handlers.radio.mouseenter);
  map.on('mouseleave', 'ooh-radio-markers', handlers.radio.mouseleave);
}

function removeRadio(map) {
  if (!map || map._removed) return;
  if (handlers.radio) {
    map.off('click', 'ooh-radio-markers', handlers.radio.click);
    map.off('mouseenter', 'ooh-radio-markers', handlers.radio.mouseenter);
    map.off('mouseleave', 'ooh-radio-markers', handlers.radio.mouseleave);
    handlers.radio = null;
  }
  removeLayerAndSource(map, 'ooh-radio-markers', 'ooh-radio');
}

// ---- Main component ----
export default function GlobeLayerManager({ map, activeLayers }) {
  const popupRef = useRef(null);
  const { spots: mushrooms, loading: mushLoading } = useMushroomData();
  const { spots: floraSpots, loading: floraLoading } = useFloraData();
  const { zones: warZones, loading: warLoading } = useWarZoneData();
  const { selectStation } = useRadio();

  // Initialize popup instance once
  useEffect(() => {
    if (!map) return;
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '260px',
    });
    return () => {
      // Clean up all layers + handlers on unmount
      removeRivers(map);
      removeMushrooms(map);
      removeFlora(map);
      removeWarZones(map);
      removeRadio(map);
      if (popupRef.current) popupRef.current.remove();
    };
  }, [map]);

  // Rivers — static data, toggle on/off
  useEffect(() => {
    if (!map || !popupRef.current) return;
    if (activeLayers.includes('rivers')) {
      if (!map.getSource('ooh-rivers')) addRivers(map, popupRef.current);
    } else {
      removeRivers(map);
    }
  }, [map, activeLayers]);

  // Mushrooms — live data, update when spots arrive
  useEffect(() => {
    if (!map || !popupRef.current) return;
    if (activeLayers.includes('mushrooms') && !mushLoading && mushrooms.length) {
      if (!map.getSource('ooh-mushrooms')) {
        addMushrooms(map, popupRef.current, mushrooms);
      } else {
        map.getSource('ooh-mushrooms').setData(mushroomFC(mushrooms));
      }
    } else if (!activeLayers.includes('mushrooms')) {
      removeMushrooms(map);
    }
  }, [map, activeLayers, mushrooms, mushLoading]);

  // Flora — live data, update when spots arrive
  useEffect(() => {
    if (!map || !popupRef.current) return;
    if (activeLayers.includes('flora') && !floraLoading && floraSpots.length) {
      if (!map.getSource('ooh-flora')) {
        addFlora(map, popupRef.current, floraSpots);
      } else {
        map.getSource('ooh-flora').setData(floraFC(floraSpots));
      }
    } else if (!activeLayers.includes('flora')) {
      removeFlora(map);
    }
  }, [map, activeLayers, floraSpots, floraLoading]);

  // War zones — live data, update when zones arrive
  useEffect(() => {
    if (!map || !popupRef.current) return;
    if (activeLayers.includes('war') && !warLoading && warZones.length) {
      if (!map.getSource('ooh-warzones')) {
        addWarZones(map, popupRef.current, warZones);
      } else {
        map.getSource('ooh-warzones').setData(warFC(warZones));
      }
    } else if (!activeLayers.includes('war')) {
      removeWarZones(map);
    }
  }, [map, activeLayers, warZones, warLoading]);

  // Radio beacons — static data, toggle on/off
  useEffect(() => {
    if (!map || !popupRef.current) return;
    if (activeLayers.includes('radio')) {
      if (!map.getSource('ooh-radio')) addRadio(map, popupRef.current, selectStation);
    } else {
      removeRadio(map);
    }
  }, [map, activeLayers, selectStation]);

  return null;
}
