import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Key, ShoppingBag, Wrench, HelpCircle, BusFront, Globe } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import MobileHeader from "@/components/ooh/MobileHeader";
import KeyGlyph from "@/components/ooh/KeyGlyph";
import { Image } from "@/components/ui/image";
import { ACCESS_KEYS } from "@/components/ooh/accessKeys";
import { keyDetail, stopsForKey, ACCESS_KEY_ORDER } from "@/components/ooh/access/accessKeyDetails";
import AccessKeyIcon from "@/components/ooh/access/AccessKeyIcon";
import AccessKeyMap from "@/components/ooh/access/AccessKeyMap";

export default function AccessKeyDetail() {
  const { slug } = useParams();
  const k = keyDetail(slug);

  if (!ACCESS_KEYS[slug]) {
    return (
      <div className="min-h-screen bg-void text-silver">
        <Nav />
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">// signal lost</p>
          <h1 className="mt-3 font-display text-2xl font-bold">Key not found</h1>
          <Link to="/access-keys" className="mt-6 inline-flex items-center gap-2 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone">
            <ArrowLeft className="h-3.5 w-3.5" /> Access keys
          </Link>
        </div>
      </div>
    );
  }

  const stops = stopsForKey(slug);
  const probable = stops.length > 0;
  const idx = ACCESS_KEY_ORDER.indexOf(slug);
  const next = ACCESS_KEY_ORDER[(idx + 1) % ACCESS_KEY_ORDER.length];
  const prev = ACCESS_KEY_ORDER[(idx - 1 + ACCESS_KEY_ORDER.length) % ACCESS_KEY_ORDER.length];
  const lookSvg = k.lookImage && k.lookImage.endsWith(".svg");

  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <MobileHeader to="/access-keys" label="Access keys" />
      <main className="page-top mx-auto max-w-6xl px-5 pb-24">
        <Breadcrumbs items={[{ label: "Access Keys", to: "/access-keys" }, { label: k.label }]} className="mb-4" />
        <Link to="/access-keys" className="mb-6 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone lg:inline-flex">
          <ArrowLeft className="h-3.5 w-3.5" /> Access keys
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Left · map + locations */}
          <div className="flex flex-col gap-4">
            <div className="border border-slate2/60" style={{ height: "clamp(280px, 48dvh, 460px)" }}>
              {stops.length ? (
                <AccessKeyMap stops={stops} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <HelpCircle className="h-6 w-6 text-dim/50" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">No locations added for this page</p>
                  <p className="max-w-xs text-[11px] leading-relaxed text-dim/70">No bus stops confirmed with this key yet. Log a field check to add the first.</p>
                </div>
              )}
            </div>

            <div className="border border-slate2/60 p-4">
              <div className="mb-3 flex items-center gap-2">
                <BusFront className="h-3.5 w-3.5 text-ozone" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// works at these locations</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/50">{stops.length}</span>
                <span className="h-px flex-1 bg-slate2/40" />
              </div>
              {stops.length ? (
                <>
                  {probable && (
                    <p className="mb-2 font-mono text-[10px] leading-relaxed text-flare/90">// probable match — london shelters are typically JCDecaux / Clear Channel; key unconfirmed until a field check.</p>
                  )}
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <ul className="grid gap-1.5">
                      {stops.map((s) => (
                        <li key={s.id}>
                          <Link to={`/bus-stop/${s.id}`} className="group flex items-center gap-3 border border-slate2/40 px-3 py-2 transition-colors hover:border-ozone/60 hover:bg-slate2/10">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-flare" title="probable" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-display text-[13px] font-medium text-silver transition-colors group-hover:text-ozone">{s.name}</span>
                              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">{s.facing} · bus shelter</span>
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/50 transition-colors group-hover:text-ozone">↗</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 py-6 font-mono text-[11px] uppercase tracking-[0.2em] text-dim/70">
                  <HelpCircle className="h-4 w-4" /> No locations added for this page
                </div>
              )}
            </div>
          </div>

          {/* Right · key detail card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-slate2/60 bg-card p-6">
              <div className="flex justify-center">
                <AccessKeyIcon slug={slug} iconSvg={k.iconSvg} chipClassName="h-16 w-16 border border-ozone/40" className="h-11 w-11" />
              </div>

              <div className="mt-5">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/80">// about</span>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.02em] text-silver">{k.label}</h1>
                <p className="mt-2 text-[13px] leading-relaxed text-darkgray">{k.about || k.blurb}</p>
                {(k.countries || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] text-dim/70">
                      <Globe className="h-3 w-3" /> used in
                    </span>
                    {k.countries.map((c) => (
                      <span key={c} className="border border-slate2/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-silver/70">{c}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate2/40 pt-5">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/80">// how does it look?</span>
                <div className="mt-3 relative aspect-[4/3] overflow-hidden border border-slate2/60 bg-brand-smoke">
                  {k.lookImage ? (
                    lookSvg ? (
                      <img src={k.lookImage} alt={`${k.label} key`} className="h-full w-full object-contain p-3" />
                    ) : (
                      <Image src={k.lookImage} alt={`${k.label} key`} className="h-full w-full" fittingType="fit" />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <KeyGlyph slug={slug} className="h-20 w-20 text-black" />
                    </div>
                  )}
                  <span className="pointer-events-none absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center border border-slate2 bg-brand-smoke/90">
                    {k.iconSvg ? <img src={k.iconSvg} alt="" className="h-5 w-5 object-contain" /> : <KeyGlyph slug={slug} className="h-5 w-5 text-black" />}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-slate2/40 pt-5">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/80">// what is it made out of?</span>
                <div className="mt-2 flex items-center gap-2 text-silver">
                  <Wrench className="h-4 w-4 text-darkgray" />
                  <span className="font-display text-[14px] font-medium">{k.material || "Aluminium"}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-slate2/40 pt-5">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/80">// where to get</span>
                {k.buyUrl ? (
                  <a href={k.buyUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex w-full items-center justify-center gap-2 border border-slate2 bg-transparent px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:bg-ozone hover:text-void">
                    <ShoppingBag className="h-3.5 w-3.5" /> Buy {k.label} key
                  </a>
                ) : (
                  <p className="mt-2 font-mono text-[10px] text-dim">// no supplier linked yet</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
              <Link to={`/access-keys/${prev}`} className="transition-colors hover:text-ozone">← {ACCESS_KEYS[prev]?.label}</Link>
              <Link to={`/access-keys/${next}`} className="transition-colors hover:text-ozone">{ACCESS_KEYS[next]?.label} →</Link>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link to="/report" className="inline-flex items-center gap-2 border border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare">
            <Key className="h-3.5 w-3.5" /> Log a field check
          </Link>
        </div>
      </main>
    </div>
  );
}