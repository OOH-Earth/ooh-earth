import { useState } from 'react';
import Nav from '@/components/ooh/Nav';
import { JM_CSS } from '@/components/ooh/journey/styles';
import { TABS, PANELS_A } from '@/components/ooh/journey/panelsA';
import { PANELS_B } from '@/components/ooh/journey/panelsB';

const PANELS = { ...PANELS_A, ...PANELS_B };

export default function JourneyMap() {
  const [active, setActive] = useState('overview');

  return (
    <div className="relative min-h-screen bg-void">
      <Nav />
      <main className="page-top px-5 pb-24 md:px-8">
        <div className="jm-root mx-auto max-w-[1240px]">
          <style dangerouslySetInnerHTML={{ __html: JM_CSS }} />

          <header className="jm-head">
            <div className="jm-eyebrow">Orbital Perspective · Product Doc</div>
            <h1 className="jm-title">
              UX JOURNEY MAP <span className="dot">/</span> OOH EARTH
            </h1>
            <p className="jm-sub">
              The full path through the civic platform — mapped from every side of the screen,
              wireframed low-fi, with a live build status on every feature. Where does a stranger
              become a Scout? Where does a Scout become a City Ambassador? What's shipped, what's
              mid-build, what's still on the roadmap. This is the map of the map.
            </p>
            <div className="jm-metarow">
              <span>
                Platform · <b>Base44</b>
              </span>
              <span>
                Voice ref · <b>/campaign</b>
              </span>
              <span>
                Tiers · <b>Scout → Field Reporter → City Ambassador</b>
              </span>
              <span>v1 · Jul 2026</span>
            </div>
            <div className="jm-legend">
              <span className="jm-chip live">
                <span className="d"></span>Live
              </span>
              <span className="jm-chip building">
                <span className="d"></span>Building
              </span>
              <span className="jm-chip planned">
                <span className="d"></span>Planned
              </span>
              <span className="jm-chip exploring">
                <span className="d"></span>Exploring
              </span>
            </div>
          </header>

          <nav className="jm-menu" aria-label="Journey perspectives">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`jm-tab${active === t.id ? ' jm-on' : ''}`}
                onClick={() => setActive(t.id)}
                aria-current={active === t.id ? 'page' : undefined}
              >
                <span className="n">{t.n}</span>
                {t.label}
              </button>
            ))}
          </nav>

          <div
            key={active}
            className="jm-panel"
            dangerouslySetInnerHTML={{ __html: PANELS[active] }}
          />
        </div>
      </main>
    </div>
  );
}
