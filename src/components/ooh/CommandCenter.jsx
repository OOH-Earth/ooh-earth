import { useState, useEffect, useRef } from 'react';
import { X, ArrowUpRight, SprayCan } from 'lucide-react';
import { Link } from 'react-router-dom';
import GraffitiCamera from '@/components/ooh/GraffitiCamera';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// Internal app routes shown as action cards at the top of the panel.
// `camera` actions open a field camera modal instead of navigating.
const ACTIONS = [
  {
    name: 'Log an Adbust',
    desc: 'Report a billboard, tag the brand & agency.',
    to: '/report',
    priority: true,
  },
  { name: 'Live Field Map', desc: 'Explore all documented OOH locations.', to: '/map' },
  {
    name: 'Ad Scanner',
    desc: 'Point-and-shoot advertising detection on any surface.',
    to: '/lab/scanner',
    priority: true,
  },
  {
    name: 'Graffiti Camera',
    desc: 'Photograph street art & graffiti in the field.',
    camera: 'graffiti',
    priority: true,
  },
  {
    name: 'In-Home Digital Busts',
    desc: 'Document digital advertising intrusions.',
    to: '/inhome',
  },
  { name: 'Member Profile', desc: 'Your field ID, points & badges.', to: '/operative' },
  { name: 'Store / Library', desc: 'Research docs, tools, digital drops.', to: '/store' },
  { name: 'Support the mission', desc: 'Sponsor community-funded infrastructure.', to: '/support' },
];

const GROUPS = [
  {
    label: 'Get Started',
    links: [
      {
        name: 'Sign up for Early Access',
        desc: 'Join the global mapping platform.',
        href: 'https://oohearth.app/',
        priority: true,
      },
      {
        name: 'About OOH Street Maps',
        desc: 'The mission, the union, the method.',
        href: 'https://oohearth.app/about',
      },
      { name: '@advertisersanonymous', desc: 'Member profile & field log.', to: '/operative' },
    ],
  },
  {
    label: 'Adbusting City Maps',
    links: [
      {
        name: 'Bangkok',
        desc: '🗺️📍 Active intervention map.',
        to: '/map?area=bangkok',
        priority: true,
      },
      {
        name: 'London',
        desc: '🗺️📍 Active intervention map.',
        to: '/map?area=london',
        priority: true,
      },
    ],
  },
  {
    label: 'Follow',
    links: [
      {
        name: 'Instagram @oohearth.app',
        desc: 'Field photography & live updates.',
        href: 'https://www.instagram.com/oohstreetmaps/',
      },
      {
        name: 'oohearth on Zora',
        desc: 'On-chain creative resistance.',
        href: 'https://zora.co/@oohearth',
      },
    ],
  },
  {
    label: 'Union',
    links: [
      {
        name: 'Advertisers Anonymous',
        desc: 'Detoxifying corporate propaganda.',
        href: 'https://advertisersanonymous.org/',
      },
      {
        name: 'Sponsors / Funding',
        desc: 'Community-funded infrastructure.',
        href: 'https://donorbox.org/ooh',
        priority: true,
      },
    ],
  },
  {
    label: 'Design Ops',
    links: [
      {
        name: 'OOH Earth Field Card',
        desc: 'ID + access + location tagging.',
        href: 'https://supercard.framer.ai/',
      },
      {
        name: 'Foundation [ BASE ]',
        desc: 'The nonprofit core.',
        href: 'https://oohearthfoundation.framer.wiki/',
      },
      {
        name: 'OOH Earth [ START ]',
        desc: 'Adbusting & street art maps.',
        href: 'https://oohearth.framer.ai/',
      },
      {
        name: '"Anti-Social" Adbusting Network',
        desc: 'The social resistance layer.',
        href: 'https://streetsocial.framer.ai/',
      },
      {
        name: '$OOHEX · pump.fun',
        desc: 'Solana token funding the network.',
        href: 'https://pump.fun/BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump',
        priority: true,
      },
      {
        name: 'UPC Scanner · #TrueCost',
        desc: 'Demo: scan the real cost.',
        href: 'https://upc.framer.ai/',
      },
    ],
  },
];

export default function CommandCenter({ open, onClose }) {
  const [graffitiCam, setGraffitiCam] = useState(false);
  const panelRef = useRef(null);
  useFocusTrap(panelRef, open, { label: 'Command Center' });

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleAction = (a) => {
    if (a.camera === 'graffiti') {
      onClose();
      setGraffitiCam(true);
    }
  };

  return (
    // Fragment, not a single wrapper: GraffitiCamera must NOT be a DOM
    // descendant of the div below. That div goes pointer-events-none when
    // `open` is false -- and handleAction('graffiti') calls onClose() and
    // setGraffitiCam(true) together, so GraffitiCamera opens in the exact
    // render where this wrapper is already closed. pointer-events-none
    // cascades to all descendants regardless of their own z-index, so
    // GraffitiCamera's close button (and everything else in it) silently
    // stopped receiving clicks -- confirmed live: elementFromPoint at its
    // close button resolved to an unrelated Nav element behind it, not the
    // button itself. z-[2000] (matching QuickCapture/NavMenu's full-screen
    // modal convention, clearing MobileBottomTabs' z-[1000]) still matters
    // for CommandCenter's own content while genuinely open.
    <>
      <div
        className={`fixed inset-0 z-[2000] transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!open}
        // `inert` is set imperatively by useFocusTrap on panelRef below
        // (all focusable content lives inside that panel, so it's a
        // sufficient ancestor) -- see that hook for why (React 18 doesn't
        // support `inert` as a JSX prop).
      >
        <div className="absolute inset-0 bg-void/80 backdrop-blur-xl" onClick={onClose} />

        <div
          ref={panelRef}
          className={`absolute inset-y-0 right-0 flex w-full flex-col border-l border-ozone/20 bg-void shadow-2xl transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                // Tactical Overlay
              </span>
              <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-silver">
                Command Center
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center border border-white/10 text-silver/60 transition-colors hover:border-flare hover:text-flare"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="atlas-track flex-1 overflow-y-auto px-6 py-6">
            {/* Internal quick actions */}
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                  Quick Actions
                </span>
                <span className="h-px flex-1 bg-ozone/20" />
              </div>
              <div className="grid gap-px sm:grid-cols-2">
                {ACTIONS.map((a) => {
                  /** @type {any} */
                  const Wrap = a.to ? Link : 'button';
                  const wrapProps = a.to
                    ? { to: a.to, onClick: onClose }
                    : { onClick: () => handleAction(a) };
                  return (
                    <Wrap
                      key={a.name}
                      {...wrapProps}
                      className={`group relative flex items-start justify-between gap-3 border p-4 text-left transition-colors ${a.priority ? 'border-ozone/30 bg-ozone/[0.04] hover:bg-ozone/10' : 'border-white/5 bg-card hover:border-white/15'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {a.camera === 'graffiti' && (
                            <SprayCan className="h-3.5 w-3.5 text-flare" />
                          )}
                          <div
                            className={`font-display text-base font-bold uppercase tracking-tight ${a.priority ? 'text-ozone' : 'text-silver'}`}
                          >
                            {a.name}
                          </div>
                        </div>
                        <div className="mt-1 font-mono text-[10px] leading-relaxed text-silver/45">
                          {a.desc}
                        </div>
                      </div>
                      <ArrowUpRight
                        className={`mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${a.priority ? 'text-ozone' : 'text-silver/30'}`}
                      />
                    </Wrap>
                  );
                })}
              </div>
            </div>

            {GROUPS.map((g) => (
              <div key={g.label} className="mb-8">
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver/40">
                    {g.label}
                  </span>
                  <span className="h-px flex-1 bg-white/5" />
                </div>
                <div className="grid gap-px sm:grid-cols-2">
                  {g.links.map((l) => {
                    /** @type {any} */
                    const Wrap = l.to ? Link : 'a';
                    const wrapProps = l.to
                      ? { to: l.to, onClick: onClose }
                      : { href: l.href, target: '_blank', rel: 'noreferrer' };
                    return (
                      <Wrap
                        key={l.to || l.href}
                        {...wrapProps}
                        data-cursor="view"
                        className={`group relative flex items-start justify-between gap-3 border p-4 transition-colors ${
                          l.priority
                            ? 'border-ozone/30 bg-ozone/[0.04] hover:bg-ozone/10'
                            : 'border-white/5 bg-card hover:border-white/15'
                        }`}
                      >
                        <div>
                          <div
                            className={`font-display text-base font-bold uppercase tracking-tight ${l.priority ? 'text-ozone' : 'text-silver'}`}
                          >
                            {l.name}
                          </div>
                          <div className="mt-1 font-mono text-[10px] leading-relaxed text-silver/45">
                            {l.desc}
                          </div>
                        </div>
                        <ArrowUpRight
                          className={`mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${l.priority ? 'text-ozone' : 'text-silver/30'}`}
                        />
                      </Wrap>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/30">
              17 channels · All systems routed through the OOH Earth ecosystem
            </p>
          </div>
        </div>
      </div>
      <GraffitiCamera open={graffitiCam} onClose={() => setGraffitiCam(false)} />
    </>
  );
}
