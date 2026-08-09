import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import useSoundscape from "@/hooks/useSoundscape";
import { MapPin, Hand, Monitor, Coins, UserPlus, BadgeCheck, Radio } from "lucide-react";

const TYPES = {
  report: { icon: MapPin, label: "Offense logged", color: "text-ozone", dot: "rgb(var(--c-ozone))" },
  claim: { icon: Hand, label: "Lead adopted", color: "text-flare", dot: "#FF5C00" },
  bust: { icon: Monitor, label: "Digital bust", color: "text-flare", dot: "#FF5C00" },
  donate: { icon: Coins, label: "Treasury inflow", color: "text-[#39FF14]", dot: "#39FF14" },
  operative: { icon: UserPlus, label: "Member onboard", color: "text-[#1F51FF]", dot: "#1F51FF" },
  verify: { icon: BadgeCheck, label: "Site verified", color: "text-ozone", dot: "rgb(var(--c-ozone))" },
};

const CITIES = ["Bangkok", "São Paulo", "London", "Manila", "Jakarta", "Lagos", "Berlin", "Mexico City", "Mumbai", "Athens", "Seoul", "Cairo"];
const HANDLES = ["ghostsignal", "neonghost", "subvert", "kilowatt", "nightpaste", "voidwalk", "spraycan", "meridian", "static", "fuse"];
const OFFENSES = ["Billboard · 48-sheet", "Digital screen · transit", "Painted takeover", "Projection · night raid", "Sticker bomb cluster", "Mural · side wall", "Bus flank · 2-sheet"];
const BUSTS = ["Metaverse billboard hijack", "Banner ad overlay", "Sponsored post counter", "Pre-roll replace", "AR lens flip"];
const CRYPTO = ["0.05 ETH", "2.1 SOL", "0.001 BTC", "75 USDC"];

function synth() {
  const r = Math.random();
  if (r < 0.32) return { type: "report", title: OFFENSES[Math.floor(Math.random() * OFFENSES.length)], meta: CITIES[Math.floor(Math.random() * CITIES.length)] };
  if (r < 0.5) return { type: "claim", title: "Adopted landmark for intervention", meta: "@" + HANDLES[Math.floor(Math.random() * HANDLES.length)] };
  if (r < 0.66) return { type: "bust", title: BUSTS[Math.floor(Math.random() * BUSTS.length)], meta: CITIES[Math.floor(Math.random() * CITIES.length)] };
  if (r < 0.8) return { type: "donate", title: CRYPTO[Math.floor(Math.random() * CRYPTO.length)] + " received", meta: "treasury · public record" };
  if (r < 0.93) return { type: "operative", title: "New member registered", meta: "@" + HANDLES[Math.floor(Math.random() * HANDLES.length)] + " · " + CITIES[Math.floor(Math.random() * CITIES.length)] };
  return { type: "verify", title: "Photo evidence confirmed", meta: CITIES[Math.floor(Math.random() * CITIES.length)] };
}

const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

export default function LiveActivityFeed() {
  const [events, setEvents] = useState([]);
  const timers = useRef(new Map());
  const { blip } = useSoundscape();

  const push = (ev) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item = { id, ts: stamp(), ...ev };
    // haptic-click algorithmic tick — makes each live popup feel tactile/alive
    blip(1180, 0.028, "square", 0.022);
    setTimeout(() => blip(820, 0.04, "triangle", 0.014), 55);
    setEvents((cur) => [item, ...cur].slice(0, 5));
    const t = setTimeout(() => {
      setEvents((cur) => cur.filter((e) => e.id !== id));
      timers.current.delete(id);
    }, 7000);
    timers.current.set(id, t);
  };

  useEffect(() => {
    const pushSynth = () => push(synth());
    pushSynth();
    const id = setInterval(pushSynth, 5500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const subs = [
      base44.entities.Location.subscribe((e) => { if (e.type === "create") push({ type: "report", title: e.data?.title || "Offense logged", meta: e.data?.address || "field report" }); }),
      base44.entities.DigitalBust.subscribe((e) => { if (e.type === "create") push({ type: "bust", title: e.data?.platform_name || "Digital bust", meta: e.data?.region || "metaverse" }); }),
      base44.entities.LeadClaim.subscribe((e) => { if (e.type === "create") push({ type: "claim", title: "Adopted landmark", meta: "@" + (e.data?.operative_handle || "operative") }); }),
      base44.entities.FundingLead.subscribe((e) => { if (e.type === "create") push({ type: "donate", title: "Pledge logged", meta: e.data?.channel || "lead" }); }),
    ];
    return () => subs.forEach((u) => u && u());
  }, []);

  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); timers.current.clear(); }, []);

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[80] hidden w-[300px] max-w-[calc(100vw-24px)] flex-col gap-2 md:flex">
      <div className="flex items-center gap-2 px-1">
        <Radio className="h-3 w-3 animate-flicker text-ozone" />
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-silver/70">Live feed</span>
        <span className="h-px flex-1 bg-slate2/50" />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">ON AIR</span>
      </div>
      <AnimatePresence initial={false}>
        {events.map((ev) => {
          const t = TYPES[ev.type];
          const Icon = t.icon;
          return (
            <motion.div
              key={ev.id}
              layout
              initial={{ opacity: 0, x: -40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="pointer-events-auto flex items-start gap-3 border border-slate2/70 bg-void/90 p-3 backdrop-blur-md"
            >
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: t.dot, boxShadow: `0 0 8px ${t.dot}` }} />
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${t.color}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${t.color}`}>{t.label}</span>
                  <span className="font-mono text-[8px] tabular text-dim/70">{ev.ts}</span>
                </div>
                <div className="mt-0.5 truncate font-display text-[12px] font-semibold leading-tight text-silver">{ev.title}</div>
                <div className="truncate font-mono text-[9px] text-darkgray">{ev.meta}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}