import { Coins, ScanLine, HeartHandshake, ArrowUpRight, Flame, Map, CreditCard, Share2, Landmark } from "lucide-react";
import TreasuryBalances from "@/components/ooh/TreasuryBalances";

const FUNDS = [
  { label: "Platform development & security", val: "Build the mapping infrastructure end to end." },
  { label: "Mobile app · Global South access", val: "Members document from anywhere." },
  { label: "Direct support for organizers", val: "Resources to the people doing the work." },
  { label: "Research, finance & platform ops", val: "Keep the resistance solvent and steady." },
];

export default function OnChain() {
  return (
    <section id="onchain" className="relative border-t border-slate2/40 bg-void">
      <div className="hi-vis-stripes h-1 w-full opacity-80" />
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 05 — On-chain infrastructure</span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              The resistance<br />economy
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            An SDG-aligned, community-owned treasury. Every transaction funds OOH.EARTH — open infrastructure for documenting corporate advertising offenses and coordinating creative resistance across the Global South.
          </p>
        </div>

        <div className="mt-8"><TreasuryBalances /></div>

        {/* $OOHEX feature */}
        <div className="mt-10 grid gap-px border border-slate2/60 bg-slate2/40 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative flex flex-col justify-between overflow-hidden bg-card p-6 md:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 opacity-[0.07]">
              <Coins className="h-64 w-64 text-ozone" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-ozone px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void">
                  <Flame className="h-3 w-3" /> $OOHEX
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">pump.fun · Solana</span>
              </div>
              <h3 className="mt-5 font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-silver md:text-5xl">
                They stole the streets. We're stealing them back.
              </h3>
              <p className="mt-4 max-w-lg font-display text-sm font-normal leading-[1.4] text-darkgray">
                A community token that funds the global adbusting network — mapping every corporate crime and coordinating creative chaos.
              </p>
            </div>

            <ul className="mt-8 grid gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-2">
              {FUNDS.map((f) => (
                <li key={f.label} className="bg-card p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">{f.label}</div>
                  <div className="mt-1.5 font-display text-[13px] font-normal leading-[1.4] text-silver/70">{f.val}</div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="https://pump.fun/BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump"
                target="_blank"
                rel="noreferrer"
                data-cursor="view"
                className="inline-flex items-center gap-2 bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare"
              >
                Buy on pump.fun <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://pump.fun/BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump"
                target="_blank"
                rel="noreferrer"
                data-cursor="view"
                className="inline-flex items-center gap-2 border border-slate2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
              >
                Chart · pump.fun
              </a>
              <a
                href="https://donorbox.org/ooh"
                target="_blank"
                rel="noreferrer"
                data-cursor="view"
                className="inline-flex items-center gap-2 border border-slate2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
              >
                <HeartHandshake className="h-3.5 w-3.5" /> Fiat sponsor
              </a>
            </div>
            <a
              href="https://solscan.io/token/BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump"
              target="_blank"
              rel="noreferrer"
              data-cursor="view"
              className="mt-4 inline-block break-all font-mono text-[10px] uppercase tracking-[0.2em] text-dim transition-colors hover:text-ozone"
            >
              CONTRACT · BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump
            </a>
          </div>

          {/* Side tiles */}
          <div className="grid gap-px bg-slate2/40">
            <SideTile
              icon={<Coins className="h-4 w-4" />}
              eyebrow="Zora"
              title="oohearth on-chain"
              desc="On-chain creative resistance. Minted works fund the field."
              href="https://zora.co/@oohearth"
              accent
            />
            <SideTile
              icon={<ScanLine className="h-4 w-4" />}
              eyebrow="Demo"
              title="#TrueCost scanner"
              desc="Scan a barcode or photo to expose the real cost of what they sell."
              href="https://upc.framer.ai/"
            />
          </div>
        </div>

        {/* Live subprojects */}
        <div className="mt-12 border-t border-slate2/40 pt-10">
          <div className="mb-6 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// The ecosystem · live subprojects</span>
            <span className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-2 lg:grid-cols-4">
            <EcoTile
              icon={<Map className="h-4 w-4" />}
              eyebrow="OOH Earth · START"
              title="Adbusting maps"
              desc="The live street-art & adbusting map app. Document the visual world, claim the walls back."
              href="https://oohearth.framer.ai/"
            />
            <EcoTile
              icon={<CreditCard className="h-4 w-4" />}
              eyebrow="Field Card"
              title="OOH supercard"
              desc="Member ID, access tiers and location tagging for field documentation."
              href="https://supercard.framer.ai/"
            />
            <EcoTile
              icon={<Share2 className="h-4 w-4" />}
              eyebrow="Anti-Social"
              title="Adbusting network"
              desc="The social resistance layer — connect, organize and broadcast without the algorithm."
              href="https://streetsocial.framer.ai/"
            />
            <EcoTile
              icon={<Landmark className="h-4 w-4" />}
              eyebrow="Foundation · BASE"
              title="The nonprofit core"
              desc="Governance, treasury and mission docs for the OOH Earth foundation."
              href="https://oohearthfoundation.framer.wiki/"
            />
          </div>
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          Not financial advice. A spoof brand funding real resistance.
        </p>
      </div>
    </section>
  );
}

function SideTile({ icon, eyebrow, title, desc, href, accent = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-cursor="view"
      className={`group relative flex flex-1 flex-col justify-between p-6 transition-colors md:p-8 ${accent ? "bg-card" : "bg-void"}`}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className={accent ? "text-ozone" : "text-dim"}>{icon}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">{eyebrow}</span>
        </div>
        <h4 className="mt-4 font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-silver md:text-3xl">{title}</h4>
        <p className="mt-2 font-display text-[13px] font-normal leading-[1.4] text-darkgray">{desc}</p>
      </div>
      <div className="mt-6 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
        Open <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </a>
  );
}

function EcoTile({ icon, eyebrow, title, desc, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-cursor="view"
      className="group relative flex flex-col justify-between bg-card p-5 transition-colors hover:bg-void md:p-6"
    >
      <div>
        <div className="flex items-center gap-2 text-dim">
          {icon}
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{eyebrow}</span>
        </div>
        <h4 className="mt-4 font-display text-xl font-bold leading-[1.15] tracking-[-0.02em] text-silver">{title}</h4>
        <p className="mt-2 font-display text-[13px] font-normal leading-[1.4] text-darkgray">{desc}</p>
      </div>
      <div className="mt-5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">
        Open <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </a>
  );
}