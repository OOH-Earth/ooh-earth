import { useState } from "react";
import { Smartphone, MapPin, Grid3x3, Wallet, Vote, Radio, ShieldCheck } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import { fromLines, TRI, DIAL } from "@/lib/hexagrams";

// OOH Earth — Companion App (Lab)
// Five mobile screens (S-01…S-05) for the Hex Engine, on the OOH design
// system. Each screen mirrors a real oohearth.app surface.

const TABS = [
  { id: "PAIR", icon: Smartphone }, { id: "MAP", icon: MapPin }, { id: "HEX", icon: Grid3x3 },
  { id: "WALLET", icon: Wallet }, { id: "DAO", icon: Vote },
];

function Phone({ code, name, tab, children }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-[272px] border border-slate2 bg-void p-1.5">
        <div className="relative h-[540px] overflow-hidden border border-slate2/60 bg-card">
          <div className="flex items-center justify-between border-b border-slate2/60 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.2em] text-silver/40">
            <span className="text-ozone">{code}</span><span>OOH · UWB · SE</span>
          </div>
          <div className="h-[458px] overflow-y-auto p-3">{children}</div>
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 border-t border-slate2/60 bg-void">
            {TABS.map((t) => (
              <div key={t.id} className={`flex flex-col items-center gap-0.5 py-2 ${t.id === tab ? "text-ozone" : "text-silver/25"}`}>
                <t.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="font-mono text-[7px] uppercase tracking-wide">{t.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40">{code} · {name}</div>
    </div>
  );
}

const Row = ({ k, v, c }) => (
  <div className="flex justify-between border-b border-slate2/40 py-1.5 font-mono text-[10px] last:border-0">
    <span className="text-silver/40">{k}</span><span style={c ? { color: c } : undefined} className={c ? "" : "text-silver"}>{v}</span>
  </div>
);
const Label = ({ children }) => <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ozone">{children}</div>;

function ScreenPair() {
  const steps = ["discover", "shake", "attest", "bind"];
  const devices = [
    { n: "Hex Engine", s: "BLE · discovered" },
    { n: "OOH Watch", s: "BLE · discovered" },
  ];
  return (
    <>
      <Label>Pair device · onboarding</Label>
      <div className="flex items-center justify-between font-mono text-[7px] uppercase tracking-wider text-silver/30">
        {steps.map((s, i) => (
          <span key={s} className={i === 1 ? "text-ozone" : ""}>{i + 1} {s}</span>
        ))}
      </div>
      <div className="my-4 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ozone/60" style={{ boxShadow: "0 0 24px rgba(237,255,0,.18)" }}>
          <Radio className="h-8 w-8 text-ozone" strokeWidth={1.2} />
        </div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-silver">Shake to bond</div>
        <div className="mt-0.5 font-mono text-[8px] text-silver/40">hold the engine · shake twice</div>
      </div>
      <div className="font-mono text-[8px] uppercase tracking-widest text-silver/40">Available devices</div>
      <div className="mt-1.5 space-y-1.5">
        {devices.map((d) => (
          <div key={d.n} className="flex items-center justify-between border border-slate2 bg-void px-2 py-1.5">
            <div>
              <div className="font-mono text-[10px] text-silver">{d.n}</div>
              <div className="font-mono text-[7px] text-silver/40">{d.s}</div>
            </div>
            <span className="border border-ozone/50 px-2 py-0.5 font-mono text-[7px] uppercase tracking-wide text-ozone">pair</span>
          </div>
        ))}
      </div>
      <div className="mt-3 border border-slate2 bg-void p-3">
        <Row k="LINK" v="BLE 5.3 · paired" c="#39FF14" />
        <Row k="ATTEST" v="SE EAL6+ ✓" c="#39FF14" />
        <Row k="BINDS TO" v="0x7A3…f19" />
      </div>
      <div className="mt-2 flex items-center gap-2 font-mono text-[9px] text-silver/50"><ShieldCheck className="h-3.5 w-3.5 text-brand-green" /> On-device secure element attestation</div>
    </>
  );
}
function ScreenMap() {
  const markers = [[20, 30], [55, 22], [38, 60], [72, 48], [28, 78], [64, 72]];
  return (
    <>
      <Label>City map · Maps / Discovery</Label>
      <div className="relative h-40 border border-slate2 bg-void" style={{ backgroundImage: "linear-gradient(rgba(241,241,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(241,241,241,.04) 1px,transparent 1px)", backgroundSize: "16px 16px" }}>
        {markers.map(([x, y], i) => (
          <div key={i} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 bg-flare" style={{ left: `${x}%`, top: `${y}%`, boxShadow: "0 0 8px rgba(255,92,0,.6)" }} />
        ))}
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ozone" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Billboards", "Digital", "Transit", "Painted"].map((c, i) => (
          <span key={c} className={`border px-2 py-1 font-mono text-[8px] uppercase tracking-wide ${i === 0 ? "border-ozone text-ozone" : "border-slate2 text-silver/40"}`}>{c}</span>
        ))}
      </div>
      <div className="mt-3 border border-slate2 bg-void p-3">
        <Row k="RINGS" v="filter offense layer" />
        <Row k="UWB" v="verified · 2.1m" c="#39FF14" />
        <Row k="ON RECORD" v="6 nearby offenses" />
      </div>
    </>
  );
}
function ScreenHex() {
  const [lines] = useState([1, 0, 1, 1, 0, 1]);
  const h = fromLines(lines);
  return (
    <>
      <Label>Hex state · read-only mirror</Label>
      <div className="flex items-center gap-4">
        <div className="text-6xl leading-none text-ozone" style={{ textShadow: "0 0 20px rgba(237,255,0,.3)" }}>{h.char}</div>
        <div className="flex flex-1 flex-col gap-1">
          {lines.slice().reverse().map((v, i) => (
            <div key={i} className="flex h-2.5 gap-1">{v ? <span className="w-full bg-ozone" /> : <><span className="flex-1 bg-silver/20" /><span className="flex-1 bg-silver/20" /></>}</div>
          ))}
        </div>
      </div>
      <div className="mt-3 border border-slate2 bg-void p-3">
        <Row k="HEXAGRAM" v={`H${h.kw} ${h.pinyin}`} />
        <Row k="MEANING" v={h.english} />
        <Row k="LAYER" v={h.upper.layer} c="#EDFF00" />
        <Row k="BINARY" v={`${h.binary} · ${h.hex}`} />
      </div>
      <div className="mt-3 font-mono text-[9px] uppercase tracking-widest text-silver/40">Recent operations</div>
      <div className="mt-1 font-mono text-[9px] leading-relaxed text-silver/50">
        <div>21:04  SIGN@IDENTITY · H1</div>
        <div>20:52  VERIFY@ASSETS · H52</div>
      </div>
    </>
  );
}
function ScreenWallet() {
  return (
    <>
      <Label>Wallet · engine signs</Label>
      <div className="border border-slate2 bg-void p-3 text-center">
        <div className="font-mono text-[9px] uppercase tracking-widest text-silver/40">$OOH balance</div>
        <div className="mt-1 text-2xl font-bold text-ozone">12,480</div>
        <div className="mt-1 font-mono text-[9px] text-silver/40">+ Genesis Coin № 0045 twin</div>
      </div>
      <div className="mt-3 border border-flare/40 bg-void p-3">
        <div className="font-mono text-[9px] uppercase tracking-widest text-flare">Pending signature</div>
        <Row k="ACTION" v="Fund campaign" />
        <Row k="AMOUNT" v="250 $OOH" />
        <div className="mt-2 border border-ozone bg-ozone py-2 text-center font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void">PRESS engine to sign</div>
      </div>
      <div className="mt-2 font-mono text-[8px] text-silver/40">App composes · secure element signs on-device</div>
    </>
  );
}
function ScreenDao() {
  return (
    <>
      <Label>DAO · governance</Label>
      <div className="border border-slate2 bg-void p-3">
        <div className="font-mono text-[9px] uppercase tracking-widest text-silver/40">Active proposal</div>
        <div className="mt-1 text-sm font-bold text-silver">Ban digital billboards · Zone 3</div>
        <div className="mt-2 flex gap-2">
          <div className="flex-1 border border-brand-green/50 py-2 text-center font-mono text-[9px] uppercase tracking-wide text-brand-green">Ring ↑ For</div>
          <div className="flex-1 border border-slate2 py-2 text-center font-mono text-[9px] uppercase tracking-wide text-silver/40">Ring ↓ Against</div>
        </div>
      </div>
      <div className="mt-3 border border-slate2 bg-void p-3">
        <Row k="WEIGHT" v="×1 · Genesis holder" c="#EDFF00" />
        <Row k="QUORUM" v="61% reached" c="#39FF14" />
        <Row k="CLOSES" v="2d 04h" />
      </div>
      <div className="mt-3 border border-ozone bg-ozone py-2 text-center font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void">PRESS commits vote</div>
    </>
  );
}

const LAYER_MAP = DIAL.map((k) => TRI[k]);

export default function HexCompanion() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Phone Companion" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Phone <span className="text-ozone">Companion</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Five screens · the phone half of the engine</p>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Working copy</span>
        </header>

        <p className="my-6 max-w-3xl font-mono text-xs leading-loose text-silver/50">
          The engine composes intent physically; the app is the window into it. Every screen maps to a live oohearth.app surface — the map is the offense record, the wallet holds the Genesis twin, the DAO tab is real governance. The secure element always signs on-device after a physical PRESS.
        </p>

        <div className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Phone code="S-01" name="Pair" tab="PAIR"><ScreenPair /></Phone>
          <Phone code="S-02" name="City Map" tab="MAP"><ScreenMap /></Phone>
          <Phone code="S-03" name="Hex State" tab="HEX"><ScreenHex /></Phone>
          <Phone code="S-04" name="Wallet" tab="WALLET"><ScreenWallet /></Phone>
          <Phone code="S-05" name="DAO" tab="DAO"><ScreenDao /></Phone>
        </div>

        {/* extra spec: layer routing behind the tabs */}
        <div className="mt-10 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Layer routing · Ba Gua mode → app surface</div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px] sm:grid-cols-4">
            {LAYER_MAP.map((t) => (
              <div key={t.el} className="border-b border-slate2/40 pb-1.5">
                <span className="text-ozone">{t.sym} {t.layer}</span>
                <div className="text-silver/40">{t.verb} · {t.el}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}