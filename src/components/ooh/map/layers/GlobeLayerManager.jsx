import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMushroomData } from "./useMushroomData";
import { useFloraData } from "./useFloraData";
import { useWarZoneData } from "./useWarZoneData";
import { riversToGeoJSON, riverSourcesToGeoJSON, POLLUTION_META } from "./riverData";

// GlobeLayerManager — adds/removes MapLibre GL sources and layers on the 3D
// globe based on which layer IDs are active. Must receive the ready map instance.
//
// Layer IDs: "rivers" | "mushrooms" | "war"
// Each layer manages its own source + render layers + popup handlers.

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function removeLayerAndSource(map, layerId, sourceId) {
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

// ---- Rivers ----
function addRivers(map, popup) {
  const rivers = riversToGeoJSON();
  const sources = riverSourcesToGeoJSON();

  map.addSource("ooh-rivers", { type: "geojson", data: rivers });
  map.addLayer({
    id: "ooh-river-lines",
    type: "line",
    source: "ooh-rivers",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#39FF14", "line-width": 2.5, "line-opacity": 0.7 },
  });

  map.addSource("ooh-river-sources", { type: "geojson", data: sources });
  map.addLayer({
    id: "ooh-river-source-markers",
    type: "circle",
    source: "ooh-river-sources",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "wqi"], 0, 12, 50, 9, 100, 7],
      "circle-color": ["get", "color"],
      "circle-stroke-color": "#000",
      "circle-stroke-width": 2,
      "circle-opacity": 0.7,
    },
  });

  map.on("click", "ooh-river-source-markers", (e) => {
    const f = e.features?.[0];
    if (!f) return;
    const p = f.properties;
    const meta = POLLUTION_META[p.pollution] || { color: "#B2B2B2", label: "Unknown" };
    popup.setLngLat(f.geometry.coordinates.slice()).setHTML(`
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
    `).addTo(map);
  });
  map.on("mouseenter", "ooh-river-source-markers", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "ooh-river-source-markers", () => { map.getCanvas().style.cursor = ""; });
}

function removeRivers(map) {
  removeLayerAndSource(map, "ooh-river-source-markers", "ooh-river-sources");
  removeLayerAndSource(map, "ooh-river-lines", "ooh-rivers");
}

// ---- Mushrooms ----
function mushroomPopupHTML(p) {
  return `
    <div style="width:180px;font-family:'Inter Tight',sans-serif">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:#FF5C00;font-weight:700">Mushroom Index</span>
      </div>
      <div style="font-weight:700;font-size:14px;color:hsl(var(--foreground))">${esc(p.region || "Unknown")}</div>
      <div style="font-size:11px;color:#FF5C00;margin-top:4px;font-style:italic">${esc(p.species)}</div>
      ${p.habitat ? `<div style="font-size:10px;color:hsl(var(--muted-foreground));margin-top:4px"><span style="text-transform:uppercase;letter-spacing:0.1em;font-weight:700;font-size:8">Habitat</span><br/>${esc(p.habitat)}</div>` : ""}
      ${p.note ? `<div style="font-size:10px;color:hsl(var(--muted-foreground));margin-top:4px;line-height:1.4">${esc(p.note)}</div>` : ""}
    </div>`;
}

function addMushrooms(map, popup, spots) {
  const fc = {
    type: "FeatureCollection",
    features: spots
      .filter((s) => isFinite(s.lat) && isFinite(s.lng))
      .map((s) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [s.lng, s.lat] },
        properties: { species: s.species, habitat: s.habitat, note: s.note, region: s.region },
      })),
  };
  map.addSource("ooh-mushrooms", { type: "geojson", data: fc });
  map.addLayer({
    id: "ooh-mushroom-markers",
    type: "circle",
    source: "ooh-mushrooms",
    paint: {
      "circle-radius": 7,
      "circle-color": "#FF5C00",
      "circle-stroke-color": "#000",
      "circle-stroke-width": 2,
      "circle-opacity": 0.65,
    },
  });
  map.on("click", "ooh-mushroom-markers", (e) => {
    const f = e.features?.[0];
    if (!f) return;
    popup.setLngLat(f.geometry.coordinates.slice()).setHTML(mushroomPopupHTML(f.properties)).addTo(map);
  });
  map.on("mouseenter", "ooh-mushroom-markers", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "ooh-mushroom-markers", () => { map.getCanvas().style.cursor = ""; });
}

function removeMushrooms(map) {
  removeLayerAndSource(map, "ooh-mushroom-markers", "ooh-mushrooms");
}

// ---- Flora ----
function floraPopupHTML(p) {
  return `
    <div style="width:180px;font-family:'Inter Tight',sans-serif">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:#39FF14;font-weight:700">Flora Index</span>
      </div>
      <div style="font-weight:700;font-size:14px;color:hsl(var(--foreground))">${esc(p.region || "Unknown")}</div>
      <div style="font-size:11px;color:#39FF14;margin-top:4px;font-style:italic">${esc(p.species)}</div>
      ${p.ecosystem ? `<div style="font-size:10px;color:hsl(var(--muted-foreground));margin-top:4px"><span style="text-transform:uppercase;letter-spacing:0.1em;font-weight:700;font-size:8">Ecosystem</span><br/>${esc(p.ecosystem)}</div>` : ""}
      ${p.note ? `<div style="font-size:10px;color:hsl(var(--muted-foreground));margin-top:4px;line-height:1.4">${esc(p.note)}</div>` : ""}
    </div>`;
}

function addFlora(map, popup, spots) {
  const fc = {
    type: "FeatureCollection",
    features: spots
      .filter((s) => isFinite(s.lat) && isFinite(s.lng))
      .map((s) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [s.lng, s.lat] },
        properties: { species: s.species, ecosystem: s.ecosystem, note: s.note, region: s.region },
      })),
  };
  map.addSource("ooh-flora", { type: "geojson", data: fc });
  map.addLayer({
    id: "ooh-flora-markers",
    type: "circle",
    source: "ooh-flora",
    paint: {
      "circle-radius": 7,
      "circle-color": "#39FF14",
      "circle-stroke-color": "#000",
      "circle-stroke-width": 2,
      "circle-opacity": 0.55,
    },
  });
  map.on("click", "ooh-flora-markers", (e) => {
    const f = e.features?.[0];
    if (!f) return;
    popup.setLngLat(f.geometry.coordinates.slice()).setHTML(floraPopupHTML(f.properties)).addTo(map);
  });
  map.on("mouseenter", "ooh-flora-markers", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "ooh-flora-markers", () => { map.getCanvas().style.cursor = ""; });
}

function removeFlora(map) {
  removeLayerAndSource(map, "ooh-flora-markers", "ooh-flora");
}

// ---- War Zones ----
function warPopupHTML(z) {
  const critical = z.severity === "critical";
  const color = critical ? "#FF0040" : "#FF5C00";
  return `
    <div style="width:200px;font-family:'Inter Tight',sans-serif">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:${color};font-weight:700">${critical ? "Critical Zone" : "Advisory"}</span>
      </div>
      <div style="font-weight:700;font-size:14px;color:hsl(var(--foreground));line-height:1.25">${esc(z.title)}</div>
      ${z.region ? `<div style="font-size:11px;color:hsl(var(--muted-foreground));margin-top:3px">${esc(z.region)}</div>` : ""}
      ${z.advisory ? `<div style="font-size:10px;color:hsl(var(--foreground));margin-top:6px;line-height:1.45;opacity:0.85">${esc(z.advisory)}</div>` : ""}
      ${z.source ? `<div style="font-size:8px;color:hsl(var(--muted-foreground));margin-top:8px;text-transform:uppercase;letter-spacing:0.15em">Src: ${esc(z.source)}</div>` : ""}
    </div>`;
}

function addWarZones(map, popup, zones) {
  const fc = {
    type: "FeatureCollection",
    features: zones
      .filter((z) => isFinite(z.lat) && isFinite(z.lng))
      .map((z) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [z.lng, z.lat] },
        properties: { title: z.title, region: z.region, advisory: z.advisory, severity: z.severity, source: z.source },
      })),
  };
  map.addSource("ooh-warzones", { type: "geojson", data: fc });
  map.addLayer({
    id: "ooh-warzone-markers",
    type: "circle",
    source: "ooh-warzones",
    paint: {
      "circle-radius": ["case", ["==", ["get", "severity"], "critical"], 13, 9],
      "circle-color": ["case", ["==", ["get", "severity"], "critical"], "#FF0040", "#FF5C00"],
      "circle-stroke-color": "#000",
      "circle-stroke-width": 2,
      "circle-opacity": ["case", ["==", ["get", "severity"], "critical"], 0.55, 0.4],
    },
  });
  map.on("click", "ooh-warzone-markers", (e) => {
    const f = e.features?.[0];
    if (!f) return;
    popup.setLngLat(f.geometry.coordinates.slice()).setHTML(warPopupHTML(f.properties)).addTo(map);
  });
  map.on("mouseenter", "ooh-warzone-markers", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "ooh-warzone-markers", () => { map.getCanvas().style.cursor = ""; });
}

function removeWarZones(map) {
  removeLayerAndSource(map, "ooh-warzone-markers", "ooh-warzones");
}

// ---- Main component ----
export default function GlobeLayerManager({ map, activeLayers }) {
  const popupRef = useRef(null);
  const { spots: mushrooms, loading: mushLoading } = useMushroomData();
  const { spots: floraSpots, loading: floraLoading } = useFloraData();
  const { zones: warZones, loading: warLoading } = useWarZoneData();

  // Initialize popup instance once
  useEffect(() => {
    if (!map) return;
    popupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "260px" });
  }, [map]);

  // Rivers — static data, toggle on/off
  useEffect(() => {
    if (!map || !popupRef.current) return;
    if (activeLayers.includes("rivers")) {
      if (!map.getSource("ooh-rivers")) addRivers(map, popupRef.current);
    } else {
      removeRivers(map);
    }
  }, [map, activeLayers]);

  // Mushrooms — live data, update when spots arrive
  useEffect(() => {
    if (!map || !popupRef.current) return;
    if (activeLayers.includes("mushrooms") && !mushLoading && mushrooms.length) {
      if (!map.getSource("ooh-mushrooms")) {
        addMushrooms(map, popupRef.current, mushrooms);
      } else {
        map.getSource("ooh-mushrooms").setData({
          type: "FeatureCollection",
          features: mushrooms.filter((s) => isFinite(s.lat) && isFinite(s.lng)).map((s) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [s.lng, s.lat] },
            properties: { species: s.species, habitat: s.habitat, note: s.note, region: s.region },
          })),
        });
      }
    } else if (!activeLayers.includes("mushrooms")) {
      removeMushrooms(map);
    }
  }, [map, activeLayers, mushrooms, mushLoading]);

  // Flora — live data, update when spots arrive
  useEffect(() => {
    if (!map || !popupRef.current) return;
    if (activeLayers.includes("flora") && !floraLoading && floraSpots.length) {
      if (!map.getSource("ooh-flora")) {
        addFlora(map, popupRef.current, floraSpots);
      } else {
        map.getSource("ooh-flora").setData({
          type: "FeatureCollection",
          features: floraSpots.filter((s) => isFinite(s.lat) && isFinite(s.lng)).map((s) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [s.lng, s.lat] },
            properties: { species: s.species, ecosystem: s.ecosystem, note: s.note, region: s.region },
          })),
        });
      }
    } else if (!activeLayers.includes("flora")) {
      removeFlora(map);
    }
  }, [map, activeLayers, floraSpots, floraLoading]);

  // War zones — live data, update when zones arrive
  useEffect(() => {
    if (!map || !popupRef.current) return;
    if (activeLayers.includes("war") && !warLoading && warZones.length) {
      if (!map.getSource("ooh-warzones")) {
        addWarZones(map, popupRef.current, warZones);
      } else {
        map.getSource("ooh-warzones").setData({
          type: "FeatureCollection",
          features: warZones.filter((z) => isFinite(z.lat) && isFinite(z.lng)).map((z) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [z.lng, z.lat] },
            properties: { title: z.title, region: z.region, advisory: z.advisory, severity: z.severity, source: z.source },
          })),
        });
      }
    } else if (!activeLayers.includes("war")) {
      removeWarZones(map);
    }
  }, [map, activeLayers, warZones, warLoading]);

  return null;
}