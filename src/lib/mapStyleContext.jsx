import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Site-wide map tile styles. Each carries a Leaflet raster `url` plus a
// MapLibre `glStyle` (URL or inline object) so both the flat map and the globe
// stay in sync. `matrix` reuses the dark tiles with a CSS filter tint.
export const MAP_STYLE_DEFAULT_KEY = "map_style_default";
const LS_KEY = "ooh-map-style";

const SATELLITE_GL = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "satellite", type: "raster", source: "satellite" }],
};

export const MAP_STYLES = [
  { id: "dark", label: "Dark", attribution: "&copy; OpenStreetMap contributors &copy; CARTO", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", subdomains: "abcd", maxZoom: 20, glStyle: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json", bg: "#000" },
  { id: "light", label: "Light", attribution: "&copy; OpenStreetMap contributors &copy; CARTO", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", subdomains: "abcd", maxZoom: 20, glStyle: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", bg: "#f5f5f5" },
  { id: "voyager", label: "Voyager", attribution: "&copy; OpenStreetMap contributors &copy; CARTO", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", subdomains: "abcd", maxZoom: 20, glStyle: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", bg: "#f4f1ea" },
  { id: "satellite", label: "Satellite", attribution: "© Esri, Maxar, Earthstar Geographics", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", subdomains: "abc", maxZoom: 19, glStyle: SATELLITE_GL, bg: "#000" },
  { id: "matrix", label: "Matrix", attribution: "&copy; OpenStreetMap contributors &copy; CARTO", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", subdomains: "abcd", maxZoom: 20, glStyle: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json", bg: "#02110a", tint: true },
];

const IDS = MAP_STYLES.map((s) => s.id);
const byId = (id) => MAP_STYLES.find((s) => s.id === id) || MAP_STYLES[0];

const MapStyleContext = createContext(null);

export function MapStyleProvider({ children }) {
  const [styleId, setStyleId] = useState(() => {
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s && IDS.includes(s)) return s;
    } catch {}
    return "dark";
  });

  // Only fetch the admin site default when the visitor has no local override.
  useEffect(() => {
    let active = true;
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s && IDS.includes(s)) return; // user override wins
    } catch {}
    (async () => {
      let siteDefault = null;
      try {
        const rows = await base44.entities.SiteSetting.filter({ key: MAP_STYLE_DEFAULT_KEY });
        const rec = rows?.[0];
        if (rec?.value && IDS.includes(rec.value)) siteDefault = rec.value;
      } catch {}
      if (active && siteDefault) setStyleId(siteDefault);
    })();
    return () => { active = false; };
  }, []);

  const setStyle = useCallback((id) => {
    if (!IDS.includes(id)) return;
    setStyleId(id);
    try { localStorage.setItem(LS_KEY, id); } catch {}
  }, []);

  return (
    <MapStyleContext.Provider value={{ styleId, style: byId(styleId), setStyleId: setStyle, styles: MAP_STYLES }}>
      {children}
    </MapStyleContext.Provider>
  );
}

export function useMapStyle() {
  const ctx = useContext(MapStyleContext);
  if (!ctx) return { styleId: "dark", style: byId("dark"), setStyleId: () => {}, styles: MAP_STYLES };
  return ctx;
}