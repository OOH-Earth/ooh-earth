import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { ZoomIn, ZoomOut, Compass, RotateCw } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import GlobeHud from "@/components/ooh/GlobeHud";

import { thumbHTML, metaFor } from "@/components/ooh/map/LocationThumb";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function popupHTML(m) {
  const type = metaFor(m.type).label;
  const status = m.status || "pending";
  return `
    <div style="width:220px;font-family:'Inter Tight',sans-serif">
      ${thumbHTML(m)}
      <div style="padding:10px 2px 2px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;font-weight:700;color:#EDFF00">${esc(type)}</span>
          <span style="width:5px;height:5px;border-radius:999px;background:${status === "verified" ? "#39FF14" : "#FF5C00"}"></span>
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:hsl(var(--muted-foreground))">${esc(status)}</span>
        </div>
        <div style="font-weight:700;font-size:15px;color:hsl(var(--foreground));line-height:1.25">${esc(m.title)}</div>
        <div style="font-size:12px;color:hsl(var(--muted-foreground));margin-top:4px;line-height:1.4">${esc(m.address || "")}</div>
        <div style="font-size:9px;color:hsl(var(--muted-foreground));margin-top:4px;font-family:monospace;opacity:0.8">${Number(m.lat).toFixed(4)}, ${Number(m.lng).toFixed(4)}</div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}" target="_blank" rel="noreferrer" style="font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:#FF5C00;text-decoration:none">Directions ↗</a>
          ${m.link ? `<a href="${esc(m.link)}" target="_blank" rel="noreferrer" style="font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:#EDFF00;text-decoration:none">OOH.EARTH ↗</a>` : ""}
        </div>
      </div>
    </div>`;
}

function buildFC(markers, selectedId) {
  return {
    type: "FeatureCollection",
    features: markers
      .filter((m) => isFinite(m.lat) && isFinite(m.lng))
      .map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
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

export default function Globe3D({ markers, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const readyRef = useRef(false);
  const dataRef = useRef({ type: "FeatureCollection", features: [] });
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [ready, setReady] = useState(false);
  const [spinning, setSpinning] = useState(false);

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
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [100.55, 13.746],
      zoom: 1.6,
      pitch: 25,
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
          range: [1, 10],
          color: "#0a0a0a",
          "high-color": "#1a1a1a",
          "horizon-blend": 0.12,
          "space-color": "#000000",
          "star-intensity": 0.45,
        });
      } catch (e) {}
    };
    map.on("load", () => {
      applyGlobe();
      map.on("style.load", applyGlobe);
      map.addSource("ooh-markers", { type: "geojson", data: dataRef.current });
      map.addLayer({
        id: "ooh-markers",
        type: "circle",
        source: "ooh-markers",
        paint: {
          "circle-radius": ["case", ["==", ["get", "selected"], true], 9, 6],
          "circle-color": ["case", ["==", ["get", "selected"], true], "#FF5C00", "#EDFF00"],
          "circle-stroke-color": "#000000",
          "circle-stroke-width": 1.5,
          "circle-blur": ["case", ["==", ["get", "selected"], true], 0.6, 0.2],
        },
      });

      map.on("click", "ooh-markers", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        const coords = f.geometry.coordinates.slice();
        popupRef.current.setLngLat(coords).setHTML(popupHTML(p)).addTo(map);
        onSelectRef.current?.(p.id);
      });
      map.on("mouseenter", "ooh-markers", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "ooh-markers", () => { map.getCanvas().style.cursor = ""; });

      readyRef.current = true;
      setReady(true);
      map.getSource("ooh-markers").setData(dataRef.current);
    });

    return () => {
      readyRef.current = false;
      map.remove();
    };
  }, []);

  useEffect(() => {
    dataRef.current = buildFC(markers, selectedId);
    const map = mapRef.current;
    if (readyRef.current && map && map.getSource("ooh-markers")) {
      map.getSource("ooh-markers").setData(dataRef.current);
    }
    if (selectedId && readyRef.current && map) {
      const m = markers.find((x) => x.id === selectedId);
      if (m && isFinite(m.lat) && isFinite(m.lng)) {
        map.flyTo({ center: [m.lng, m.lat], zoom: Math.max(map.getZoom(), 6), duration: 700 });
        popupRef.current.setLngLat([m.lng, m.lat]).setHTML(popupHTML(m)).addTo(map);
      }
    }
  }, [markers, selectedId]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" style={{ background: "#000" }} />
      <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
        // drag to rotate · scroll to zoom · click a marker
      </div>
      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1.5">
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
      {ready && <GlobeHud map={mapRef.current} />}
    </div>
  );
}