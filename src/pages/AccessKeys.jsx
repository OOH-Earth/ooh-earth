import { Link } from "react-router-dom";
import { Key, ArrowLeft } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import MobileHeader from "@/components/ooh/MobileHeader";
import KeyGlyph from "@/components/ooh/KeyGlyph";
import { ACCESS_KEY_ORDER, keyDetail } from "@/components/ooh/access/accessKeyDetails";

export default function AccessKeys() {
  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <MobileHeader to="/bus-stops" label="Bus stops" />
      <main className="page-top mx-auto max-w-5xl px-5 pb-24">
        <Breadcrumbs items={[{ label: "Bus Stops", to: "/bus-stops" }, { label: "Access Keys" }]} className="mb-4" />
        <Link to="/bus-stops" className="mb-6 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone lg:inline-flex">
          <ArrowLeft className="h-3.5 w-3.5" /> Bus-stop directory
        </Link>

        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// open-access key registry</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">Access keys</h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-darkgray">
          Keys unlock. Advertising units are illegal — we've got the keys to claim back our public space. The standard
          tools that open transit-shelter and ad-space housings, each with a map of the bus-stop locations it likely fits.
          <span className="text-flare"> Keys are unconfirmed until a field check.</span>
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {ACCESS_KEY_ORDER.map((slug) => {
            const k = keyDetail(slug);
            return (
              <Link
                key={slug}
                to={`/access-keys/${slug}`}
                className="group flex items-start gap-3 border border-slate2/60 bg-card p-4 transition-colors hover:border-ozone/60 hover:bg-slate2/10"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-slate2 text-ozone transition-colors group-hover:border-ozone">
                  <KeyGlyph slug={slug} className="h-7 w-7" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-[15px] font-semibold tracking-[-0.01em] text-silver transition-colors group-hover:text-ozone">{k.label}</span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/50">{slug}</span>
                  </span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-darkgray">{k.blurb}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-6 font-mono text-[10px] leading-relaxed text-dim">// key types beyond this set exist and can be added to the collection — the illustrated field guide covers the most common open-access tools.</p>
      </main>
    </div>
  );
}