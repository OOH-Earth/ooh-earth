import { useEffect, useMemo, useState } from "react";
import { Image } from "@/components/ui/image";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ShoppingBag, BookOpen, Download, ExternalLink, CheckCircle2, Check, ArrowUpRight, Sparkles } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import { useWalkthrough } from "@/lib/walkthroughContext";
import { CAT_META, priceLabel, ProductPreview } from "@/components/ooh/store/catalog";
import { downloadItemPdf } from "@/components/ooh/store/downloadPdf";
import ComponentGallery from "@/components/ooh/store/ComponentGallery";

const STORE_TOUR = [
{ title: "OOH Store", body: "Field research, digital products, and drops — all built on this platform and sourced from our own data. Every sale funds the Field Offensive." },
{ title: "How it works", body: "Library docs open in a reader. Digital products check out through Stripe and unlock to your account. Drops open their own page. Free items download on the spot.", cta: true }];


// Filter chips — 'all' + 'components', plus one per category that actually has stock.
const CAT_ORDER = ["library", "plugin", "uikit", "theme", "nft", "physical"];

const SORTS = [
{ id: "featured", label: "Featured" },
{ id: "newest", label: "Newest" },
{ id: "price_low", label: "Price ↑" },
{ id: "price_high", label: "Price ↓" }];


function Badge({ children, tone = "ozone" }) {
  const tones = {
    ozone: "border-ozone/50 text-ozone",
    flare: "border-flare/50 text-flare",
    green: "border-[#39FF14]/50 text-[#39FF14]",
    dim: "border-slate2/60 text-dim"
  };
  return <span className={`flex items-center gap-1 border ${tones[tone]} bg-void/80 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] backdrop-blur`}>{children}</span>;
}

function ProductCard({ item, owned, onAction, busy }) {
  const cat = CAT_META[item.category] || CAT_META.library;
  const Icon = cat.icon;
  const isLibrary = item.category === "library";
  const actionable = item.status === "available" || item.status === "free";
  const isExternal = !!item.external_url;
  const isFree = item.status === "free" || Number(item.price_usd) === 0;
  const busyThis = busy === item.id;

  const label = owned ? "Open" :
  isLibrary ? "Read" :
  !actionable ? item.status === "sold_out" ? "Sold out" : "Coming soon" :
  isExternal ? "Open drop" :
  isFree ? "Download" :
  "Buy";
  const CtaIcon = busyThis ? Loader2 : owned ? Check : isLibrary ? BookOpen : isExternal ? ExternalLink : isFree ? Download : ShoppingBag;

  return (
    <div className="group flex flex-col overflow-hidden border border-slate2/50 bg-card transition-all duration-300 hover:border-ozone/50 hover:shadow-[0_0_0_1px_rgba(237,255,0,0.15),0_18px_40px_-24px_rgba(237,255,0,0.25)]">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-slate2/50 bg-void">
        {item.image_url ?
        <Image src={item.image_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" /> :

        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"><ProductPreview item={item} /></div>
        }
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <Badge><Icon className="h-2.5 w-2.5" /> {cat.label}</Badge>
          {item.featured && <Badge tone="flare"><Sparkles className="h-2.5 w-2.5" /> Featured</Badge>}
        </div>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {owned && <Badge tone="green"><Check className="h-2.5 w-2.5" /> Owned</Badge>}
          {item.edition_size ? <Badge tone="flare">{item.edition_sold || 0}/{item.edition_size}</Badge> : null}
          {item.status === "in_build" && <Badge tone="flare">In build</Badge>}
          {!actionable && item.status === "upcoming" && <Badge tone="dim">Soon</Badge>}
        </div>
        {/* price chip */}
        <div className="absolute bottom-2 right-2">
          <span className={`border px-2 py-1 font-display text-sm font-black tabular backdrop-blur ${isFree ? "border-[#39FF14]/50 bg-void/80 text-[#39FF14]" : "border-ozone/50 bg-void/80 text-ozone"}`}>{priceLabel(item)}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-bold tracking-[-0.01em] text-silver">{item.title}</h3>
        {item.subtitle && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-dim">{item.subtitle}</p>}
        {item.description && <p className="mt-2 flex-1 font-display text-[12px] leading-relaxed text-darkgray line-clamp-3">{item.description}</p>}
        {item.tags?.length ?
        <div className="mt-3 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((t) =>
          <span key={t} className="border border-slate2/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-darkgray">{t}</span>
          )}
          </div> :
        null}
        <button
          onClick={() => onAction(item)}
          disabled={!actionable && !owned || busyThis}
          className="mt-4 flex items-center justify-center gap-1.5 border border-ozone bg-ozone px-3 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare disabled:border-slate2/60 disabled:bg-slate2/40 disabled:text-dim">
          
          <CtaIcon className={`h-3.5 w-3.5 ${busyThis ? "animate-spin" : ""}`} /> {label}
        </button>
      </div>
    </div>);

}

function Grid({ items, ownedIds, onAction, busy }) {
  if (!items) return (
    <div className="flex items-center gap-3 py-16 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" /> Loading catalogue…
    </div>);

  if (!items.length) return (
    <div className="border border-slate2/60 bg-card p-12 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// Nothing here yet</div>);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <ProductCard key={item.id} item={item} owned={ownedIds.has(item.id)} onAction={onAction} busy={busy} />)}
    </div>);

}

export default function Store() {
  const navigate = useNavigate();
  const { registerSteps } = useWalkthrough();
  const [items, setItems] = useState(null);
  const [ownedIds, setOwnedIds] = useState(new Set());
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [thanks, setThanks] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("featured");
  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  useEffect(() => {
    registerSteps(STORE_TOUR);
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "thanks") setThanks(true);

    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("storeCatalog", {});
        const d = res?.data ?? res;
        if (!cancelled) setItems(Array.isArray(d?.items) ? d.items : []);
      } catch {if (!cancelled) setItems([]);}
      // Owned entitlements (for badges + re-download), if signed in.
      try {
        const me = await base44.auth.me();
        if (me?.id && !cancelled) {
          const ps = await base44.entities.Purchase.filter({ user_id: me.id, status: "paid" }, "-created_date", 200);
          if (!cancelled) setOwnedIds(new Set((ps || []).map((p) => p.item_id)));
        }
      } catch {/* logged out — fine */}
    })();
    return () => {cancelled = true;};
  }, [registerSteps]);

  const cats = useMemo(() => {
    const present = new Set((items || []).map((i) => i.category));
    return CAT_ORDER.filter((c) => present.has(c));
  }, [items]);

  const shown = useMemo(() => {
    let list = [...(items || [])];
    if (filter !== "all" && filter !== "components") list = list.filter((i) => i.category === filter);
    const price = (i) => i.status === "free" ? 0 : Number(i.price_usd) || 0;
    list.sort((a, b) => {
      if (sort === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (a.sort_order || 0) - (b.sort_order || 0);
      if (sort === "newest") return String(b.created_date || "").localeCompare(String(a.created_date || ""));
      if (sort === "price_low") return price(a) - price(b);
      if (sort === "price_high") return price(b) - price(a);
      return 0;
    });
    return list;
  }, [items, filter, sort]);

  // Deliver a free or already-owned item's content (server-verified).
  const deliver = async (item) => {
    try {
      const res = await base44.functions.invoke("getStoreContent", { item_id: item.id });
      const d = res?.data ?? res;
      if (d?.owned || d?.free) {
        if (d.file_url) {window.open(d.file_url, "_blank");return;}
        if (d.content) {downloadItemPdf({ ...item, content: d.content });return;}
      }
      navigate(`/store/${item.id}`);
    } catch {navigate(`/store/${item.id}`);}
  };

  const onAction = async (item) => {
    setError("");
    if (item.category === "library") {navigate(`/store/${item.id}`);return;}
    if (item.external_url) {window.open(item.external_url, "_blank");return;}
    const isFree = item.status === "free" || Number(item.price_usd) === 0;
    if (isFree || ownedIds.has(item.id)) {await deliver(item);return;}
    if (inIframe) {setError("Checkout works only from the published app — open oohearth.app in its own tab.");return;}
    setBusy(item.id);
    try {
      const res = await base44.functions.invoke("createProductCheckout", { item_id: item.id });
      const d = res?.data ?? res;
      if (d?.url) {window.location.href = d.url;return;}
      if (d?.error === "login_required") {navigate("/login");return;}
      setError(d?.error || "Checkout failed.");
    } catch (e) {
      if (e?.message === "login_required" || /401/.test(String(e?.message))) {navigate("/login");return;}
      setError(e?.message || "Checkout failed.");
    } finally {setBusy(null);}
  };

  const featured = (items || []).find((i) => i.featured);

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <div className="border-b border-slate2/50 pb-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// commerce · built on this platform</span>
            <h1 className="mt-2 flex items-center gap-3 font-display text-5xl font-bold leading-[1.0] tracking-[-0.02em] text-silver md:text-7xl">
              <ShoppingBag className="h-8 w-8 shrink-0 text-ozone" /> Store
            </h1>
            <p className="mt-3 max-w-2xl font-display text-sm leading-[1.6] text-darkgray md:text-base">
              Field research, digital products, mockups, and drops — sourced from our own data and built on oohearth.app. Every sale funds the Field Offensive: no ads.
            </p>
          </div>

          {thanks &&
          <div className="mt-6 flex items-center gap-2 border border-[#39FF14]/40 bg-[#39FF14]/5 p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#39FF14]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#39FF14]">// Payment received — thank you. Your purchase is unlocked to your account; open it below or from its page.</span>
            </div>
          }
          {error && <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</p>}

          {/* Filter + sort bar */}
          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {["all", ...cats, "components"].map((c) => {
                const meta = CAT_META[c];
                const label = c === "all" ? "All" : c === "components" ? "Components" : meta?.label || c;
                const active = filter === c;
                return (
                  <button key={c} onClick={() => setFilter(c)} className={`border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${active ? "border-ozone bg-ozone text-void" : "border-slate2/60 text-darkgray hover:border-ozone hover:text-ozone"}`}>
                    {label}
                  </button>);

              })}
            </div>
            {filter !== "components" &&
            <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Sort</span>
                {SORTS.map((s) =>
              <button key={s.id} onClick={() => setSort(s.id)} className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${sort === s.id ? "text-ozone" : "text-darkgray hover:text-ozone"}`}>{s.label}</button>
              )}
              </div>
            }
          </div>

          {/* Featured spotlight (only on 'all') */}
          {filter === "all" && featured &&
          <button onClick={() => onAction(featured)} className="group mt-6 flex w-full flex-col overflow-hidden border border-ozone/40 bg-card text-left transition-colors hover:border-ozone md:flex-row">
              <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-slate2/50 bg-void md:aspect-auto md:w-1/2 md:border-b-0 md:border-r">
                {featured.image_url ? <Image src="https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/652891b63_ooh-nft-OOH-00001.png" alt={featured.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <ProductPreview item={featured} />}
                <span className="absolute left-3 top-3"><Badge tone="flare"><Sparkles className="h-2.5 w-2.5" /> Featured</Badge></span>
              </div>
              <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">{(CAT_META[featured.category] || CAT_META.library).label}</span>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.01em] text-silver md:text-3xl">{featured.title}</h2>
                {featured.description && <p className="mt-2 max-w-lg font-display text-[13px] leading-relaxed text-darkgray line-clamp-3">{featured.description}</p>}
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-display text-xl font-black text-ozone">{priceLabel(featured)}</span>
                  <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-silver group-hover:text-ozone">View <ArrowUpRight className="h-3.5 w-3.5" /></span>
                </div>
              </div>
            </button>
          }

          {/* Body */}
          <div className="mt-6">
            {filter === "components" ?
            <>
                <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Live components built on this site — Framer / React / SVG</div>
                <ComponentGallery onGiveaway={(item) => downloadItemPdf(item)} />
              </> :

            <Grid items={shown} ownedIds={ownedIds} onAction={onAction} busy={busy} />
            }
          </div>
        </div>
      </main>
    </div>);

}