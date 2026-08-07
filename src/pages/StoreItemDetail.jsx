import { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Download, ShoppingBag, ExternalLink, Lock, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import { CAT_META, priceLabel, ProductPreview } from "@/components/ooh/store/catalog";
import { downloadItemPdf } from "@/components/ooh/store/downloadPdf";
import { useSeo } from "@/lib/seoContext";

const inIframe = typeof window !== "undefined" && window.self !== window.top;

const MD_COMPONENTS = {
  h2: (p) => <h2 className="mt-6 mb-2 font-display text-lg font-bold tracking-[-0.01em] text-silver" {...p} />,
  h3: (p) => <h3 className="mt-5 mb-1.5 font-display text-base font-bold text-silver" {...p} />,
  p: (p) => <p className="text-darkgray leading-[1.7]" {...p} />,
  ul: (p) => <ul className="list-disc space-y-1 pl-5 text-darkgray" {...p} />,
  ol: (p) => <ol className="list-decimal space-y-1 pl-5 text-darkgray" {...p} />,
  li: (p) => <li className="leading-[1.6]" {...p} />,
  strong: (p) => <strong className="font-bold text-silver" {...p} />,
  a: (p) => <a className="text-ozone underline underline-offset-2" target="_blank" rel="noreferrer" {...p} />,
  blockquote: (p) => <blockquote className="border-l-2 border-ozone/60 pl-4 text-darkgray italic" {...p} />,
};

export default function StoreItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);       // metadata: null=loading, false=not found
  const [gate, setGate] = useState({ loading: true }); // deliverable gate
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadContent = async () => {
    setGate({ loading: true });
    try {
      const res = await base44.functions.invoke("getStoreContent", { item_id: id });
      const d = res?.data ?? res;
      setGate({ loading: false, owned: !!d?.owned, free: !!d?.free, locked: !!d?.locked, content: d?.content || "", file_url: d?.file_url || "", reason: d?.reason });
    } catch { setGate({ loading: false, locked: true }); }
  };

  useEffect(() => {
    let cancelled = false;
    setItem(null); setGate({ loading: true });
    (async () => {
      try {
        const res = await base44.functions.invoke("storeCatalog", { item_id: id });
        const d = res?.data ?? res;
        if (cancelled) return;
        if (d?.ok && d.item) { setItem(d.item); await loadContent(); }
        else setItem(false);
      } catch { if (!cancelled) setItem(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const buy = async () => {
    if (!item) return;
    setError("");
    if (item.external_url) { window.open(item.external_url, "_blank"); return; }
    const isFree = item.status === "free" || Number(item.price_usd) === 0;
    if (isFree || gate.owned) {
      if (gate.file_url) { window.open(gate.file_url, "_blank"); return; }
      if (gate.content) { downloadItemPdf({ ...item, content: gate.content }); return; }
      await loadContent();
      return;
    }
    if (inIframe) { setError("Checkout works only from the published app — open oohearth.app in its own tab."); return; }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("createProductCheckout", { item_id: item.id });
      const d = res?.data ?? res;
      if (d?.url) { window.location.href = d.url; return; }
      if (d?.error === "login_required") { navigate("/login"); return; }
      setError(d?.error || "Checkout failed.");
    } catch (e) {
      if (e?.message === "login_required" || /401/.test(String(e?.message))) { navigate("/login"); return; }
      setError(e?.message || "Checkout failed.");
    } finally { setBusy(false); }
  };

  useSeo(item && item !== false ? {
    title: `${item.title} — OOH Earth Store`,
    desc: item.subtitle || item.description || item.title,
    image: item.image_url,
    type: "product",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: item.title,
      description: item.description || item.subtitle || "",
      image: item.image_url ? [item.image_url] : undefined,
      category: (CAT_META[item.category] || CAT_META.library).label,
      offers: {
        "@type": "Offer",
        price: String(Number(item.price_usd) || 0),
        priceCurrency: "USD",
        availability: item.status === "sold_out" ? "https://schema.org/SoldOut" : "https://schema.org/InStock"
      }
    }
  } : null);

  if (item === null) {
    return (
      <div className="min-h-screen bg-void page-top"><Nav />
        <div className="flex items-center gap-3 px-8 pt-32 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" /> Loading entry…
        </div>
      </div>
    );
  }
  if (item === false) {
    return (
      <div className="min-h-screen bg-void page-top"><Nav />
        <div className="px-8 pt-32">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">// Entry not found</p>
          <button onClick={() => navigate("/store")} className="mt-4 flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.25em] text-silver hover:border-ozone hover:text-ozone">
            <ArrowLeft className="h-3 w-3" /> Back to store
          </button>
        </div>
      </div>
    );
  }

  const cat = CAT_META[item.category] || CAT_META.library;
  const actionable = ["available", "free"].includes(item.status);
  const isFree = item.status === "free" || Number(item.price_usd) === 0;
  const isExternal = !!item.external_url;
  const unlocked = gate.owned || gate.free;
  const btnLabel = gate.owned && !isFree ? (gate.file_url ? "Download" : "Open")
    : !actionable && !gate.owned ? (item.status === "sold_out" ? "Sold out" : "Coming soon")
    : isExternal ? "Open drop"
    : isFree ? "Download"
    : `Buy ${priceLabel(item)}`;

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs items={[{ label: "Store", to: "/store" }, { label: item.title }]} className="mb-4" />
          <button onClick={() => navigate("/store")} className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone">
            <ArrowLeft className="h-3.5 w-3.5" /> Store
          </button>

          <div className="mt-4 flex flex-col gap-5 md:flex-row">
            <div className="aspect-[4/3] w-full shrink-0 overflow-hidden border border-slate2/50 bg-void md:w-56">
              {item.image_url ? <Image src={item.image_url} alt={item.title} className="h-full w-full object-cover" /> : <ProductPreview item={item} />}
            </div>
            <div className="flex-1">
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
                <cat.icon className="h-3 w-3" /> {cat.label}
                {gate.owned && <span className="flex items-center gap-1 text-[#39FF14]"><CheckCircle2 className="h-3 w-3" /> Owned</span>}
              </span>
              <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-silver">{item.title}</h1>
              {item.subtitle && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-dim">{item.subtitle}</p>}
              {item.description && <p className="mt-3 font-display text-[13px] leading-[1.6] text-darkgray">{item.description}</p>}
              {item.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.tags.map((t) => <span key={t} className="border border-slate2/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-darkgray">{t}</span>)}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="font-display text-2xl font-black tabular text-silver">{priceLabel(item)}</span>
                <button
                  onClick={buy}
                  disabled={(!actionable && !gate.owned) || busy}
                  className="flex items-center gap-1.5 border border-ozone bg-ozone px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare disabled:border-slate2/60 disabled:bg-slate2/40 disabled:text-dim"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isExternal ? <ExternalLink className="h-3.5 w-3.5" /> : (isFree || gate.owned) ? <Download className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                  {btnLabel}
                </button>
              </div>
              {error && <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</p>}
            </div>
          </div>

          {/* Deliverable — gated server-side; content never ships until unlocked */}
          {gate.loading ? (
            <div className="mt-8 flex items-center gap-3 border-t border-slate2/50 pt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" /> Checking access…
            </div>
          ) : unlocked ? (
            gate.content ? (
              <article className="mt-8 border-t border-slate2/50 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-[#39FF14]"><CheckCircle2 className="h-3 w-3" /> {gate.free ? "Free access" : "Owned — full access"}</span>
                  <button onClick={() => downloadItemPdf({ ...item, content: gate.content })} className="flex items-center gap-1.5 border border-slate2/60 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                    <Download className="h-3 w-3" /> PDF
                  </button>
                </div>
                <ReactMarkdown components={MD_COMPONENTS}>{gate.content}</ReactMarkdown>
              </article>
            ) : null
          ) : (
            <div className="mt-8 border-t border-slate2/50 pt-6">
              <div className="flex flex-col items-start gap-3 border border-ozone/40 bg-card p-6">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone"><Lock className="h-3.5 w-3.5" /> Locked — purchase to unlock</span>
                <p className="font-display text-[13px] leading-[1.6] text-darkgray">
                  The full {item.category === "library" ? "document" : "deliverable"} unlocks to your account after purchase — read it here anytime and re-download whenever you need.
                  {gate.reason === "login_required" && " Log in and buy to get lasting access."}
                </p>
                <button onClick={buy} disabled={busy} className="flex items-center gap-1.5 border border-ozone bg-ozone px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-50">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingBag className="h-3.5 w-3.5" />} Buy {priceLabel(item)}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}