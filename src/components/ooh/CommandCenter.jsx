import { useEffect } from "react";
import { X, ArrowUpRight } from "lucide-react";

const GROUPS = [
  {
    label: "Get Started",
    links: [
      { name: "Sign up for Early Access", desc: "Join the global mapping platform.", href: "http://ooh.earth/", priority: true },
      { name: "About OOH Street Maps", desc: "The mission, the union, the method.", href: "https://ooh.earth/about" },
      { name: "@advertisersanonymous", desc: "Operative profile & field log.", href: "https://ooh.earth/profile/advertisersanonymous" },
    ],
  },
  {
    label: "Adbusting City Maps",
    links: [
      { name: "Bangkok", desc: "🗺️📍 Active intervention map.", href: "https://ooh.earth/area/bangkok", priority: true },
      { name: "London", desc: "🗺️📍 Active intervention map.", href: "https://ooh.earth/area/london", priority: true },
    ],
  },
  {
    label: "Follow",
    links: [
      { name: "Instagram @ooh.earth", desc: "Field photography & live updates.", href: "https://www.instagram.com/oohstreetmaps/" },
      { name: "oohearth on Zora", desc: "On-chain creative resistance.", href: "https://zora.co/@oohearth" },
    ],
  },
  {
    label: "Broadcast",
    links: [
      { name: "Twitch · oohearth", desc: "Live broadcast from the field.", href: "https://twitch.tv/oohearth", priority: true },
      { name: "Real Roots Radio", desc: "Reggae · Dub · Ska · Roots 24/7.", href: "https://realrootsradio.net/" },
    ],
  },
  {
    label: "Union",
    links: [
      { name: "Advertisers Anonymous", desc: "Detoxifying corporate propaganda.", href: "https://advertisersanonymous.org/" },
      { name: "Sponsors / Funding", desc: "Community-funded infrastructure.", href: "https://donorbox.org/ooh", priority: true },
    ],
  },
  {
    label: "Design Ops",
    links: [
      { name: "OOH Earth Field Card", desc: "ID + access + location tagging.", href: "https://supercard.framer.ai/" },
      { name: "Foundation [ BASE ]", desc: "The nonprofit core.", href: "https://oohearthfoundation.framer.wiki/" },
      { name: "OOH Earth [ START ]", desc: "Adbusting & street art maps.", href: "https://oohearth.framer.ai/" },
      { name: '"Anti-Social" Adbusting Network', desc: "The social resistance layer.", href: "https://streetsocial.framer.ai/" },
      { name: "OOHEX Meme Coin · OpenSea", desc: "$OUTOFHELL funds the network.", href: "https://opensea.io/collection/oohex" },
      { name: "UPC Scanner · #TrueCost", desc: "Demo: scan the real cost.", href: "https://upc.framer.ai/" },
    ],
  },
];

export default function CommandCenter({ open, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-void/80 backdrop-blur-xl" onClick={onClose} />

      <div className={`absolute inset-y-0 right-0 flex w-full flex-col border-l border-ozone/20 bg-void shadow-2xl transition-transform duration-500 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Tactical Overlay</span>
            <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-silver">Command Center</h2>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center border border-white/10 text-silver/60 transition-colors hover:border-flare hover:text-flare">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="atlas-track flex-1 overflow-y-auto px-6 py-6">
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-8">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver/40">{g.label}</span>
                <span className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid gap-px sm:grid-cols-2">
                {g.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor="view"
                    className={`group relative flex items-start justify-between gap-3 border p-4 transition-colors ${
                      l.priority
                        ? "border-ozone/30 bg-ozone/[0.04] hover:bg-ozone/10"
                        : "border-white/5 bg-card hover:border-white/15"
                    }`}
                  >
                    <div>
                      <div className={`font-display text-base font-bold uppercase tracking-tight ${l.priority ? "text-ozone" : "text-silver"}`}>{l.name}</div>
                      <div className="mt-1 font-mono text-[10px] leading-relaxed text-silver/45">{l.desc}</div>
                    </div>
                    <ArrowUpRight className={`mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${l.priority ? "text-ozone" : "text-silver/30"}`} />
                  </a>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/30">
            17 channels · All systems routed through the OOH Earth ecosystem
          </p>
        </div>
      </div>
    </div>
  );
}