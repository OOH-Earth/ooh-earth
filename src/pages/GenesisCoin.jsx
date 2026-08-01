import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Box, Coins, ArrowRight, ShieldCheck, Globe2, Award } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import CoinViewer3D from "@/components/ooh/lab/CoinViewer3D";
import CoinMatrixStrip from "@/components/ooh/lab/CoinMatrixStrip";
import { useLabGate } from "@/components/ooh/LabGate";
import { COIN_MATERIALS, COIN_EDITIONS, COIN_SPECS, COIN_TOKENOMICS, SDG_ALIGNMENTS, EDGE_TYPES, ENAMEL_ACCENTS } from "@/components/ooh/lab/coinPresets";

// OOH Earth — Genesis Coin (Hex Engine Lab)
// Cultural artifact · Founding Edition · 64mm Ø
// Evolved to NFT-grade 3D viewing standard with UN SDG alignment.

export default function GenesisCoin() {
  const viewerRef = useRef(null);
  const { gate } = useLabGate();
  const [serial, setSerial] = useState(45);
  const [edition, setEdition] = useState("FOUNDING EDITION");
  const [materialId, setMaterialId] = useState("brass");
  const [edgeType, setEdgeType] = useState("reeded");
  const [enamelId, setEnamelId] = useState("ozone");

  const num = Math.min(6400, Math.max(1, Number(serial) || 1));
  const serialLabel = String(num).padStart(4, "0");
  const config = { serial: serialLabel, edition };
  const material = COIN_MATERIALS.find((m) => m.id === materialId) || COIN_MATERIALS[0];
  const editionInfo = COIN_EDITIONS.find((e) => e.id === edition) || COIN_EDITIONS[0];
  const enamel = ENAMEL_ACCENTS.find((e) => e.id === enamelId) || ENAMEL_ACCENTS[0];

  const handleExport = () => {
    if (!gate("Export artifact PNG")) return;
    viewerRef.current?.exportPNG();
  };

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Genesis Coin" }]} className="mb-4" />

        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Genesis <span className="text-ozone">Coin</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Cultural artifact · {editionInfo.name} · 64mm Ø</p>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs uppercase tracking-[0.1em]">
            <Link to="/lab" className="text-silver/40 transition-colors hover:text-ozone">← Lab</Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">Working copy</span>
          </div>
        </header>

        {/* Cultural artifact designation */}
        <div className="mt-5 flex items-start gap-3 border border-ozone/25 bg-ozone/[0.04] px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ozone" />
          <p className="font-mono text-[11px] leading-relaxed text-silver/60">
            <span className="text-ozone">CULTURAL ARTIFACT DESIGNATION</span> — The Genesis Coin is registered as a non-monetary cultural artifact under OOH Earth's UN-aligned protocol. It documents participation in the visual commons, not financial value. Aligned to UN SDGs 11, 16, 17.
          </p>
        </div>

        {/* Lab concept — what we are doing here */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="border border-slate2 bg-card p-4">
            <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">01 · Prototype</div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">The Lab is prototyping a physical-digital cultural artifact — a 64mm challenge coin with a 1:1 on-chain twin. This page is the live spec viewer.</p>
          </div>
          <div className="border border-slate2 bg-card p-4">
            <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">02 · Standard</div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">Built to 2025 challenge-coin standards: deep 3D relief, hard-enamel color, premium materials, reeded/rope/lettered edges, and 4.5mm heft.</p>
          </div>
          <div className="border border-slate2 bg-card p-4">
            <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">03 · Mission</div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">Not currency. An artifact of participation in the visual commons — documenting public-space reclamation, aligned to UN SDGs, minted union-made.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-5 flex flex-wrap items-center gap-5 font-mono text-[11px] uppercase tracking-[0.14em] text-silver/50">
          <label className="flex items-center gap-2">
            Genesis №
            <input type="number" min={1} max={6400} value={serial} onChange={(e) => setSerial(e.target.value)}
              className="w-24 border border-slate2 bg-card px-2 py-1.5 font-mono text-xs tracking-normal text-silver outline-none focus:border-ozone" />
          </label>
          <label className="flex items-center gap-2">
            Edition
            <select value={edition} onChange={(e) => setEdition(e.target.value)}
              className="border border-slate2 bg-card px-2 py-1.5 font-mono text-xs tracking-normal text-silver outline-none focus:border-ozone">
              {COIN_EDITIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        </div>

        {/* Main grid: 3D viewer + material panel */}
        <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            <CoinViewer3D ref={viewerRef} config={config} materialId={materialId} edgeType={edgeType} enamelId={enamelId} />
            <CoinMatrixStrip config={config} material={material} />
          </div>

          {/* Material selector + specs */}
          <div className="flex flex-col gap-4">
            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Material</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {COIN_MATERIALS.map((m) => (
                  <button key={m.id} onClick={() => setMaterialId(m.id)}
                    className={`flex flex-col gap-1.5 border p-3 text-left transition-colors ${materialId === m.id ? "border-ozone bg-ozone/5" : "border-slate2 hover:border-ozone/40"}`}>
                    <span className="h-4 w-full border border-slate2/50" style={{ background: m.hex }} />
                    <span className="text-[11px] font-bold text-silver">{m.name}</span>
                    <span className="font-mono text-[9px] text-silver/45">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate2 bg-card p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Edge</div>
                <div className="mt-2 space-y-1.5">
                  {EDGE_TYPES.map((e) => (
                    <button key={e.id} onClick={() => setEdgeType(e.id)}
                      className={`flex w-full items-center justify-between border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${edgeType === e.id ? "border-ozone bg-ozone/5 text-ozone" : "border-slate2 text-silver/50 hover:border-ozone/40"}`}>
                      <span>{e.name}</span>
                      <span className="text-[8px] text-silver/30">{e.desc.split("·")[0].trim()}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border border-slate2 bg-card p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Enamel</div>
                <div className="mt-2 space-y-1.5">
                  {ENAMEL_ACCENTS.map((e) => (
                    <button key={e.id} onClick={() => setEnamelId(e.id)}
                      className={`flex w-full items-center gap-2 border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${enamelId === e.id ? "border-ozone bg-ozone/5 text-ozone" : "border-slate2 text-silver/50 hover:border-ozone/40"}`}>
                      <span className="h-3 w-3 border border-slate2/40" style={{ background: e.hex || "transparent" }} />
                      <span>{e.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Physical specs · 64mm Ø</div>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 font-mono text-[11px]">
                {COIN_SPECS.map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[9px] uppercase tracking-widest text-silver/40">{k}</div>
                    <div className="mt-0.5 text-silver/80">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleExport}
              className="flex items-center justify-center gap-2 border-2 border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare">
              <Download className="h-3.5 w-3.5" /> Export artifact PNG
            </button>
          </div>
        </div>

        {/* UN SDG alignment */}
        <div className="mt-8 border border-slate2 bg-card p-5">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-ozone" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">UN SDG alignment</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {SDG_ALIGNMENTS.map((s) => (
              <div key={s.num} className="border border-slate2 p-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-ozone">{String(s.num).padStart(2, "0")}</span>
                  <span className="text-sm font-bold text-silver">{s.name}</span>
                </div>
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-silver/50">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tokenomics */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-ozone" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Artifact + on-chain twin</div>
          </div>
          <div className="mt-3 border border-slate2/40 font-mono text-xs text-silver/60">
            {COIN_TOKENOMICS.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 px-4 py-2 border-b border-slate2/30 last:border-0">
                <span className="uppercase tracking-wider text-silver/50">{k}</span>
                <span className="text-right text-silver">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/40">Not primarily a currency. An artifact of participation — the meme coin you can hold. 1:1 on-chain twin binds the physical coin to a wallet via NFC tap-to-claim.</p>
        </div>

        {/* Provenance certificate */}
        <div className="mt-6 border border-ozone/30 bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-ozone" />
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Provenance · cultural artifact certificate</div>
            </div>
            <span className="border border-flare/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-flare">{editionInfo.rarity}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 md:grid-cols-3 font-mono text-[11px]">
            {[
              ["Artifact ID", `OOH-GC-${serialLabel}`],
              ["Designation", "Cultural Artifact"],
              ["Edition", editionInfo.name],
              ["Material", material.name],
              ["Diameter", "64mm Ø"],
              ["Relief", "Deep 3D · raised rim"],
              ["Edge", (EDGE_TYPES.find((e) => e.id === edgeType) || {}).name || "Reeded"],
              ["Enamel", enamel.name],
              ["SDG Class", "11 · 16 · 17"],
              ["Chain Twin", "Base · ERC-721"],
              ["Custodian", "Unclaimed"],
              ["Origin", "OOH Earth Union"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[9px] uppercase tracking-widest text-silver/40">{k}</div>
                <div className="mt-0.5 text-silver/80">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-slate2/40 pt-3 font-mono text-[10px] leading-relaxed text-silver/45">
            This certificate registers the artifact under OOH Earth's open provenance ledger. The physical coin and its on-chain twin are inseparable — claim the twin by tapping the embedded NFC to a wallet. Transfer of the physical coin transfers the twin.
          </p>
        </div>

        {/* Lab integration */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Lab integration</div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link to="/lab/device" className="group flex items-center gap-3 border border-slate2 p-4 transition-colors hover:border-ozone/50">
              <Box className="h-5 w-5 text-ozone" />
              <div><div className="text-sm font-bold">3D Device</div><div className="font-mono text-[10px] text-silver/50">Coin-cube geometry</div></div>
              <ArrowRight className="ml-auto h-4 w-4 text-silver/30 group-hover:text-ozone" />
            </Link>
            <Link to="/lab/livingcoin" className="group flex items-center gap-3 border border-slate2 p-4 transition-colors hover:border-ozone/50">
              <Coins className="h-5 w-5 text-ozone" />
              <div><div className="text-sm font-bold">Living Coin</div><div className="font-mono text-[10px] text-silver/50">Production spec</div></div>
              <ArrowRight className="ml-auto h-4 w-4 text-silver/30 group-hover:text-ozone" />
            </Link>
            <Link to="/lab/nft" className="group flex items-center gap-3 border border-slate2 p-4 transition-colors hover:border-ozone/50">
              <ShieldCheck className="h-5 w-5 text-ozone" />
              <div><div className="text-sm font-bold">NFT Creator</div><div className="font-mono text-[10px] text-silver/50">Slab grading studio</div></div>
              <ArrowRight className="ml-auto h-4 w-4 text-silver/30 group-hover:text-ozone" />
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}