import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import { TRI, DIAL } from "@/lib/hexagrams";

// OOH Earth — Hex Engine Engineering Spec (Lab)
// Technical document, rebuilt on the OOH design system. Layer map is derived
// live from the canonical hexagrams.js module.

const STATES = [
  ["SLEEP", "lift · IMU wake", "IDLE"],
  ["IDLE", "ring detent", "COMPOSING"],
  ["COMPOSING", "6 rings settled · 800ms debounce", "ARMED"],
  ["ARMED", "PRESS", "CONFIRM"],
  ["CONFIRM", "SE signs", "EXECUTE"],
  ["CONFIRM", "timeout 10s / no ACK", "ERROR"],
  ["ARMED", "SHAKE", "COMPOSING · randomize"],
  ["any state", "HOLD 2s", "lock toggle"],
];
const GATT = [
  ["0xFE65", "Notify", "Ring state, mode, lock, battery (on change)"],
  ["0xFE66", "Notify", "Executed operations (PRESS events)"],
  ["0xFE67", "Write", "32-byte hash + context; queues on-device confirm"],
  ["0xFE68", "Notify", "Signature or rejection"],
  ["0xFE69", "Write", "App-triggered feedback patterns (nav cues)"],
];
const FRAME = [
  ["0", "A5", "Sync / start byte"],
  ["1", "OPCODE", "Operation type"],
  ["2", "HEX", "Hexagram · 00–3F"],
  ["3", "MODE", "Ba Gua layer · 00–07"],
  ["4", "FLAGS", "State bits"],
  ["5–6", "SEQ16", "16-bit sequence"],
  ["7", "CRC8", "Checksum"],
];
const SCREENS = [
  ["S-01", "Pair Device", "Shake-to-bond · SE attestation"],
  ["S-02", "City Map", "Rings filter map · UWB verify nearby"],
  ["S-03", "Hex State", "Live mirror of physical state (read-only)"],
  ["S-04", "Wallet", "App composes tx · engine PRESS signs"],
  ["S-05", "DAO", "Ring 1 = vote direction · PRESS commits"],
];
const OPEN_Q = [
  "Ring-settle debounce (800ms) vs. deliberate slow composition — needs hand testing.",
  "Does FLIP (network toggle) risk accidental testnet signing? Consider requiring FLIP + HOLD.",
  "$OOH token mechanics beyond the coin twin — out of scope for v1.0, DAO decision.",
  "Offline signing queue depth when BLE is out of range.",
];

function Section({ n, title, children }) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline gap-3 border-b border-slate2 pb-2">
        <span className="font-mono text-[11px] text-silver/40">{n}</span>
        <h2 className="text-base font-bold uppercase tracking-[0.14em]">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto border border-slate2">
      <table className="w-full border-collapse font-mono text-[11px]">
        <thead>
          <tr className="border-b border-slate2 text-left">
            {head.map((h) => <th key={h} className="px-3 py-2 font-normal uppercase tracking-widest text-ozone">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate2/50 last:border-0">
              {r.map((c, j) => <td key={j} className={`px-3 py-2 align-top ${j === 0 ? "text-silver" : "text-silver/60"}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HexSpec() {
  const layerRows = DIAL.map((k) => { const t = TRI[k]; return [`${t.sym} ${t.el}`, t.layer, t.verb, t.verbDesc]; });

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-4xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Engineering Spec" }]} className="mb-4" />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Engineering <span className="text-ozone">Spec</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">Hex Engine · digital half · v1.0</p>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Working copy</span>
        </header>

        <Section n="00" title="System overview">
          <p className="font-mono text-xs leading-loose text-silver/60">
            The Hex Engine is a tangible I Ching controller: six rotating rings compose a hexagram (0–63), a Ba Gua dial selects one of eight OOH Earth layers, and PRESS executes the resulting operation. The physical device composes intent; a secure element signs on-device after physical confirmation. This document specifies the digital half — protocol, state machine, and BLE service.
          </p>
        </Section>

        <Section n="01" title="Layer map">
          <Table head={["Trigram", "Layer", "Verb", "Meaning"]} rows={layerRows} />
        </Section>

        <Section n="02" title="Device state machine">
          <Table head={["From", "Transition", "To"]} rows={STATES} />
        </Section>

        <Section n="03" title="BLE GATT · service 0xFE64 “HexEngine”">
          <Table head={["Char", "Type", "Payload"]} rows={GATT} />
        </Section>

        <Section n="04" title="Frame format · 8 bytes">
          <Table head={["Byte", "Field", "Description"]} rows={FRAME} />
          <p className="mt-3 font-mono text-[11px] text-silver/50">CRC8 = (0xA5 + hex + mode) mod 256 · little-endian sequence.</p>
        </Section>

        <Section n="05" title="Companion screen inventory">
          <Table head={["ID", "Screen", "Function"]} rows={SCREENS} />
        </Section>

        <Section n="06" title="Open questions">
          <ul className="space-y-2 font-mono text-[11px] leading-relaxed text-silver/60">
            {OPEN_Q.map((q, i) => <li key={i} className="flex gap-2"><span className="text-ozone">·</span> {q}</li>)}
          </ul>
        </Section>
      </div>
      <SiteFooter />
    </div>
  );
}
