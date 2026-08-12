import { Link } from 'react-router-dom';
import Nav from '@/components/ooh/Nav';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import SiteFooter from '@/components/ooh/SiteFooter';
import EngineHero from '@/components/ooh/lab/poster/EngineHero';
import MechanicsOfHand from '@/components/ooh/lab/poster/MechanicsOfHand';
import RingHexagrams from '@/components/ooh/lab/poster/RingHexagrams';
import BaGuaModes from '@/components/ooh/lab/poster/BaGuaModes';
import EcosystemSet from '@/components/ooh/lab/poster/EcosystemSet';

// OOH Earth — Hex Engine concept poster (Lab). All sphere, no coin: the 3D Ba Gua
// sphere, the mechanics of the hand, the 64 hexagram states, the 8 modes, and the
// ecosystem it drives. The coin has its own poster at /lab/coin-poster.
export default function HexPoster() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs
          items={[{ label: 'Lab', to: '/lab' }, { label: 'Hex Engine Poster' }]}
          className="mb-4"
        />
        <header className="flex flex-wrap items-baseline gap-4 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">
            Hex Engine <span className="text-ozone">Poster</span>
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">
            The 3D Ba Gua sphere · the city is the interface
          </p>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs uppercase tracking-[0.1em]">
            <Link
              to="/lab/coin-poster"
              className="text-ozone transition-colors hover:text-ozone/70"
            >
              Coin Poster →
            </Link>
            <Link to="/lab" className="text-ozone transition-colors hover:text-ozone/70">
              ← Lab
            </Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">Working copy</span>
          </div>
        </header>

        <div className="mt-6 space-y-6">
          <EngineHero />
          <MechanicsOfHand />
          <RingHexagrams />
          <BaGuaModes />
          <EcosystemSet />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { to: '/lab/simulator', label: 'Hex Simulator' },
            { to: '/lab/devices', label: 'Devices' },
            { to: '/lab/spec', label: 'Engineering Spec' },
            { to: '/lab/companion', label: 'Phone Companion' },
            { to: '/lab/coin-poster', label: 'Coin Poster' },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="border border-slate2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/50 transition-colors hover:border-ozone hover:text-ozone"
            >
              {l.label} →
            </Link>
          ))}
        </div>

        <div className="mt-8 border-t border-slate2 pt-5 text-center">
          <div className="text-lg font-bold uppercase tracking-[0.14em]">OOH Earth Hex Engine</div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-silver/50">
            Ancient systems · future networks · one interface
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
