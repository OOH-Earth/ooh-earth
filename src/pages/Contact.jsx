import { Link } from 'react-router-dom';
import { Mail, Send, ArrowUpRight, Instagram, Twitch, Radio, Crosshair } from 'lucide-react';
import Nav from '@/components/ooh/Nav';
import SiteFooter from '@/components/ooh/SiteFooter';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import ViewfinderCursor from '@/components/ooh/ViewfinderCursor';

const SOCIALS = [
  {
    label: 'Instagram',
    handle: '@oohstreetmaps',
    href: 'https://www.instagram.com/oohstreetmaps/',
    Icon: Instagram,
  },
  { label: 'Twitch', handle: 'oohearth', href: 'https://twitch.tv/oohearth', Icon: Twitch },
  { label: 'Zora', handle: '@oohearth', href: 'https://zora.co/@oohearth', Icon: Radio },
];

export default function Contact() {
  return (
    <div className="relative bg-void">
      <ViewfinderCursor />
      <HorizonProgress />
      <Nav />

      <main className="page-top">
        <section className="border-b border-slate2/40 bg-void">
          <div className="px-5 py-16 md:px-8 md:py-24">
            <div className="mx-auto max-w-3xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                // Contact
              </span>
              <h1 className="mt-3 font-display text-4xl font-bold leading-[1.04] tracking-[-0.02em] text-silver md:text-6xl">
                Get in touch with the movement
              </h1>
              <p className="mt-5 max-w-xl font-display text-sm font-normal leading-[1.5] text-darkgray md:text-base">
                Reach out to join, collaborate, report a billboard, or support the work. We read
                every message — union-made, community-funded.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-slate2/40 bg-card">
          <div className="px-5 py-12 md:px-8 md:py-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-2xl font-bold tracking-[-0.01em] text-silver md:text-3xl">
                Direct channels
              </h2>
              <div className="mt-6 grid gap-px border border-slate2/40 bg-slate2/40 sm:grid-cols-3">
                {SOCIALS.map(({ label, handle, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col gap-2 bg-void p-5 transition-colors hover:bg-void/60"
                  >
                    <Icon className="h-5 w-5 text-ozone" />
                    <span className="font-display text-sm font-bold uppercase tracking-wide text-silver">
                      {label}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.1em] text-darkgray">
                      {handle}
                    </span>
                  </a>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <a
                  href="mailto:hello@ooh.earth"
                  className="flex items-center gap-3 border border-slate2/50 px-5 py-4 transition-colors hover:border-ozone"
                >
                  <Mail className="h-5 w-5 text-ozone" />
                  <span className="font-display text-sm font-bold text-silver">
                    hello@ooh.earth
                  </span>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-silver/40 transition-colors group-hover:text-ozone" />
                </a>

                <Link
                  to="/support"
                  className="flex items-center gap-3 border border-slate2/50 px-5 py-4 transition-colors hover:border-ozone"
                >
                  <Send className="h-5 w-5 text-ozone" />
                  <span className="font-display text-sm font-bold text-silver">
                    Send a support message
                  </span>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-silver/40" />
                </Link>

                <Link
                  to="/report"
                  className="flex items-center gap-3 border border-slate2/50 px-5 py-4 transition-colors hover:border-ozone"
                >
                  <Crosshair className="h-5 w-5 text-ozone" />
                  <span className="font-display text-sm font-bold text-silver">
                    Report a billboard or adbust
                  </span>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-silver/40" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
