import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShoppingBag, BookOpen, Download, ExternalLink, Sparkles, Package, CheckCircle2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import { useWalkthrough } from "@/lib/walkthroughContext";
import AtlasPreview from "@/components/ooh/store/AtlasPreview";
import ThemePreview from "@/components/ooh/store/ThemePreview";
import MetroKitPreview from "@/components/ooh/store/MetroKitPreview";
import CursorPackPreview from "@/components/ooh/store/CursorPackPreview";
import NftDropPreview from "@/components/ooh/store/NftDropPreview";
import PhysicalPreview from "@/components/ooh/store/PhysicalPreview";

const STORE_TOUR = [
  { title: "OOH Store", body: "Two wings. The Library sells our research and field docs. The Store fronts digital products built on this app — plugins, UI kits, the Base44 theme — then NFT drops and one-off physical prototypes." },
  { title: "How buying works", body: "Paid digital items check out through Stripe (card). Free items download instantly. NFT drops and external releases open their own page. Every sale funds the Field Offensive.", cta: true },
];

const CAT_META = {
  library: { icon: BookOpen, label: "Library" },
  plugin: { icon: Package, label: "Plugin" },
  uikit: { icon: Package, label: "UI Kit" },
  theme: { icon: Sparkles, label: "Theme" },
  nft: { icon: Sparkles, label: "NFT Drop" },
  physical: { icon: Package, label: "Prototype" },
};

const PREVIEW = {
  library: AtlasPreview,
  theme: ThemePreview,
  uikit: MetroKitPreview,
  plugin: CursorPackPreview,
  nft: NftDropPreview,
  physical: PhysicalPreview,
};

function priceLabel(item) {
  if (item.status === "free" || Number(item.price_usd) === 0) return "Free";
  if (item.status === "upcoming") return "Upcoming";
  if (item.status === "sold_out") return "Sold out";
  return `$${item.price_usd}`;
}

function ProductCard({ item, onBuy, busy }) {
  const cat = CAT_META[item.category] || CAT_META.library;
  const Icon = cat.icon;
  const actionable = item.status === "available" || item.status === "free";
  const isExternal = !!item.external_url;
  const isFree = item.status === "free" || Number(item.price_usd) === 0;
  const busyThis = busy === item.id;
  const btnLabel = !actionable
    ? (item.status === "upcoming" ? "Soon" : "Sold out")
    : isExternal ? "Open drop"
    : isFree ? "Download"
    : "Buy";
  return (
    <div className="group flex flex-col border border-slate2/50 bg-card transition-colors hover:border-ozone/40">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-slate2/50 grid-bg bg-void">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full">{(() => { const P = PREVIEW[item.category] || AtlasPreview; return <P />; })()}</div>
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 border border-slate2/60 bg-void/80 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone backdrop-blur">
          <Icon className="h-2.5 w-2.5" /> {cat.label}
        </span>
        {item.edition_size ? (
          <span className="absolute right-2 top-2 border border-flare/50 bg-void/80 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare backdrop-blur">
            {item.edition_sold || 0}/{item.edition_size}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-bold tracking-[-0.01em] text-silver">{item.title}</h3>
        {item.subtitle && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-dim">{item.subtitle}</p>}
        {item.description && <p className="mt-2 flex-1 font-display text-[12px] leading-relaxed text-darkgray">{item.description}</p>}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="font-display text-lg font-black tabular text-silver">{priceLabel(item)}</span>
          <button
            onClick={() => onBuy(item)}
            disabled={!actionable || busyThis}
            className="flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare disabled:border-slate2/60 disabled:bg-slate2/40 disabled:text-dim"
          >
            {busyThis ? <Loader2 className="h-3 w-3 animate-spin" /> : isExternal ? <ExternalLink className="h-3 w-3" /> : isFree ? <Download className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Grid({ items, onBuy, busy, emptyNote }) {
  if (!items) return (
    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
      <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ozone" /> Loading…
    </div>
  );
  if (!items.length) return (
    <div className="border border-slate2/60 bg-card p-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-dim">{emptyNote}</div>
  );
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <ProductCard key={item.id} item={item} onBuy={onBuy} busy={busy} />)}
    </div>
  );
}

export default function Store() {
  const { registerSteps } = useWalkthrough();
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [thanks, setThanks] = useState(false);
  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  useEffect(() => {
    registerSteps(STORE_TOUR);
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "thanks") setThanks(true);

    let cancelled = false;
    const load = () =>
      base44.entities.StoreItem.list("-created_date", 200)
        .then((recs) => {
          if (cancelled) return;
          const sorted = [...(recs || [])].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (a.sort_order || 0) - (b.sort_order || 0));
          setItems(sorted);
        })
        .catch(() => { if (!cancelled) setItems([]); });
    load();
    const unsub = base44.entities.StoreItem.subscribe(load);
    return () => { cancelled = true; if (unsub) unsub(); };
  }, [registerSteps]);

  const library = (items || []).filter((i) => i.category === "library");
  const shop = (items || []).filter((i) => i.category !== "library");

  const buy = async (item) => {
    setError("");
    if (item.status === "free" || Number(item.price_usd) === 0) {
      if (item.file_url) window.open(item.file_url, "_blank");
      return;
    }
    if (item.external_url) { window.open(item.external_url, "_blank"); return; }
    if (inIframe) { setError("Checkout works only from the published app. Open oohearth.app in its own tab."); return; }
    setBusy(item.id);
    try {
      const res = await base44.functions.invoke("createProductCheckout", { item_id: item.id });
      if (res.data?.url) window.location.href = res.data.url;
      else setError(res.data?.error || "Checkout failed.");
    } catch (e) {
      setError(e?.message || "Checkout failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="border-b border-slate2/50 pb-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// commerce // library + store</span>
            <h1 className="mt-2 flex items-center gap-3 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">
              <ShoppingBag className="h-7 w-7 text-ozone" /> Store
            </h1>
            <p className="mt-2 max-w-2xl font-display text-sm leading-[1.5] text-darkgray">
              Field research and digital products built on oohearth.app. Every sale funds the Field Offensive.
            </p>
          </div>

          {thanks && (
            <div className="mt-6 flex items-center gap-2 border border-[#39FF14]/40 bg-[#39FF14]/5 p-3">
              <CheckCircle2 className="h-4 w-4 text-[#39FF14]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#39FF14]">// Payment received — thank you. Your download or access details follow by email.</span>
            </div>
          )}
          {error && <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</p>}

          <Tabs defaultValue="library" className="mt-8">
            <TabsList className="border border-slate2/60 bg-card">
              <TabsTrigger value="library" className="font-mono text-[10px] uppercase tracking-[0.25em] data-[state=active]:bg-ozone data-[state=active]:text-void">Library</TabsTrigger>
              <TabsTrigger value="store" className="font-mono text-[10px] uppercase tracking-[0.25em] data-[state=active]:bg-ozone data-[state=active]:text-void">Store</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="mt-6">
              <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Research, field docs & reference — sourced from our own data</div>
              <Grid items={library} onBuy={buy} busy={busy} emptyNote="// No library entries yet" />
            </TabsContent>
            <TabsContent value="store" className="mt-6">
              <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Digital products · NFT drops · physical prototypes</div>
              <Grid items={shop} onBuy={buy} busy={busy} emptyNote="// No store entries yet" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}