import { Map as MapIcon, Megaphone, Users, Wallet, MapPin, Network } from "lucide-react";

const ECO = [
  { icon: MapIcon, t: "Maps", d: "Discover OOH media & murals" },
  { icon: Megaphone, t: "Campaigns", d: "View & support live activations" },
  { icon: Users, t: "DAO", d: "Propose, vote & govern" },
  { icon: Wallet, t: "Wallet", d: "Sign, send, stake & collect" },
  { icon: MapPin, t: "Proof of Presence", d: "Check-in, verify real-world impact" },
  { icon: Network, t: "Community", d: "Connect artists, brands, curators" },
];

function MiniPhone({ label, children }) {
  return (
    <div className="w-[150px] border border-slate2 bg-void p-1">
      <div className="h-[230px] overflow-hidden border border-slate2/60 bg-card p-2">
        <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-ozone">{label}</div>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

export default function EcosystemSet() {
  return (
    <>
      <section className="border border-slate2 bg-card p-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">OOH Earth ecosystem integration</div>
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ECO.map((e) => (
              <div key={e.t} className="border border-slate2 bg-void/40 p-3">
                <e.icon className="h-5 w-5 text-ozone" strokeWidth={1.5} />
                <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-silver">{e.t}</div>
                <div className="mt-0.5 font-mono text-[9px] leading-snug text-silver/45">{e.d}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <MiniPhone label="Map">
              <div className="relative h-24 border border-slate2/50 bg-void grid-bg">
                {[[30, 30], [60, 22], [45, 60], [75, 55]].map(([x, y], i) => <div key={i} className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-flare" style={{ left: `${x}%`, top: `${y}%` }} />)}
                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ozone" />
              </div>
              <div className="mt-2 flex justify-center"><div className="h-8 w-8 rounded-full border-2 border-ozone/60" style={{ boxShadow: "0 0 12px rgba(237,255,0,.2)" }} /></div>
            </MiniPhone>
            <MiniPhone label="DAO">
              <div className="border border-slate2/50 bg-void p-2">
                <div className="font-mono text-[7px] uppercase text-silver/50">DAO Proposal</div>
                <div className="mt-1 text-[9px] font-bold text-silver">Mural District Fund</div>
                <div className="mt-2 bg-ozone py-1.5 text-center font-mono text-[8px] font-bold uppercase tracking-wide text-void">Vote</div>
              </div>
              <div className="mt-2 flex justify-between font-mono text-[7px] text-silver/40">
                {["Vote", "Prop", "Gov", "Hist"].map((s) => <span key={s}>{s}</span>)}
              </div>
            </MiniPhone>
            <MiniPhone label="Wallet">
              <div className="border border-slate2/50 bg-void p-2 text-center">
                <div className="font-mono text-[7px] uppercase text-silver/40">Balance</div>
                <div className="text-base font-bold text-ozone">2.45 OOH</div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="aspect-square border border-slate2/50 bg-card" />)}
                </div>
              </div>
              <div className="mt-2 flex justify-between font-mono text-[7px] text-silver/40">
                {["Wal", "Act", "Col", "Set"].map((s) => <span key={s}>{s}</span>)}
              </div>
            </MiniPhone>
          </div>
        </div>
      </section>

      <section className="border border-ozone/30 bg-card p-6 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">The set</div>
        <div className="mt-3 text-lg font-bold uppercase tracking-[0.14em] text-silver">Ancient systems · future networks · one interface</div>
        <p className="mx-auto mt-3 max-w-2xl font-mono text-[11px] leading-relaxed text-silver/55">The OOH Earth Hex Engine and Genesis Coin, paired in a limited set — the complexity of the city and the blockchain turned into something you can hold, feel and understand.</p>
      </section>
    </>
  );
}