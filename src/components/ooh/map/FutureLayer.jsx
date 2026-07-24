import { Marker, Tooltip, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";

// Dashed "future" marker — ozone + flare rings, FUT glyph. Non-clustering,
// rendered as a separate layer so they read as roadmap placeholders, not live spots.
const futureIcon = L.divIcon({
  className: "ooh-pin ooh-pin--future",
  html: `<div style="position:relative;width:34px;height:34px"><span style="position:absolute;inset:-6px;border-radius:50%;border:1px dashed rgba(237,255,0,0.5)"></span><span style="position:absolute;inset:2px;border-radius:50%;border:1px dashed rgba(255,92,0,0.55)"></span><span style="position:relative;display:flex;width:34px;height:34px;border-radius:50%;background:rgba(10,10,10,0.75);border:1px solid #EDFF00;box-shadow:0 0 10px rgba(237,255,0,0.28);align-items:center;justify-content:center"><span style="font-family:'Inter Tight',monospace;font-weight:700;font-size:8px;color:#EDFF00;letter-spacing:0.1em">FUT</span></span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  tooltipAnchor: [0, -16],
  popupAnchor: [0, -18],
});

// Phase → ordinal 0..5 across the Q3 2026 → Q1 2028 roadmap, used for the
// progress rail inside the detail popup.
const PHASE_RANK = { "Q3 2026": 0, "Q4 2026": 1, "Q1 2027": 2, "Q2 2027": 3, "Q3 2027": 4, "Q4 2027": 5, "Q1 2028": 6 };
const PHASES = ["Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027", "Q1 2028"];

function phaseProgress(phase) {
  const rank = PHASE_RANK[phase] ?? 0;
  return Math.round((rank / (PHASES.length - 1)) * 100);
}

function FutureDetail({ f }) {
  const pct = phaseProgress(f.phase);
  return (
    <div style={{ width: 230, fontFamily: "'Inter Tight', sans-serif" }}>
      <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FF5C00", fontWeight: 700 }}>
        OOH Future · {f.phase}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#EDFF00", marginTop: 4, lineHeight: 1.2 }}>
        {f.city}, {f.country}
      </div>
      <div style={{ fontSize: 11, color: "#B2B2B2", marginTop: 6, lineHeight: 1.45 }}>{f.pillar}</div>

      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "#666", fontWeight: 700 }}>
          <span>Roadmap</span>
          <span style={{ color: "#EDFF00" }}>{pct}%</span>
        </div>
        <div style={{ position: "relative", height: 4, marginTop: 5, background: "rgba(241,241,241,0.10)" }}>
          <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "linear-gradient(90deg,#EDFF00,#FF5C00)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 7, letterSpacing: "0.1em", color: "#666", fontFamily: "monospace" }}>
          <span>Q3’26</span>
          <span>Q1’28</span>
        </div>
      </div>

      <div style={{ fontSize: 9, color: "#666", marginTop: 8, fontFamily: "monospace", opacity: 0.85 }}>
        {Number(f.lat).toFixed(4)}, {Number(f.lng).toFixed(4)}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Link
          to="/report"
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: "#EDFF00",
            color: "#000",
            padding: "6px 8px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Seed network
        </Link>
        <Link
          to="/support"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(237,255,0,0.5)",
            color: "#EDFF00",
            padding: "6px 10px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Notify
        </Link>
      </div>
      <div style={{ fontSize: 8, color: "#666", marginTop: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        // Placeholder · not a live spot
      </div>
    </div>
  );
}

export default function FutureLayer({ futures }) {
  if (!futures?.length) return null;
  return futures.map((f, i) => (
    <Marker key={f.id || i} position={[f.lat, f.lng]} icon={futureIcon} zIndexOffset={-100}>
      <Tooltip direction="top" offset={[0, -14]} opacity={1}>
        <div style={{ fontFamily: "'Inter Tight', sans-serif", minWidth: 120 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#FF5C00", fontWeight: 700 }}>Future · {f.phase}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#EDFF00", marginTop: 2 }}>{f.city}, {f.country}</div>
          <div style={{ fontSize: 10, color: "#B2B2B2", marginTop: 2 }}>{f.pillar}</div>
          <div style={{ fontSize: 8, color: "#666", marginTop: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>Click for details</div>
        </div>
      </Tooltip>
      <Popup>
        <FutureDetail f={f} />
      </Popup>
    </Marker>
  ));
}