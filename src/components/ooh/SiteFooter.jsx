import { Crosshair } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandMark from '@/components/ooh/BrandMark';
import BetaTag from '@/components/ooh/BetaTag';
import { useCommandCenter } from '@/lib/commandCenterContext';

export default function SiteFooter() {
  const { openCommand } = useCommandCenter();
  return (
    <footer className="border-t border-white/5 bg-void pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="px-5 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="group inline-block transition-opacity hover:opacity-90"
                aria-label="OOH Earth — home"
              >
                <BrandMark className="h-16 w-16 md:h-20 md:w-20" />
              </Link>
              <BetaTag />
            </div>
            <p className="mt-1 pl-1 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
              OOH Street Art & Adbusting Maps
            </p>
            <p className="mt-4 max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
              An open-source, community-funded app reclaiming the visual commons. Union-made and
              aligned to the UN Sustainable Development Goals — documenting every corporate
              advertising offense on the public record.
            </p>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver/40">
              Channels
            </div>
            <ul className="mt-3 space-y-2 font-mono text-[11px] text-silver/60">
              <li>
                <a
                  href="https://www.instagram.com/oohstreetmaps/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://twitch.tv/oohearth"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Twitch
                </a>
              </li>
              <li>
                <a
                  href="https://zora.co/@oohearth"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Zora
                </a>
              </li>
              <li>
                <a
                  href="https://pump.fun/BwVYGpW3wqe6UZWoLDj4UbxXc94n813MSJcDNePApump"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  $OOHEX · pump.fun
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver/40">
              Union
            </div>
            <ul className="mt-3 space-y-2 font-mono text-[11px] text-silver/60">
              <li>
                <a
                  href="https://advertisersanonymous.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Advertisers Anonymous
                </a>
              </li>
              <li>
                <Link
                  to="/support"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Sponsor / Fund
                </Link>
              </li>
              <li>
                <a
                  href="https://oohearthfoundation.framer.wiki/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Foundation
                </a>
              </li>
              <li>
                <Link
                  to="/about"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-silver/40">
              Site
            </div>
            <ul className="mt-3 space-y-2 font-mono text-[11px] text-silver/60">
              <li>
                <Link
                  to="/map"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Map
                </Link>
              </li>
              <li>
                <Link
                  to="/report"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Report
                </Link>
              </li>
              <li>
                <Link
                  to="/plans"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="inline-block py-1.5 -my-1.5 transition-colors hover:text-ozone"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 md:flex-row md:items-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            © {new Date().getFullYear()} OOH Street Art & Adbusting Maps · Aligned to UN SDGs ·
            Union made · <span className="text-flare/70">AGPL-3.0 · CC BY-SA 4.0</span>
          </span>
          <button
            onClick={openCommand}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-silver/50 transition-colors hover:text-ozone"
          >
            <Crosshair className="h-3.5 w-3.5" /> Open Command Center
          </button>
        </div>
      </div>
    </footer>
  );
}
