import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Crosshair, HandHeart } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import SiteFooter from "@/components/ooh/SiteFooter";
import CommandCenter from "@/components/ooh/CommandCenter";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import ViewfinderCursor from "@/components/ooh/ViewfinderCursor";

const GALLERY = [
  "https://ooh.earth/wp-content/uploads/2024/11/AdidasBillboard30-768x512.jpg",
  "https://ooh.earth/wp-content/uploads/2024/12/signal-2024-02-05-222059_002-768x576.jpeg",
  "https://ooh.earth/wp-content/uploads/2024/11/IMG_2919-768x576.jpg",
  "https://ooh.earth/wp-content/uploads/2024/11/IMG_2899-3-768x576.jpg",
  "https://ooh.earth/wp-content/uploads/2024/11/IMG_2939-768x1024.jpg",
  "https://ooh.earth/wp-content/uploads/2024/11/IMG_1557-768x576.jpg",
  "https://ooh.earth/wp-content/uploads/2024/11/IMG_1555-2-768x1024.jpg",
  "https://ooh.earth/wp-content/uploads/2024/11/IMG_0709-768x576.jpg",
];

export default function About() {
  const [commandOpen, setCommandOpen] = useState(false);
  const openCommand = () => setCommandOpen(true);

  return (
    <div className="relative bg-void">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav onCommand={openCommand} />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[78vh] items-end overflow-hidden">
          <img
            src="https://ooh.earth/wp-content/uploads/2025/01/517shots_so.jpeg"
            alt="OOH field intervention"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />
          <div className="relative px-5 pb-16 md:px-8 md:pb-24">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// About · Out Of Hell™</span>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.04] tracking-[-0.02em] text-silver md:text-6xl">
              A call to reclaim our streets and our skies, our senses and our minds.
            </h1>
            <p className="mt-5 max-w-xl font-display text-sm font-normal leading-[1.4] text-darkgray md:text-base">
              An adbusting platform for Out-of-Home (OOH) advertising. Union-made by subvertisers and advertising-industry war veterans.
            </p>
          </div>
        </section>

        {/* Manifesto */}
        <section id="manifesto" className="border-t border-slate2/40 bg-void">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <div className="mx-auto max-w-3xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 01 — Manifesto for world revolution</span>
              <div className="mt-6 space-y-5 font-display text-lg font-normal leading-[1.5] text-silver/85 md:text-xl md:leading-[1.45]">
                <p>
                  In every corner of our cities, corporate advertising has come to dominate. It commands our streets, our skylines, our public spaces. Billboards, bus stops, digital screens — they scream at us, feeding us a constant stream of messages we never asked for, promising products we don't need, and dictating desires that aren't our own.
                </p>
                <p>
                  But public space should belong to the public. It should reflect the diversity, creativity, and collective values of the people who live there — not the profit motives of corporations. Our streets deserve better than to be tools for corporate gain. And so do we.
                </p>
                <p className="font-bold text-silver">
                  Out of Hell™ is a call to reclaim — our streets and our skies, our senses and our minds. We will not passively accept the corporate vision forced upon us. Together, we will rewrite the rules, creating cities that honor the people who inhabit them — not the corporations who seek to monetize them.
                </p>
                <p>
                  It's time for a new vision of public space: one free from corporate interests, and full of the people's voices.
                </p>
                <p className="font-bold text-ozone">Join us. Stand with us. Build with us.</p>
              </div>
              <div className="mt-8 border-t border-slate2/40 pt-6">
                <p className="font-display text-base font-bold tracking-[-0.01em] text-silver">Out of Hell™</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">For Cities That Belong to People</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stat */}
        <section className="border-t border-slate2/40 bg-card">
          <div className="px-5 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-4xl text-center">
              <div className="font-display text-6xl font-black leading-none tracking-[-0.03em] text-ozone md:text-8xl">2%</div>
              <p className="mt-4 font-display text-lg font-medium leading-[1.3] text-silver md:text-2xl">
                only 2% of OOH ads are being challenged.
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">We exist to close the gap.</p>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="border-t border-slate2/40 bg-void">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <div className="flex items-end justify-between border-b border-slate2/40 pb-6">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 02 — Field evidence</span>
                <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-6xl">The record</h2>
              </div>
              <Link to="/map" className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-silver/60 hover:text-ozone sm:flex">
                Open map <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-px border border-slate2/40 bg-slate2/40 sm:grid-cols-3 lg:grid-cols-4">
              {GALLERY.map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden bg-void">
                  <img src={src} alt={`OOH field intervention ${i + 1}`} className="h-full w-full object-cover transition-opacity hover:opacity-80" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Join / Fund */}
        <section className="border-t border-slate2/40 bg-void">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <div className="mx-auto max-w-3xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 03 — Join the movement</span>
              <h2 className="mt-3 font-display text-5xl font-bold leading-[1.04] tracking-[-0.02em] text-silver md:text-7xl">
                Fund the<br />resistance
              </h2>
              <p className="mt-4 max-w-md font-display text-sm font-normal leading-[1.4] text-darkgray">
                By funding Out of Hell™, you support a platform that fights corporate overreach, backs grassroots artists, and inspires real change in public spaces. Target: $10,000 for growth, platform development, and community outreach.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://donorbox.org/ooh"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-ozone px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare"
                >
                  <HandHeart className="h-4 w-4" /> Donate
                </a>
                <Link
                  to="/support"
                  className="inline-flex items-center gap-2 border border-slate2 px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
                >
                  See plans <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter onCommand={openCommand} />
      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}