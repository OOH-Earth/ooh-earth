import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

/* ============================================================================
   OOH EARTH · AD FREE STREETS — "The Guild" Reader
   Orbital Perspective build system. Neon-on-black, Inter Tight chrome,
   Newsreader serif reading column, orbital reticle signature.
   Self-contained: no external UI deps. Drop into Base44 as a page component.
   ========================================================================== */

import { BOOK } from './guildBookData';
import Nav from '@/components/ooh/Nav';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import SiteFooter from '@/components/ooh/SiteFooter';

/* ---- working-doc config: hide front matter, open Ch 1..MAX_OPEN -------- */
const HIDE_FRONT = true;
const MAX_OPEN = 3;
const isFrontChapter = (c) => c.kind === 'front' || c.part === 'FRONT MATTER';
const isLockedChapter = (c) => c.num != null && c.num > MAX_OPEN;

/* ---- chapter lists + lookups ------------------------------------------ */
const RAW = [];
BOOK.parts.forEach((p) => p.chapters.forEach((c) => RAW.push({ ...c, part: p.title })));
const DISPLAY = RAW.filter((c) => !(HIDE_FRONT && isFrontChapter(c)));
DISPLAY.forEach((c) => {
  c.locked = isLockedChapter(c);
});
const FLAT = DISPLAY.filter((c) => !c.locked);
const LOCKED_COUNT = DISPLAY.length - FLAT.length;
const BY_ID = Object.fromEntries(FLAT.map((c) => [c.id, c]));
const IDX = Object.fromEntries(FLAT.map((c, i) => [c.id, i]));

/* ---- persistence (window.storage if present, else memory) ------------- */
const mem = {};
const store = {
  async get(k) {
    try {
      if (typeof window !== 'undefined' && window.storage) {
        const r = await window.storage.get(k);
        return r ? r.value : null;
      }
    } catch (e) {}
    return k in mem ? mem[k] : null;
  },
  async set(k, v) {
    try {
      if (typeof window !== 'undefined' && window.storage) {
        await window.storage.set(k, v);
        return;
      }
    } catch (e) {}
    mem[k] = v;
  },
};
const PKEY = 'oohguild:progress:v1';

/* ---- inline formatting: **bold**  *italic*  _italic_ ------------------- */
function renderInline(text) {
  if (!text) return null;
  const out = [];
  let i = 0,
    key = 0;
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_)/g;
  let m,
    last = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined)
      out.push(
        <strong key={key++} style={{ color: 'var(--paper)', fontWeight: 700 }}>
          {m[2]}
        </strong>,
      );
    else out.push(<em key={key++}>{m[3] !== undefined ? m[3] : m[4]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const isLyric = (t) =>
  t && t.length > 2 && t.trim().startsWith('*') && t.trim().endsWith('*') && !t.includes('**');

/* ---- block renderer ---------------------------------------------------- */
function Block({ b, first }) {
  switch (b.type) {
    case 'h':
      if (b.level === 3)
        return (
          <h3 className="rh3">
            <span className="rtick" />
            {b.text}
          </h3>
        );
      if (b.level === 4) return <h4 className="rh4">{b.text}</h4>;
      return <h5 className="rh5">{b.text}</h5>;
    case 'quote':
      return <blockquote className="rquote">{renderInline(b.text)}</blockquote>;
    case 'hr':
      return (
        <div className="rhr" aria-hidden>
          <span /> <b /> <span />
        </div>
      );
    case 'ul':
      return (
        <ul className="rul">
          {b.items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="rol">
          {b.items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ol>
      );
    case 'p':
    default:
      if (isLyric(b.text)) return <p className="rlyric">{renderInline(b.text)}</p>;
      return <p className={'rp' + (first ? ' rp-first' : '')}>{renderInline(b.text)}</p>;
  }
}

/* ---- progress ring ----------------------------------------------------- */
function Ring({ pct, size = 34, stroke = 3 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,.14)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--hivis)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{
          transition: 'stroke-dashoffset .5s ease',
          filter: 'drop-shadow(0 0 4px rgba(237,255,0,.5))',
        }}
      />
    </svg>
  );
}

/* ---- reticle corner brackets ------------------------------------------ */
const Brackets = ({ which = 'all' }) => {
  const set = which === 'all' ? ['tl', 'tr', 'bl', 'br'] : which.split(' ');
  return set.map((p) => <span key={p} className={'brk ' + p} />);
};

/* ======================================================================== */
export default function GuildReader() {
  const [view, setView] = useState('cover'); // cover | reader
  const [activeId, setActiveId] = useState(FLAT[0].id);
  const [readIds, setReadIds] = useState([]);
  const [fontScale, setFontScale] = useState(1);
  const [toc, setToc] = useState(false); // mobile drawer
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState('');
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);

  /* load progress */
  useEffect(() => {
    (async () => {
      const raw = await store.get(PKEY);
      if (raw) {
        try {
          const s = JSON.parse(raw);
          if (Array.isArray(s.readIds)) setReadIds(s.readIds);
          if (s.lastId && BY_ID[s.lastId]) setActiveId(s.lastId);
          if (s.fontScale) setFontScale(s.fontScale);
        } catch (e) {}
      }
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(
    (next) => {
      const payload = {
        readIds,
        lastId: activeId,
        fontScale,
        ...next,
      };
      store.set(PKEY, JSON.stringify(payload));
    },
    [readIds, activeId, fontScale],
  );

  const markRead = useCallback(
    (id) => {
      setReadIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        store.set(PKEY, JSON.stringify({ readIds: next, lastId: id, fontScale }));
        return next;
      });
    },
    [fontScale],
  );

  const goto = useCallback(
    (id) => {
      setActiveId(id);
      setView('reader');
      setToc(false);
      setSearch(false);
      persist({ lastId: id });
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        if (typeof window !== 'undefined') window.scrollTo(0, 0);
      });
    },
    [persist],
  );

  const active = BY_ID[activeId];
  const pos = IDX[activeId];
  const prev = pos > 0 ? FLAT[pos - 1] : null;
  const next = pos < FLAT.length - 1 ? FLAT[pos + 1] : null;
  const pct = readIds.length / FLAT.length;
  const started = readIds.length > 0 || activeId !== FLAT[0].id;

  /* mark active read on mount / change */
  useEffect(() => {
    if (view === 'reader' && active) {
      const t = setTimeout(() => markRead(active.id), 900);
      return () => clearTimeout(t);
    }
  }, [view, activeId]); // eslint-disable-line

  const setScale = (d) => {
    setFontScale((s) => {
      const v = Math.min(1.5, Math.max(0.85, +(s + d).toFixed(2)));
      store.set(PKEY, JSON.stringify({ readIds, lastId: activeId, fontScale: v }));
      return v;
    });
  };

  /* search results */
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 3) return [];
    const out = [];
    for (const c of FLAT) {
      for (const b of c.blocks) {
        const t = (b.text || (b.items && b.items.join(' ')) || '').toLowerCase();
        const at = t.indexOf(term);
        if (at !== -1) {
          const src = b.text || (b.items && b.items.join(' ')) || '';
          const start = Math.max(0, at - 40);
          out.push({
            id: c.id,
            title: c.title,
            part: c.part,
            snippet:
              (start > 0 ? '…' : '') +
              src.slice(start, at + term.length + 60).replace(/\*/g, '') +
              '…',
          });
          break;
        }
      }
      if (out.length > 24) break;
    }
    return out;
  }, [q]);

  /* =====================================================================
     COVER / STORE VIEW
     ===================================================================== */
  const Cover = (
    <div className="cover-scroll">
      <div className="cover-wrap">
        <div className="cover-art">
          <Brackets />
          <div className="ca-grid" />
          <div className="ca-inner">
            <div className="ca-eye">
              <span className="tick" /> The Meaning Transformation Guild
            </div>
            <div className="ca-title">
              SUBVERTISING<span className="amp"> &amp; </span>BRANDALISM
            </div>
            <div className="ca-sub">
              THE <em>GUILD</em>
            </div>
            <div className="ca-meta">A field manual for creative resistance · Est. 2026</div>
            <div className="ca-coord">13.7563° N · 100.5018° E</div>
          </div>
        </div>

        <div className="cover-side">
          <div className="cs-kicker">
            <span className="tick" /> Agency Working Doc · Internal
          </div>
          <h1 className="cs-h1">
            The working <em>file.</em>
          </h1>
          <p className="cs-lede">
            Live agency draft of the field manual. Chapters 1–3 are open for review; the rest of the
            manuscript is in review and reveals as it clears. Notes welcome.
          </p>

          <div className="cs-stats">
            <div className="stat">
              <b>{FLAT.length}</b>
              <span>Open</span>
            </div>
            <div className="stat">
              <b>{LOCKED_COUNT}</b>
              <span>In review</span>
            </div>
            <div className="stat">
              <b>{(BOOK.totalWords / 1000).toFixed(0)}k</b>
              <span>Words</span>
            </div>
            <div className="stat">
              <b>
                {Math.floor(BOOK.totalMinutes / 60)}h {BOOK.totalMinutes % 60}m
              </b>
              <span>Full read</span>
            </div>
          </div>

          <div className="cs-cta">
            <button className="btn-primary" onClick={() => goto(started ? activeId : FLAT[0].id)}>
              {started ? (
                <>
                  Continue — {active.num ? 'Ch ' + active.num : active.title}{' '}
                  <span className="arr">→</span>
                </>
              ) : (
                <>
                  Start reading <span className="arr">→</span>
                </>
              )}
            </button>
            <button className="btn-ghost" onClick={() => goto(FLAT[0].id)}>
              From the beginning
            </button>
          </div>

          {loaded && readIds.length > 0 && (
            <div className="cs-progress">
              <Ring pct={pct} />
              <span>
                {Math.round(pct * 100)}% · {readIds.length}/{FLAT.length} chapters read
              </span>
            </div>
          )}

          <div className="cs-get">
            <div className="cs-get-head">
              <span className="tick" /> Working file
            </div>
            <div className="cs-tiles">
              <button className="tile active" onClick={() => goto(started ? activeId : FLAT[0].id)}>
                <div className="tile-k">Read now</div>
                <div className="tile-v">Ch 1–3</div>
                <div className="tile-note">Open for review →</div>
              </button>
              <div className="tile soon">
                <div className="tile-k">Full manuscript</div>
                <div className="tile-v">In review</div>
                <div className="tile-note">Reveals as it clears</div>
              </div>
              <a className="tile buy" href="mailto:hello@ooh.earth?subject=The%20Guild%20notes">
                <div className="tile-k">Feedback</div>
                <div className="tile-v">Send notes</div>
                <div className="tile-note">hello@ooh.earth →</div>
              </a>
            </div>
            <div className="lic-row">
              <span className="pill">AGPL-3.0</span>
              <span className="pill">CC BY-SA 4.0</span>
              <span className="pill ghost">Draft · v0.9</span>
            </div>
            <p className="cs-fine">
              Internal agency draft — not for public circulation yet. Chapters open as they clear
              review.
            </p>
          </div>
        </div>
      </div>

      {/* contents preview on cover */}
      <div className="cover-toc">
        <div className="ct-head">
          <span className="tick" /> Contents
        </div>
        {BOOK.parts
          .filter((p) => p.title !== 'FRONT MATTER')
          .map((p) => (
            <div className="ct-part" key={p.title}>
              <div className="ct-part-name">{p.title}</div>
              {p.chapters.map((c) => {
                const locked = c.num != null && c.num > MAX_OPEN;
                if (locked)
                  return (
                    <div className="ct-row locked" key={c.id}>
                      <span className="ct-num">{String(c.num).padStart(2, '0')}</span>
                      <span className="ct-title">{c.title}</span>
                      <span className="ct-min lock">Reveal soon</span>
                    </div>
                  );
                return (
                  <button className="ct-row" key={c.id} onClick={() => goto(c.id)}>
                    <span className="ct-num">{c.num ? String(c.num).padStart(2, '0') : '—'}</span>
                    <span className="ct-title">{c.title}</span>
                    <span className="ct-min">
                      {readIds.includes(c.id) && <i className="dot-read" />}
                      {c.minutes}m
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
      </div>

      <div className="cover-foot">
        ooh<span className="dot">.</span>earth &nbsp;·&nbsp; @adfreestreets
      </div>
    </div>
  );

  /* =====================================================================
     READER VIEW
     ===================================================================== */
  const Sidebar = (
    <aside className={'sidebar' + (toc ? ' open' : '')}>
      <div className="sb-top">
        <button className="sb-home" onClick={() => setView('cover')}>
          ← Cover
        </button>
        <button className="sb-x" onClick={() => setToc(false)}>
          ✕
        </button>
      </div>
      <div className="sb-scroll">
        {BOOK.parts
          .filter((p) => p.title !== 'FRONT MATTER')
          .map((p) => (
            <div className="sb-part" key={p.title}>
              <div className="sb-part-name">{p.title}</div>
              {p.chapters.map((c) => {
                const locked = c.num != null && c.num > MAX_OPEN;
                if (locked)
                  return (
                    <div className="sb-row locked" key={c.id}>
                      <span className="sb-num">{String(c.num).padStart(2, '0')}</span>
                      <span className="sb-title">{c.title}</span>
                      <span className="sb-min lock">soon</span>
                    </div>
                  );
                const on = c.id === activeId;
                const read = readIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    className={'sb-row' + (on ? ' on' : '')}
                    onClick={() => goto(c.id)}
                  >
                    <span className="sb-num">{c.num ? String(c.num).padStart(2, '0') : '•'}</span>
                    <span className="sb-title">{c.title}</span>
                    <span className="sb-min">
                      {read && <i className="dot-read" />}
                      {c.minutes}m
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
      </div>
    </aside>
  );

  const Reader = (
    <div className="reader">
      {Sidebar}
      {toc && <div className="scrim" onClick={() => setToc(false)} />}

      <main className="stage">
        <header className="topbar">
          <button className="tb-menu" onClick={() => setToc(true)}>
            ☰
          </button>
          <button className="tb-brand" onClick={() => setView('cover')}>
            <span className="tb-tick" />
            THE GUILD
          </button>
          <div className="tb-spacer" />
          <button className="tb-icon" title="Search" onClick={() => setSearch(true)}>
            ⌕
          </button>
          <div className="tb-font">
            <button onClick={() => setScale(-0.08)}>A−</button>
            <button onClick={() => setScale(0.08)}>A+</button>
          </div>
          <div className="tb-prog">
            <Ring pct={pct} size={30} stroke={3} />
            <span>{Math.round(pct * 100)}%</span>
          </div>
        </header>

        <div className="progline" style={{ width: pct * 100 + '%' }} />

        <div className="stage-scroll" ref={scrollRef}>
          <Brackets which="tl tr" />
          <article className="rdr" style={{ fontSize: 19 * fontScale + 'px' }} key={active.id}>
            <div className="ch-head">
              <div className="ch-part">
                <span className="tick" /> {active.part}
              </div>
              <h2 className="ch-title">
                {active.num != null && (
                  <span className="ch-no">{String(active.num).padStart(2, '0')}</span>
                )}
                {active.title}
              </h2>
              {active.byline && <div className="ch-byline">{active.byline}</div>}
              <div className="ch-time">
                {active.words.toLocaleString()} words · {active.minutes} min read
              </div>
            </div>

            {active.blocks.map((b, i) => (
              <Block
                key={i}
                b={b}
                first={b.type === 'p' && !active.blocks.slice(0, i).some((x) => x.type === 'p')}
              />
            ))}

            <nav className="ch-nav">
              {prev ? (
                <button className="nav-btn" onClick={() => goto(prev.id)}>
                  <span className="nav-dir">← Previous</span>
                  <span className="nav-name">{prev.title}</span>
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button className="nav-btn right" onClick={() => goto(next.id)}>
                  <span className="nav-dir">Next →</span>
                  <span className="nav-name">{next.title}</span>
                </button>
              ) : (
                <button className="nav-btn right" onClick={() => setView('cover')}>
                  <span className="nav-dir">Fin →</span>
                  <span className="nav-name">Back to cover</span>
                </button>
              )}
            </nav>

            <div className="rdr-foot">
              ooh<span className="dot">.</span>earth · The Meaning Transformation Guild
            </div>
          </article>
        </div>
      </main>

      {search && (
        <div className="search-overlay" onClick={() => setSearch(false)}>
          <div className="search-box" onClick={(e) => e.stopPropagation()}>
            <div className="search-in">
              <span className="s-ic">⌕</span>
              <input
                autoFocus
                placeholder="Search the book…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button onClick={() => setSearch(false)}>ESC</button>
            </div>
            <div className="search-results">
              {q.trim().length < 3 && <div className="s-hint">Type at least 3 characters.</div>}
              {q.trim().length >= 3 && results.length === 0 && (
                <div className="s-hint">No matches.</div>
              )}
              {results.map((r, i) => (
                <button
                  className="s-row"
                  key={i}
                  onClick={() => {
                    goto(r.id);
                  }}
                >
                  <div className="s-r-top">
                    <span className="s-r-part">{r.part}</span>
                    <span className="s-r-title">{r.title}</span>
                  </div>
                  <div className="s-r-snip">{r.snippet}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <HorizonProgress />
      <Nav />
      <div className="page-top">
        <Breadcrumbs
          items={[{ label: 'Lab', to: '/lab' }, { label: 'The Guild · Book' }]}
          className="mx-auto mb-4 max-w-[1220px] px-6"
        />
        <div className="guild-root">
          <style>{CSS}</style>
          {view === 'cover' ? Cover : Reader}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

/* ======================================================================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500;1,600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap');

.guild-root{
  --hivis:#EDFF00; --flare:#FF5C00; --ozone:#39FF14;
  --canvas:#000; --canvas2:#0A0A0A; --paper:#fff; --alert:#FF0040;
  --muted:rgba(255,255,255,.62); --faint:rgba(255,255,255,.40);
  --line:rgba(255,255,255,.08);
  --ui:'Inter Tight',system-ui,-apple-system,sans-serif;
  --read:'Newsreader',Georgia,'Times New Roman',serif;
  --track:.28em;
  --glow-y:0 0 24px rgba(237,255,0,.28);
  --glow-o:0 0 22px rgba(255,92,0,.30);
  font-family:var(--ui);
  color:var(--paper);
  background:transparent;
  position:relative;
  -webkit-font-smoothing:antialiased;
}
.guild-root *{box-sizing:border-box}
.guild-root button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
.guild-root a{color:var(--ozone);text-decoration:none}
.guild-root a:hover{text-decoration:underline}
.tick{display:inline-block;width:16px;height:5px;background:var(--flare);box-shadow:var(--glow-o);margin-right:9px;vertical-align:middle}
.dot{color:var(--flare)}
.dot-read{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--ozone);box-shadow:0 0 8px rgba(57,255,20,.7);margin-right:7px;vertical-align:middle}

/* reticle brackets */
.brk{position:absolute;width:26px;height:26px;border:2px solid var(--hivis);z-index:4;opacity:.85;pointer-events:none}
.brk.tl{top:16px;left:16px;border-right:0;border-bottom:0}
.brk.tr{top:16px;right:16px;border-left:0;border-bottom:0}
.brk.bl{bottom:16px;left:16px;border-right:0;border-top:0}
.brk.br{bottom:16px;right:16px;border-left:0;border-top:0}

/* ======================= COVER ======================= */
.cover-scroll{background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:44px 44px;padding-top:20px}
.cover-wrap{max-width:1180px;margin:0 auto;padding:56px 28px 20px;display:grid;grid-template-columns:1.05fr 1fr;gap:44px;align-items:stretch}
.cover-art{position:relative;background:var(--canvas);border-radius:6px;overflow:hidden;min-height:520px;display:flex;isolation:isolate}
.ca-grid{position:absolute;inset:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:34px 34px;-webkit-mask-image:radial-gradient(120% 110% at 50% 26%,#000 42%,transparent 100%);mask-image:radial-gradient(120% 110% at 50% 26%,#000 42%,transparent 100%)}
.ca-inner{position:relative;z-index:3;padding:48px 42px;display:flex;flex-direction:column;justify-content:center;width:100%}
.ca-eye{font-size:12px;font-weight:600;letter-spacing:var(--track);text-transform:uppercase;color:var(--hivis);margin-bottom:26px}
.ca-title{font-size:clamp(34px,5vw,58px);font-weight:900;line-height:.94;letter-spacing:-.03em}
.ca-title .amp{color:var(--flare)}
.ca-sub{font-size:clamp(30px,4.4vw,50px);font-weight:900;letter-spacing:.02em;margin-top:6px}
.ca-sub em{font-style:normal;color:var(--hivis);text-shadow:var(--glow-y)}
.ca-meta{margin-top:26px;font-size:13px;color:var(--muted);font-weight:500;max-width:34ch;line-height:1.5}
.ca-coord{margin-top:16px;font-size:12px;color:var(--faint);font-variant-numeric:tabular-nums;letter-spacing:.06em}

.cover-side{display:flex;flex-direction:column;justify-content:center;padding:8px 4px}
.cs-kicker{font-size:11.5px;font-weight:600;letter-spacing:var(--track);text-transform:uppercase;color:var(--ozone)}
.cs-h1{font-size:clamp(30px,4vw,44px);font-weight:900;line-height:1.02;letter-spacing:-.025em;margin:18px 0 0}
.cs-h1 em{font-style:normal;color:var(--hivis);text-shadow:var(--glow-y)}
.cs-lede{margin-top:18px;font-size:15.5px;line-height:1.6;color:var(--muted);font-weight:500;max-width:46ch}
.cs-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:30px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:20px 0}
.cs-stats .stat{display:flex;flex-direction:column;gap:5px}
.cs-stats .stat b{font-size:26px;font-weight:900;letter-spacing:-.02em;color:var(--hivis);font-variant-numeric:tabular-nums;line-height:1}
.cs-stats .stat span{font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.cs-cta{display:flex;gap:12px;margin-top:26px;flex-wrap:wrap}
.btn-primary{background:var(--hivis);color:#000;font-weight:800;font-size:15px;letter-spacing:.01em;padding:15px 24px;border-radius:6px;box-shadow:var(--glow-y);display:inline-flex;align-items:center;gap:9px;transition:transform .12s ease,box-shadow .2s}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 0 34px rgba(237,255,0,.45)}
.btn-primary .arr{font-size:17px}
.btn-ghost{border:1px solid rgba(255,255,255,.24);padding:15px 20px;border-radius:6px;font-weight:600;font-size:14px;color:var(--paper);transition:border-color .2s,background .2s}
.btn-ghost:hover{border-color:var(--hivis);background:rgba(237,255,0,.06)}
.cs-progress{display:flex;align-items:center;gap:12px;margin-top:22px;font-size:13px;color:var(--muted);font-weight:500}
.cs-get{margin-top:26px;border-top:1px solid var(--line);padding-top:20px}
.cs-get-head{font-size:11px;font-weight:600;letter-spacing:var(--track);text-transform:uppercase;color:var(--hivis);margin-bottom:14px}
.cs-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.tile{display:block;text-align:left;padding:15px 14px;border-radius:6px;border:1px solid var(--line);background:rgba(255,255,255,.02);transition:border-color .18s,background .18s,transform .12s}
.tile:hover{transform:translateY(-2px)}
.tile-k{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);margin-bottom:7px}
.tile-v{font-size:17px;font-weight:900;letter-spacing:-.01em;line-height:1}
.tile-note{margin-top:8px;font-size:11px;font-weight:600;color:var(--muted)}
.tile.active{border-color:var(--hivis);background:rgba(237,255,0,.07)}
.tile.active .tile-v{color:var(--hivis)}
.tile.active:hover{box-shadow:var(--glow-y)}
.tile.buy:hover{border-color:var(--ozone);background:rgba(57,255,20,.07)}
.tile.buy .tile-v{color:var(--ozone)}
.tile.soon{opacity:.72}
.tile.soon .tile-v{color:var(--flare)}
.tile.soon:hover{border-color:var(--flare);opacity:1}
.lic-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.pill{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:4px;background:rgba(57,255,20,.12);color:var(--ozone);border:1px solid rgba(57,255,20,.3)}
.pill.ghost{background:transparent;color:var(--faint);border-color:var(--line)}
.cs-fine{font-size:13px;color:var(--muted);line-height:1.55;font-weight:500;max-width:52ch}

.cover-toc{max-width:1180px;margin:34px auto 0;padding:0 28px}
.ct-head{font-size:12px;font-weight:600;letter-spacing:var(--track);text-transform:uppercase;color:var(--hivis);padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.14);margin-bottom:8px}
.ct-part{margin-top:22px}
.ct-part-name{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--flare);margin-bottom:8px;padding-left:2px}
.ct-row{display:grid;grid-template-columns:34px 1fr auto;align-items:center;gap:14px;width:100%;text-align:left;padding:11px 10px;border-radius:5px;border-bottom:1px solid var(--line);transition:background .15s}
.ct-row:hover{background:rgba(237,255,0,.05)}
.ct-num{font-size:12px;font-weight:700;color:var(--faint);font-variant-numeric:tabular-nums}
.ct-title{font-size:15px;font-weight:600;letter-spacing:-.01em}
.ct-min{font-size:11.5px;color:var(--faint);font-weight:600;white-space:nowrap}
.ct-row.locked{opacity:.5;cursor:default}
.ct-row.locked:hover{background:transparent}
.ct-min.lock{color:var(--flare);font-weight:700;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase}
.sb-row.locked{opacity:.42;cursor:default}
.sb-row.locked:hover{background:transparent}
.sb-min.lock{color:var(--flare);font-weight:700;font-size:9px;letter-spacing:.1em;text-transform:uppercase}
.cover-foot{max-width:1180px;margin:44px auto;padding:24px 28px;text-align:center;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);border-top:1px solid var(--line)}
.cover-foot .dot{color:var(--flare)}

/* ======================= READER ======================= */
.reader{display:flex;gap:34px;align-items:flex-start;max-width:1220px;margin:0 auto;padding:20px 20px 90px;position:relative}
.sidebar{width:270px;flex-shrink:0;background:transparent;border-right:1px solid var(--line);display:flex;flex-direction:column;position:sticky;top:104px;align-self:flex-start;max-height:calc(100vh - 128px);z-index:30}
.sb-top{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 12px;border-bottom:1px solid var(--line)}
.sb-home{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.sb-home:hover{color:var(--hivis)}
.sb-x{display:none;font-size:18px;color:var(--muted)}
.sb-scroll{overflow-y:auto;padding:14px 10px 40px;flex:1}
.sb-part{margin-bottom:16px}
.sb-part-name{font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--flare);padding:8px 8px 6px}
.sb-row{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:9px;width:100%;text-align:left;padding:9px 8px;border-radius:5px;border-left:2px solid transparent;transition:background .14s}
.sb-row:hover{background:rgba(255,255,255,.04)}
.sb-row.on{background:rgba(237,255,0,.09);border-left-color:var(--hivis)}
.sb-num{font-size:11px;font-weight:700;color:var(--faint);font-variant-numeric:tabular-nums}
.sb-row.on .sb-num{color:var(--hivis)}
.sb-title{font-size:13px;font-weight:600;letter-spacing:-.005em;line-height:1.25}
.sb-min{font-size:10.5px;color:var(--faint);font-weight:600;white-space:nowrap}

.scrim{display:none}

.stage{flex:1;display:flex;flex-direction:column;min-width:0;position:relative}
.topbar{height:52px;flex-shrink:0;display:flex;align-items:center;gap:14px;padding:0 16px;border:1px solid var(--line);border-radius:8px;background:rgba(10,10,10,.85);backdrop-filter:blur(8px);position:sticky;top:104px;z-index:20;margin-bottom:10px}
.tb-menu{display:none;font-size:20px;color:var(--paper)}
.tb-brand{display:flex;align-items:center;font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.tb-tick{width:14px;height:5px;background:var(--flare);box-shadow:var(--glow-o);margin-right:9px}
.tb-spacer{flex:1}
.tb-icon{font-size:19px;color:var(--muted);padding:4px 8px;border-radius:5px}
.tb-icon:hover{color:var(--hivis);background:rgba(237,255,0,.06)}
.tb-font{display:flex;gap:2px;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.tb-font button{font-size:12px;font-weight:700;padding:7px 10px;color:var(--muted)}
.tb-font button:hover{background:rgba(237,255,0,.08);color:var(--hivis)}
.tb-prog{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums}
.progline{height:2px;background:var(--hivis);box-shadow:var(--glow-y);transition:width .4s ease;flex-shrink:0}

.stage-scroll{position:relative}
.stage-scroll .brk{display:none}

.rdr{max-width:720px;margin:0 auto;padding:20px 28px 40px;font-family:var(--read)}
.ch-head{margin-bottom:44px;padding-bottom:26px;border-bottom:1px solid var(--line);font-family:var(--ui)}
.ch-part{font-size:11.5px;font-weight:600;letter-spacing:var(--track);text-transform:uppercase;color:var(--hivis)}
.ch-title{font-family:var(--ui);font-size:clamp(30px,4.6vw,46px);font-weight:900;line-height:1;letter-spacing:-.03em;margin:18px 0 0;display:flex;flex-wrap:wrap;align-items:baseline;gap:16px}
.ch-no{font-size:.5em;font-weight:800;color:var(--flare);letter-spacing:0;font-variant-numeric:tabular-nums;text-shadow:var(--glow-o)}
.ch-byline{margin-top:16px;font-family:var(--read);font-style:italic;font-size:16px;color:var(--muted)}
.ch-time{margin-top:14px;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}

.rp{margin:0 0 1.35em;line-height:1.72;color:rgba(255,255,255,.90);font-weight:400}
.rp-first::first-letter{initial-letter:2;-webkit-initial-letter:2;font-weight:600;color:var(--hivis);margin-right:.10em;font-family:var(--ui)}
.rlyric{margin:.2em 0 1.1em;padding:14px 20px;border-left:2px solid var(--hivis);background:rgba(237,255,0,.04);font-style:italic;line-height:1.75;color:rgba(255,255,255,.86);font-size:.97em}
.rquote{margin:2em 0;padding:6px 0 6px 26px;border-left:3px solid var(--flare);font-style:italic;font-size:1.18em;line-height:1.5;color:var(--paper);font-family:var(--read)}
.rh3{font-family:var(--ui);font-size:1.02em;font-weight:800;letter-spacing:.02em;text-transform:uppercase;margin:2.4em 0 .9em;color:var(--paper);display:flex;align-items:center}
.rtick{width:18px;height:5px;background:var(--flare);box-shadow:var(--glow-o);margin-right:12px;flex-shrink:0}
.rh4{font-family:var(--ui);font-size:1.04em;font-weight:700;margin:2em 0 .7em;color:var(--hivis);letter-spacing:-.01em}
.rh5{font-family:var(--ui);font-size:.86em;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin:1.8em 0 .6em;color:var(--muted)}
.rul,.rol{margin:0 0 1.4em;padding-left:0;list-style:none}
.rul li,.rol li{position:relative;padding-left:26px;margin-bottom:.6em;line-height:1.62;color:rgba(255,255,255,.86)}
.rul li::before{content:"";position:absolute;left:4px;top:.62em;width:8px;height:8px;background:var(--ozone);box-shadow:0 0 8px rgba(57,255,20,.6);border-radius:1px}
.rol{counter-reset:ol}
.rol li{counter-increment:ol}
.rol li::before{content:counter(ol);position:absolute;left:0;top:.05em;font-family:var(--ui);font-weight:800;font-size:.8em;color:var(--flare)}
.rhr{display:flex;align-items:center;justify-content:center;gap:12px;margin:2.6em 0}
.rhr span{height:1px;width:60px;background:var(--line)}
.rhr b{width:7px;height:7px;background:var(--flare);box-shadow:var(--glow-o);transform:rotate(45deg)}

.ch-nav{display:flex;justify-content:space-between;gap:16px;margin-top:64px;padding-top:28px;border-top:1px solid var(--line);font-family:var(--ui)}
.nav-btn{display:flex;flex-direction:column;gap:5px;text-align:left;padding:14px 18px;border:1px solid var(--line);border-radius:6px;max-width:46%;transition:border-color .18s,background .18s}
.nav-btn.right{text-align:right;align-items:flex-end}
.nav-btn:hover{border-color:var(--hivis);background:rgba(237,255,0,.05)}
.nav-dir{font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--hivis)}
.nav-name{font-size:13.5px;font-weight:600;color:var(--muted)}
.rdr-foot{margin-top:56px;text-align:center;font-family:var(--ui);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.rdr-foot .dot{color:var(--flare)}

/* search */
.search-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(6px);z-index:60;display:flex;align-items:flex-start;justify-content:center;padding:12vh 20px}
.search-box{width:100%;max-width:640px;background:var(--canvas2);border:1px solid rgba(255,255,255,.16);border-radius:10px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.search-in{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--line)}
.s-ic{font-size:20px;color:var(--hivis)}
.search-in input{flex:1;background:none;border:0;outline:none;color:var(--paper);font-size:17px;font-family:var(--ui);font-weight:500}
.search-in input::placeholder{color:var(--faint)}
.search-in button{font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--faint);border:1px solid var(--line);padding:5px 9px;border-radius:5px}
.search-results{max-height:52vh;overflow-y:auto}
.s-hint{padding:26px;text-align:center;color:var(--faint);font-size:13px}
.s-row{display:block;width:100%;text-align:left;padding:14px 18px;border-bottom:1px solid var(--line);transition:background .14s}
.s-row:hover{background:rgba(237,255,0,.06)}
.s-r-top{display:flex;gap:10px;align-items:baseline;margin-bottom:5px}
.s-r-part{font-size:9.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--flare)}
.s-r-title{font-size:13.5px;font-weight:700}
.s-r-snip{font-size:12.5px;color:var(--muted);line-height:1.5}

/* ======================= RESPONSIVE ======================= */
@media(max-width:900px){
  .cover-wrap{grid-template-columns:1fr;gap:28px;padding:40px 20px 8px}
  .cover-art{min-height:360px}
  .sidebar{position:fixed;left:0;top:0;bottom:0;max-height:none;transform:translateX(-100%);transition:transform .26s ease;box-shadow:0 0 60px rgba(0,0,0,.6);background:var(--canvas2);z-index:70;padding-top:env(safe-area-inset-top)}
  .sidebar.open{transform:translateX(0)}
  .sb-x{display:block}
  .scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:65}
  .reader{padding-top:16px}
  .cover-scroll{padding-top:16px}
  .topbar{top:88px}
  .tb-menu{display:block}
  .tb-font{display:none}
  .rdr{padding:40px 20px 100px}
  .nav-name{display:none}
  .cs-stats{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:560px){
  .ca-inner{padding:34px 26px}
  .cs-cta{flex-direction:column}
  .btn-primary,.btn-ghost{width:100%;justify-content:center}
  .cs-tiles{grid-template-columns:1fr}
  .tile{display:flex;align-items:baseline;gap:10px}
  .tile-k{margin-bottom:0;min-width:96px}
  .tile-note{margin-top:0;margin-left:auto}
}
`;
