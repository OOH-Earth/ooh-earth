import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Upload, Sparkles, Trash2, Eye, Download, Shuffle, Link as LinkIcon } from "lucide-react";
import { CASING_TYPES, FINISHES, LABEL_COLORS, LAYERS } from "./nftPresets";

export default function NftStudioPanel({ config, onConfig, artworkUrl, onArtwork, onExport, onGenerate, generating, onRandomize }) {
  const fileRef = useRef(null);
  const idx = CASING_TYPES.findIndex((c) => c.id === config.casing);
  const current = CASING_TYPES[idx] || CASING_TYPES[0];
  const layers = LAYERS[config.casing] || [];

  const prev = () => onConfig({ casing: CASING_TYPES[(idx - 1 + CASING_TYPES.length) % CASING_TYPES.length].id });
  const next = () => onConfig({ casing: CASING_TYPES[(idx + 1) % CASING_TYPES.length].id });

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) onArtwork(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-4">
      {/* Casing carousel */}
      <div className="border border-slate2 bg-card p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Casing</div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <button onClick={prev} className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate2 text-silver/60 hover:border-ozone hover:text-ozone"><ChevronLeft className="h-4 w-4" /></button>
          <div className="text-center">
            <div className="text-base font-bold uppercase tracking-wider">{current.name}</div>
            <div className="mt-1 font-mono text-[10px] text-silver/50">{current.desc}</div>
          </div>
          <button onClick={next} className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate2 text-silver/60 hover:border-ozone hover:text-ozone"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Finish toggle */}
      <div className="border border-slate2 bg-card p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Finish</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {FINISHES.map((f) => (
            <button key={f.id} onClick={() => onConfig({ finish: f.id })} className={`border py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${config.finish === f.id ? "border-ozone text-ozone" : "border-slate2 text-silver/50"}`}>{f.name}</button>
          ))}
        </div>
      </div>

      {/* Label editor */}
      <div className="border border-slate2 bg-card p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Label</div>
        <div className="mt-3 space-y-3">
          <div>
            <label className="font-mono text-[9px] uppercase tracking-widest text-silver/40">Title</label>
            <input value={config.title} onChange={(e) => onConfig({ title: e.target.value })} className="mt-1 w-full border border-slate2 bg-void px-3 py-2 font-mono text-xs text-silver outline-none focus:border-ozone" placeholder="Subvertising title" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-silver/40">Grade</label>
              <select value={config.grade} onChange={(e) => onConfig({ grade: e.target.value })} className="mt-1 w-full border border-slate2 bg-void px-3 py-2 font-mono text-xs text-silver outline-none focus:border-ozone">
                {["1","2","3","4","5","6","7","8","9","9.5","10"].map((g) => <option key={g} value={g}>{g}{g === "10" ? " · GEM" : g === "9.5" ? " · MINT" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-silver/40">Serial</label>
              <input value={config.serial} onChange={(e) => onConfig({ serial: e.target.value })} className="mt-1 w-full border border-slate2 bg-void px-3 py-2 font-mono text-xs text-silver outline-none focus:border-ozone" placeholder="OOH-00000" />
            </div>
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-widest text-silver/40">Label colour</label>
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {LABEL_COLORS.map((c) => (
                <button key={c.id} onClick={() => onConfig({ labelColor: c.id })} title={c.name} className={`h-7 border ${config.labelColor === c.id ? "border-ozone ring-1 ring-ozone" : "border-slate2"}`} style={{ background: c.bg }}>
                  <span className="sr-only">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Artwork */}
      <div className="border border-slate2 bg-card p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Artwork</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-silver/70 hover:border-ozone hover:text-ozone">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            <Upload className="h-3.5 w-3.5" /> Upload
          </label>
          <button onClick={onGenerate} disabled={generating} className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-silver/70 hover:border-ozone hover:text-ozone disabled:opacity-50">
            <Sparkles className="h-3.5 w-3.5" /> {generating ? "Generating…" : "AI Generate"}
          </button>
          {artworkUrl && (
            <button onClick={() => onArtwork(null)} className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-silver/70 hover:border-flare hover:text-flare">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <button onClick={onRandomize} className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-silver/70 hover:border-ozone hover:text-ozone">
            <Shuffle className="h-3.5 w-3.5" /> Random
          </button>
        </div>
      </div>

      {/* Layer panel */}
      <div className="border border-slate2 bg-card p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Layers · {current.name}</div>
        <div className="mt-3 space-y-1">
          {layers.map((l, i) => (
            <div key={l} className="flex items-center gap-2 py-1 font-mono text-[10px] text-silver/60">
              <Eye className="h-3 w-3 text-silver/40" />
              <span className="text-silver/30 tabular">{String(layers.length - i).padStart(2, "0")}</span>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onExport} className="flex flex-1 items-center justify-center gap-2 border-2 border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void hover:bg-flare hover:border-flare">
          <Download className="h-3.5 w-3.5" /> Export PNG
        </button>
        <Link to="/zora" className="flex flex-1 items-center justify-center gap-2 border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver/70 hover:border-ozone hover:text-ozone">
          <LinkIcon className="h-3.5 w-3.5" /> Mint on Zora
        </Link>
      </div>
    </div>
  );
}