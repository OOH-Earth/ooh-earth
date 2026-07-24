import { useCallback, useEffect, useState } from "react";

const KEY = "ooh_sound_enabled";

// ---- module-level audio engine (single AudioContext) ----
let ctx = null;
let master = null;
let started = false;
const listeners = new Set();

// read-aloud (screen-reader style) — independent of the ambient sound toggle
const KEY2 = "ooh_readaloud_enabled";
const readListeners = new Set();
function readReadAloud() {
  try { return localStorage.getItem(KEY2) === "1"; } catch { return false; }
}
function emitReadAloud(v) { readListeners.forEach((fn) => fn(v)); }

function reduced() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
function readEnabled() {
  try { const v = localStorage.getItem(KEY); return v === null ? true : v === "1"; }
  catch { return true; }
}
function emit(v) { listeners.forEach((fn) => fn(v)); }

// audio-focus: when the TV channel is playing, duck the ambient drone + mute
// subvocal speech so the two signals never cross.
let tvFocus = false;
function applyTvFocus(v) {
  tvFocus = v;
  if (v) {
    try { window.speechSynthesis?.cancel(); } catch {}
    if (master && ctx) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 0.4);
    }
  } else if (readEnabled() && !reduced()) {
    engineStart();
  }
}

function ensureEngine() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.016;
  droneGain.connect(master);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 430;
  filter.Q.value = 0.7;
  filter.connect(droneGain);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 170;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 55; o1.connect(filter); o1.start();
  const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = 55.3; o2.connect(filter); o2.start();
  const o3 = ctx.createOscillator(); o3.type = "sine"; o3.frequency.value = 110;
  const o3g = ctx.createGain(); o3g.gain.value = 0.5; o3.connect(o3g); o3g.connect(filter); o3.start();
  return ctx;
}
function engineStart() {
  const c = ensureEngine();
  if (!c || !master) return;
  if (c.state === "suspended") c.resume();
  if (started) return;
  started = true;
  const t = c.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0.4, t + 2.5);
}
function engineStop() {
  if (!ctx || !master) return;
  started = false;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0, t + 0.6);
}
function engineBlip(freq = 660, dur = 0.12, type = "sine", vol = 0.06) {
  if (!ctx || !master || ctx.state !== "running") return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq; g.gain.value = 0;
  o.connect(g); g.connect(master);
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}

export function isSoundSupported() {
  return typeof window !== "undefined" && (!!window.AudioContext || !!window.webkitAudioContext);
}
export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// pick a female-sounding system voice (cached; refreshed on voiceschanged)
let femaleVoice = null;
function ensureFemaleVoice() {
  if (femaleVoice) return femaleVoice;
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const voices = synth.getVoices() || [];
  femaleVoice =
    voices.find((v) => /female/i.test(v.name)) ||
    voices.find((v) => /samantha|zira|karen|tessa|fiona|victoria|moira|serena|allison|ava|susan|kate|google uk english female|google us english/i.test(v.name)) ||
    voices.find((v) => /en-/i.test(v.lang)) ||
    null;
  return femaleVoice;
}

export default function useSoundscape() {
  const [enabled, setEnabled] = useState(readEnabled);

  useEffect(() => {
    const fn = (v) => setEnabled(v);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  // start on first user gesture (browsers block autoplay)
  useEffect(() => {
    if (reduced()) return;
    const onG = () => { if (readEnabled()) engineStart(); };
    window.addEventListener("pointerdown", onG, { once: true, passive: true });
    window.addEventListener("keydown", onG, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onG);
      window.removeEventListener("keydown", onG);
    };
  }, []);

  const set = useCallback((v) => {
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch {}
    emit(v);
    if (v) engineStart(); else engineStop();
  }, []);

  const toggle = useCallback(() => set(!readEnabled()), [set]);

  const blip = useCallback((f, d, t, v) => {
    if (!readEnabled() || reduced() || tvFocus) return;
    engineBlip(f, d, t, v);
  }, []);

  const speak = useCallback((text) => {
    if (tvFocus || !readReadAloud() || reduced() || !text || !isSpeechSupported()) return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = ensureFemaleVoice();
      if (v) u.voice = v;
      u.volume = 0.16; u.rate = 0.84; u.pitch = 0.92;
      synth.speak(u);
    } catch {}
  }, []);

  // refresh female voice cache when the engine loads its voice list
  useEffect(() => {
    if (!isSpeechSupported()) return;
    const refresh = () => { femaleVoice = null; ensureFemaleVoice(); };
    window.speechSynthesis.addEventListener?.("voiceschanged", refresh);
    refresh();
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", refresh);
  }, []);

  // read-aloud: forced speech (bypasses ambient toggle), female voice, a touch louder
  const [readAloud, setReadAloud] = useState(readReadAloud);
  useEffect(() => {
    const fn = (v) => setReadAloud(v);
    readListeners.add(fn);
    return () => { readListeners.delete(fn); };
  }, []);
  const toggleReadAloud = useCallback(() => {
    const next = !readReadAloud();
    try { localStorage.setItem(KEY2, next ? "1" : "0"); } catch {}
    emitReadAloud(next);
    if (!next) { try { window.speechSynthesis?.cancel(); } catch {} }
  }, []);
  const speakForced = useCallback((text) => {
    if (tvFocus || !text || !isSpeechSupported()) return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = ensureFemaleVoice();
      if (v) u.voice = v;
      u.volume = 0.55; u.rate = 0.9; u.pitch = 0.92;
      synth.speak(u);
    } catch {}
  }, []);

  const setTvFocus = useCallback((v) => applyTvFocus(v), []);

  return {
    enabled, toggle, blip, speak,
    speakForced, readAloud, toggleReadAloud,
    setTvFocus,
    supported: isSoundSupported(),
    speechSupported: isSpeechSupported(),
  };
}