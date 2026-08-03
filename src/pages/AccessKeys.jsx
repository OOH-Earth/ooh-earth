import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Key, ArrowLeft, Globe } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import MobileHeader from "@/components/ooh/MobileHeader";
import { ACCESS_KEY_ORDER, keyDetail, ALL_COUNTRIES } from "@/components/ooh/access/accessKeyDetails";
import AccessKeyIcon from "@/components/ooh/access/AccessKeyIcon";

export default function AccessKeys() {
  const [country, setCountry] = useState("All");
  const keys = useMemo(() => ACCESS_KEY_ORDER.map(keyDetail), []);
  const list = country === "All" ? keys : keys.filter((k) => (k.countries || []).includes(country));

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
          tools that open transit-shelter and ad-space housings worldwide, each with a map of the bus-stop locations it
          likely fits.
          <span className="text-flare"> Keys are unconfirmed until a field check.</span>
        </p>

        {/* Country filter */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
            <Globe className="h-3.5 w-3.5" /> country
          </span>
          {["All", ...ALL_COUNTRIES].map((c) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
                country === c
                  ? "border-ozone bg-ozone text-void"
                  : "border-slate2 text-darkgray hover:border-ozone/60 hover:text-ozone"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {list.map((k) => (
            <Link
              key={k.slug}
              to={`/access-keys/${k.slug}`}
              className="group flex items-start gap-3 border border-slate2/60 bg-card p-4 transition-colors hover:border-ozone/60 hover:bg-slate2/10"
            >
              <AccessKeyIcon slug={k.slug} iconSvg={k.iconSvg} chipClassName="h-12 w-12 shrink-0 border border-slate2" className="h-9 w-9" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-[15px] font-semibold tracking-[-0.01em] text-silver transition-colors group-hover:text-ozone">{k.label}</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/50">{k.slug}</span>
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-darkgray">{k.blurb}</span>
                {(k.countries || []).length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1">
                    {k.countries.map((c) => (
                      <span key={c} className="border border-slate2/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-dim/70">{c}</span>
                    ))}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>

        {list.length === 0 && (
          <p className="mt-8 font-mono text-[11px] text-dim">// no keys documented for {country} yet — log a field check to add the first.</p>
        )}
        <p className="mt-6 font-mono text-[10px] leading-relaxed text-dim">// more key types exist worldwide and can be added to the collection as field data comes in.</p>
      </main>
    </div>
  );
}