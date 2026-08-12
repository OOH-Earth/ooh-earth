import { Link } from 'react-router-dom';
import { Nfc, ShieldCheck, ArrowRight, Droplet, Weight } from 'lucide-react';
import Nav from '@/components/ooh/Nav';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import SiteFooter from '@/components/ooh/SiteFooter';

// NFC Field Tag — pendant wearable prototype. Tap a spot, bind it to a wallet.
const SPECS = [
  ['Chip', 'NTAG216 · 888 B'],
  ['Protocol', 'NFC Forum Type 2'],
  ['Bind', 'Spot → wallet · 1:1'],
  ['Tamper', 'Tamper-evident seal'],
  ['Rating', 'IP68 · 1.5m / 60 min'],
  ['Material', 'Recycled steel + enamel'],
  ['Size', '34mm Ø · 6g'],
  ['Claim', 'Tap → ERC-721 twin'],
];

export default function NfcFieldTag() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-5xl page-top px-6 pb-12">
        <Breadcrumbs
          items={[
            { label: 'Lab', to: '/lab' },
            { label: 'Devices', to: '/lab/devices' },
            { label: 'NFC Field Tag' },
          ]}
          className="mb-4"
        />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">
            NFC <span className="text-ozone">Field Tag</span>
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">
            Pendant wearable · tap-to-claim
          </p>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">
            Prototype
          </span>
        </header>

        <div className="mt-6 grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          {/* tag visual */}
          <div className="border border-slate2 bg-card p-6">
            <div className="flex justify-center">
              <svg
                viewBox="0 0 200 240"
                className="w-48"
                role="img"
                aria-label="NFC field tag pendant"
              >
                <defs>
                  <radialGradient id="tagFace" cx="40%" cy="35%" r="70%">
                    <stop offset="0%" stopColor="#3a3a3a" />
                    <stop offset="100%" stopColor="#161616" />
                  </radialGradient>
                </defs>
                <rect x="92" y="8" width="16" height="22" rx="3" fill="#1a1a1a" stroke="#3a3a3a" />
                <rect
                  x="40"
                  y="28"
                  width="120"
                  height="190"
                  rx="26"
                  fill="url(#tagFace)"
                  stroke="#EDFF00"
                  strokeWidth="1.5"
                />
                <rect
                  x="48"
                  y="36"
                  width="104"
                  height="174"
                  rx="20"
                  fill="none"
                  stroke="#3a3a3a"
                  strokeWidth="1"
                />
                <text
                  x="100"
                  y="92"
                  textAnchor="middle"
                  fontSize="30"
                  fontWeight="800"
                  fill="#EDFF00"
                  fontFamily="Inter Tight, sans-serif"
                >
                  OOH
                </text>
                <text
                  x="100"
                  y="112"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#EDFF00"
                  letterSpacing="2"
                  fontFamily="Inter Tight, sans-serif"
                >
                  EARTH
                </text>
                <g stroke="#B2B2B2" strokeWidth="1.5" fill="none" opacity="0.7">
                  <path d="M70 150 a30 30 0 0 1 60 0" />
                  <path d="M78 150 a22 22 0 0 1 44 0" />
                  <path d="M86 150 a14 14 0 0 1 28 0" />
                </g>
                <circle cx="100" cy="150" r="3" fill="#EDFF00" />
                <text
                  x="100"
                  y="192"
                  textAnchor="middle"
                  fontSize="9"
                  fill="#888"
                  letterSpacing="2"
                  fontFamily="monospace"
                >
                  NTAG216 · IP68
                </text>
              </svg>
            </div>
            <div className="mt-4 flex justify-center gap-4 font-mono text-[9px] uppercase tracking-widest text-silver/40">
              <span className="flex items-center gap-1">
                <Weight className="h-3 w-3" />
                6g
              </span>
              <span className="flex items-center gap-1">
                <Droplet className="h-3 w-3" />
                IP68
              </span>
              <span className="flex items-center gap-1">
                <Nfc className="h-3 w-3" />
                NFC
              </span>
            </div>
          </div>

          {/* copy + flow + specs */}
          <div className="flex flex-col gap-4">
            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
                What it does
              </div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-silver/55">
                A pendant you tap to any logged billboard, bus-stop, or spot. The tag writes its
                identity over NFC and binds the physical location to your wallet as a 1:1 on-chain
                twin — proof-of-presence, on the record.
              </p>
            </div>
            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
                Tap-to-claim flow
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-silver/65">
                <span className="border border-slate2 px-2 py-1">Tap spot</span>
                <ArrowRight className="h-3 w-3 text-ozone" />
                <span className="border border-slate2 px-2 py-1">Tag signs</span>
                <ArrowRight className="h-3 w-3 text-ozone" />
                <span className="border border-slate2 px-2 py-1">Spot → wallet</span>
                <ArrowRight className="h-3 w-3 text-ozone" />
                <span className="border border-ozone/40 bg-ozone/5 px-2 py-1 text-ozone">
                  ERC-721 twin
                </span>
              </div>
            </div>
            <div className="border border-slate2 bg-card p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
                Specs
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px]">
                {SPECS.map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[9px] uppercase tracking-widest text-silver/40">{k}</div>
                    <div className="text-silver/80">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-silver/50">
          <ShieldCheck className="h-4 w-4 text-brand-green" /> Tamper-evident seal — the tag voids
          if removed, killing the twin.
        </div>

        <Link
          to="/lab/devices"
          className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver/50 transition-colors hover:text-ozone"
        >
          <ArrowRight className="h-3 w-3 rotate-180" /> Back to devices
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
