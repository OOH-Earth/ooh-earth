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