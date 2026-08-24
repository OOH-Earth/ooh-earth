import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Nav from '@/components/ooh/Nav';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Lock, Copy, Check, ArrowUpRight } from 'lucide-react';

/* ────────────────────────────────────────────────────────────
   OOH Earth · Architecture Operations Portal · /portal/ops · v2
   Ported from the standalone Orbital Perspective build into the
   live app. Single source of truth for system architecture,
   protocol stack, treasury and security posture. Real repo state
   where verified — explicit "Planned" labels everywhere infra
   doesn't exist yet.

   Admin-only: route sits under ProtectedRoute (auth); this page
   enforces agency membership. The clearance selector is a UI-only
   demo of the access matrix — like Dashboard's "Preview as" — it
   never changes real permissions.

   SENSITIVE METADATA (secret names/purposes + risk register) is
   NOT in this bundle. It's fetched at runtime from opsIntel, an
   agency-gated function that only returns secrets to admins. The
   bundle carries no secret names, purposes, or risk text.

   LIVE wiring (all defensive — a failed call falls back to a
   placeholder, never breaks the page):
     · opsIntel    → risk register + (admin) secrets inventory
     · fieldStats  → executive stats + client-latency readout
     · cryptoWatch → live Polygon balances + recent SOL/ETH tx
     · Location    → real moderation queue (filter + update)
──────────────────────────────────────────────────────────── */

import { roleOf, accessOf, agencyOf, payload } from '@/lib/clearance';
const fmt = (n) => (typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString() : '—');
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const short = (h) => (h ? `${h.slice(0, 6)}…${h.slice(-6)}` : '');

const CLR_NAMES = ['Member', 'Operative', 'Moderator', 'Admin'];

const SECTIONS = [
  { id: 'exec', label: 'Executive Overview', min: 1 },
  { id: 'map', label: 'Architecture Map', min: 1 },
  { id: 'protocol', label: 'Protocol Stack', min: 1 },
  { id: 'treasury', label: 'Treasury', min: 3 },
  { id: 'coins', label: 'Coin Registry', min: 1 },
  { id: 'api', label: 'API Inventory', min: 2 },
  { id: 'infra', label: 'Infrastructure', min: 2 },
  { id: 'security', label: 'Security Center', min: 3 },
  { id: 'docs', label: 'Documentation', min: 1 },
  { id: 'monitor', label: 'Live Monitoring', min: 1 },
  { id: 'risk', label: 'Risk Register', min: 2, isNew: true },
  { id: 'deploy', label: 'Deploy & Releases', min: 3, isNew: true },
  { id: 'console', label: 'Ops Console', min: 3, isNew: true },
  { id: 'roster', label: 'Access Roster', min: 2, isNew: true },
];

/* ── data (non-sensitive; sensitive metadata lives in opsIntel) ─ */
const PROTOCOLS = [
  ['Bitcoin', 'Treasury donation wallet', 'impl', 'Treasury', 'Display only — no tx watcher.'],
  [
    'Ethereum',
    'Treasury wallet + live tx watcher',
    'impl',
    'Treasury',
    'cryptoWatch via Blockchair.',
  ],
  [
    'Polygon',
    'Live treasury watcher + donation panel',
    'impl',
    'Treasury',
    'Most complete integration. See Risk R-01.',
  ],
  [
    'Solana',
    'Treasury wallet + tx watcher + Phantom',
    'impl',
    'Treasury',
    'Separate from the pump.fun coin.',
  ],
  ['Base', 'Only wired mint pipeline', 'impl', 'Mint pipeline', 'No treasury watcher on Base.'],
  [
    'Zora protocol',
    'Metadata prep + market display on Base',
    'impl',
    'Mint pipeline',
    'Mint tx happens off-app at zora.co/create.',
  ],
  [
    'pump.fun (Solana)',
    'Hosts the placeholder community coin',
    'plan',
    'Coin Registry',
    'Explicitly flagged as a placeholder.',
  ],
];
const WALLETS = [
  ['Bitcoin', 'bc1qafyzrynhgwd3c8wm536re7wk2q22qw5zmfqjzv'],
  ['Ethereum', '0xe286EB19b5a64DC41Ca76f58D8fd6d7F114C1c12'],
  ['Solana', 'EusJyb6R7vZEnmCLoJXBXui6inozZguAFjkKJNGEaafx'],
  ['USDC (multi-chain)', '0xe286EB19b5a64DC41Ca76f58D8fd6d7F114C1c12'],
  ['Polygon', '0xe286EB19b5a64DC41Ca76f58D8fd6d7F114C1c12'],
];
const COINS = [
  [
    '$OOHEX',
    'Solana',
    'BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump',
    'Explicit placeholder — swap before treating as launch-ready.',
  ],
  ['FLOWER', 'Base', '0x5b48166eeb1321f6c09ee148b59a1eaede13fc81', 'Sample feed.'],
  ['PIRULITO', 'Base', '0xcac466f9520f87c429fa43676d6f6c8fc94c0f71', 'Sample feed.'],
  ['FLORES', 'Base', '0x9f0649369fb58f521722c1b78dc867283a603acf', 'Sample feed.'],
  ['CAMERA', 'Base', '0xcdcb1c89b8bee6255b69fe7a3500bf26470b5413', 'Sample feed.'],
];
// Function inventory — notes for secret-gated fns are generic here; the
// real per-function secret mapping is served (admin-only) via opsIntel.
const FNS = [
  [
    'blog',
    'Gated read/write for BlogPost (public vs agency).',
    'pub',
    'scoped by audience server-side',
  ],
  [
    'cachedIntel',
    'Daily-cached LLM endpoint (skyIntel).',
    'pub',
    'read-only, cached in IntelCache',
  ],
  [
    'createDonationCheckout',
    'Stripe Checkout for a free-form donation.',
    'secret',
    'Stripe Checkout · secrets server-side',
  ],
  [
    'createProductCheckout',
    'Stripe Checkout for a StoreItem.',
    'secret',
    'Stripe Checkout · secrets server-side',
  ],
  ['cryptoWatch', 'Live on-chain treasury watcher: SOL/ETH/Polygon.', 'pub', 'no auth, read-only'],
  [
    'fetchMapLocations',
    'Live location markers from a published feed.',
    'pub',
    'no auth, read-only',
  ],
  ['fieldStats', 'PII-free aggregate stats for the orbital HUD.', 'pub', 'no auth, read-only'],
  [
    'importKmlLocations',
    'Admin-only bulk KML importer, SSRF-hardened.',
    'admin',
    'role/access admin check',
  ],
  [
    'investorAccess',
    'Server-side gate for the investor area.',
    'secret',
    'investor gate · secrets server-side',
  ],
  [
    'moderate',
    'Verification gate for Location and DigitalBust.',
    'admin',
    'queue: admin/mod/operative · verify: admin/mod',
  ],
  [
    'n8nPing',
    'Base44 → n8n bridge health/ping test.',
    'secret',
    'bridge test · secret server-side',
  ],
  [
    'personaCtl',
    'Admin/key-gated clearance controller. Writes AccessLog.',
    'admin',
    'admin OR key-gated',
  ],
  [
    'stripeWebhook',
    'Verifies Stripe signature; updates StoreItem, FundingLead.',
    'secret',
    'signature verify · secret server-side',
  ],
];
const PROPOSED = [
  ['opsHealth', 'Aggregate probe: Base44, n8n, Stripe, last cryptoWatch.', 'Monitoring gaps'],
  ['incidentLog', 'Minimal incident entity + writer. Replaces manual process.', 'R-04'],
  ['secretsAudit', 'Reports secret age vs a rotation cadence.', 'R-06'],
  ['promoteBackup', 'Guarded release: records CHANGELOG + tags a version.', 'R-03'],
  ['riskRegister', 'CRUD for the risk items so the count is live-editable.', 'Risk Register'],
  ['rateLimit', 'Per-IP throttle for public read functions.', 'R-05'],
];
const EXT = [
  ['Etherscan', 'ETH tx links'],
  ['Polygonscan', 'Polygon treasury address link'],
  ['Basescan', 'Base-chain minted-coin links'],
  ['Solscan', 'SOL tx/token links'],
  ['Blockchair', 'ETH tx history for cryptoWatch'],
  ['CoinGecko', 'BTC/ETH/SOL/MATIC price feeds'],
  ['DexScreener', 'Live price/mcap/volume for Zora + pump.fun'],
];
const ENTITIES = [
  ['AccessLog', 'ADMIN-ONLY (ALL CRUD)'],
  ['BlogPost', 'ADMIN-ONLY (PUBLIC VIA BLOG FN)'],
  ['DigitalBust', 'READ: VERIFIED / OWNER / ADMIN'],
  ['FundingLead', 'CREATE OPEN · R/U/D ADMIN'],
  ['IntelCache', 'READ OPEN · WRITE ADMIN'],
  ['LeadClaim', 'R/CREATE OPEN · U/D ADMIN'],
  ['Location', 'READ: VERIFIED / OWNER / ADMIN'],
  ['Mint', 'ADMIN-ONLY'],
  ['Operative', 'READ OPEN · WRITE ADMIN'],
  ['QuestCompletion', 'READ/CREATE OPEN'],
  ['StoreItem', 'ADMIN-ONLY'],
  ['User', 'ADMIN-ONLY'],
];
const ROLES = [
  ['MEMBER', 'Default', 'File reports, browse the verified atlas, manage own captures.'],
  ['OPERATIVE', 'Access: operative', 'Read-only field intel — sees the queue. No approve/reject.'],
  [
    'MODERATOR',
    'Access: moderator',
    'Approve/reject via moderate. No funding, store, persona control.',
  ],
  ['ADMIN', 'Role/access: admin', 'Everything — plus Persona Control and the audit log.'],
];
const DOCS = [
  ['README', 'README.md'],
  ['CLAUDE.md', 'CLAUDE.md'],
  ['AGENTS.md', 'AGENTS.md'],
  ['SECURITY.md', 'SECURITY.md'],
  ['BACKLOG.md', 'BACKLOG.md'],
  ['CHANGELOG.md', 'CHANGELOG.md'],
  ['CONTRIBUTING.md', 'CONTRIBUTING.md'],
  ['Radio self-host runbook', 'RADIO-SELF-HOST-RUNBOOK.md'],
  ['LICENSE (AGPL-3.0)', 'LICENSE'],
  ['LICENSE-CONTENT (CC BY-SA 4.0)', 'LICENSE-CONTENT'],
];
const NODES = {
  'Frontend routes': [
    ['/campaign', 'route'],
    ['/dashboard', 'route'],
    ['/portal/investor', 'route'],
    ['/portal/ops', 'route'],
    ['/zora', 'route'],
    ['MintLocationPanel', 'component'],
  ],
  'Backend functions': [
    ['blog', 'func'],
    ['cachedIntel', 'func'],
    ['createDonationCheckout', 'func'],
    ['createProductCheckout', 'func'],
    ['cryptoWatch', 'func'],
    ['fetchMapLocations', 'func'],
    ['fieldStats', 'func'],
    ['importKmlLocations', 'func'],
    ['investorAccess', 'func'],
    ['moderate', 'func'],
    ['n8nPing', 'func'],
    ['personaCtl', 'func'],
    ['stripeWebhook', 'func'],
  ],
  Entities: [
    ['AccessLog', 'entity'],
    ['BlogPost', 'entity'],
    ['DigitalBust', 'entity'],
    ['FundingLead', 'entity'],
    ['IntelCache', 'entity'],
    ['LeadClaim', 'entity'],
    ['Location', 'entity'],
    ['Mint', 'entity'],
    ['Operative', 'entity'],
    ['QuestCompletion', 'entity'],
    ['StoreItem', 'entity'],
    ['User', 'entity'],
  ],
  'Chains & external': [
    ['Base', 'ext'],
    ['Bitcoin', 'ext'],
    ['Ethereum', 'ext'],
    ['n8n', 'ext'],
    ['Polygon', 'ext'],
    ['pump.fun', 'ext'],
    ['Solana', 'ext'],
    ['Stripe', 'ext'],
    ['Zora protocol', 'ext'],
  ],
};
const EDGES = [
  ['/campaign', 'fieldStats'],
  ['/dashboard', 'fieldStats'],
  ['/portal/investor', 'investorAccess'],
  ['/portal/ops', 'personaCtl'],
  ['/zora', 'cryptoWatch'],
  ['MintLocationPanel', 'createDonationCheckout'],
  ['blog', 'BlogPost'],
  ['cachedIntel', 'IntelCache'],
  ['createDonationCheckout', 'Stripe'],
  ['createDonationCheckout', 'FundingLead'],
  ['createProductCheckout', 'Stripe'],
  ['createProductCheckout', 'StoreItem'],
  ['cryptoWatch', 'Ethereum'],
  ['cryptoWatch', 'Polygon'],
  ['cryptoWatch', 'Solana'],
  ['fetchMapLocations', 'Location'],
  ['fieldStats', 'Operative'],
  ['fieldStats', 'Location'],
  ['importKmlLocations', 'Location'],
  ['investorAccess', 'User'],
  ['moderate', 'Location'],
  ['moderate', 'DigitalBust'],
  ['n8nPing', 'n8n'],
  ['personaCtl', 'AccessLog'],
  ['personaCtl', 'User'],
  ['stripeWebhook', 'StoreItem'],
  ['stripeWebhook', 'FundingLead'],
  ['stripeWebhook', 'Stripe'],
  ['Mint', 'Base'],
  ['Mint', 'Zora protocol'],
  ['DigitalBust', 'QuestCompletion'],
  ['LeadClaim', 'FundingLead'],
  ['Bitcoin', 'cryptoWatch'],
  ['pump.fun', 'Solana'],
];
const TOTAL_NODES = Object.values(NODES).reduce((n, a) => n + a.length, 0);

/* ── tiny presentational helpers ──────────────────────────── */
function Badge({ children, tone = 'mute' }) {
  const map = {
    ok: 'border-ozone/50 text-ozone',
    warn: 'border-flare/50 text-flare',
    high: 'border-[#FF0040]/60 text-[#FF0040]',
    mute: 'border-slate2/60 text-dim',
    pub: 'border-ozone/50 text-ozone',
  };
  return (
    <span
      className={`inline-block whitespace-nowrap border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] ${map[tone] || map.mute}`}
    >
      {children}
    </span>
  );
}
function Stat({ k, v, sub = '', accent = '' }) {
  return (
    <div className="border border-slate2/60 bg-card p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-dim">{k}</div>
      <div
        className={`mt-3 font-display text-2xl font-bold tabular leading-none ${accent || 'text-silver'}`}
      >
        {v}
      </div>
      {sub && (
        <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-dim">{sub}</div>
      )}
    </div>
  );
}
function Gap({ n, children }) {
  return (
    <div className="relative border border-dashed border-slate2/60 p-4 pl-6">
      <span className="absolute left-4 top-[19px] h-1.5 w-1.5 rounded-full bg-flare" />
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-flare">
        {n}
      </div>
      <div className="mt-1.5 text-[12.5px] leading-relaxed text-dim">{children}</div>
    </div>
  );
}
function Block({ title, desc, children }) {
  return (
    <div className="mb-5 border border-slate2/60 bg-card/40 p-6">
      <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-silver">
        {title}
      </h2>
      {desc && <p className="mt-1.5 mb-5 text-[12.5px] leading-relaxed text-dim">{desc}</p>}
      {children}
    </div>
  );
}
function Copyable({ v }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(v).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1100);
        });
      }}
      className={`group inline-flex items-center gap-1.5 font-mono text-[11.5px] transition-colors ${done ? 'text-[#39FF14]' : 'text-silver hover:text-ozone'}`}
      title="Copy"
    >
      <span className="break-all">{v}</span>
      {done ? (
        <Check className="h-3 w-3 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100" />
      )}
    </button>
  );
}
const Th = ({ children, right = false }) => (
  <th
    className={`border-b border-slate2/60 pb-3 pr-4 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-dim ${right ? 'text-right' : 'text-left'}`}
  >
    {children}
  </th>
);
const Td = ({ children, name = false, right = false, mono = false }) => (
  <td
    className={`border-b border-slate2/30 py-3.5 pr-4 align-top text-[13px] leading-snug ${right ? 'text-right' : ''} ${mono ? 'font-mono text-[11.5px]' : ''} ${name ? 'font-bold text-silver' : 'text-dim'}`}
  >
    {children}
  </td>
);

/* ── section renderers ────────────────────────────────────── */
function ExecView({ stats, intel }) {
  const risks = intel?.risks || null;
  const riskCount = risks ? risks.length : null;
  const highCount = risks ? risks.filter((r) => r[2] === 'high').length : null;
  const KEYS = [
    ['Reports', stats?.reports],
    ['Verified', stats?.verified],
    ['Members', stats?.operatives],
    ['Cities', stats?.cities],
    ['Raised', stats?.raised],
    ['Donors', stats?.donors],
    ['Digital Busts', stats?.digital_busts],
    ['Points', stats?.points],
  ];
  const healthTone = highCount == null ? 'mute' : highCount > 0 ? 'warn' : 'ok';
  const healthText =
    highCount == null
      ? 'Assessing posture…'
      : highCount > 0
        ? `Needs attention · ${highCount} high-severity gap${highCount > 1 ? 's' : ''}`
        : 'Nominal · no high-severity gaps';
  const healthBadge = highCount == null ? 'Checking' : highCount > 0 ? 'In progress' : 'Healthy';
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <div className="border border-slate2/60 bg-card p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-dim">
            System health
          </div>
          <div className="mt-3 font-display text-sm font-bold leading-tight text-silver">
            {healthText}
          </div>
          <div className="mt-3">
            <Badge tone={healthTone}>{healthBadge}</Badge>
          </div>
        </div>
        <Stat k="Services (functions)" v={String(FNS.length)} />
        <Stat k="Entities" v={String(ENTITIES.length)} />
        <Stat
          k="Open risk items"
          v={riskCount == null ? '—' : String(riskCount)}
          sub="see Risk Register"
        />
      </div>
      <div className="mt-5">
        <Block
          title="Field Stats"
          desc={
            stats
              ? 'Live via fieldStats() — a PII-free aggregate.'
              : `Live via base44.functions.invoke("fieldStats"). Loading, or unavailable in this context.`
          }
        >
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {KEYS.map(([k, v]) => (
              <div key={k} className="border border-slate2/50 bg-card p-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-dim">{k}</div>
                <div
                  className={`mt-3 font-display text-lg font-bold ${v == null ? 'text-dim' : 'text-ozone'}`}
                >
                  {v == null ? '—' : fmt(num(v))}
                </div>
                <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-dim">
                  {v == null ? 'via fieldStats()' : 'live'}
                </div>
              </div>
            ))}
          </div>
        </Block>
      </div>
      <Block
        title="Environments"
        desc="From sitemapData.js — imported, not copied, in the real app. Standing rule: prove on BACKUP before promoting to main."
      >
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Td name>STAGE / BACKUP</Td>
              <Td>
                Internal review · appId <span className="font-mono">6a6748e0…591871</span>
              </Td>
              <Td right>
                <Badge>Internal</Badge>
              </Td>
            </tr>
            <tr>
              <Td name>LIVE / main</Td>
              <Td>
                Production · appId <span className="font-mono">6a62213c…04ff5</span>
              </Td>
              <Td right>
                <Badge tone="ok">Production</Badge>
              </Td>
            </tr>
          </tbody>
        </table>
      </Block>
      <div className="grid gap-2.5 md:grid-cols-2">
        <Gap n="Release tagging">
          CI build-verify runs via GitHub Actions; a release-tagging / CHANGELOG pipeline is still
          proposed. See Deploy &amp; Releases.
        </Gap>
        <Gap n="Incident status">
          Handled manually via SECURITY.md today; incidentLog is proposed in API Inventory to
          formalise it.
        </Gap>
      </div>
    </>
  );
}

function MapView() {
  const [sel, setSel] = useState(null);
  const adj = useMemo(() => {
    if (!sel) return new Set();
    const s = new Set();
    EDGES.forEach(([a, b]) => {
      if (a === sel) s.add(b);
      if (b === sel) s.add(a);
    });
    return s;
  }, [sel]);
  const dotColor = {
    route: 'border-l-ozone',
    func: 'border-l-flare',
    component: 'border-l-ozone',
    entity: 'border-l-slate2',
    ext: 'border-l-[#39FF14]',
  };
  return (
    <Block
      title="Dependency Graph"
      desc={`${TOTAL_NODES} nodes · ${EDGES.length} verified edges — every edge traces to a real dependency. Click any node to trace its relationships.`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Object.entries(NODES).map(([col, arr]) => (
          <div key={col}>
            <h3 className="mb-3 font-mono text-[9px] uppercase tracking-[0.13em] text-dim">
              {col}
            </h3>
            {arr.map(([n, t]) => {
              const isSel = sel === n,
                isRel = adj.has(n);
              const dim = sel && !isSel && !isRel;
              return (
                <button
                  key={n}
                  onClick={() => setSel(isSel ? null : n)}
                  className={`mb-2 block w-full border border-l-[3px] bg-card px-3 py-2.5 text-left transition-all ${dotColor[t] || 'border-l-slate2'} ${isSel ? 'border-ozone shadow-[0_0_20px_rgba(237,255,0,.18)]' : isRel ? 'border-flare' : 'border-slate2/60'} ${dim ? 'opacity-25' : ''}`}
                >
                  <div className="font-display text-[12.5px] font-bold text-silver">{n}</div>
                  <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.11em] text-dim">
                    {t}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 min-h-[18px] font-mono text-[11.5px] leading-relaxed text-dim">
        {sel ? (
          <span>
            <span className="text-ozone">{sel}</span> →{' '}
            {[...adj].join(' · ') || 'no verified edges recorded'}
          </span>
        ) : (
          'Select a node to trace its edges.'
        )}
      </div>
    </Block>
  );
}

function ProtocolView() {
  return (
    <Block
      title="Protocol Stack"
      desc="Imported from fundConfig.js / zoraConfig.js in the real app."
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <Th>Protocol</Th>
            <Th>Purpose</Th>
            <Th>Status</Th>
            <Th>Owner</Th>
            <Th>Notes</Th>
          </tr>
        </thead>
        <tbody>
          {PROTOCOLS.map(([p, u, s, o, n]) => (
            <tr key={p}>
              <Td name>{p}</Td>
              <Td>{u}</Td>
              <Td>
                {s === 'impl' ? <Badge tone="ok">Implemented</Badge> : <Badge>Planned</Badge>}
              </Td>
              <Td>{o}</Td>
              <Td>{n}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Block>
  );
}

function TreasuryView({ crypto }) {
  const p = crypto?.polygon;
  const recent = [...(crypto?.sol || []), ...(crypto?.eth || [])].slice(0, 8);
  const usdc = num(p?.usdc),
    usdce = num(p?.usdce),
    matic = num(p?.matic),
    totalUsd = num(p?.totalUsd);
  return (
    <>
      <Block
        title="Wallet Addresses"
        desc="Real treasury wallets from fundConfig.js — already public in the client bundle. Click any address to copy."
      >
        {WALLETS.map(([k, v]) => (
          <div
            key={k}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-slate2/30 py-4 last:border-0"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.13em] text-dim">{k}</span>
            <Copyable v={v} />
          </div>
        ))}
      </Block>
      <Block
        title="Live Polygon Balances"
        desc="Live via cryptoWatch — USDC (native) + USDC.e + POL, valued through CoinGecko. Refreshes on page load."
      >
        {p ? (
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Stat k="USDC" v={fmt(num(usdc.toFixed(2)))} accent="text-ozone" />
            <Stat k="USDC.e" v={fmt(num(usdce.toFixed(2)))} accent="text-ozone" />
            <Stat
              k="POL"
              v={fmt(num(matic.toFixed(3)))}
              sub={p.maticUsd ? `@ $${p.maticUsd}` : undefined}
            />
            <Stat k="Total USD" v={`$${fmt(num(totalUsd.toFixed(2)))}`} accent="text-[#39FF14]" />
          </div>
        ) : (
          <p className="font-mono text-[11px] text-dim">
            — loading live balances, or watcher unavailable in this context.
          </p>
        )}
      </Block>
      <Block
        title="Recent SOL / ETH Activity"
        desc="Live via cryptoWatch — most recent treasury signatures/transactions."
      >
        {recent.length ? (
          recent.map((t) => (
            <a
              key={t.hash}
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-3 border-b border-slate2/30 py-3 last:border-0"
            >
              <span className="flex items-center gap-3">
                <Badge tone={t.chain === 'SOL' ? 'ok' : 'mute'}>{t.chain}</Badge>
                <span className="font-mono text-[11.5px] text-silver group-hover:text-ozone">
                  {short(t.hash)}
                </span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-dim group-hover:text-ozone" />
            </a>
          ))
        ) : (
          <p className="font-mono text-[11px] text-dim">
            — no recent activity returned, or watcher unavailable.
          </p>
        )}
      </Block>
    </>
  );
}

function CoinsView() {
  return (
    <>
      <Block
        title="Coin Registry"
        desc="Every token discovered in the codebase. Click any contract to copy."
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Symbol</Th>
              <Th>Chain</Th>
              <Th>Contract</Th>
              <Th>Status</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {COINS.map(([s, c, ct, n]) => (
              <tr key={s}>
                <Td name>{s}</Td>
                <Td>{c}</Td>
                <Td mono>
                  <Copyable v={ct} />
                </Td>
                <Td>
                  <Badge>Planned</Badge>
                </Td>
                <Td>{n}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>
      <Gap n="Naming drift detected">
        The "$OOHEX" symbol is hardcoded across surfaces (zoraConfig.js, SiteFooter.jsx,
        FieldIdBack.jsx) rather than imported from a single source of truth. Tracked as Risk R-02.
      </Gap>
    </>
  );
}

function ApiView({ fnSecrets }) {
  const authBadge = (a) =>
    a === 'pub' ? (
      <Badge tone="pub">Public</Badge>
    ) : a === 'admin' ? (
      <Badge tone="warn">Admin-gated</Badge>
    ) : (
      <Badge>Secret-gated</Badge>
    );
  return (
    <>
      <Block
        title="Internal Functions"
        desc={`${FNS.length} base44/functions, tagged by actual auth posture. Secret names shown to admins only — served via opsIntel, not bundled.`}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Function</Th>
              <Th>Purpose</Th>
              <Th>Auth</Th>
              <Th>Note</Th>
            </tr>
          </thead>
          <tbody>
            {FNS.map(([f, p, a, n]) => {
              const note = fnSecrets && fnSecrets[f] ? fnSecrets[f] : n;
              return (
                <tr key={f}>
                  <Td name mono>
                    {f}
                  </Td>
                  <Td>{p}</Td>
                  <Td>{authBadge(a)}</Td>
                  <Td mono>{note}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Block>
      <Block
        title="Proposed Functions — planned"
        desc="New functions to close the open gaps. None exist yet — listed so the roadmap stays visible and honest."
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Function</Th>
              <Th>Purpose</Th>
              <Th>Closes</Th>
            </tr>
          </thead>
          <tbody>
            {PROPOSED.map(([f, p, c]) => (
              <tr key={f}>
                <Td name mono>
                  {f}
                </Td>
                <Td>{p}</Td>
                <Td>
                  <Badge tone="warn">{c}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>
      <Block
        title="External Dependencies"
        desc="Third-party APIs actually called from this codebase."
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Service</Th>
              <Th>Used for</Th>
              <Th right>Health / latency</Th>
            </tr>
          </thead>
          <tbody>
            {EXT.map(([s, u]) => (
              <tr key={s}>
                <Td name>{s}</Td>
                <Td>{u}</Td>
                <Td right>
                  <Badge>Planned</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>
    </>
  );
}

function EntityGrid() {
  return (
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
      {ENTITIES.map(([n, r]) => (
        <div key={n} className="border border-slate2/60 p-4">
          <div className="font-display text-[13px] font-bold text-silver">{n}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-dim">{r}</div>
        </div>
      ))}
    </div>
  );
}
function InfraView() {
  return (
    <>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {[
          ['Hosting', 'Base44 is the runtime source of truth. GitHub is a live two-way mirror.'],
          [
            'Environment variables',
            '7 secrets via Deno.env.get() — inventory in Security Center (admin, server-served).',
          ],
          ['Storage', '12 Base44 entities.'],
        ].map(([k, v]) => (
          <div key={k} className="border border-slate2/60 bg-card p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-dim">{k}</div>
            <div className="mt-3 text-[13px] leading-snug text-silver">{v}</div>
            <div className="mt-3">
              <Badge tone="ok">Implemented</Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Block title="Data Storage — Entities" desc="Row-security posture per entity.">
          <EntityGrid />
        </Block>
      </div>
      <div className="grid gap-2.5 md:grid-cols-2">
        <Gap n="Release tagging / CI-CD">
          GitHub Actions build-verify runs on push (lint · build). A release-tagging / CHANGELOG
          pipeline via promoteBackup is still proposed.
        </Gap>
        <Gap n="Cron jobs">No scheduled task runner configured.</Gap>
        <Gap n="Logs">
          No centralized log aggregation. AccessLog is the one structured audit trail.
        </Gap>
        <Gap n="Secrets rotation">
          Pattern documented; no cadence or scanning. secretsAudit proposed.
        </Gap>
      </div>
    </>
  );
}

function SecurityView({ secrets }) {
  const notImpl = [
    'Dependency scanning',
    'SBOM',
    'Contract audit tracker',
    'Key rotation',
    'Backup & disaster recovery',
    'Rate limiting',
    'OWASP checklist',
    'Compliance checklist',
  ];
  return (
    <>
      <Block
        title="Secrets Inventory"
        desc="Names + purpose served from an admin-gated endpoint (opsIntel), never shipped in the client bundle. Values are only ever read server-side via Deno.env.get()."
      >
        {secrets == null ? (
          <p className="font-mono text-[11px] text-dim">
            — loading from opsIntel, or unavailable in this context.
          </p>
        ) : secrets.length === 0 ? (
          <p className="font-mono text-[11px] text-dim">— no secrets returned.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>Secret</Th>
                <Th>Used by</Th>
                <Th>Purpose</Th>
              </tr>
            </thead>
            <tbody>
              {secrets.map(([s, u, p]) => (
                <tr key={s}>
                  <Td name mono>
                    {s}
                  </Td>
                  <Td mono>{u}</Td>
                  <Td>{p}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Block>
      <Block title="Access Matrix" desc="member → operative → moderator → admin">
        {ROLES.map(([r, l, d]) => (
          <div
            key={r}
            className="flex flex-wrap items-start justify-between gap-5 border-b border-slate2/30 py-4 last:border-0"
          >
            <Badge tone="ok">{r}</Badge>
            <div className="flex-1 text-right">
              <div className="font-mono text-[9px] uppercase tracking-[0.11em] text-dim">{l}</div>
              <div className="mt-1 text-[13px] text-dim">{d}</div>
            </div>
          </div>
        ))}
      </Block>
      <Block title="Least-Privilege Review" desc="Entity-level row security posture.">
        <EntityGrid />
      </Block>
      <div className="mb-3 mt-8 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-dim">
        Not yet implemented
      </div>
      <div className="grid gap-2.5 md:grid-cols-2">
        {notImpl.map((x) => (
          <Gap key={x} n={x}>
            Not implemented — no process configured.
          </Gap>
        ))}
      </div>
    </>
  );
}

function DocsView() {
  return (
    <>
      <Block
        title="Repo Documentation"
        desc="Every verified root doc — linked to GitHub source (oohearth/ooh-earth) in the real app."
      >
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {DOCS.map(([n, f]) => (
            <div
              key={f}
              className="flex items-center justify-between gap-3 border border-slate2/60 bg-card p-4"
            >
              <div>
                <div className="font-display text-[13.5px] font-bold text-silver">{n}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-dim">
                  {f}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Block>
      <Gap n="Architecture decision records">
        No formal ADR system — architectural context lives in CLAUDE.md, BACKLOG.md, and commit
        history instead.
      </Gap>
    </>
  );
}

function MonitorView({ lat }) {
  return (
    <>
      <Block
        title="Self-measured Client Latency"
        desc="Round-trip of two live calls (fieldStats, cryptoWatch) measured in this browser on page load — explicitly not infrastructure monitoring."
      >
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <Stat
            k="fieldStats round-trip"
            v={lat?.fieldStats != null ? `${lat.fieldStats} ms` : '— ms'}
            sub="measured client-side"
            accent={lat?.fieldStats != null ? 'text-ozone' : 'text-dim'}
          />
          <Stat
            k="cryptoWatch round-trip"
            v={lat?.cryptoWatch != null ? `${lat.cryptoWatch} ms` : '— ms'}
            sub="measured client-side"
            accent={lat?.cryptoWatch != null ? 'text-ozone' : 'text-dim'}
          />
        </div>
      </Block>
      <div className="grid gap-2.5 md:grid-cols-2">
        <Gap n="RPC latency">
          No server-side probing of Solana/Polygon RPC endpoints. opsHealth would add this.
        </Gap>
        <Gap n="Wallet watcher status">
          cryptoWatch has no uptime/health tracking beyond on-demand calls.
        </Gap>
        <Gap n="Build status">
          CI build-verify runs on GitHub Actions; an in-portal status readout isn't wired yet
          (opsHealth would pull it).
        </Gap>
        <Gap n="Background jobs">No scheduled job runner configured.</Gap>
        <Gap n="Errors / warnings feed">No centralized error tracking (e.g. Sentry) wired.</Gap>
      </div>
    </>
  );
}

function RiskView({ risks }) {
  const sevBadge = (s) =>
    s === 'high' ? (
      <Badge tone="high">High</Badge>
    ) : s === 'med' ? (
      <Badge tone="warn">Med</Badge>
    ) : (
      <Badge>Low</Badge>
    );
  if (risks == null) {
    return (
      <Block
        title="Risk Register"
        desc="Served live from opsIntel (agency-gated) — not shipped in the client bundle."
      >
        <p className="font-mono text-[11px] text-dim">
          — loading risk register, or unavailable in this context.
        </p>
      </Block>
    );
  }
  const c = {
    high: risks.filter((r) => r[2] === 'high').length,
    med: risks.filter((r) => r[2] === 'med').length,
    low: risks.filter((r) => r[2] === 'low').length,
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat k="Open risks" v={String(risks.length)} />
        <Stat k="High severity" v={String(c.high)} accent="text-[#FF0040]" />
        <Stat k="Medium" v={String(c.med)} accent="text-flare" />
        <Stat k="Low" v={String(c.low)} accent="text-dim" />
      </div>
      <div className="mt-5">
        <Block
          title="Risk Register"
          desc="The items behind “open risk items” on the overview. Served live from opsIntel (agency-gated); the proposed riskRegister function will make them editable."
        >
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Risk</Th>
                <Th>Sev</Th>
                <Th>Area</Th>
                <Th>Status</Th>
                <Th>Mitigation</Th>
              </tr>
            </thead>
            <tbody>
              {risks.map(([id, r, s, a, m]) => (
                <tr key={id}>
                  <Td name mono>
                    {id}
                  </Td>
                  <Td>{r}</Td>
                  <Td>{sevBadge(s)}</Td>
                  <Td>{a}</Td>
                  <Td>
                    <Badge tone="warn">Open</Badge>
                  </Td>
                  <Td>{m}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      </div>
    </>
  );
}

function DeployView() {
  const items = [
    'BACKUP build is green (exit 0)',
    'Smoke-tested the change on BACKUP',
    'Target appId confirmed explicitly',
    'dry_run passed on complex edits',
    'CHANGELOG.md updated',
  ];
  const [checked, setChecked] = useState(items.map(() => false));
  const all = checked.every(Boolean);
  const [out, setOut] = useState(false);
  return (
    <>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        <div className="border border-slate2/60 bg-card p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-dim">
            STAGE / BACKUP
          </div>
          <div className="mt-3 font-display text-sm font-bold text-silver">Internal review</div>
          <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-dim">
            appId 6a6748e0…591871
          </div>
        </div>
        <div className="border border-slate2/60 bg-card p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-dim">
            LIVE / main
          </div>
          <div className="mt-3 font-display text-sm font-bold text-silver">Production</div>
          <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-dim">
            appId 6a62213c…04ff5
          </div>
        </div>
        <div className="border border-slate2/60 bg-card p-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-dim">
            CI · GitHub Actions
          </div>
          <div className="mt-3 text-[13px] text-silver">Build-verify on push (lint · build)</div>
          <div className="mt-3">
            <Badge tone="ok">Implemented</Badge>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <Block
          title="GitHub Mirror"
          desc="Non-destructive bidirectional mirror. S3 stays the source of truth (git_remote_source = s3); code mirrors to GitHub as commits automatically; GitHub-side edits sync back. No manual commit step."
        >
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <Td name>main</Td>
                <Td>
                  → <span className="font-mono">oohearth/ooh-earth</span> · PUBLIC · AGPL-3.0 + CC
                  BY-SA 4.0
                </Td>
              </tr>
              <tr>
                <Td name>BACKUP</Td>
                <Td>
                  → <span className="font-mono">oohearth/ooh-earth-backup</span>
                </Td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-[12.5px] leading-relaxed text-dim">
            <span className="text-flare">Caveat:</span> very large single files (e.g. the 34KB AGPL
            LICENSE) can abort the Base44-side write before it reaches the mirror — add those via
            GitHub's own UI.
          </p>
        </Block>
      </div>
      <Block
        title="Build Verify"
        desc="Runs on every push via GitHub Actions build-verify, and locally before promotion. Release tagging + CHANGELOG automation (promoteBackup) still proposed — R-03."
      >
        <pre className="overflow-x-auto border border-slate2/50 bg-black p-3 font-mono text-[11px] leading-relaxed text-dim">
          <span className="text-[#39FF14]">$</span> npm run build {'>'} /tmp/b.log 2{'>'}&amp;1;
          echo "BUILD EXIT: $?"{'\n'}
          <span className="text-ozone">BUILD EXIT: 0</span>
          {'\n'}
          <span className="text-[#39FF14]">$</span> tail -3 /tmp/b.log
        </pre>
      </Block>
      <Block
        title="Promotion Gate — BACKUP → main"
        desc="The standing rule made mechanical. Every box must be checked before promotion unlocks."
      >
        {items.map((t, i) => (
          <label
            key={i}
            className="flex cursor-pointer items-start gap-3 border-b border-slate2/30 py-3 last:border-0"
          >
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
              className="mt-0.5 h-4 w-4 accent-[#EDFF00]"
            />
            <span className="text-[13.5px] text-silver">{t}</span>
          </label>
        ))}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            disabled={!all}
            onClick={() => setOut(true)}
            className={`border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.09em] transition-colors ${all ? 'border-ozone bg-ozone text-void hover:bg-flare hover:border-flare' : 'border-slate2 text-dim'}`}
          >
            Promote to main
          </button>
          <span className={`font-mono text-[11px] ${all ? 'text-ozone' : 'text-dim'}`}>
            {all
              ? 'All checks passed — promotion unlocked.'
              : 'Checklist incomplete — promotion locked.'}
          </span>
        </div>
        {out && (
          <pre className="mt-3 overflow-x-auto border border-slate2/50 bg-black p-3 font-mono text-[11px] leading-relaxed text-dim">
            <span className="text-flare">// WIRE:</span> base44.functions.invoke("promoteBackup",{' '}
            {'{'} target:"main", appId:"6a62213c…04ff5" {'}'}){'\n'}
            <span className="text-ozone">
              → guarded action (proposed). In this preview, no write is performed.
            </span>
          </pre>
        )}
      </Block>
    </>
  );
}

function ConsoleView({ queue, onVerify, busy }) {
  const [outs, setOuts] = useState({});
  const run = useCallback(async (key, fn, args) => {
    setOuts((o) => ({ ...o, [key]: { state: 'run' } }));
    try {
      const t0 = performance.now();
      const res = await base44.functions.invoke(fn, args);
      const dt = Math.round(performance.now() - t0);
      const data = payload(res);
      const preview = JSON.stringify(data)?.slice(0, 220);
      setOuts((o) => ({ ...o, [key]: { state: 'ok', dt, preview } }));
    } catch (e) {
      setOuts((o) => ({ ...o, [key]: { state: 'err', msg: e?.message || 'call failed' } }));
    }
  }, []);
  const ACTIONS = [
    {
      key: 'n8n',
      title: 'n8n bridge test',
      desc: 'Ping the Base44 → n8n bridge (proven end-to-end). test action only.',
      btn: 'Run n8nPing',
      fn: 'n8nPing',
      args: {},
    },
    {
      key: 'cache',
      title: 'Refresh intel cache',
      desc: 'Re-pull the daily-cached LLM intel (skyIntel).',
      btn: 'Run cachedIntel',
      fn: 'cachedIntel',
      args: {},
    },
    {
      key: 'stats',
      title: 'Refresh field stats',
      desc: 'Re-fetch the PII-free aggregate that powers the orbital HUD.',
      btn: 'Run fieldStats',
      fn: 'fieldStats',
      args: {},
    },
    {
      key: 'health',
      title: 'Health probe',
      desc: 'Aggregate reachability probe. Proposed — opsHealth does not exist yet.',
      btn: 'opsHealth (proposed)',
      proposed: true,
    },
  ];
  const pending = queue?.length || 0;
  return (
    <>
      <Block
        title="Ops Console"
        desc="Live actions via base44.functions.invoke(...). Buttons fire the real function and print its response; opsHealth is proposed and only prints the call it would make."
      >
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {ACTIONS.map((a) => {
            const o = outs[a.key];
            return (
              <div key={a.key} className="border border-slate2/60 bg-card p-5">
                <div className="font-display text-sm font-bold text-silver">{a.title}</div>
                <div className="mt-1.5 text-[12.5px] leading-relaxed text-dim">{a.desc}</div>
                <button
                  onClick={() =>
                    a.proposed
                      ? setOuts((s) => ({ ...s, [a.key]: { state: 'stub' } }))
                      : run(a.key, a.fn, a.args)
                  }
                  disabled={o?.state === 'run'}
                  className="mt-3 border border-ozone px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.09em] text-ozone transition-colors hover:bg-ozone hover:text-void disabled:opacity-50"
                >
                  {o?.state === 'run' ? 'Running…' : a.btn}
                </button>
                {o && (
                  <pre className="mt-3 overflow-x-auto border border-slate2/50 bg-black p-2.5 font-mono text-[10.5px] leading-relaxed text-dim">
                    {o.state === 'stub' && (
                      <>
                        <span className="text-flare">// WIRE:</span>{' '}
                        base44.functions.invoke("opsHealth")
                        <br />
                        <span className="text-flare">→ proposed function — not called.</span>
                      </>
                    )}
                    {o.state === 'run' && <span className="text-ozone">→ dispatching…</span>}
                    {o.state === 'ok' && (
                      <>
                        <span className="text-[#39FF14]">→ ok · {o.dt} ms</span>
                        <br />
                        {o.preview}
                      </>
                    )}
                    {o.state === 'err' && <span className="text-[#FF0040]">→ {o.msg}</span>}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      </Block>
      <Block
        title="Moderation Queue"
        desc="Live pending captures (Location, status=pending). Approve/reject writes through the moderate function immediately."
      >
        {queue == null ? (
          <p className="font-mono text-[11px] text-dim">— loading queue…</p>
        ) : queue.length === 0 ? (
          <p className="font-mono text-[11px] text-ozone">Queue clear — no pending captures.</p>
        ) : (
          <>
            {queue.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate2/30 py-3 last:border-0"
              >
                <div className="min-w-0 text-[13px] text-silver">
                  <span className="truncate">{r.title || 'Untitled capture'}</span>
                  <span className="ml-2 font-mono text-[10.5px] text-[#39FF14]">
                    {r.address ||
                      (r.lat != null ? `${r.lat?.toFixed?.(4)}, ${r.lng?.toFixed?.(4)}` : '')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busy?.[r.id]}
                    onClick={() => onVerify(r.id, 'verified')}
                    className="border border-ozone/50 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ozone hover:bg-ozone hover:text-void disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busy?.[r.id]}
                    onClick={() => onVerify(r.id, 'rejected')}
                    className="border border-[#FF0040]/50 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#FF0040] hover:bg-[#FF0040] hover:text-void disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            <p className="mt-4 font-mono text-[11px] text-dim">{pending} pending.</p>
          </>
        )}
      </Block>
    </>
  );
}

function RosterView() {
  const PEOPLE = [
    [
      'Dee Sidhom',
      'Founder',
      'ADMIN',
      'role: admin',
      'Everything · Persona Control · audit log',
      'ACTIVE',
      'ok',
    ],
    [
      'Adil',
      'Growth Technical Lead (trial)',
      'MODERATOR',
      'proposed',
      'Growth + build, per Collaboration Agreement',
      'PENDING COUNTERSIGN',
      'warn',
    ],
    [
      '—',
      'City Ambassador seat',
      'MODERATOR',
      'open',
      'Per-city verification & outreach',
      'VACANT',
      'mute',
    ],
  ];
  const TIERS = [
    ['Scout', 'Entry', 'Files reports, earns points, browses the verified atlas.'],
    ['Field Reporter', 'Trusted', 'Sees the moderation queue (read-only field intel).'],
    ['City Ambassador', 'Lead', 'Coordinates a city; can be granted moderator access.'],
  ];
  return (
    <>
      <Block
        title="Back-office Access Roster"
        desc="Who holds which back-office role. Distinct from the civic member tiers below. Written to AccessLog via personaCtl on every change."
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Operator</Th>
              <Th>Position</Th>
              <Th>Access</Th>
              <Th>Basis</Th>
              <Th>Scope</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {PEOPLE.map(([n, p, a, b, s, st, k]) => (
              <tr key={p}>
                <Td name>{n}</Td>
                <Td>{p}</Td>
                <Td>
                  <Badge tone={a === 'ADMIN' ? 'ok' : 'mute'}>{a}</Badge>
                </Td>
                <Td mono>{b}</Td>
                <Td>{s}</Td>
                <Td>
                  <Badge tone={k}>{st}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-[12.5px] leading-relaxed text-dim">
          <span className="text-flare">Note:</span> Collaboration Agreement signed by Adil, not yet
          countersigned; trial-length / payment-timing / licence-name placeholders open. Licence
          pair (AGPL-3.0 + CC BY-SA 4.0) fills the licence placeholder. Sole ownership retained; no
          equity.
        </p>
      </Block>
      <Block
        title="Civic Member Tiers"
        desc="The public progression in the app — separate from back-office access. Stored on the Operative entity."
      >
        {TIERS.map(([t, l, d]) => (
          <div
            key={t}
            className="flex flex-wrap items-start justify-between gap-5 border-b border-slate2/30 py-4 last:border-0"
          >
            <Badge tone="ok">{t}</Badge>
            <div className="flex-1 text-right">
              <div className="font-mono text-[9px] uppercase tracking-[0.11em] text-dim">{l}</div>
              <div className="mt-1 text-[13px] text-dim">{d}</div>
            </div>
          </div>
        ))}
      </Block>
    </>
  );
}

/* ── page ─────────────────────────────────────────────────── */
export default function PortalOps() {
  const { user, isLoadingAuth, authChecked } = useAuth();
  const [active, setActive] = useState('exec');
  const [clr, setClr] = useState(3); // UI-only demo of the access matrix
  const [intel, setIntel] = useState(null); // { risks, secrets, fn_secrets } from opsIntel
  const [stats, setStats] = useState(null);
  const [crypto, setCrypto] = useState(null);
  const [lat, setLat] = useState({});
  const [queue, setQueue] = useState(null);
  const [busy, setBusy] = useState({});

  const isAdmin = roleOf(user) === 'admin' || accessOf(user) === 'admin';
  const isAgency = isAdmin || agencyOf(user);
  const effClr = isAdmin ? clr : 2; // non-admin agency members capped at moderator-equivalent; admins can preview lower

  useEffect(() => {
    if (!isAgency) return;
    let alive = true;
    (async () => {
      try {
        const r = await base44.functions.invoke('opsIntel');
        if (alive) setIntel(payload(r));
      } catch {
        /* sensitive metadata stays server-side; sections show a loading/unavailable note */
      }
      try {
        const t0 = performance.now();
        const r = await base44.functions.invoke('fieldStats');
        const dt = Math.round(performance.now() - t0);
        if (alive) {
          setStats(payload(r));
          setLat((l) => ({ ...l, fieldStats: dt }));
        }
      } catch {
        /* keep placeholder */
      }
      try {
        const t0 = performance.now();
        const r = await base44.functions.invoke('cryptoWatch');
        const dt = Math.round(performance.now() - t0);
        if (alive) {
          setCrypto(payload(r));
          setLat((l) => ({ ...l, cryptoWatch: dt }));
        }
      } catch {
        /* keep placeholder */
      }
      try {
        const q = await base44.entities.Location.filter({ status: 'pending' }, '-created_date', 20);
        if (alive) setQueue(q || []);
      } catch {
        if (alive) setQueue([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isAgency]);

  const verify = useCallback(async (id, status) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await base44.functions.invoke('moderate', {
        action: 'verify',
        entity: 'Location',
        id,
        status,
      });
      setQueue((q) => (q || []).filter((r) => r.id !== id));
    } catch {
      /* surfaced via disabled state */
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }, []);

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Loader2 className="h-6 w-6 animate-spin text-ozone" />
      </div>
    );
  }

  if (!isAgency) {
    return (
      <div className="relative min-h-screen bg-void page-top">
        <Nav />
        <main className="px-5 pb-24 md:px-8">
          <div className="mx-auto mt-20 max-w-lg border border-dashed border-flare/60 bg-flare/[0.03] p-10 text-center">
            <Lock className="mx-auto h-7 w-7 text-flare" />
            <h1 className="mt-4 font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-flare">
              Agency access required
            </h1>
            <p className="mx-auto mt-3 max-w-[42ch] text-[13.5px] leading-relaxed text-dim">
              The Architecture Operations Portal is restricted to agency members. Ask an admin to
              switch on your agency status.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-block border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-dim transition-colors hover:border-ozone hover:text-ozone"
            >
              ← Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const sec = SECTIONS.find((s) => s.id === active);
  const locked = effClr < sec.min;

  const renderView = () => {
    switch (active) {
      case 'exec':
        return <ExecView stats={stats} intel={intel} />;
      case 'map':
        return <MapView />;
      case 'protocol':
        return <ProtocolView />;
      case 'treasury':
        return <TreasuryView crypto={crypto} />;
      case 'coins':
        return <CoinsView />;
      case 'api':
        return <ApiView fnSecrets={intel?.fn_secrets} />;
      case 'infra':
        return <InfraView />;
      case 'security':
        return <SecurityView secrets={intel?.secrets} />;
      case 'docs':
        return <DocsView />;
      case 'monitor':
        return <MonitorView lat={lat} />;
      case 'risk':
        return <RiskView risks={intel?.risks} />;
      case 'deploy':
        return <DeployView />;
      case 'console':
        return <ConsoleView queue={queue} onVerify={verify} busy={busy} />;
      case 'roster':
        return <RosterView />;
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-void page-top">
      <style>{`.aop-grid{background-image:linear-gradient(rgb(var(--c-slate2)/.22) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--c-slate2)/.22) 1px,transparent 1px);background-size:44px 44px}`}</style>
      <Nav />
      <main className="aop-grid px-5 pb-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* header */}
          <div className="border-b border-slate2/50 pb-6 pt-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">
              // Internal · Agency · /portal/ops
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[0.98] tracking-[-0.03em] text-silver md:text-5xl">
              Architecture Operations Portal
            </h1>
            <p className="mt-4 max-w-[74ch] text-[14.5px] leading-relaxed text-dim">
              Single source of truth for system architecture, protocol stack, treasury and security
              posture. Real repo state where verified —{' '}
              <span className="text-ozone">explicit "Planned" labels</span> everywhere infra doesn't
              exist yet. Sensitive metadata (secret names, risk register) is served at runtime from
              an agency-gated endpoint — never bundled. Admins can preview lower clearances to watch
              the matrix gate these panels — it never changes real permissions.
            </p>
          </div>

          {/* clearance strip — admins only (preview-as demo) */}
          {isAdmin && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border border-ozone/20 bg-ozone/[0.03] px-3 py-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                Preview clearance
              </span>
              {[3, 2, 1, 0].map((v) => (
                <button
                  key={v}
                  onClick={() => setClr(v)}
                  className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${clr === v ? 'border-ozone bg-ozone text-void' : 'border-slate2/60 text-darkgray hover:border-ozone hover:text-ozone'}`}
                >
                  {CLR_NAMES[v]}
                </button>
              ))}
              {clr < 3 && (
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-flare/80">
                  UI preview only · permissions unchanged
                </span>
              )}
            </div>
          )}

          {/* tabs */}
          <nav className="mt-7 flex flex-wrap gap-2 border-t border-slate2/40 pt-6">
            {SECTIONS.map((s) => {
              const isLocked = effClr < s.min;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`relative border px-3.5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${active === s.id ? 'border-ozone bg-ozone/[0.06] text-ozone shadow-[0_0_20px_rgba(237,255,0,.14)]' : 'border-slate2/60 bg-card/40 text-dim hover:border-ozone/40 hover:text-silver'}`}
                >
                  {s.label}
                  {s.isNew && (
                    <span className="absolute -right-1.5 -top-1.5 bg-flare px-1 py-px font-mono text-[7px] font-bold tracking-[0.06em] text-void">
                      NEW
                    </span>
                  )}
                  {isLocked && <span className="ml-1.5 text-flare">·</span>}
                </button>
              );
            })}
          </nav>

          {/* panel */}
          <div className="mt-7">
            {locked ? (
              <div className="border border-dashed border-flare/60 bg-flare/[0.03] p-11 text-center">
                <Lock className="mx-auto h-6 w-6 text-flare" />
                <h3 className="mt-3 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-flare">
                  Clearance required
                </h3>
                <p className="mx-auto mt-2.5 max-w-[46ch] text-[13.5px] leading-relaxed text-dim">
                  This panel is gated to{' '}
                  <span className="font-bold text-ozone">{CLR_NAMES[sec.min]}</span> and above. Your
                  clearance is <span className="font-bold text-ozone">{CLR_NAMES[effClr]}</span>.
                  {isAdmin ? ' Raise it above to view.' : ''}
                </p>
              </div>
            ) : (
              renderView()
            )}
          </div>

          {/* footer */}
          <div className="mt-14 border-t border-slate2/40 pt-6 font-mono text-[10px] leading-relaxed tracking-[0.05em] text-dim">
            OOH EARTH · ARCHITECTURE OPERATIONS PORTAL · v2 · Orbital Perspective
            <br />
            Live data via opsIntel · fieldStats · cryptoWatch · Location. Git commits mirror
            automatically (no manual step).
          </div>
        </div>
      </main>
    </div>
  );
}
