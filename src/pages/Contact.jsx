import { Mail, ArrowUpRight } from 'lucide-react';
import Nav from '@/components/ooh/Nav';
import SiteFooter from '@/components/ooh/SiteFooter';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import ViewfinderCursor from '@/components/ooh/ViewfinderCursor';
import OrbitalField from '@/components/ooh/contact/OrbitalField';

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
                Get in touch
              </h1>
              <p className="mt-5 max-w-xl font-display text-sm font-normal leading-[1.5] text-darkgray md:text-base">
                Email is our only contact channel.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-slate2/40 bg-card">
          <div className="px-5 py-10 md:px-8 md:py-14">
            <div className="mx-auto max-w-3xl space-y-8">
              <a
                href="mailto:hello@ooh.earth"
                className="group flex min-h-14 items-center gap-3 border border-ozone/50 px-5 py-4 transition-colors hover:border-ozone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ozone"
              >
                <Mail className="h-5 w-5 shrink-0 text-ozone" aria-hidden="true" />
                <span className="break-all font-display text-base font-bold text-silver md:text-lg">
                  hello@ooh.earth
                </span>
                <ArrowUpRight
                  className="ml-auto h-4 w-4 shrink-0 text-silver/40 transition-colors group-hover:text-ozone"
                  aria-hidden="true"
                />
              </a>
              <OrbitalField />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
