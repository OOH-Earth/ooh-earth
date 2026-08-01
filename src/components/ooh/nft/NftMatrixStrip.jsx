// Compact NFT metadata readout — terminal/matrix-styled data strip
export default function NftMatrixStrip({ config }) {
  const hashSeed = (config.serial || "") + (config.casing || "") + (config.grade || "");
  const hash = hashSeed.split("").reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).padStart(6, "0").slice(0, 6);
  const created = new Date().toISOString().slice(0, 10);

  const rows = [
    { k: "TOKEN", v: config.serial },
    { k: "GRADE", v: config.grade, accent: true },
    { k: "CASING", v: (config.casing || "slab").toUpperCase() },
    { k: "FINISH", v: (config.finish || "clear").toUpperCase() },
    { k: "DIMENSIONS", v: "2.5″ × 3.5″" },
    { k: "MATERIAL", v: "Polystyrene" },
    { k: "HASH", v: `0x${hash}…` },
    { k: "CREATED", v: created },
  ];

  return (
    <div className="border border-slate2 bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">NFT Matrix · metadata</div>
        <span className="flex items-center gap-1.5 font-mono text-[9px] text-silver/30">
          <span className="h-1.5 w-1.5 animate-pulse bg-ozone" /> live readout
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[10px] md:grid-cols-4">
        {rows.map((r) => (
          <div key={r.k} className="flex items-baseline gap-1.5">
            <span className="text-silver/40">{r.k}</span>
            <span className={r.accent ? "text-ozone" : "text-silver/80"}>{r.v}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate2/60 pt-2 font-mono text-[9px] text-silver/30">
        <span><span className="text-ozone">●</span> RENDER: WebGL2</span>
        <span>· LAYERS: 06</span>
        <span>· ENV: RoomEnvironment</span>
        <span>· TONE: ACES Filmic</span>
        <span>· PIXELS: {typeof window !== "undefined" ? window.devicePixelRatio.toFixed(1) : "1"}×</span>
      </div>
    </div>
  );
}