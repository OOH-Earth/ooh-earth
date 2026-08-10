import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CreditCard } from "lucide-react";
import PaymentBadges from "@/components/ooh/campaign/PaymentBadges";

const TIERS = [25, 50, 100, 250];

export default function StripeDonate() {
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  const donate = async () => {
    const val = custom ? Number(custom) : amount;
    if (!val || val < 1) {
      setError("Enter a valid amount.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("createDonationCheckout", { amount: val });
      if (res.data?.url) window.location.href = res.data.url;
      else setError(res.data?.error || "Checkout failed.");
    } catch (e) {
      setError(e?.message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden border border-ozone/40 bg-card p-4 md:p-6">
      <h3 className="font-display text-xl font-bold text-silver">Card / fiat</h3>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">// Secure checkout via Stripe</p>
      <div className="mt-4 grid grid-cols-4 gap-px overflow-hidden border border-slate2/60 bg-slate2/40">
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => { setAmount(t); setCustom(""); }}
            className={`py-3 font-mono text-[11px] font-bold transition-colors active:scale-95 ${amount === t && !custom ? "bg-ozone text-void" : "bg-card text-darkgray hover:text-silver hover:bg-slate2/30"}`}
          >
            ${t}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">$</span>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          inputMode="decimal"
          placeholder="Custom amount"
          className="w-full border border-slate2 bg-void px-3 py-2.5 font-mono text-sm text-silver outline-none transition-all placeholder:text-dim focus:border-ozone focus:shadow-[0_0_0_1px_rgba(237,255,0,0.2)]"
        />
      </div>
      {inIframe && (
        <p className="mt-3 border border-flare/40 bg-flare/5 p-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-flare">
          // Checkout works only from the published app. Open oohearth.app in its own tab to donate by card.
        </p>
      )}
      {error && <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">{error}</p>}
      <button
        onClick={donate}
        disabled={loading || inIframe}
        className="mt-4 flex w-full items-center justify-center gap-2 bg-ozone px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-all hover:bg-flare active:scale-[0.98] disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {loading ? "Processing…" : "Donate now"}
      </button>
      <PaymentBadges securedBy="Stripe" className="mt-4" />
    </div>
  );
}