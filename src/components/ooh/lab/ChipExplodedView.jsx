import { Layers, Recycle, Fingerprint, Leaf } from 'lucide-react';

// ChipExplodedView — technical exploded-view diagram of the OOH Earth
// Genesis Chip construction (face → PVD coating → copper bond → steel core),
// matched to the reference exploded spec, plus a Web7 open-material spec strip.

const LAYERS = [
  {
    cx: 150,
    title: 'Finished Face',
    sub: ['Engraved OOH EARTH iconography,', 'hard-enamel SDG trigram wells'],
    fill: 'url(#faceGrad)',
    rim: true,
  },
  {
    cx: 390,
    title: 'Web7 PVD Coating',
    sub: ['Lead-free PVD brass / ZrN,', '0.3µm · RoHS · corrosion-proof'],
    fill: 'url(#pvdGrad)',
  },
  {
    cx: 630,
    title: '10% Copper Bond',
    sub: ['Electrolytic copper strike layer', 'for PVD adhesion + enamel key'],
    fill: 'url(#cuGrad)',
    speckle: true,
  },
  {
    cx: 870,
    title: '90% Steel Core',
    sub: ['Recycled AISI 1018 high-density', 'steel · 4.5mm heft · 64mm Ø'],
    fill: 'url(#coreGrad)',
    facets: true,
  },
];

const SPEC = [
  { k: 'Core', v: 'Recycled AISI 1018 · 90% · 4.5mm' },
  { k: 'Bonding', v: 'Electrolytic copper · 10% strike' },
  { k: 'Coating', v: 'PVD brass / ZrN · 0.3µm · lead-free' },
  { k: 'Enamel', v: 'Hard enamel · UN SDG trigram wells' },
  { k: 'Provenance', v: 'On-chain material hash · NFC-bound' },
  { k: 'Sourcing', v: 'Conflict-mineral-free · union-made' },
];

const PRINCIPLES = [
  {
    icon: Layers,
    label: 'Open disclosure',
    note: 'Full material BOM published — no hidden alloys.',
  },
  {
    icon: Fingerprint,
    label: 'Verifiable',
    note: 'Material hash minted to the on-chain twin metadata.',
  },
  { icon: Recycle, label: 'Circular', note: 'Recycled steel core, reclaimable end-of-life.' },
  { icon: Leaf, label: 'SDG-aligned', note: 'SDG 12 responsible consumption · union labor.' },
];

export default function ChipExplodedView() {
  return (
    <div className="border border-slate2 bg-card p-5">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-ozone" />
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
          Construction · exploded view · real-to-spec
        </div>
      </div>
      <p className="mt-3 font-mono text-[11px] leading-relaxed text-silver/55">
        Four stacked layers, minted to a 64mm Ø × 4.5mm challenge-chip standard. The face is
        engraved — never printed — so the artifact outlives the platform. Materials disclosed
        openly, verifiable on-chain.
      </p>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox="0 0 1000 430"
          className="w-full min-w-[640px]"
          role="img"
          aria-label="Exploded view of Genesis Chip construction layers"
        >
          <defs>
            <radialGradient id="faceGrad" cx="38%" cy="34%" r="70%">
              <stop offset="0%" stopColor="#F6E7A8" />
              <stop offset="45%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#9C7A12" />
            </radialGradient>
            <radialGradient id="pvdGrad" cx="38%" cy="34%" r="70%">
              <stop offset="0%" stopColor="#FFF1B8" />
              <stop offset="50%" stopColor="#E8C24A" />
              <stop offset="100%" stopColor="#B8860B" />
            </radialGradient>
            <radialGradient id="cuGrad" cx="42%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#D08855" />
              <stop offset="60%" stopColor="#B87333" />
              <stop offset="100%" stopColor="#8B4513" />
            </radialGradient>
            <radialGradient id="coreGrad" cx="40%" cy="36%" r="72%">
              <stop offset="0%" stopColor="#D8D8D8" />
              <stop offset="55%" stopColor="#A9A9A9" />
              <stop offset="100%" stopColor="#6E6E6E" />
            </radialGradient>
            <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
              <feOffset dx="0" dy="6" result="off" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.34" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* connecting exploded axis */}
          <line
            x1="150"
            y1="150"
            x2="870"
            y2="150"
            stroke="#3a3a3a"
            strokeWidth="1"
            strokeDasharray="3 5"
            opacity="0.5"
          />

          {LAYERS.map((L) => (
            <g key={L.title}>
              {/* disc */}
              <g filter="url(#softShadow)">
                <circle
                  cx={L.cx}
                  cy="150"
                  r="92"
                  fill={L.fill}
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth="1.5"
                />
                {L.rim && (
                  <>
                    <circle
                      cx={L.cx}
                      cy="150"
                      r="84"
                      fill="none"
                      stroke="#7A5C0E"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      opacity="0.7"
                    />
                    <circle
                      cx={L.cx}
                      cy="150"
                      r="58"
                      fill="none"
                      stroke="#7A5C0E"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                    <text
                      x={L.cx}
                      y="138"
                      textAnchor="middle"
                      fontSize="30"
                      fontWeight="800"
                      fill="#5A430A"
                      fontFamily="Inter Tight, sans-serif"
                    >
                      OOH
                    </text>
                    <text
                      x={L.cx}
                      y="162"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="#5A430A"
                      letterSpacing="2"
                      fontFamily="Inter Tight, sans-serif"
                    >
                      EARTH
                    </text>
                  </>
                )}
                {L.speckle &&
                  Array.from({ length: 26 }).map((_, i) => {
                    const a = (i / 26) * Math.PI * 2;
                    const rr = 30 + ((i * 7) % 55);
                    return (
                      <circle
                        key={i}
                        cx={L.cx + Math.cos(a) * rr}
                        cy={150 + Math.sin(a) * rr}
                        r={2 + (i % 3)}
                        fill="#6E3410"
                        opacity="0.55"
                      />
                    );
                  })}
                {L.facets &&
                  Array.from({ length: 14 }).map((_, i) => {
                    const a1 = (i / 14) * Math.PI * 2;
                    const a2 = ((i + 1) / 14) * Math.PI * 2;
                    return (
                      <line
                        key={i}
                        x1={L.cx}
                        y1="150"
                        x2={L.cx + Math.cos(a2) * 92}
                        y2={150 + Math.sin(a2) * 92}
                        stroke="#7C7C7C"
                        strokeWidth="0.7"
                        opacity="0.5"
                      />
                    );
                  })}
                {L.facets && (
                  <circle
                    cx={L.cx}
                    cy="150"
                    r="34"
                    fill="none"
                    stroke="#6E6E6E"
                    strokeWidth="0.8"
                    opacity="0.6"
                  />
                )}
              </g>

              {/* leader line + label */}
              <line x1={L.cx} y1="244" x2={L.cx} y2="288" stroke="#555" strokeWidth="1" />
              <circle cx={L.cx} cy="288" r="2.5" fill="#EDFF00" />
              <text
                x={L.cx}
                y="312"
                textAnchor="middle"
                fontSize="15"
                fontWeight="700"
                fill="#F1F1F1"
                fontFamily="Inter Tight, sans-serif"
              >
                {L.title}
              </text>
              <text
                x={L.cx}
                y="334"
                textAnchor="middle"
                fontSize="10.5"
                fill="#B2B2B2"
                fontFamily="Inter Tight, sans-serif"
              >
                {L.sub[0]}
              </text>
              <text
                x={L.cx}
                y="350"
                textAnchor="middle"
                fontSize="10.5"
                fill="#B2B2B2"
                fontFamily="Inter Tight, sans-serif"
              >
                {L.sub[1]}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Web7 material spec strip */}
      <div className="mt-5 border-t border-slate2/60 pt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
          Web7 material spec · open · verifiable · circular
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {SPEC.map((s) => (
            <div key={s.k} className="border border-slate2 bg-void/40 p-3">
              <div className="font-mono text-[9px] uppercase tracking-widest text-silver/40">
                {s.k}
              </div>
              <div className="mt-1 font-mono text-[10.5px] leading-snug text-silver/80">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Web7 principles */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PRINCIPLES.map((p) => (
          <div key={p.label} className="border border-slate2 p-3">
            <p.icon className="h-4 w-4 text-ozone" />
            <div className="mt-2 text-[12px] font-bold text-silver">{p.label}</div>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-silver/50">{p.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
