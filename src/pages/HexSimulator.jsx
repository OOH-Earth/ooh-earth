import { useState } from 'react';
import Nav from '@/components/ooh/Nav';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import SiteFooter from '@/components/ooh/SiteFooter';
import { fromLines, TRI, DIAL } from '@/lib/hexagrams';

// OOH Earth — Hex Engine Simulator (Lab)
// Working 64-state device sim, ported from the design handoff onto the OOH
// design system. Driven by the canonical hexagrams.js protocol module.

const LED_COLORS = ['#6fd6ff', '#EDFF00', '#39FF14', '#ff6a8a'];
const C = { dim: '#7d8aa0', err: '#ff5a4e', ack: '#39FF14', sys: '#EDFF00' };

export default function HexSimulator() {
  const [lines, setLines] = useState([1, 0, 1, 1, 0, 1]);
  const [mode, setMode] = useState(2);
  const [locked, setLocked] = useState(false);
  const [ledTs, setLedTs] = useState(0);
  const [ledColor, setLedColor] = useState('#6fd6ff');
  const [log, setLog] = useState([]);

  const h = fromLines(lines);
  const activeTri = TRI[DIAL[mode]];
  const op = (mode << 6) | h.dec;
  const opHex = '0x' + op.toString(16).toUpperCase().padStart(3, '0');

  const push = (text, color) => {
    const t = new Date().toTimeString().slice(0, 8);
    setLog((l) => [{ text: `${t}  ${text}`, color: color || C.dim }, ...l].slice(0, 30));
  };
  const frame = (hx, m, opc) => {
    const crc = (0xa5 + hx.dec + m) % 256;
    return `TX A5 ${opc} ${hx.dec.toString(16).toUpperCase().padStart(2, '0')} 0${m} ${crc.toString(16).toUpperCase().padStart(2, '0')}`;
  };

  const setLine = (i) => {
    if (locked) return push('ERR 0x08 RINGS LOCKED — HOLD TO UNLOCK', C.err);
    const nl = lines.slice();
    nl[i] = nl[i] ? 0 : 1;
    setLines(nl);
    const nh = fromLines(nl);
    push(`DETENT R${i + 1} → ${nl[i] ? 'YANG' : 'YIN'} · H${nh.kw} ${nh.pinyin}`);
  };
  const selectMode = (i) => {
    setMode(i);
    push(`MODE → ${TRI[DIAL[i]].el.toUpperCase()} · LAYER ${TRI[DIAL[i]].layer.toUpperCase()}`);
  };

  const rnd = () => Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 0 : 1));
  const gestures = [
    {
      label: 'TWIST',
      fire: () => {
        const m = (mode + 1) % 8;
        setMode(m);
        push(`TWIST → MODE ${TRI[DIAL[m]].el.toUpperCase()}`);
      },
    },
    {
      label: 'FLIP',
      fire: () => {
        if (locked) return push('ERR 0x08 RINGS LOCKED', C.err);
        const nl = lines.map((v) => (v ? 0 : 1));
        setLines(nl);
        push(`FLIP → H${fromLines(nl).kw}`);
      },
    },
    {
      label: 'SHAKE',
      fire: () => {
        if (locked) return push('ERR 0x08 RINGS LOCKED', C.err);
        const nl = rnd();
        setLines(nl);
        const nh = fromLines(nl);
        push(`SHAKE → RANDOMIZE · H${nh.kw} ${nh.pinyin}`);
      },
    },
    {
      label: 'HOLD',
      fire: () => {
        setLocked((v) => !v);
        push(locked ? 'HOLD → UNLOCKED' : 'HOLD → RINGS LOCKED', C.sys);
      },
    },
  ];
  const press = () => {
    setLedTs(Date.now());
    push(
      `${frame(h, mode, '21')} · ${h.lower.verb}@${activeTri.layer.toUpperCase()} · H${h.kw} ${h.pinyin}`,
      ledColor,
    );
    setTimeout(() => push('RX A5 41 00 ACK · SIG OK · SECURE ELEMENT', C.ack), 450);
  };

  const ringsTopDown = lines.map((v, i) => ({ num: i + 1, yang: v === 1 })).reverse();
  const entries = log.length
    ? log
    : [{ text: '--:--:--  IDLE · AWAITING GESTURE', color: '#56637c' }];

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <style>{`@keyframes ledpulse{0%{opacity:.35}100%{opacity:1}}`}</style>
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs
          items={[{ label: 'Lab', to: '/lab' }, { label: 'Hex Engine Simulator' }]}
          className="mb-4"
        />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">
            Hex Engine <span className="text-ozone">Simulator</span>
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">
            64-state device · live protocol
          </p>
          <div className="ml-auto flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em]">
            <span className="text-silver/40">LED</span>
            {LED_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setLedColor(c)}
                aria-label={`LED ${c}`}
                className={`h-4 w-4 border ${ledColor === c ? 'border-silver' : 'border-slate2'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 01 — HEXAGRAM STACK */}
          <section className="border border-slate2 bg-card p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ozone">
              01 · Hexagram stack
            </div>
            <div className="mt-4 space-y-2">
              {ringsTopDown.map((r) => (
                <button
                  key={r.num}
                  onClick={() => setLine(r.num - 1)}
                  className={`flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors ${locked ? 'border-slate2/50 opacity-70' : 'border-slate2 hover:border-ozone/50'}`}
                >
                  <span className="w-8 font-mono text-[10px] uppercase tracking-widest text-silver/40">
                    R{r.num}
                  </span>
                  <span className="flex flex-1 items-center gap-1.5">
                    {r.yang ? (
                      <span className="h-3 flex-1 bg-ozone" />
                    ) : (
                      <>
                        <span className="h-3 flex-1 bg-silver/25" />
                        <span className="w-3" />
                        <span className="h-3 flex-1 bg-silver/25" />
                      </>
                    )}
                  </span>
                  <span
                    className={`w-16 text-right font-mono text-[10px] uppercase tracking-widest ${r.yang ? 'text-ozone' : 'text-silver/40'}`}
                  >
                    {r.yang ? 'yang 1' : 'yin 0'}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate2 pt-4 font-mono text-[11px]">
              <div>
                <span className="text-silver/40">BINARY</span>{' '}
                <span className="text-silver">{h.binary}</span>
              </div>
              <div>
                <span className="text-silver/40">DEC</span>{' '}
                <span className="text-silver">{h.dec}</span>
              </div>
              <div>
                <span className="text-silver/40">OP</span>{' '}
                <span className="text-silver">{opHex}</span>
              </div>
              <div>
                <span className="text-silver/40">LOCK</span>{' '}
                <span style={{ color: locked ? C.err : C.ack }}>{locked ? 'ON' : 'OFF'}</span>
              </div>
            </div>
          </section>

          {/* 02 — BA GUA CONTEXT */}
          <section className="border border-slate2 bg-card p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ozone">
              02 · Ba Gua context
            </div>
            <div className="relative mx-auto mt-4 h-[300px] w-[300px] max-w-full">
              {DIAL.map((k, i) => {
                const t = TRI[k];
                const ang = ((i * 45 - 90) * Math.PI) / 180;
                const x = 150 + 118 * Math.cos(ang),
                  y = 150 + 118 * Math.sin(ang);
                const active = i === mode;
                return (
                  <button
                    key={k}
                    onClick={() => selectMode(i)}
                    title={`${t.el} · ${t.layer}`}
                    className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center border text-lg"
                    style={{
                      left: x,
                      top: y,
                      borderColor: active ? ledColor : '#33456a',
                      color: active ? ledColor : '#EDFF00',
                      background: '#0c111d',
                      boxShadow: active ? `0 0 18px ${ledColor}66` : 'none',
                    }}
                  >
                    {t.sym}
                  </button>
                );
              })}
              <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border border-slate2 bg-void text-center">
                <span className="text-2xl" style={{ color: ledColor }}>
                  {activeTri.sym}
                </span>
                <span className="mt-1 px-1 font-mono text-[8px] uppercase leading-tight tracking-widest text-silver/60">
                  {activeTri.layer}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {gestures.map((g) => (
                <button
                  key={g.label}
                  onClick={g.fire}
                  className="border border-slate2 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-silver transition-colors hover:border-ozone hover:text-ozone"
                >
                  {g.label}
                </button>
              ))}
            </div>
          </section>

          {/* 03 — STATE READOUT */}
          <section className="flex flex-col border border-slate2 bg-card p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ozone">
              03 · State readout
            </div>
            <div className="mt-3 text-center">
              <div
                className="text-7xl leading-none"
                style={{ color: ledColor, textShadow: `0 0 24px ${ledColor}55` }}
              >
                {h.char}
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver/60">
                Hexagram {h.kw} · {h.pinyin}
              </div>
              <div className="text-lg font-bold">{h.english}</div>
              <div className="mt-1 font-mono text-[11px] text-silver/50">
                <span className="text-ozone">{h.lower.verb}</span> ×{' '}
                <span className="text-ozone">{activeTri.layer}</span>
              </div>
            </div>

            <button
              onClick={press}
              className="mt-4 w-full border-2 border-ozone bg-ozone py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
            >
              Press · Execute
            </button>
            <div className="mt-3 h-2 w-full border border-slate2" key={ledTs}>
              <div
                className="h-full w-full"
                style={{
                  background: ledColor,
                  animation: ledTs ? 'ledpulse .4s ease-in-out 4 alternate' : 'none',
                  opacity: ledTs ? 1 : 0.35,
                }}
              />
            </div>

            <div
              className="mt-4 flex-1 overflow-y-auto border border-slate2 bg-void p-3 font-mono text-[10px] leading-relaxed"
              style={{ maxHeight: 200 }}
            >
              {entries.map((e, i) => (
                <div key={i} style={{ color: e.color }}>
                  {e.text}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
