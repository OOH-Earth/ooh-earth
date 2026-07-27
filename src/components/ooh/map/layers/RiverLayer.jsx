import { Polyline, CircleMarker, Tooltip, Popup } from "react-leaflet";
import { RIVERS, RIVER_SOURCES, POLLUTION_META } from "./riverData";
import { Droplets } from "lucide-react";

// Renders river polylines plus source/headwater monitoring stations with
// pollution-level color coding. Each station popup reports WQI, pH, turbidity,
// and field notes benchmarked against WHO drinking-water and SDG 6.3 standards.
export default function RiverLayer() {
  return (
    <>
      {RIVERS.map((r, i) => (
        <Polyline
          key={`river-${i}`}
          positions={r.coords}
          pathOptions={{
            color: "#39FF14",
            weight: 3,
            opacity: 0.7,
            lineCap: "round",
            lineJoin: "round",
          }}
        >
          <Tooltip sticky direction="top" opacity={0.95}>
            <div style={{ fontFamily: "'Inter Tight', sans-serif", minWidth: 80 }}>
              <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#39FF14", fontWeight: 700 }}>
                Hydrology
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground))", marginTop: 2 }}>
                {r.name}
              </div>
              <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                {r.region}
              </div>
            </div>
          </Tooltip>
        </Polyline>
      ))}

      {RIVER_SOURCES.map((s, i) => {
        const meta = POLLUTION_META[s.pollution] || POLLUTION_META.moderate;
        return (
          <CircleMarker
            key={`rsrc-${i}`}
            center={[s.lat, s.lng]}
            radius={s.pollution === "toxic" ? 12 : s.pollution === "heavy" ? 10 : 8}
            pathOptions={{
              color: "#000",
              weight: 2,
              fillColor: meta.color,
              fillOpacity: 0.7,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.96}>
              <div style={{ fontFamily: "'Inter Tight', sans-serif", minWidth: 120 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Droplets size={10} style={{ color: meta.color }} />
                  <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: meta.color, fontWeight: 700 }}>
                    {meta.label} · WQI {s.wqi}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--foreground))", marginTop: 2 }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>
                  {s.river}
                </div>
              </div>
            </Tooltip>
            <Popup>
              <div style={{ fontFamily: "'Inter Tight', sans-serif", width: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Droplets size={14} style={{ color: meta.color }} />
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: meta.color, fontWeight: 700 }}>
                    {meta.label} Pollution
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "hsl(var(--foreground))", lineHeight: 1.25 }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                  {s.river} · Source Monitoring Station
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                  <div style={{ border: "1px solid rgba(241,241,241,0.1)", padding: "4px 6px" }}>
                    <div style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.15em", color: "hsl(var(--muted-foreground))" }}>WQI</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: meta.color }}>{s.wqi}</div>
                  </div>
                  <div style={{ border: "1px solid rgba(241,241,241,0.1)", padding: "4px 6px" }}>
                    <div style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.15em", color: "hsl(var(--muted-foreground))" }}>pH</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "hsl(var(--foreground))" }}>{s.ph}</div>
                  </div>
                  <div style={{ border: "1px solid rgba(241,241,241,0.1)", padding: "4px 6px" }}>
                    <div style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.15em", color: "hsl(var(--muted-foreground))" }}>Turbidity</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "hsl(var(--foreground))" }}>{s.turbidity}<span style={{ fontSize: 8, color: "hsl(var(--muted-foreground))" }}>NTU</span></div>
                  </div>
                  <div style={{ border: "1px solid rgba(241,241,241,0.1)", padding: "4px 6px" }}>
                    <div style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.15em", color: "hsl(var(--muted-foreground))" }}>Status</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: "uppercase" }}>{meta.label}</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "hsl(var(--foreground))", marginTop: 8, lineHeight: 1.45, opacity: 0.85 }}>
                  {s.notes}
                </div>
                <div style={{ fontSize: 8, color: "hsl(var(--muted-foreground))", marginTop: 8, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  Benchmarked: WHO Drinking Water · SDG 6.3
                </div>
                <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 4, fontFamily: "monospace", opacity: 0.8 }}>
                  {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}