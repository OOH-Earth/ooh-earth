import { metaFor } from "@/components/ooh/map/LocationThumb";

/**
 * Minimal terminal-styled popup for mobile map pins.
 * Shows category label, status, title, and a single "Expand" button that
 * pushes the full detail into the bottom sheet.
 *
 * Rendered inside react-leaflet <Popup> — uses inline styles to match
 * the existing popup pattern (Leaflet doesn't reliably inherit Tailwind).
 */
export default function CompactPinPopup({ m, onExpand }) {
  const verified = m.status === "verified";
  return (
    <div style={{ minWidth: 160, fontFamily: "'Inter Tight', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, color: "#EDFF00" }}>
          {metaFor(m.type).label}
        </span>
        <span style={{ width: 5, height: 5, borderRadius: 999, background: verified ? "#39FF14" : "#FF5C00" }} />
        <span style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", color: "hsl(var(--muted-foreground))" }}>{m.status}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(var(--foreground))", marginTop: 4, lineHeight: 1.2 }}>
        {m.title}
      </div>
      {m.address && (
        <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", marginTop: 3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
          {m.address}
        </div>
      )}
      <button
        onClick={onExpand}
        className="ooh-popup-btn ooh-popup-btn--ozone"
        style={{ marginTop: 8 }}
      >
        ▸ Expand
      </button>
    </div>
  );
}