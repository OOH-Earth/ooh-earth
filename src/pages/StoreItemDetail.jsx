import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Download, ShoppingBag, ExternalLink, Gift } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Image } from "@/components/ui/image";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import { CAT_META, priceLabel, ProductPreview } from "@/components/ooh/store/catalog";
import { downloadItemPdf } from "@/components/ooh/store/downloadPdf";

const inIframe = typeof window !== "undefined" && window.self !== window.top;

// PDF export lives in @/components/ooh/store/downloadPdf

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
  const [item, setItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setItem(null);
    base44.entities.StoreItem.get(id)
      .then((r) => { if (!cancelled) setItem(r); })
      .catch(() => { if (!cancelled) setItem(false); });
    return () => { cancelled = true; };
  }, [id]);

  const buy = async () => {
    if (!item) return;
    setError("");
    const isFree = item.status === "free" || Number(item.price_usd) === 0;
    if (isFree) { downloadItemPdf(item); return; }
    if (item.external_url) { window.open(item.external_url, "_blank"); return; }
    if (inIframe) { setError("Checkout works only from the published app. Open oohearth.app in its own tab."); return; }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("createProductCheckout", { item_id: item.id });
      if (res.data?.url) window.location.href = res.data.url;
      else setError(res.data?.error || "Checkout failed.");
    } catch (e) {
      setError(e?.message || "Checkout failed.");
    } finally {
      setBusy(false);
    }
  };

  if (item === null) {
    return (
      <div className="min-h-screen bg-void page-top">
        <Nav />
        <div className="flex items-center gap-3 px-8 pt-32 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" /> Loading entry…
        </div>
      </div>
    );
  }
  if (item === false) {
    return (
      <div className="min-h-screen bg-void page-top">
        <Nav />
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
  const btnLabel = !actionable ? "Coming soon" : isFree ? "Download PDF" : isExternal ? "Open drop" : `Buy ${priceLabel(item)}`;

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-3xl">
          <button onClick={() => navigate("/store")} className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone">
            <ArrowLeft className="h-3.5 w-3.5" /> Store
          </button>

          <div className="mt-4 flex flex-col gap-5 md:flex-row">
            <div className="aspect-[4/3] w-full shrink-0 overflow-hidden border border-slate2/50 bg-void md:w-56">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <ProductPreview item={item} />
              )}
            </div>
            <div className="flex-1">
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
                <cat.icon className="h-3 w-3" /> {cat.label}
              </span>
              <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-silver">{item.title}</h1>
              {item.subtitle && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-dim">{item.subtitle}</p>}
              {item.description && <p className="mt-3 font-display text-[13px] leading-[1.6] text-darkgray">{item.description}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="font-display text-2xl font-black tabular text-silver">{priceLabel(item)}</span>
                <button
                  onClick={() => downloadItemPdf(item)}
                  className="flex items-center gap-1.5 border border-slate2/60 px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-[#39FF14] hover:text-[#39FF14]"
                >
                  <Gift className="h-3.5 w-3.5" /> Giveaway
                </button>
                <button
                  onClick={buy}
                  disabled={!actionable || busy}
                  className="flex items-center gap-1.5 border border-ozone bg-ozone px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare disabled:border-slate2/60 disabled:bg-slate2/40 disabled:text-dim"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isExternal ? <ExternalLink className="h-3.5 w-3.5" /> : isFree ? <Download className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                  {btnLabel}
                </button>
              </div>
              {error && <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</p>}
            </div>
          </div>

          {item.content && (
            <article className="mt-8 border-t border-slate2/50 pt-6">
              <ReactMarkdown components={MD_COMPONENTS}>{item.content}</ReactMarkdown>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}