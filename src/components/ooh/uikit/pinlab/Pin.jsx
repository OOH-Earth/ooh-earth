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
 * OOH field pin — high-spec map marker atom.
 * States: default · hover · selected. Renders tagged brand logos orbiting the
 * head and a superscript live-data stream above it.
 */
export default function Pin({
  type = "billboard",
  status = "pending",
  size = 44,
  selected = false,
  hovered = false,
  stream = null,
  brands = [],
  onSelect,
}) {
  const { Icon, accent } = metaFor(type);
  const verified = status === "verified";
  const ring = verified ? "#39FF14" : accent;
  const lifted = selected || hovered;
  const head = size;

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

      {/* orbiting tagged-brand logos */}
      {brands.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-1/2">
          {brands.map((b, i) => {
            const angle = (i / brands.length) * Math.PI * 2 - Math.PI / 2;
            const rad = head * 0.95;
            const x = Math.cos(angle) * rad;
            const y = Math.sin(angle) * rad;
            return (
              <motion.div
                key={b.id}
                title={`${b.name} · ${formatCompact(b.reach)} reach`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: lifted ? 1 : 0.72, opacity: lifted ? 1 : 0.4, x, y }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: i * 0.04 }}
                whileHover={{ scale: 1.45 }}
                className="pointer-events-auto absolute"
                style={{ marginLeft: -10, marginTop: -10 }}
              >
                <div
                  className="flex h-5 w-5 items-center justify-center border border-white/15 font-mono text-[7px] font-bold"
                  style={{ background: b.color, color: b.text }}
                >
                  {b.name[0]}
                </div>
                <span className="absolute -right-1.5 -top-1.5 font-mono text-[6px] font-bold tabular-nums text-ozone drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]">
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
            animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${ring}`,
            boxShadow: selected ? `0 0 18px ${ring}66` : hovered ? `0 0 12px ${ring}44` : "none",
            background: "#0a0a0a",
          }}
        />
        <Icon className="relative z-10" style={{ width: head * 0.4, height: head * 0.4, color: accent }} strokeWidth={2} />
        {verified && <BadgeCheck className="absolute -right-1 -top-1 z-20 h-3.5 w-3.5 text-ozone drop-shadow-[0_0_3px_rgba(0,0,0,0.9)]" />}
      </motion.button>

      {/* pointer */}
      <div
        className="-mt-[1px]"
        style={{
          width: 0,
          height: 0,
          borderLeft: `${head * 0.18}px solid transparent`,
          borderRight: `${head * 0.18}px solid transparent`,
          borderTop: `${head * 0.28}px solid ${ring}`,
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