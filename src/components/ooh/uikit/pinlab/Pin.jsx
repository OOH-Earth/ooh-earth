import { motion } from "framer-motion";
import { BadgeCheck, TrendingUp, TrendingDown } from "lucide-react";
import { metaFor } from "@/components/ooh/map/LocationThumb";

export function formatCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return Math.round(n).toString();
}

/**
 * Black vertical ad-structure glyphs — the central pin icon (phone-booth /
 * ad-panel family). The glyph changes per location type; the chassis
 * (high-vis yellow disc + pink radial highlight) stays constant.
 */
function InnerGlyph({ type, size }) {
  const u = size * 0.5;
  const k = "#EDFF00";
  switch (type) {
    case "digital":
      return (
        <svg viewBox="0 0 24 24" width={u} height={u} fill="none" aria-hidden>
          <rect x="5" y="3" width="14" height="11" rx="1" fill="#000" />
          <rect x="7" y="5" width="10" height="2.5" fill={k} opacity="0.9" />
          <rect x="7" y="8.5" width="6" height="1.5" fill={k} opacity="0.55" />
          <rect x="9" y="14" width="2" height="5" fill="#000" />
          <rect x="13" y="14" width="2" height="5" fill="#000" />
        </svg>
      );
    case "transit":
      return (
        <svg viewBox="0 0 24 24" width={u} height={u} fill="none" aria-hidden>
          <rect x="5" y="3" width="14" height="12" rx="2" fill="#000" />
          <rect x="7" y="5" width="10" height="4" fill={k} opacity="0.8" />
          <circle cx="9" cy="17" r="1.7" fill="#000" />
          <circle cx="15" cy="17" r="1.7" fill="#000" />
        </svg>
      );
    case "sticker":
      return (
        <svg viewBox="0 0 24 24" width={u} height={u} fill="none" aria-hidden>
          <path d="M12 3c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7z" fill="#000" />
          <path d="M12 3v7l4 4" stroke={k} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "mural":
      return (
        <svg viewBox="0 0 24 24" width={u} height={u} fill="none" aria-hidden>
          <rect x="4" y="4" width="16" height="12" fill="#000" />
          <rect x="4" y="4" width="16" height="3" fill={k} opacity="0.7" />
          <rect x="9" y="16" width="2" height="5" fill="#000" />
          <rect x="13" y="16" width="2" height="5" fill="#000" />
        </svg>
      );
    case "projection":
      return (
        <svg viewBox="0 0 24 24" width={u} height={u} fill="none" aria-hidden>
          <rect x="3" y="9" width="6" height="6" fill="#000" />
          <path d="M9 12L21 6" stroke="#000" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M9 12L21 18" stroke="#000" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        </svg>
      );
    case "painted":
      return (
        <svg viewBox="0 0 24 24" width={u} height={u} fill="none" aria-hidden>
          <rect x="5" y="3" width="14" height="11" rx="1" fill="#000" />
          <path d="M8 9c2-1 3-2 5-2s3 1 4 2" stroke={k} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <rect x="9" y="14" width="2" height="5" fill="#000" />
          <rect x="13" y="14" width="2" height="5" fill="#000" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width={u} height={u} fill="none" aria-hidden>
          <rect x="5" y="3" width="14" height="11" rx="1" fill="#000" />
          <rect x="7" y="5" width="10" height="2.5" fill={k} opacity="0.85" />
          <rect x="9" y="14" width="2" height="6" fill="#000" />
          <rect x="13" y="14" width="2" height="6" fill="#000" />
        </svg>
      );
  }
}

/**
 * OOH field pin — evolved V2 atom.
 * High-vis yellow disc, black ad-structure glyph, pink/red radial highlight,
 * and an orbiting brand-badge cloud revealed on hover / selection.
 */
export default function Pin({
  type = "billboard",
  status = "pending",
  size = 44,
  selected = false,
  hovered = false,
  stream = null,
  brands = [],
  onSelect = (/** @type {{ type: string }} */ _selection) => {},
}) {
  const { accent } = metaFor(type);
  const verified = status === "verified";
  const ring = verified ? "#39FF14" : accent;
  const lifted = selected || hovered;
  const head = size;
  const glow = lifted ? 0.5 : 0.26;

  return (
    <motion.div
      className="relative flex flex-col items-center"
      animate={{ scale: selected ? 1.08 : hovered ? 1.04 : 1, y: lifted ? -4 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* superscript streaming data */}
      {stream && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[140%] whitespace-nowrap">
          <span className="font-mono text-[9px] font-bold tabular-nums text-glow-ozone" style={{ color: accent }}>
            {formatCompact(stream.value)}
          </span>
          {stream.delta !== 0 && (
            <span
              className="ml-0.5 inline-flex items-center gap-0.5 align-super"
              style={{ color: stream.delta > 0 ? "#FF5C00" : "#39FF14" }}
            >
              {stream.delta > 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
              <span className="font-mono text-[7px] font-bold">{Math.abs(stream.delta).toFixed(1)}</span>
            </span>
          )}
        </div>
      )}

      {/* pink / red radial highlight */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: head * 1.95,
          height: head * 1.95,
          background: `radial-gradient(circle, rgba(255,72,118,${glow}), transparent 65%)`,
          opacity: lifted ? 1 : 0.55,
          transition: "opacity 0.25s ease",
        }}
      />

      {/* orbiting tagged-brand logos */}
      {brands.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-1/2">
          {brands.map((b, i) => {
            const angle = (i / brands.length) * Math.PI * 2 - Math.PI / 2;
            const rad = head * 0.98;
            const x = Math.cos(angle) * rad;
            const y = Math.sin(angle) * rad;
            return (
              <motion.div
                key={b.id}
                title={`${b.name} · ${formatCompact(b.reach)} reach`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: lifted ? 1 : 0.7, opacity: lifted ? 1 : 0.35, x, y }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: i * 0.04 }}
                whileHover={{ scale: 1.45 }}
                className="pointer-events-auto absolute"
                style={{ marginLeft: -11, marginTop: -11 }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-black font-mono text-[8px] font-bold"
                  style={{ background: b.color, color: b.text, boxShadow: "0 0 8px rgba(0,0,0,0.6)" }}
                >
                  {b.name[0]}
                </div>
                <span className="absolute -right-1.5 -top-1.5 font-mono text-[6px] font-bold tabular-nums text-ozone drop-shadow-[0_0_2px_rgba(0,0,0,0.95)]">
                  {formatCompact(b.reach)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* pin head */}
      <motion.button
        onClick={() => onSelect?.({ type })}
        className="relative grid place-items-center"
        style={{ width: head, height: head }}
        whileTap={{ scale: 0.92 }}
        aria-label={`${type} pin`}
      >
        {selected && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${ring}` }}
            animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: "#EDFF00",
            border: "2px solid #000",
            boxShadow: selected
              ? `0 0 0 3px rgba(255,72,118,0.35), 0 0 18px ${ring}66`
              : hovered
              ? `0 0 0 2px rgba(255,72,118,0.28), 0 0 12px ${ring}44`
              : "0 0 8px rgba(237,255,0,0.4)",
          }}
        />
        <span className="relative z-10 grid place-items-center">
          <InnerGlyph type={type} size={head} />
        </span>
        {verified && <BadgeCheck className="absolute -right-1 -top-1 z-20 h-3.5 w-3.5 text-ozone drop-shadow-[0_0_3px_rgba(0,0,0,0.9)]" />}
      </motion.button>

      {/* pointer */}
      <div
        className="-mt-[2px]"
        style={{
          width: 0,
          height: 0,
          borderLeft: `${head * 0.16}px solid transparent`,
          borderRight: `${head * 0.16}px solid transparent`,
          borderTop: `${head * 0.26}px solid #EDFF00`,
        }}
      />

      {/* ground shadow */}
      <motion.span
        className="mt-0.5 block rounded-[50%] bg-black/70 blur-[2px]"
        animate={{ width: lifted ? head * 0.6 : head * 0.82, opacity: lifted ? 0.32 : 0.55 }}
        style={{ height: head * 0.1 }}
      />
    </motion.div>
  );
}