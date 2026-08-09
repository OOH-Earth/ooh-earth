import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { ZoomIn, ZoomOut, Compass, RotateCw } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStyle } from "@/lib/mapStyleContext";
import { motion } from "framer-motion";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const SCOPE_COLOR = { global: "#EDFF00", regional: "#FF5C00", local: "#B2B2B2" };

function panelLabel(panels) {
  if (!panels || panels <= 0) return "";
  if (panels >= 1000000) return (panels / 1000000).toFixed(1) + "M";
  if (panels >= 1000) return Math.round(panels / 1000) + "K";
  return String(panels);
}

function makeCorpPinIcon(scope, selected, panels) {
  const S = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d");
  const cx = S / 2;
  const cy = S / 2 - 6;
  const r = selected ? 20 : 16;
  const color = SCOPE_COLOR[scope] || SCOPE_COLOR.local;

  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, S / 2);
  glow.addColorStop(0, selected ? "rgba(237,255,0,0.45)" : "rgba(237,255,0,0.12)");
  glow.addColorStop(1, "rgba(237,255,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - r * 0.7, cy + r * 0.7);
  ctx.lineTo(cx, cy + r + 12);
  ctx.lineTo(cx + r * 0.7, cy + r * 0.7);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.7, cy + r * 0.7);
  ctx.lineTo(cx, cy + r + 12);
  ctx.lineTo(cx + r * 0.7, cy + r * 0.7);
  ctx.stroke();

  if (selected) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FF5C00";
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  const label = panelLabel(panels);
  if (label) {
    ctx.fillStyle = "#000";
    ctx.font = `700 ${selected ? 11 : 9}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy);
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(cx - 6, cy - 5, 12, 10);
    ctx.fillStyle = color;
    ctx.fillRect(cx - 4, cy - 3, 3, 3);
    ctx.fillRect(cx + 1, cy - 3, 3, 3);
    ctx.fillRect(cx - 4, cy + 1, 3, 3);
    ctx.fillRect(cx + 1, cy + 1, 3, 3);
  }
  return canvas;
}

function corpPopupHTML(c) {
  const color = SCOPE_COLOR[c.scope] || SCOPE_COLOR.local;
  const plabel = c.panels > 0 ? ` · ${panelLabel(c.panels)} panels` : "";
  return `
    <div style="width:220px;font-family:'Inter Tight',sans-serif">
      <div style="padding:10px 12px 12px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="width:7px;height:7px;border-radius:999px;background:${color}"></span>
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;font-weight:700;color:${color}">${esc(c.scope)}</span>
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:hsl(var(--muted-foreground))">${esc(c.countries || 0)} countries</span>
        </div>
        <div style="font-weight:700;font-size:15px;color:hsl(var(--foreground));line-height:1.25">${esc(c.name)}</div>
        <div style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:4px;line-height:1.4">${esc(c.hq)}</div>
        ${c.parent ? `<div style="font-size:9px;color:hsl(var(--muted-foreground));margin-top:4px;font-family:monospace;opacity:0.8">${esc(c.parent)}</div>` : ""}
        <div style="font-size:9px;color:hsl(var(--muted-foreground));margin-top:2px;font-family:monospace;opacity:0.7">${plabel}</div>
        <div style="margin-top:8px;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:#EDFF00">Click to view details →</div>
      </div>
    </div>`;
}

function buildFC(corps, selectedId) {
  return {
    type: "FeatureCollection",
    features: (corps || [])
      .filter((c) => isFinite(c.lat) && isFinite(c.lng))
      .map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        properties: {
          id: c.id, name: c.name, hq: c.hq, scope: c.scope,
          panels: c.panels, countries: c.countries, parent: c.parent,
          selected: c.id === selectedId,
        },
      })),
  };
}

const SCOPES = ["global", "regional", "local"];

export default function MediaCorpGlobe({ corps, selected, onSelect, onBoundsChange, showCoverage, fitAllNonce }) {
  const mapStyle = useMapStyle().style;
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const readyRef = useRef(false);
  const dataRef = useRef({ type: "FeatureCollection", features: [] });
  const onSelectRef = useRef(onSelect);
  const onBoundsRef = useRef(onBoundsChange);
  onSelectRef.current = onSelect;
  onBoundsRef.current = onBoundsChange;

  const [ready, setReady] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetNorth = () => mapRef.current?.resetNorth();

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !spinning) return;
    let raf, last = performance.now();
    const tick = (t) => {
      const dt = t - last; last = t;
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
      center: [20, 15],
      zoom: 1.4,
      pitch: 20,
      maxPitch: 85,
      projection: "globe",
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    popupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "260px" });

    const applyGlobe = () => {
      try { map.setProjection({ type: "globe" }); } catch (e) {}
      try {
        map.setFog({
          range: [1, 10], color: "#0a0a0a", "high-color": "#1a1a1a",
          "horizon-blend": 0.12, "space-color": "#000000", "star-intensity": 0.4,
        });
      } catch (e) {}
    };

    const reportBounds = () => {
      try {
        const b = map.getBounds();
        onBoundsRef.current?.({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
      } catch (e) {}
    };

    map.on("load", () => {
      applyGlobe();
      map.on("style.load", applyGlobe);

      map.addSource("mc-markers", { type: "geojson", data: dataRef.current, cluster: true, clusterRadius: 50, clusterMaxZoom: 12 });
      // Separate non-clustered source for coverage circles
      map.addSource("mc-coverage", { type: "geojson", data: dataRef.current });

      SCOPES.forEach((s) => {
        const a = makeCorpPinIcon(s, false, 0);
        map.addImage(`mc-pin-${s}`, a.getContext("2d").getImageData(0, 0, a.width, a.height), { pixelRatio: 1 });
        const b = makeCorpPinIcon(s, true, 0);
        map.addImage(`mc-pin-${s}-sel`, b.getContext("2d").getImageData(0, 0, b.width, b.height), { pixelRatio: 1 });
      });

      // Coverage circles (below clusters + pins)
      map.addLayer({
        id: "mc-coverage-circles",
        type: "circle",
        source: "mc-coverage",
        layout: { visibility: showCoverage ? "visible" : "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "countries"], 1, 22, 5, 40, 15, 60, 45, 85, 80, 120],
          "circle-color": ["match", ["get", "scope"], "global", "#EDFF00", "regional", "#FF5C00", "#B2B2B2"],
          "circle-opacity": 0.04,
          "circle-stroke-color": ["match", ["get", "scope"], "global", "#EDFF00", "regional", "#FF5C00", "#B2B2B2"],
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.2,
        },
      }, "mc-clusters");

      // Clusters
      map.addLayer({
        id: "mc-clusters",
        type: "circle",
        source: "mc-markers",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 26],
          "circle-color": "#0a0a0a",
          "circle-stroke-color": "#EDFF00",
          "circle-stroke-width": 2,
          "circle-blur": 0.08,
        },
      });
      map.addLayer({
        id: "mc-cluster-count",
        type: "symbol",
        source: "mc-markers",
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-allow-overlap": true },
        paint: { "text-color": "#EDFF00", "text-halo-color": "#000", "text-halo-width": 1.5 },
      });

      // Individual pins
      map.addLayer({
        id: "mc-pins",
        type: "symbol",
        source: "mc-markers",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": ["case", ["==", ["get", "selected"], true], ["concat", "mc-pin-", ["get", "scope"], "-sel"], ["concat", "mc-pin-", ["get", "scope"]]],
          "icon-size": ["case", ["==", ["get", "selected"], true], 0.95, 0.78],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      map.on("click", "mc-pins", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties;
        popupRef.current.setLngLat(f.geometry.coordinates.slice()).setHTML(corpPopupHTML(p)).addTo(map);
        onSelectRef.current?.(p.id);
      });
      map.on("mouseenter", "mc-pins", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "mc-pins", () => { map.getCanvas().style.cursor = ""; });

      map.on("click", "mc-clusters", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const src = map.getSource("mc-markers");
        if (src?.getClusterExpansionZoom) {
          src.getClusterExpansionZoom(f.properties.cluster_id).then((z) => {
            map.flyTo({ center: f.geometry.coordinates, zoom: Math.max(z, map.getZoom() + 1), duration: 700 });
          }).catch(() => { map.flyTo({ center: f.geometry.coordinates, zoom: map.getZoom() + 2, duration: 700 }); });
        }
      });
      map.on("mouseenter", "mc-clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "mc-clusters", () => { map.getCanvas().style.cursor = ""; });

      readyRef.current = true;
      setReady(true);
      map.getSource("mc-markers").setData(dataRef.current);
      map.getSource("mc-coverage").setData(dataRef.current);
      reportBounds();
    });

    map.on("moveend", reportBounds);
    map.on("zoomend", reportBounds);

    return () => { readyRef.current = false; map.remove(); };
  }, []);

  // Update data
  useEffect(() => {
    dataRef.current = buildFC(corps, selected?.id);
    if (readyRef.current && mapRef.current) {
      const m = mapRef.current;
      if (m.getSource("mc-markers")) m.getSource("mc-markers").setData(dataRef.current);
      if (m.getSource("mc-coverage")) m.getSource("mc-coverage").setData(dataRef.current);
    }
  }, [corps, selected]);

  // Toggle coverage visibility
  useEffect(() => {
    if (!readyRef.current || !mapRef.current) return;
    try {
      mapRef.current.setLayoutProperty("mc-coverage-circles", "visibility", showCoverage ? "visible" : "none");
    } catch (e) {}
  }, [showCoverage, ready]);

  // Fly to selected
  useEffect(() => {
    if (!readyRef.current || !mapRef.current || !selected) return;
    mapRef.current.flyTo({ center: [selected.lng, selected.lat], zoom: Math.max(mapRef.current.getZoom(), 4), duration: 1000 });
    popupRef.current.setLngLat([selected.lng, selected.lat]).setHTML(corpPopupHTML(selected)).addTo(mapRef.current);
  }, [selected, ready]);

  // Fit all
  useEffect(() => {
    if (!readyRef.current || !mapRef.current || !fitAllNonce) return;
    const coords = (corps || []).filter((c) => isFinite(c.lat) && isFinite(c.lng)).map((c) => [c.lng, c.lat]);
    if (coords.length === 0) return;
    const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
    mapRef.current.fitBounds(bounds, { padding: 60 });
  }, [fitAllNonce, ready]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className={`h-full w-full ${mapStyle.tint ? "ooh-globe-style-matrix" : ""}`} style={{ background: mapStyle.bg }} />

      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ozone/10" />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "conic-gradient(from 0deg, rgba(237,255,0,0.10), transparent 22%)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute left-3 top-3 h-4 w-4 border-l border-t border-ozone/40" />
        <div className="absolute right-3 top-3 h-4 w-4 border-r border-t border-ozone/40" />
        <div className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-ozone/40" />
        <div className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-ozone/40" />
      </div>

      <div className="absolute bottom-12 right-3 z-[1000] flex flex-col gap-1.5">
        <button onClick={zoomIn} aria-label="Zoom in" className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/80 font-mono text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={zoomOut} aria-label="Zoom out" className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/80 font-mono text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={resetNorth} aria-label="Reset north" className="flex h-9 w-9 items-center justify-center border border-slate2 bg-void/80 font-mono text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone">
          <Compass className="h-4 w-4" />
        </button>
        <button onClick={() => setSpinning((s) => !s)} aria-label="Auto-spin" className={`flex h-9 w-9 items-center justify-center border bg-void/80 font-mono backdrop-blur-md transition-colors ${spinning ? "border-ozone text-ozone" : "border-slate2 text-darkgray hover:border-ozone hover:text-ozone"}`}>
          <RotateCw className="h-4 w-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-12 left-3 flex items-center gap-2 border border-slate2/70 bg-void/85 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray backdrop-blur-sm">
        <span className="text-ozone/80">⊙</span>
        <span>drag to rotate · click a pin</span>
      </div>
    </div>
  );
}