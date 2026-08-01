import { useWallet } from "@/hooks/useWallet";
import { Wallet, Loader2, CheckCircle2 } from "lucide-react";

export default function WalletButton({ chain }) {
  const { address, shortAddress, connecting, reconnecting, available, connect, disconnect } = useWallet(chain);
  const label = chain === "solana" ? "Phantom" : "EVM";

  if (address) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 border border-ozone/60 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:border-flare hover:text-flare"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="tabular">{shortAddress}</span>
      </button>
    );
  }

  if (reconnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-dim opacity-60"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Reconnecting…</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={connecting}
      className="flex items-center gap-2 border-2 border-ozone bg-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-50"
    >
      {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
      <span>{available ? `Connect ${label}` : `Get ${label}`}</span>
    </button>
  );
}