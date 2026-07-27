import { CircleMarker, Tooltip, Popup } from "react-leaflet";
import { Leaf, Loader2 } from "lucide-react";
import { useMushroomData } from "./useMushroomData";

// Renders mushroom foraging hotspot circle markers. Data fetched via LLM web
// search using the shared useMushroomData hook.
export default function MushroomLayer() {
  const { spots, loading } = useMushroomData();

  if (loading) {
    return (
      <CircleMarker center={[13.746, 100.55]} radius={0} pathOptions={{ opacity: 0 }}>
        <Tooltip permanent direction="center" opacity={0.85}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter Tight', sans-serif" }}>
            <Loader2 className="h-3 w-3 animate-spin" style={{ color: "#FF5C00" }} />
            <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#FF5C00", fontWeight: 700 }}>
              Scanning mycelial index…
            </span>
          </div>
        </Tooltip>
      </CircleMarker>
    );
  }

  return spots.map((s, i) => (
    <CircleMarker
      key={`mush-${i}`}
      center={[s.lat, s.lng]}
      radius={9}
      pathOptions={{
        color: "#000",
        weight: 2,
        fillColor: "#FF5C00",
        fillOpacity: 0.65,
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
        <div style={{ fontFamily: "'Inter Tight', sans-serif", minWidth: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Leaf size={10} style={{ color: "#FF5C00" }} />
            <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#FF5C00", fontWeight: 700 }}>
              Mycelium
            </span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--foreground))", marginTop: 2 }}>
            {s.region || "Unknown"}
          </div>
          <div style={{ fontSize: 9, color: "#FF5C00", marginTop: 2, fontStyle: "italic" }}>
            {s.species}
          </div>
        </div>
      </Tooltip>
      <Popup>
        <div style={{ fontFamily: "'Inter Tight', sans-serif", width: 180 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Leaf size={12} style={{ color: "#FF5C00" }} />
            <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#FF5C00", fontWeight: 700 }}>
              Mushroom Index
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "hsl(var(--foreground))" }}>
            {s.region || "Unknown"}
          </div>
          <div style={{ fontSize: 11, color: "#FF5C00", marginTop: 4, fontStyle: "italic" }}>
            {s.species}
          </div>
          {s.habitat && (
            <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, fontSize: 8 }}>Habitat</span>
              <br />{s.habitat}
            </div>
          )}
          {s.note && (
            <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 4, lineHeight: 1.4 }}>
              {s.note}
            </div>
          )}
          <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 6, fontFamily: "monospace", opacity: 0.8 }}>
            {Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}
          </div>
        </div>
      </Popup>
    </CircleMarker>
  ));
}