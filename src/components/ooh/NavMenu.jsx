import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  X,
  Compass,
  Home,
  Map as MapIcon,
  Megaphone,
  Scan,
  Tv,
  LayoutDashboard,
  Trash2,
  Coins,
  CreditCard,
  Key,
  LayoutGrid,
  Info,
  Briefcase,
  Mail,
  BookOpen,
  Heart,
  Layers,
  LifeBuoy,
  Network,
  ShoppingBag,
  Ban,
  Leaf,
  Droplets,
  AlertTriangle,
  SprayCan,
  LineChart,
  TrendingUp,
  Landmark,
  Palette,
  HeartHandshake,
  Recycle,
  Cpu,
  ShieldCheck,
  Gauge,
  Users,
  Milestone,
  Radio,
  Workflow,
  FileText,
  Newspaper,
  BusFront,
  RectangleHorizontal,
  MonitorPlay,
  Paintbrush2,
  Shapes,
  Globe,
  Image as ImageIcon,
  Building2,
  FlaskConical,
  Store,
  ScanLine,
} from 'lucide-react';

// Navigation hierarchy — audience-ordered. Keep in step with
// src/components/ooh/sitemapData.js (the /sitemap doc is the canonical model;
// this menu is the navigable subset). Items may carry a status:
//   (none) = live · "building" · "planned" · "exploring".
// A null `to` means the surface isn't navigable yet — it renders as a
// non-clickable row so unbuilt work is still visible in the map.
// Categories (surface types) are an INDEX — they live in their own group and
// on /categories, not as a giant inline dropdown.
const SITEMAP = [
  {
    group: 'Explore',
    items: [
      { to: '/', label: 'Home', status: 'live' },
      { to: '/map', label: 'Field Atlas', status: 'live' },
      { to: '/channel', label: 'OOH·TV', status: 'live' },
      { to: '/blog', label: 'Blog', status: 'live' },
      { to: '/about', label: 'About', status: 'live' },
      { to: null, label: 'City Density · OSM', status: 'planned' },
    ],
  },
  {
    group: 'Categories',
    items: [
      { to: '/categories', label: 'All Categories', status: 'live' },
      { to: '/regions', label: 'Regions', status: 'live' },
      { to: '/bus-stops', label: 'Bus Stops', status: 'live' },
      { to: '/category/billboard', label: 'Billboards', status: 'live' },
      { to: '/category/digital', label: 'Digital', status: 'live' },
      { to: '/category/transit', label: 'Transit', status: 'live' },
      { to: '/category/painted', label: 'Painted', status: 'live' },
    ],
  },
  {
    group: 'Campaigns',
    items: [
      { to: '/adbusting', label: 'Adbusting', status: 'live' },
      { to: '/graffiti', label: 'Graffiti', status: 'live' },
      { to: '/ecology', label: 'Ecology', status: 'live' },
      { to: '/rivers', label: 'Rivers', status: 'live' },
      { to: '/warzones', label: 'War Zones', status: 'live' },
      { to: '/campaign', label: 'Fund the Offensive', status: 'testing' },
      { to: '/media-corps', label: 'Media Corps Map', status: 'live' },
      { to: null, label: 'AFC Correspondents', status: 'planned' },
    ],
  },
  {
    group: 'Field Ops',
    items: [
      { to: '/report', label: 'Field Report', status: 'live' },
      { to: '/ar', label: 'AR Lens', status: 'testing' },
      { to: '/scan', label: 'TrueCost', status: 'testing' },
      { to: '/lab/scanner', label: 'Ad Scanner', status: 'live' },
      { to: '/trash', label: 'Trash ID', status: 'testing' },
      { to: '/inhome', label: 'In-Home', status: 'live' },
      { to: '/zora', label: 'Zora Mint', status: 'testing' },
      { to: '/field-id', label: 'Field ID', status: 'live' },
      { to: '/card', label: 'Union Card', status: 'live' },
      { to: '/access-keys', label: 'Access Keys', status: 'live' },
      { to: null, label: 'Objection Generator', status: 'building' },
      { to: null, label: 'Precedent Library', status: 'exploring' },
    ],
  },
  {
    group: 'Operate',
    items: [
      { to: '/operative', label: 'Member Profile', status: 'live' },
      { to: '/dashboard', label: 'Console', status: 'live' },
      { to: '/guides', label: 'Guides', status: 'live' },
      { to: null, label: 'Streaks & Nudges', status: 'exploring' },
    ],
  },
  {
    group: 'Fund & Store',
    items: [
      { to: null, label: 'On-chain Treasury', status: 'building' },
      { to: '/plans', label: 'Plans / Roadmap', status: 'live' },
      { to: '/store', label: 'Store', status: 'live' },
      { to: null, label: 'Field Credentials · CR80', status: 'building' },
      { to: '/support', label: 'Support', status: 'live' },
      { to: '/contact', label: 'Contact', status: 'live' },
      { to: '/careers', label: 'Careers', status: 'live' },
    ],
  },
  {
    group: 'Capital · Investor',
    items: [
      { to: '/investor-access', label: 'Investor Access', status: 'live' },
      { to: '/investor', label: 'Investor Hub', status: 'live' },
      { to: '/console', label: 'Investor Console', status: 'live' },
      { to: '/portal/investor', label: 'Investor Dashboard', status: 'live' },
      { to: '/portal/client', label: 'Client Portal', status: 'building' },
      { to: '/capital/impact-grants', label: 'Impact Grants', status: 'live' },
      { to: '/capital/philanthropic', label: 'Philanthropic', status: 'live' },
      { to: '/capital/retro-pgf', label: 'Retro Public Goods', status: 'live' },
      { to: '/capital/civic-tech', label: 'Civic-Tech', status: 'live' },
    ],
  },
  {
    group: 'Agency · Internal',
    items: [
      { to: '/agency', label: 'Agency HQ', status: 'live' },
      { to: '/agency/blog', label: 'Agency Newsroom', status: 'live' },
      { to: '/fde', label: 'FDE Portal', status: 'live' },
      { to: '/portfolio', label: 'Treasury Console', status: 'live' },
      { to: '/radio-ops', label: 'Radio Ops', status: 'live' },
      { to: null, label: 'Automation · n8n', status: 'building' },
      { to: '/lab/book', label: 'The Guild · Book', status: 'live' },
    ],
  },
  {
    group: 'Ops · Access & Moderation',
    agencyOnly: true,
    items: [
      { to: '/portal/ops', label: 'Architecture Ops', status: 'live' },
      { to: '/lab/admin', label: 'Lab Admin', status: 'live' },
      { to: '/store/admin', label: 'Store Admin', status: 'live' },
      { to: '/dashboard', label: 'Persona Control', status: 'live' },
      { to: '/dashboard', label: 'Moderation Service', status: 'live' },
      { to: '/dashboard', label: 'Access Audit Log', status: 'live' },
    ],
  },
  {
    group: 'Lab',
    items: [
      { to: '/lab', label: 'Hex Engine Lab', status: 'live' },
      { to: '/lab/coin', label: 'Genesis Coin', status: 'live' },
      { to: '/lab/simulator', label: 'Hex Engine Simulator', status: 'live' },
      { to: '/lab/device', label: '3D Device', status: 'live' },
      { to: '/lab/livingcoin', label: 'Living Coin', status: 'live' },
      { to: '/lab/spec', label: 'Engineering Spec', status: 'live' },
      { to: '/lab/sequencer', label: 'I Ching Sequencer', status: 'live' },
      { to: '/lab/companion', label: 'Companion App', status: 'live' },
      { to: '/lab/poster', label: 'Concept Poster', status: 'live' },
      { to: '/lab/status', label: 'Status Report', status: 'live' },
      { to: '/lab/nft', label: 'NFT Creator', status: 'live' },
    ],
  },
  {
    group: 'Reference & Docs',
    items: [
      { to: '/journey', label: 'Journey Map', status: 'live' },
      { to: '/sitemap', label: 'Sitemap', status: 'live' },
      { to: '/kit', label: 'Brand Guide', status: 'live' },
      { to: '/brand', label: 'Brand Standards', status: 'live' },
    ],
  },
];

const ICON = {
  Home,
  'Field Atlas': MapIcon,
  'OOH·TV': Tv,
  Blog: Newspaper,
  About: Info,
  'City Density · OSM': Network,
  'All Categories': Shapes,
  Regions: Globe,
  'Bus Stops': BusFront,
  Billboards: RectangleHorizontal,
  Digital: MonitorPlay,
  Transit: BusFront,
  Painted: Paintbrush2,
  Adbusting: Ban,
  Graffiti: SprayCan,
  Ecology: Leaf,
  Rivers: Droplets,
  'War Zones': AlertTriangle,
  'AFC Correspondents': Users,
  'Field Report': Megaphone,
  'AR Lens': Scan,
  TrueCost: Scan,
  'Trash ID': Trash2,
  'In-Home': Tv,
  'Zora Mint': Coins,
  'Field ID': CreditCard,
  'Union Card': CreditCard,
  'Access Keys': Key,
  'Objection Generator': FileText,
  'Precedent Library': BookOpen,
  'Member Profile': ShieldCheck,
  Console: LayoutDashboard,
  Guides: BookOpen,
  'Streaks & Nudges': TrendingUp,
  'Fund the Offensive': Heart,
  'On-chain Treasury': Coins,
  'Plans / Roadmap': Layers,
  Store: ShoppingBag,
  'Field Credentials · CR80': CreditCard,
  Support: LifeBuoy,
  Contact: Mail,
  Careers: Briefcase,
  'Investor Access': ShieldCheck,
  'Investor Hub': ShieldCheck,
  'Investor Console': LineChart,
  'Investor Dashboard': Gauge,
  'Client Portal': Users,
  'Impact Grants': Landmark,
  Philanthropic: HeartHandshake,
  'Retro Public Goods': Recycle,
  'Civic-Tech': Cpu,
  'Agency HQ': Compass,
  'Agency Newsroom': Newspaper,
  'FDE Portal': Compass,
  'Architecture Ops': Cpu,
  'Treasury Console': Coins,
  'Radio Ops': Radio,
  'Automation · n8n': Workflow,
  'The Guild · Book': BookOpen,
  'Persona Control': Users,
  'Moderation Service': ShieldCheck,
  'Access Audit Log': FileText,
  'Journey Map': Milestone,
  Sitemap: Network,
  'Brand Guide': Palette,
  'Brand Standards': BookOpen,
  'NFT Creator': ImageIcon,
  'Media Corps Map': Building2,
  'Lab Admin': FlaskConical,
  'Store Admin': Store,
  'Ad Scanner': ScanLine,
};

// Build-status semaphore for not-yet-live items (kept in step with the Journey Map + /sitemap).
const STATUS = {
  live: { text: 'Live', color: '#39FF14' },
  testing: { text: 'Testing', color: '#1F51FF' },
  building: { text: 'Building', color: '#EDFF00' },
  planned: { text: 'Planned', color: '#FF5C00' },
  exploring: { text: 'Exploring', color: 'rgba(255,255,255,0.5)' },
};

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

// Lab nav items — pulled live from LabPrototype records so the admin's
// `visible` toggle in /lab/admin controls which lab routes surface in the
// sitemap menu. Hidden prototypes stay live (LabAccessRoute ignores
// `visible` and only checks `access`), so direct links still resolve.
function useLabNavItems() {
  const [items, setItems] = useState([{ to: '/lab', label: 'Hex Engine Lab', status: 'live' }]);
  useEffect(() => {
    let active = true;
    const fetch = () =>
      base44.entities.LabPrototype.list('sort_order', 100)
        .then((rows) => {
          if (!active) return;
          const vis = (rows || []).filter((r) => r.visible !== false);
          setItems([
            { to: '/lab', label: 'Hex Engine Lab', status: 'live' },
            ...vis.map((r) => ({
              to: r.path,
              label: r.title,
              status: r.status === 'in_build' ? 'building' : 'live',
            })),
          ]);
        })
        .catch(() => {});
    fetch();
    let unsub;
    try {
      unsub = base44.entities.LabPrototype?.subscribe?.(fetch);
    } catch {
      unsub = null;
    }
    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, []);
  return items;
}

const withLabItems = (groups, labItems) =>
  groups.map((g) => (g.group === 'Lab' ? { ...g, items: labItems } : g));

/** @type {import('framer-motion').Variants} */
const groupV = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
};

const isAgencyMember = (u) => {
  const r = u?.role ?? u?.data?.role;
  const a = u?.access ?? u?.data?.access;
  const ag = u?.agency ?? u?.data?.agency;
  return r === 'admin' || a === 'admin' || !!ag;
};

function MobileLauncher({ onClose, onTour }) {
  const { user } = useAuth();
  const agency = isAgencyMember(user);
  const groups = withLabItems(SITEMAP, useLabNavItems());
  let n = 0;
  return (
    <motion.div
      key="mobile"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] flex flex-col bg-void md:hidden"
    >
      <div
        className="flex items-center justify-between border-b border-slate2/60 px-4 py-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">
          // Sitemap
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onTour?.();
              onClose();
            }}
            aria-label="Start tour"
            className="flex items-center gap-1.5 border border-slate2/60 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
          >
            <Compass className="h-3.5 w-3.5" /> Tour
          </button>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center border border-slate2/60 text-dim transition-colors hover:border-flare hover:text-flare"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-10">
        <motion.div
          variants={list}
          initial="hidden"
          animate="show"
          exit="exit"
          className="space-y-5"
        >
          {groups
            .filter((g) => !g.agencyOnly || agency)
            .map((g) => (
              <motion.div key={g.group} variants={groupV}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
                    // {g.group}
                  </span>
                  <span className="h-px flex-1 bg-slate2/40" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {g.items
                    .filter((l) => !l.agencyOnly || agency)
                    .map((l) => {
                      n += 1;
                      const Icon = ICON[l.label] || LayoutGrid;
                      const st = l.status ? STATUS[l.status] : null;
                      /** @type {any} */
                      const Wrap = l.to ? Link : 'div';
                      const wrapProps = l.to ? { to: l.to, onClick: onClose } : {};
                      return (
                        <Wrap
                          key={l.label}
                          {...wrapProps}
                          className={`group flex flex-col gap-2 border p-3.5 transition-colors ${l.to ? 'border-slate2/50 bg-card hover:border-ozone/60 hover:bg-slate2/20' : 'border-dashed border-slate2/40 bg-card/40 cursor-default'}`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon
                              className={`h-5 w-5 transition-colors ${l.to ? 'text-silver/70 group-hover:text-ozone' : 'text-silver/35'}`}
                            />
                            {st ? (
                              <span
                                className="flex items-center gap-1 font-mono text-[7px] font-bold uppercase tracking-[0.15em]"
                                style={{ color: st.color }}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ background: st.color }}
                                />
                                {st.text}
                              </span>
                            ) : (
                              <span className="font-mono text-[8px] tabular text-dim/40">
                                {String(n).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <span
                            className={`font-display text-sm font-semibold tracking-[-0.02em] transition-colors ${l.to ? 'text-silver/85 group-hover:text-ozone' : 'text-silver/55'}`}
                          >
                            {l.label}
                          </span>
                        </Wrap>
                      );
                    })}
                </div>
              </motion.div>
            ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

function PopoverLinks({ onClose }) {
  const { user } = useAuth();
  const agency = isAgencyMember(user);
  const groups = withLabItems(SITEMAP, useLabNavItems());
  let n = 0;
  return (
    <motion.div
      variants={list}
      initial="hidden"
      animate="show"
      exit="exit"
      className="grid grid-cols-2 gap-x-5 gap-y-4 px-2 py-2"
    >
      {groups
        .filter((g) => !g.agencyOnly || agency)
        .map((g) => (
          <motion.div key={g.group} variants={groupV}>
            <div className="mb-1 flex items-center gap-2 border-b border-slate2/40 pb-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
                // {g.group}
              </span>
            </div>
            {g.items
              .filter((l) => !l.agencyOnly || agency)
              .map((l) => {
                n += 1;
                const st = l.status ? STATUS[l.status] : null;
                /** @type {any} */
                const Wrap = l.to ? Link : 'div';
                const wrapProps = l.to ? { to: l.to, onClick: onClose } : {};
                return (
                  <Wrap
                    key={l.label}
                    {...wrapProps}
                    className={`group flex items-center justify-between border-b border-slate2/20 px-1 py-2 transition-colors ${l.to ? 'hover:bg-slate2/30' : 'cursor-default'}`}
                  >
                    <span className="flex items-baseline gap-2.5">
                      <span className="font-mono text-[9px] tabular text-dim/50">
                        {String(n).padStart(2, '0')}
                      </span>
                      <span
                        className={`font-display text-[13px] font-semibold tracking-[-0.02em] transition-all duration-200 ${l.to ? 'text-silver/85 group-hover:translate-x-0.5 group-hover:text-ozone' : 'text-silver/55'}`}
                      >
                        {l.label}
                      </span>
                    </span>
                    {st ? (
                      <span
                        className="flex items-center gap-1 font-mono text-[7px] font-bold uppercase tracking-[0.15em]"
                        style={{ color: st.color }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: st.color }}
                        />
                        {st.text}
                      </span>
                    ) : (
                      <span className="h-1 w-1 rounded-full bg-dim/40 transition-colors group-hover:bg-ozone" />
                    )}
                  </Wrap>
                );
              })}
          </motion.div>
        ))}
    </motion.div>
  );
}

export default function NavMenu({ open, onClose, onTour }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
          />

          {/* Mobile · full-screen smart launcher */}
          <MobileLauncher onClose={onClose} onTour={onTour} />

          {/* Desktop · popover */}
          <motion.div
            key="popover"
            initial={{ opacity: 0, scale: 0.94, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            style={{ transformOrigin: 'top right' }}
            className="fixed right-3 top-[60px] z-[100] hidden max-h-[calc(100vh-76px)] w-[min(440px,calc(100vw-24px))] flex-col overflow-hidden border border-slate2 bg-void shadow-[0_24px_60px_rgba(0,0,0,0.6)] md:right-8 md:flex"
          >
            <div className="flex items-center justify-between border-b border-slate2/60 px-5 py-4">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ozone">
                // Sitemap
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-7 w-7 items-center justify-center text-dim transition-colors hover:text-flare"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <PopoverLinks onClose={onClose} />
            </div>
            <div className="border-t border-slate2/60 px-5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">
                // resistance
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
