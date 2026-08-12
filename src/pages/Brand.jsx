import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from '@/components/ooh/Nav';
import BrandMark from '@/components/ooh/BrandMark';
import { Radio, Check, X, ArrowUpRight } from 'lucide-react';

// ─── Brand copy (canonical — from the Ad Free Streets standards) ───

const AUDIENCE = [
  {
    name: 'Urban Planners & Activists',
    needs: [
      'Data on the proliferation of outdoor ads and their impact on urban aesthetics.',
      'Mechanisms to involve the public in decisions about ad placements.',
      'Tools to gather public opinion and objections on new billboard proposals.',
      'Integration with local councils to streamline the objection process.',
      'Reporting and analytics to monitor advertising trends and responses.',
    ],
  },
  {
    name: 'Organisations & Councils',
    needs: [
      'Efficient methods for receiving, processing, and addressing complaints.',
      'Insights into public sentiment on outdoor advertising in their jurisdiction.',
      'Tools to engage the community and promote transparency in decisions.',
      'Integration with existing urban-planning systems and processes.',
      'Real-time data on advertising compliance and public feedback.',
    ],
  },
  {
    name: 'Community Leaders & Orgs',
    needs: [
      'Platforms to mobilise members against corporate advertising.',
      'Tools to document and share the impact of ads on local culture.',
      'Features to organise campaigns or petitions against ad placements.',
      'Access to data and resources to support advocacy.',
      'AR tools to visually demonstrate billboard saturation.',
    ],
  },
  {
    name: 'Environmentally Conscious',
    needs: [
      'Platforms that promote sustainable, responsible use of public space.',
      'Ways to challenge the environmental impacts of advertising.',
      'Features to support eco-friendly alternatives to billboards.',
      "The ability to spread awareness of OOH advertising's footprint.",
      'Gamification and rewards for sustainability-driven action.',
    ],
  },
  {
    name: 'Tech-Savvy Early Adopters',
    needs: [
      'Cutting-edge tools for engagement in social issues through tech.',
      'A seamless user experience with advanced functionality.',
      'High-quality augmented reality and image-recognition.',
      'Integration with other apps and smart-city infrastructure.',
      'Customisation and advanced settings to tailor the experience.',
    ],
  },
  {
    name: 'Cultural Advocates & Artists',
    needs: [
      'Platforms to push back on commercialisation and promote culture.',
      'Tools to transform corporate ads into artistic expression.',
      'Features to create, share, and overlay AR art on billboards.',
      'Community support to promote artistic and cultural initiatives.',
      'Opportunities to collaborate on campaigns reclaiming public space.',
    ],
  },
];

const VALUES = [
  [
    'Empowerment',
    'We give individuals and communities the tools to take control of their public spaces and make their voices heard.',
  ],
  [
    'Transparency',
    'We foster openness in the advertising process, so citizens see how decisions are made and how to influence them.',
  ],
  [
    'Cultural Integrity',
    'We protect and promote local culture and aesthetics, so public spaces reflect community values — not just commerce.',
  ],
  [
    'Innovation',
    'We leverage cutting-edge technology to let citizens challenge, reimagine, and reshape the urban ad landscape.',
  ],
  [
    'Sustainability',
    "We promote practices that minimise advertising's environmental impact and encourage responsible use of public resources.",
  ],
  [
    'Community Engagement',
    'We value collective action and build strong communities that can advocate for the integrity of their public spaces.',
  ],
  [
    'Responsibility',
    'We uphold ethical practice in advertising and urban development — a balance between commerce and public welfare.',
  ],
  [
    'Creativity',
    'We celebrate creative expression that challenges the status quo and transforms intrusive ads into meaningful experiences.',
  ],
];

const PERSONALITY = [
  [
    'Empathetic',
    'We understand the concerns and aspirations of the communities we serve — listening and responding with compassion.',
  ],
  [
    'Bold',
    "We aren't afraid to challenge the status quo and stand against corporate advertising in public spaces.",
  ],
  [
    'Innovative',
    "We are forward-thinking, always seeking creative and technological solutions that push what's possible.",
  ],
  [
    'Empowering',
    'We inspire and enable people to take action, giving them the confidence and tools to reclaim public space.',
  ],
  [
    'Transparent',
    'We communicate openly and honestly, so our actions and decisions are clear and understandable.',
  ],
  [
    'Engaging',
    'We are approachable and actively connect with our audience, fostering collaboration and shared purpose.',
  ],
  [
    'Visionary',
    'We are driven by a long-term vision for a better, more culturally reflective urban environment.',
  ],
  [
    'Inclusive',
    'We value diversity and welcome voices from all walks of life, so everyone can help transform public space.',
  ],
];

const PRINCIPLES = [
  [
    'Clear & Concise',
    'We communicate in a straightforward, accessible way, so our message is easily understood by all audiences.',
    'Avoid jargon and unnecessary complexity. Break complex ideas into simple, digestible parts.',
  ],
  [
    'Empowering & Encouraging',
    'Our language uplifts and inspires our audience to take action and feel confident influencing change.',
    'Use positive, action-oriented words that reinforce that every individual can make a difference.',
  ],
  [
    'Inclusive & Respectful',
    'We ensure our language respects and reflects the diversity of the communities we serve.',
    'Avoid anything that could alienate or exclude. Use gender-neutral terms; be mindful of cultural sensitivities.',
  ],
  [
    'Engaging & Relatable',
    'We speak with warmth and creativity, inviting people into the mission rather than lecturing them.',
    'Write as if speaking to a friend. Use an informal but respectful tone that invites dialogue.',
  ],
  [
    'Bold & Visionary',
    'We are confident in our mission, and our language reflects it through bold, assertive statements.',
    'Use strong, decisive language that reflects our commitment to challenging the status quo.',
  ],
  [
    'Transparent & Honest',
    'We value openness and honesty, so our audience always knows where we stand.',
    'Communicate facts clearly, acknowledge challenges, avoid spin. Be upfront about intentions and realities.',
  ],
  [
    'Community-Centric',
    'The community is at the heart of everything we do, and our language consistently reflects it.',
    "Use 'we', 'us', and 'our' to foster shared responsibility. Emphasise community voice and participation.",
  ],
  [
    'Visionary & Ambitious',
    'We frame our work as a movement — appealing to aspiration and a transformed future.',
    "Paint the future we're building. Position the tools as part of a broader movement to reshape cities.",
  ],
];

const STORY = {
  Short:
    'Having witnessed first-hand the dominance of corporate interests in the creative industry, we wanted to build a platform that truly makes a difference — with no corporate edge attached. Our goal is to reclaim public spaces from commercial control and empower communities to challenge intrusive ads. Join us in transforming how advertising interacts with our cities and celebrating local identity and creativity.',
  Medium:
    "From our years in the advertising industry, we've seen how corporate interests increasingly overshadow community values. Despite our efforts to push for more creative, community-focused advertising, our ideas were frequently sidelined by commercial priorities. Determined to drive real change, we left the traditional advertising world and built our own platform. It represents our commitment to reclaiming public spaces from corporate control — empowering communities to challenge intrusive ads and restore local creativity and identity to our cities.",
  Long: "We've always been deeply aware of the growing impact of corporate interests on our public spaces. As seasoned advertising professionals, we saw first-hand how the industry prioritised commercial gain over community values. Despite our best efforts to advocate for more creative, community-centred approaches within the industry, our ideas were often overshadowed by corporate agendas. Realising true change was unattainable within the existing system, we stepped away and channelled our expertise into a platform designed to make a real difference. It isn't just a tool — it's a movement to reclaim public spaces from corporate dominance. Public spaces should reflect our collective values and spirit, not commercial interests. Join us in reshaping how advertising interacts with our urban environment.",
};

/** @type {[string, string[]][]} */
const HEADLINES = [
  [
    'Inspiration & Vision',
    [
      'Redefine Urban Spaces: Embrace Creativity Over Corporate Control',
      'Join the Movement: Reclaim Public Spaces from Corporate Dominance',
    ],
  ],
  [
    'Empowerment & Action',
    [
      'Take a Stand: Challenge Intrusive Ads and Reclaim Your Space',
      'Empower Your Voice: Transform Public Spaces with Our Platform',
    ],
  ],
];

const CTA_DO = [
  'Start Transforming Your City Now',
  'Join Us in Reclaiming Public Spaces',
  'Challenge Unwanted Ads — Get Involved Today',
  'Help Us Redefine Public Spaces',
];
const CTA_DONT = [
  'Act Now — Save Big on Public Spaces!',
  'Register Today for Exclusive Access to Space Redesign',
  'Find Out How to Get the Best Ads in Your City',
  'Act Now: Redefine Advertising and Restore Community Spirit',
];

const NAV = [
  { id: 'positioning', label: 'Positioning', idx: '00' },
  { id: 'vision', label: 'Vision & Mission', idx: '01' },
  { id: 'audience', label: 'Audience', idx: '02' },
  { id: 'values', label: 'Values', idx: '03' },
  { id: 'personality', label: 'Personality', idx: '04' },
  { id: 'tagline', label: 'Tagline & Story', idx: '05' },
  { id: 'principles', label: 'Principles', idx: '06' },
  { id: 'headlines', label: 'Headlines & CTAs', idx: '07' },
  { id: 'visual', label: 'Visual system', idx: '08' },
];

const STATS = [
  { k: 'Values', v: '08', s: 'core' },
  { k: 'Personality', v: '08', s: 'traits' },
  { k: 'Principles', v: '08', s: 'voice' },
  { k: 'Audience', v: '06', s: 'segments' },
];

function Panel({ id, idx, title, status, children }) {
  return (
    <section id={id} className="scroll-mt-28 border border-slate2/60 bg-card">
      <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-dim/60">{idx}</span>
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-silver">
            {title}
          </h2>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
          <span className="h-1.5 w-1.5 bg-ozone animate-flicker" /> {status}
        </span>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function MiniCard({ title, desc, accent = 'ozone' }) {
  const c = accent === 'flare' ? 'border-flare/30' : 'border-slate2/50';
  return (
    <div className={`border ${c} bg-void/40 p-4`}>
      <div className="font-display text-[15px] font-bold tracking-[-0.01em] text-silver">
        {title}
      </div>
      <p className="mt-1.5 font-body text-[12.5px] leading-[1.55] text-darkgray">{desc}</p>
    </div>
  );
}

function useClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () =>
      setT(new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Bangkok' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function Brand() {
  const clock = useClock();
  const [story, setStory] = useState('Medium');

  return (
    <div className="min-h-screen bg-void grid-bg">
      <Nav />

      {/* Operations status strip */}
      <div className="fixed left-0 right-0 top-[calc(57px+env(safe-area-inset-top))] z-30 border-b border-slate2/60 bg-void/85 backdrop-blur-md md:top-[calc(64px+env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-2 md:px-8">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-silver/70">
            <Radio className="h-3 w-3 animate-flicker text-ozone" /> Brand // Ad Free Streets
          </span>
          <span className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
            <span className="hidden sm:inline">BKK · {clock}</span>
            <span className="text-ozone">STANDARDS · LIVE</span>
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-0 px-0 page-top">
        {/* Sidebar rail */}
        <aside className="sticky top-[calc(104px+env(safe-area-inset-top))] hidden h-[calc(100vh-104px-env(safe-area-inset-top))] w-[220px] shrink-0 border-r border-slate2/40 bg-void/60 md:block">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 border-b border-slate2/40 px-5 py-4">
              <BrandMark className="h-6 w-6" />
              <span className="font-brand text-base text-silver">
                ooh<span className="text-ozone">.</span>earth
              </span>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="group flex items-center justify-between border-l-2 border-transparent px-5 py-2.5 transition-colors hover:border-ozone hover:bg-slate2/20"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-[9px] text-dim/50">{n.idx}</span>
                    <span className="font-display text-[13px] font-medium tracking-[-0.01em] text-silver/80 transition-colors group-hover:text-ozone">
                      {n.label}
                    </span>
                  </span>
                  <span className="h-1 w-1 bg-dim/30 transition-colors group-hover:bg-ozone" />
                </a>
              ))}
            </nav>
            <div className="border-t border-slate2/40 px-5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">
                // creative activism
              </span>
            </div>
          </div>
        </aside>

        {/* Main dashboard */}
        <main className="min-w-0 flex-1 px-5 pb-24 md:px-8">
          {/* Mobile tab strip */}
          <nav className="atlas-track -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 md:hidden">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="shrink-0 border border-slate2/60 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/70"
              >
                {n.label}
              </a>
            ))}
          </nav>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.k} className="border border-slate2/60 bg-card p-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
                  {s.k}
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-3xl font-bold tabular-nums text-ozone">
                    {s.v}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-silver/50">
                    {s.s}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-3">
            <Panel id="positioning" idx="00" title="Positioning" status="foundation">
              <p className="max-w-3xl font-display text-xl font-semibold leading-[1.35] tracking-[-0.01em] text-silver md:text-2xl">
                AdFree Streets is a citizen-driven platform that empowers communities to reclaim
                public spaces from intrusive corporate advertising.
              </p>
              <p className="mt-3 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
                Fostering community engagement and advocacy — turning passive observers into active
                participants in shaping the aesthetic and cultural integrity of their surroundings.
                This is our guiding compass; its tenets shape every design and messaging decision we
                make.
              </p>
            </Panel>

            <Panel id="vision" idx="01" title="Vision & Mission" status="core">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="border border-ozone/25 bg-void/40 p-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                    // Vision
                  </span>
                  <p className="mt-2 font-body text-[13px] leading-[1.6] text-darkgray">
                    A world where public spaces are vibrant, culturally rich, and free from the
                    overwhelming presence of intrusive corporate advertising. We empower communities
                    to take control of their urban environments — so public space reflects the
                    values, creativity, and spirit of the people who live there.
                  </p>
                </div>
                <div className="border border-ozone/25 bg-void/40 p-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                    // Mission
                  </span>
                  <p className="mt-2 font-body text-[13px] leading-[1.6] text-darkgray">
                    Empower individuals and communities to challenge and transform the dominance of
                    corporate advertising. We provide user-friendly tools to report, object, and
                    creatively reimagine outdoor ads — amplifying community voices, removing
                    propaganda that drives needless consumption, and ensuring public space serves
                    people, not just commerce.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel id="audience" idx="02" title="Audience" status="6 segments">
              <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                {AUDIENCE.map((a) => (
                  <div key={a.name} className="border border-slate2/50 bg-void/40 p-4">
                    <div className="font-display text-[14px] font-bold text-silver">{a.name}</div>
                    <ul className="mt-2.5 space-y-1.5">
                      {a.needs.map((n) => (
                        <li
                          key={n}
                          className="flex items-start gap-2 font-body text-[12px] leading-[1.45] text-darkgray"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 bg-ozone" /> {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel id="values" idx="03" title="Values" status="8 core">
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {VALUES.map(([t, d]) => (
                  <MiniCard key={t} title={t} desc={d} />
                ))}
              </div>
            </Panel>

            <Panel id="personality" idx="04" title="Personality" status="8 traits">
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {PERSONALITY.map(([t, d]) => (
                  <MiniCard key={t} title={t} desc={d} accent="flare" />
                ))}
              </div>
            </Panel>

            <Panel id="tagline" idx="05" title="Tagline & Story" status="voice">
              <div className="border border-ozone/40 bg-ozone/[0.04] p-6 text-center">
                <p className="font-display text-2xl font-black tracking-[-0.02em] text-ozone md:text-3xl">
                  Creative Activism for a Better Urban Landscape.
                </p>
              </div>
              <div className="mt-5">
                <div className="inline-flex border border-slate2/60 bg-void p-1">
                  {Object.keys(STORY).map((k) => (
                    <button
                      key={k}
                      onClick={() => setStory(k)}
                      className={`px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${story === k ? 'bg-ozone text-void' : 'text-darkgray hover:text-ozone'}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <p className="mt-4 max-w-3xl font-body text-[13.5px] leading-[1.7] text-silver/85">
                  {STORY[story]}
                </p>
              </div>
            </Panel>

            <Panel id="principles" idx="06" title="Language principles" status="8 rules">
              <div className="grid gap-2.5 md:grid-cols-2">
                {PRINCIPLES.map(([name, principle, application], i) => (
                  <div key={name} className="border border-slate2/50 bg-void/40 p-4">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-mono text-[13px] font-black text-ozone">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="font-display text-[14px] font-bold text-silver">{name}</div>
                    </div>
                    <p className="mt-2 font-body text-[12px] leading-[1.55] text-silver/80">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-flare">
                        Do ·{' '}
                      </span>
                      {principle}
                    </p>
                    <p className="mt-1 font-body text-[12px] leading-[1.55] text-darkgray">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                        Apply ·{' '}
                      </span>
                      {application}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel id="headlines" idx="07" title="Headlines & calls to action" status="copy">
              <div className="grid gap-2.5 md:grid-cols-2">
                {HEADLINES.map(([group, lines]) => (
                  <div key={group} className="border border-slate2/50 bg-void/40 p-4">
                    <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-flare">
                      {group}
                    </div>
                    <ul className="mt-2.5 space-y-2">
                      {lines.map((l) => (
                        <li
                          key={l}
                          className="font-display text-[15px] font-bold leading-[1.2] tracking-[-0.01em] text-silver"
                        >
                          "{l}"
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
                <div className="border border-[#39FF14]/30 bg-void/40 p-4">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-[#39FF14]">
                    <Check className="h-3.5 w-3.5" /> Do
                  </div>
                  <ul className="mt-2.5 space-y-1.5">
                    {CTA_DO.map((c) => (
                      <li key={c} className="font-body text-[13px] text-silver/85">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border border-[#FF0040]/30 bg-void/40 p-4">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-[#FF0040]">
                    <X className="h-3.5 w-3.5" /> Don't
                  </div>
                  <ul className="mt-2.5 space-y-1.5">
                    {CTA_DONT.map((c) => (
                      <li
                        key={c}
                        className="font-body text-[13px] text-darkgray line-through decoration-[#FF0040]/40"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>

            <Panel id="visual" idx="08" title="Visual system" status="in production">
              <p className="mb-3 max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
                The visual sections are next — guidance is set, imagery is being prepped for
                hosting.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  [
                    'Logo',
                    "Primary + supporting marks, on-colour pairings, clear space, scaling, social icon, don'ts.",
                  ],
                  [
                    'Photography',
                    "Categories — billboards, bus stops, subway — plus principles and don'ts.",
                  ],
                  ['Graphic', "Iconography, the 'keys' access guide, offense-type icons, posters."],
                  [
                    'Applications',
                    'Cards, merch, signage, print, out-of-home, digital ads, web + app.',
                  ],
                ].map(([t, d]) => (
                  <div key={t} className="border border-dashed border-slate2/50 bg-void/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-display text-[14px] font-bold text-silver">{t}</div>
                      <span className="border border-flare/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
                        Soon
                      </span>
                    </div>
                    <p className="mt-1.5 font-body text-[12px] leading-[1.5] text-darkgray">{d}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate2/40 pt-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">
              // brand standards · ad free streets · aligned to UN SDG 11.7
            </p>
            <Link
              to="/kit"
              className="inline-flex items-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
            >
              UI Kit <ArrowUpRight className="h-3 w-3" />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
