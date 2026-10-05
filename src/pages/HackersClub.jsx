import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Paintbrush, ShieldCheck, MapPin, RotateCcw } from 'lucide-react';
import Nav from '@/components/ooh/Nav';

const briefs = [
  {
    id: 'poster',
    number: '01',
    title: 'Remix the message.',
    icon: Paintbrush,
    tag: 'DESIGN / 10 MIN',
    description:
      'What would your city say if the message belonged to its people? Make a poster concept here.',
    steps: [
      'Pick one thing your neighbourhood needs.',
      'Write a message in eight words or fewer.',
      'Try it below. Keep it a concept until you have permission to display it.',
    ],
  },
  {
    id: 'street',
    number: '02',
    title: 'Make space for art.',
    icon: MapPin,
    tag: 'FIELD / YOUR OWN PACE',
    description:
      'Turn a creative idea into a permission-based street-art brief. Begin with a place, not a feed.',
    steps: [
      'Find a community noticeboard or a surface offered by its owner.',
      'Agree the artwork, materials, duration and cleanup with the person responsible.',
      'Plan your visit on the map. Document only what you can safely observe.',
    ],
  },
  {
    id: 'research',
    number: '03',
    title: 'Build. Test. Protect.',
    icon: ShieldCheck,
    tag: 'RESEARCH / SCOPE FIRST',
    description:
      'Bring your security skills to systems you own or have explicit written permission to test.',
    steps: [
      'Choose your own local demo or an explicitly authorised test environment.',
      'Write down the permitted systems, methods and stop conditions before testing.',
      'Keep findings private and agree a reporting channel with the owner.',
    ],
  },
];

const buttonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 border border-ozone px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-ozone hover:bg-ozone hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ozone';

export default function HackersClub() {
  const [selected, setSelected] = useState('poster');
  const [message, setMessage] = useState('MORE SPACE\nFOR PEOPLE.');
  const [paper, setPaper] = useState('lime');
  const brief = briefs.find((item) => item.id === selected);

  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <main className="page-top mx-auto max-w-6xl px-5 pb-32 md:px-8">
        <header className="grid gap-8 border-b border-slate2 pb-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ozone">
              OOH!EARTH / HACKERS CLUB
            </p>
            <h1 className="mt-5 font-display text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
              Hackers Club.
              <br />
              <span className="text-ozone">
                Make the city
                <br />
                your canvas.
              </span>
            </h1>
          </div>
          <div>
            <p className="max-w-lg text-lg leading-relaxed">
              A starting point for artists, makers and ethical researchers. Remix a message. Plan a
              permission-based intervention. Build something that gives back.
            </p>
            <a href="#club-briefs" className={`${buttonClass} mt-6`}>
              Pick your first brief <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <p className="mt-4 font-mono text-xs text-silver/75">
              Open to explore. No membership sign-up required.
            </p>
          </div>
        </header>

        <section id="club-briefs" aria-labelledby="briefs-heading" className="scroll-mt-28 py-10">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="briefs-heading" className="font-display text-2xl font-bold uppercase">
              Choose a starting point.
            </h2>
            <span className="font-mono text-xs text-silver/75">
              THREE BRIEFS. ONE REAL-WORLD PURPOSE.
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {briefs.map(({ id, number, title, icon: Icon, tag, description }) => (
              <button
                key={id}
                type="button"
                aria-pressed={selected === id}
                onClick={() => setSelected(id)}
                className={`min-w-0 border p-5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ozone ${selected === id ? 'border-ozone bg-ozone/10' : 'border-slate2 bg-card hover:border-silver/60'}`}
              >
                <div className="flex items-center justify-between text-ozone">
                  <span className="font-mono text-sm">/{number}</span>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="mt-5 font-mono text-xs text-silver/75">{tag}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-silver/85">{description}</p>
                <span className="mt-5 inline-block font-mono text-xs uppercase text-ozone">
                  {selected === id ? 'Selected brief' : 'Explore brief'} →
                </span>
              </button>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="active-brief-heading"
          className="grid gap-8 border border-slate2 bg-card p-5 md:p-8 lg:grid-cols-2"
        >
          <div>
            <p className="font-mono text-xs text-ozone">YOUR STARTING BRIEF / {brief.number}</p>
            <h2 id="active-brief-heading" className="mt-3 font-display text-3xl font-bold">
              {brief.title}
            </h2>
            <ol className="mt-6 space-y-4">
              {brief.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-mono text-ozone" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {selected === 'poster' ? (
              <div className="mt-7 space-y-4">
                <label className="block text-sm font-bold" htmlFor="club-message">
                  Your poster message{' '}
                  <span className="font-normal text-silver/75">(up to 120 characters)</span>
                </label>
                <textarea
                  id="club-message"
                  maxLength={120}
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="w-full resize-y border border-silver/50 bg-void p-3 text-silver focus:border-ozone focus:outline-none"
                />
                <fieldset>
                  <legend className="mb-2 text-sm font-bold">Paper colour</legend>
                  <div className="flex flex-wrap gap-2">
                    {['lime', 'cream'].map((colour) => (
                      <label
                        key={colour}
                        className="flex min-h-11 items-center gap-2 border border-silver/40 px-3"
                      >
                        <input
                          type="radio"
                          name="club-paper"
                          value={colour}
                          checked={paper === colour}
                          onChange={() => setPaper(colour)}
                          className="accent-lime-400"
                        />
                        {colour === 'lime' ? 'Electric lime' : 'Warm cream'}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button
                  type="button"
                  onClick={() => {
                    setMessage('MORE SPACE\nFOR PEOPLE.');
                    setPaper('lime');
                  }}
                  className={buttonClass}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset poster
                </button>
                <p className="text-xs leading-relaxed text-silver/75">
                  A private sketch in this page only. Nothing is uploaded, saved or published.
                  Reloading resets it.
                </p>
              </div>
            ) : selected === 'street' ? (
              <div className="mt-7">
                <Link to="/map" className={buttonClass}>
                  Explore the field atlas <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <p className="mt-3 text-xs text-silver/75">
                  A mapped location is not permission to alter it.
                </p>
              </div>
            ) : (
              <div className="mt-7 border-l-2 border-ozone pl-4">
                <h3 className="font-bold">Permission is the starting line.</h3>
                <p className="mt-2 text-sm leading-relaxed">
                  This page grants no testing authorisation for OOH Earth, digital billboards or any
                  third-party system. No active testing tools are provided here. Arrange scope with
                  the owner first.
                </p>
                <Link to="/contact" className={`${buttonClass} mt-5`}>
                  Discuss a collaboration <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
          {selected === 'poster' ? (
            <div className="min-w-0 self-start">
              <p className="mb-3 font-mono text-xs tracking-wider text-silver/75">
                CONCEPT / NOT AN INSTALLED POSTER
              </p>
              <div
                data-testid="club-poster"
                className={`flex aspect-[3/4] flex-col justify-between overflow-hidden p-6 text-black md:p-8 ${paper === 'lime' ? 'bg-[#edff00]' : 'bg-[#f4efdc]'}`}
              >
                <div className="flex justify-between border-b-2 border-black pb-3 font-mono text-xs font-bold">
                  <span>OOH!EARTH</span>
                  <span>PUBLIC SPACE / PUBLIC VOICE</span>
                </div>
                <p
                  data-testid="club-poster-message"
                  className={`break-words font-display font-black uppercase leading-tight [overflow-wrap:anywhere] ${message.length > 60 ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'}`}
                >
                  {message.trim().replace(/\s+/g, ' ') || 'YOUR CITY. YOUR MESSAGE.'}
                </p>
                <div className="border-t-2 border-black pt-3 font-mono text-xs font-bold">
                  HACKERS CLUB / PRIVATE CONCEPT
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center border border-slate2 bg-void p-6">
              <span className="font-mono text-xs text-ozone">THE CLUB ETHOS</span>
              <p className="mt-5 font-display text-4xl font-bold uppercase leading-tight">
                Curiosity.
                <br />
                Permission.
                <br />
                Care.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-silver/85">
                Leave people, places and systems better than you found them. No trespass,
                unauthorised access or interference with live screens. Use your own materials and
                media, or get permission.
              </p>
            </div>
          )}
        </section>

        <section
          aria-labelledby="next-heading"
          className="mt-10 flex flex-col justify-between gap-5 border-t border-slate2 pt-8 md:flex-row md:items-center"
        >
          <div>
            <h2 id="next-heading" className="font-display text-2xl font-bold">
              Take the idea outside.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-silver/85">
              Find a place. Build a field route. Return with observations, not claims you cannot
              support.
            </p>
          </div>
          <Link to="/field-route" className={`${buttonClass} shrink-0`}>
            Your field route <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
