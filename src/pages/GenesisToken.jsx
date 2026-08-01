import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, Layers, ArrowRight, ShieldCheck, Flame, Vote, Award, Sparkles, Zap, Download, HelpCircle } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import { useLabGate } from "@/components/ooh/LabGate";
import TokenChip3D from "@/components/ooh/lab/TokenChip3D";
import { TOKEN_SPECS, TOKEN_DISTRIBUTION, TOKEN_UTILITY, TOKEN_VS_CHIP, TOKEN_FLOW, REWARD_TIERS, CHIP_RING_COLORS, CHIP_SPOT_COLORS, CHIP_FIELD_COLORS } from "@/components/ooh/lab/tokenPresets";

const UTILITY_ICONS = { Reward: Zap, Vote: Vote, Stake: ShieldCheck, Bounty: Coins, Access: Sparkles, Tip: ArrowRight };

// OOH Earth — Genesis Token ($OOHEX)
// Fungible community + governance token for the visual commons.
// Distinct from the Genesis Chip (physical, non-fungible cultural artifact).
// Token = liquid currency + rewards; Chip = cultural artifact + provenance.

export default function GenesisToken() {
  const chipRef = useRef(null);
  const { gate } = useLabGate();
  const [ring, setRing] = useState("#D32F2F");
  const [spot, setSpot] = useState("#7D5A46");
  const [field, setField] = useState("#000000");
  const [glyph, setGlyph] = useState("Ø");
  const [topText, setTopText] = useState("OOH EARTH · VISUAL COMMONS");
  const [bottomText, setBottomText] = useState("$OOHEX · BASE · ERC-20");

  const handleExport = () => {
    if (!gate("Export token chip PNG")) return;
    chipRef.current?.exportPNG();
  };

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Genesis Token" }]} className="mb-4" />

        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">Genesis <span className="text-ozone">Token</span></h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">$OOHEX · fungible · ERC-20 · Base · community + governance</p>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs uppercase tracking-[0.1em]">
            <Link to="/lab" className="text-silver/40 transition-colors hover:text-ozone">← Lab</Link>
            <Link to="/lab/coin" className="text-silver/40 transition-colors hover:text-ozone">→ Genesis Chip</Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">Working copy</span>
          </div>
        </header>

        {/* What this is */}
        <div className="mt-5 flex items-start gap-3 border border-ozone/25 bg-ozone/[0.04] px-4 py-3">
          <Coins className="mt-0.5 h-4 w-4 shrink-0 text-ozone" />
          <p className="font-mono text-[11px] leading-relaxed text-silver/60">
            <span className="text-ozone">$OOHEX · FUNGIBLE COMMUNITY TOKEN</span> — The Genesis Token is the liquid, on-chain currency of the OOH Earth commons. Unlike the Genesis Chip (a physical, non-fungible cultural artifact you hold), the token is divisible, tradeable, and earned. It funds field work, rewards operatives, and governs the treasury. Burned on every transfer, governed by those who hold it.
          </p>
        </div>

        {/* 3D chip spinner — token mark studio */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <TokenChip3D ref={chipRef} ring={ring} spot={spot} field={field} glyph={glyph} topText={topText} bottomText={bottomText} accent="#D4AF37" />
          <div className="flex flex-col gap-4">
            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Chip mark studio</div>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/55">
                A fungible token has no physical form — so its mark is minted as a chip. Customize the ring, edge spots, center field, glyph, and arched text, then export the render for DEX listings, wallets, and social.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Ring</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {CHIP_RING_COLORS.map((c) => (
                      <button key={c.id} onClick={() => setRing(c.hex)} title={c.name}
                        className={`h-6 w-6 border ${ring === c.hex ? "border-ozone ring-1 ring-ozone" : "border-slate2/50 hover:border-ozone/40"}`}
                        style={{ background: c.hex }} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Edge spots</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {CHIP_SPOT_COLORS.map((c) => (
                      <button key={c.id} onClick={() => setSpot(c.hex)} title={c.name}
                        className={`h-6 w-6 border ${spot === c.hex ? "border-ozone ring-1 ring-ozone" : "border-slate2/50 hover:border-ozone/40"}`}
                        style={{ background: c.hex }} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Center field</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {CHIP_FIELD_COLORS.map((c) => (
                      <button key={c.id} onClick={() => setField(c.hex)} title={c.name}
                        className={`h-6 w-6 border ${field === c.hex ? "border-ozone ring-1 ring-ozone" : "border-slate2/50 hover:border-ozone/40"}`}
                        style={{ background: c.hex }} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Glyph</div>
                  <input type="text" maxLength={3} value={glyph} onChange={(e) => setGlyph(e.target.value)}
                    className="mt-1.5 w-full border border-slate2 bg-card px-2 py-1.5 text-center font-display text-lg font-bold text-silver outline-none focus:border-ozone" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Top text</div>
                  <input type="text" maxLength={32} value={topText} onChange={(e) => setTopText(e.target.value)}
                    className="mt-1 w-full border border-slate2 bg-card px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-silver outline-none focus:border-ozone" />
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Bottom text</div>
                  <input type="text" maxLength={24} value={bottomText} onChange={(e) => setBottomText(e.target.value)}
                    className="mt-1 w-full border border-slate2 bg-card px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-silver outline-none focus:border-ozone" />
                </div>
              </div>
            </div>
            <button onClick={handleExport}
              className="flex items-center justify-center gap-2 border-2 border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare">
              <Download className="h-3.5 w-3.5" /> Export chip render PNG
            </button>
            <div className="border border-slate2 bg-card p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">Where it's used</div>
              <ul className="mt-2 space-y-1.5 font-mono text-[10px] leading-relaxed text-silver/50">
                <li>· DEX listing thumbnail (Uniswap, Raydium)</li>
                <li>· Wallet token icon (MetaMask, Phantom)</li>
                <li>· Block explorer contract page</li>
                <li>· Social previews + marketing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What's in a name — Genesis Token disambiguation */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-ozone" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">What's in a name · "Genesis Token" disambiguation</div>
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/55">
            "Genesis Token" is a generic crypto term. Several unrelated projects use the word "Genesis." Here's how ours is distinct — and what it means for OOH Earth.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="border border-slate2 p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-flare">Metaplex Genesis (Solana)</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">A launchpad for fair-mint NFT collections on Solana. It's a <span className="text-silver/80">tool</span>, not a token. Our Genesis Token is a standalone fungible ERC-20 — no relation to Metaplex's launchpad.</p>
            </div>
            <div className="border border-slate2 p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-flare">Solana Seeker Genesis Token</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">A limited NFT pass for the Seeker hardware device. It's a <span className="text-silver/80">non-fungible pass</span>. Our token is fungible and open-supply — no device gate, no whitelist.</p>
            </div>
            <div className="border border-slate2 p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-flare">Genesis (GXN) altcoin</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">A separate L1 blockchain project sharing the name. Entirely different team, chain, and purpose. Not us — no affiliation.</p>
            </div>
            <div className="border border-ozone/40 bg-ozone/5 p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">OOH Earth — $OOHEX (ours)</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">"Genesis" here marks the <span className="text-silver/80">first supply</span> — the genesis allocation that bootstraps the OOH Earth commons treasury. It's a utility + governance ERC-20 on Base, paired with the physical Genesis Chip. Not a launchpad, not a pass, not another chain's coin.</p>
            </div>
          </div>
        </div>

        {/* Chip vs Token — the core distinction */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-ozone" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Chip vs Token — two assets, one commons</div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse font-mono text-[11px]">
              <thead>
                <tr className="border-b border-slate2">
                  <th className="px-3 py-2 text-left text-[9px] uppercase tracking-widest text-silver/40">Aspect</th>
                  <th className="px-3 py-2 text-left text-[9px] uppercase tracking-widest text-ozone">$OOHEX Token</th>
                  <th className="px-3 py-2 text-left text-[9px] uppercase tracking-widest text-flare">Genesis Chip</th>
                </tr>
              </thead>
              <tbody>
                {TOKEN_VS_CHIP.map((row) => (
                  <tr key={row.aspect} className="border-b border-slate2/30 last:border-0">
                    <td className="px-3 py-2.5 text-silver/45">{row.aspect}</td>
                    <td className="px-3 py-2.5 text-silver/80">{row.token}</td>
                    <td className="px-3 py-2.5 text-silver/80">{row.chip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-silver/45">
            <span className="text-silver/70">Together:</span> the chip is the artifact you hold — scarce, physical, provenance-bearing. The token is the currency you spend and earn — liquid, divisible, governance-bearing. The chip gives you a fixed presence vote; the token gives you proportional economic say. Both fund the same treasury.
          </p>
        </div>

        {/* Two-column: specs + distribution */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border border-slate2 bg-card p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Token specs</div>
            <div className="mt-3 font-mono text-xs text-silver/60">
              {TOKEN_SPECS.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 px-1 py-2 border-b border-slate2/30 last:border-0">
                  <span className="uppercase tracking-wider text-silver/50">{k}</span>
                  <span className="text-right text-silver">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate2 bg-card p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Distribution · 1B fixed supply</div>
            <div className="mt-4 space-y-3">
              {TOKEN_DISTRIBUTION.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-silver/70">{d.label}</span>
                    <span className="text-ozone">{d.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-slate2/40">
                    <div className="h-full" style={{ width: `${d.pct}%`, background: d.color }} />
                  </div>
                  <p className="mt-1 font-mono text-[9px] leading-relaxed text-silver/40">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Utility */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-ozone" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Utility · what the token does</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {TOKEN_UTILITY.map((u) => {
              const Icon = UTILITY_ICONS[u.icon] || Zap;
              return (
                <div key={u.title} className="border border-slate2 p-4">
                  <Icon className="h-5 w-5 text-ozone" />
                  <div className="mt-2 text-sm font-bold">{u.title}</div>
                  <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-silver/50">{u.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flow — how tokens move through the ecosystem */}
        <div className="mt-6 border border-ozone/30 bg-card p-5">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-ozone" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">The cycle · earn → trade → govern → stake</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            {TOKEN_FLOW.map((f) => (
              <div key={f.step} className="border border-slate2 p-4">
                <div className="font-display text-2xl font-bold text-ozone">{f.step}</div>
                <div className="mt-1 text-sm font-bold">{f.label}</div>
                <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-silver/50">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-silver/65">
            <span className="border border-slate2 px-2 py-1">Bust verified</span>
            <ArrowRight className="h-3 w-3 text-ozone" />
            <span className="border border-slate2 px-2 py-1">+1,000 $OOHEX minted</span>
            <ArrowRight className="h-3 w-3 text-ozone" />
            <span className="border border-ozone/40 bg-ozone/5 px-2 py-1 text-ozone">Operative wallet</span>
            <ArrowRight className="h-3 w-3 text-ozone" />
            <span className="border border-slate2 px-2 py-1">Stake or spend</span>
            <ArrowRight className="h-3 w-3 text-ozone" />
            <span className="border border-flare/40 bg-flare/5 px-2 py-1 text-flare">1% burned</span>
          </div>
        </div>

        {/* Reward tiers — proof-of-presence mining */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-ozone" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Reward tiers · proof-of-presence mining</div>
          </div>
          <div className="mt-4 font-mono text-xs text-silver/60">
            {REWARD_TIERS.map((r) => (
              <div key={r.action} className="flex items-center justify-between gap-3 px-1 py-2.5 border-b border-slate2/30 last:border-0">
                <span className="text-silver/65">{r.action}</span>
                <span className="text-ozone">{r.reward}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/45">
            Rewards mint from the 20% field-rewards pool. When the pool depletes, the DAO votes to replenish from the treasury — the commons sustains its own field force.
          </p>
        </div>

        {/* Why this matters to the project */}
        <div className="mt-6 border border-ozone/30 bg-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-ozone" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Project value · why the token exists</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="border border-slate2 p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">01 · Funding</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">Token liquidity + treasury allocation funds the field work — maps, legal defense, open-source code — without ads or VC dilution. The commons is self-sustaining.</p>
            </div>
            <div className="border border-slate2 p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">02 · Incentives</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">Proof-of-presence mining turns documentation into income. Operatives in under-mapped cities earn real value for filling blank spots — the map grows where it's needed most.</p>
            </div>
            <div className="border border-slate2 p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ozone">03 · Governance</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">Those who hold and stake the token decide where the treasury flows — which cities get mapped, which legal cases backed, which tools built. Quadratic voting keeps it fair.</p>
            </div>
          </div>
          <div className="mt-4 border border-slate2 bg-void p-4">
            <div className="font-mono text-[9px] uppercase tracking-widest text-flare">The flywheel</div>
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-silver/65">
              <span className="border border-slate2 px-2 py-1">More busts</span>
              <ArrowRight className="h-3 w-3 text-ozone" />
              <span className="border border-slate2 px-2 py-1">More map data</span>
              <ArrowRight className="h-3 w-3 text-ozone" />
              <span className="border border-slate2 px-2 py-1">More value</span>
              <ArrowRight className="h-3 w-3 text-ozone" />
              <span className="border border-slate2 px-2 py-1">Higher token demand</span>
              <ArrowRight className="h-3 w-3 text-ozone" />
              <span className="border border-ozone/40 bg-ozone/5 px-2 py-1 text-ozone">Bigger treasury</span>
              <ArrowRight className="h-3 w-3 text-ozone" />
              <span className="border border-slate2 px-2 py-1">More field work</span>
            </div>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/45">
              The chip anchors provenance; the token fuels the flywheel. Together they create a self-reinforcing loop: documentation generates value, value funds more documentation, the commons grows.
            </p>
          </div>
        </div>

        {/* Not a security disclaimer */}
        <div className="mt-6 border border-flare/30 bg-flare/[0.03] px-4 py-3">
          <p className="font-mono text-[10px] leading-relaxed text-silver/50">
            <span className="text-flare">NOT A SECURITY.</span> $OOHEX is a utility + governance token. It grants no equity, no dividend, no profit-sharing. Its value derives from ecosystem use (rewards, governance, access), not from the expectation of profit from the efforts of others. The token is burned on transfer (deflationary), not promised to appreciate. Read the full disclaimer on the Zora page.
          </p>
        </div>

        {/* Lab integration */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">Lab integration</div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link to="/lab/coin" className="group flex items-center gap-3 border border-slate2 p-4 transition-colors hover:border-ozone/50">
              <Coins className="h-5 w-5 text-ozone" />
              <div><div className="text-sm font-bold">Genesis Chip</div><div className="font-mono text-[10px] text-silver/50">Physical artifact · 1:1 twin</div></div>
              <ArrowRight className="ml-auto h-4 w-4 text-silver/30 group-hover:text-ozone" />
            </Link>
            <Link to="/lab/nft" className="group flex items-center gap-3 border border-slate2 p-4 transition-colors hover:border-ozone/50">
              <Sparkles className="h-5 w-5 text-ozone" />
              <div><div className="text-sm font-bold">NFT Creator</div><div className="font-mono text-[10px] text-silver/50">Subvertising slab studio</div></div>
              <ArrowRight className="ml-auto h-4 w-4 text-silver/30 group-hover:text-ozone" />
            </Link>
            <Link to="/zora" className="group flex items-center gap-3 border border-slate2 p-4 transition-colors hover:border-ozone/50">
              <Vote className="h-5 w-5 text-ozone" />
              <div><div className="text-sm font-bold">On-Chain</div><div className="font-mono text-[10px] text-silver/50">Zora · Base · Solana markets</div></div>
              <ArrowRight className="ml-auto h-4 w-4 text-silver/30 group-hover:text-ozone" />
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}