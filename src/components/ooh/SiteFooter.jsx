import { Crosshair } from "lucide-react";

export default function SiteFooter({ onCommand }) {
  return (
    <footer className="border-t border-white/5 bg-void">
      <div className="px-5 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="font-display text-3xl font-black uppercase tracking-tight text-silver md:text-5xl">
              OOH<span className="text-ozone">.</span>EARTH
            </div>
            <p className="mt-4 max-w-sm font-mono text-[11px] leading-relaxed text-silver/50">
              Community-funded infrastructure for documenting the visual world and coordinating creative resistance. Corporate advertising has stolen our cities. We're mapping every crime.
            </p>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver/40">Channels</div>
            <ul className="mt-3 space-y-2 font-mono text-[11px] text-silver/60">
              <li><a href="https://www.instagram.com/oohstreetmaps/" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">Instagram</a></li>
              <li><a href="https://twitch.tv/oohearth" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">Twitch</a></li>
              <li><a href="https://zora.co/@oohearth" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">Zora</a></li>
              <li><a href="https://opensea.io/collection/oohex" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">OOHEX</a></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver/40">Union</div>
            <ul className="mt-3 space-y-2 font-mono text-[11px] text-silver/60">
              <li><a href="https://advertisersanonymous.org/" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">Advertisers Anonymous</a></li>
              <li><a href="https://donorbox.org/ooh" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">Sponsor / Fund</a></li>
              <li><a href="https://oohearthfoundation.framer.wiki/" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">Foundation</a></li>
              <li><a href="https://ooh.earth/about" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">About</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 md:flex-row md:items-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-silver/40">© {new Date().getFullYear()} OOH Earth · Orbital Perspective</span>
          <button onClick={onCommand} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-silver/50 transition-colors hover:text-ozone">
            <Crosshair className="h-3.5 w-3.5" /> Open Command Center
          </button>
        </div>
      </div>
    </footer>
  );
}