import { useState, useEffect, useCallback } from "react";

const short = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "");

function getSolanaProvider() {
  if (typeof window === "undefined") return null;
  const p = window.solana || window.phantom?.solana;
  return p && p.isPhantom ? p : null;
}

function getEvmProvider() {
  if (typeof window === "undefined") return null;
  return window.ethereum || null;
}

export function useWallet(chain) {
  const key = `ooh_wallet_${chain}`;
  const [address, setAddress] = useState(() => {
    try { return localStorage.getItem(key) || null; } catch { return null; }
  });
  const [connecting, setConnecting] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const provider = chain === "solana" ? getSolanaProvider() : getEvmProvider();
    setAvailable(!!provider);
    if (!provider) return;

    const tryReconnect = async () => {
      try {
        if (chain === "solana") {
          if (provider.isConnected && provider.publicKey) {
            const pk = provider.publicKey.toString();
            setAddress(pk); localStorage.setItem(key, pk);
          }
        } else {
          const accounts = await provider.request({ method: "eth_accounts" });
          if (accounts && accounts.length) {
            setAddress(accounts[0]); localStorage.setItem(key, accounts[0]);
          }
        }
      } catch {}
    };
    tryReconnect();

    const onAccountChanged = (info) => {
      const a = chain === "solana"
        ? info?.publicKey?.toString()
        : (Array.isArray(info) ? info[0] : (typeof info === "string" ? info : null));
      if (a) { setAddress(a); localStorage.setItem(key, a); }
      else { setAddress(null); localStorage.removeItem(key); }
    };

    if (chain === "solana") {
      provider.on?.("accountChanged", onAccountChanged);
      provider.on?.("disconnect", () => { setAddress(null); localStorage.removeItem(key); });
    } else {
      provider.on?.("accountsChanged", onAccountChanged);
    }

    return () => {
      provider.removeListener?.("accountChanged", onAccountChanged);
      provider.removeListener?.("accountsChanged", onAccountChanged);
    };
  }, [chain]);

  const connect = useCallback(async () => {
    const provider = chain === "solana" ? getSolanaProvider() : getEvmProvider();
    if (!provider) {
      window.open(chain === "solana" ? "https://phantom.app/" : "https://metamask.io/download/", "_blank");
      return;
    }
    setConnecting(true);
    try {
      let a;
      if (chain === "solana") {
        const resp = await provider.connect();
        a = resp?.publicKey?.toString();
      } else {
        const accounts = await provider.request({ method: "eth_requestAccounts" });
        a = Array.isArray(accounts) ? accounts[0] : accounts;
      }
      if (a) { setAddress(a); localStorage.setItem(key, a); }
    } catch {} finally {
      setConnecting(false);
    }
  }, [chain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem(key);
    const provider = chain === "solana" ? getSolanaProvider() : getEvmProvider();
    provider?.disconnect?.();
  }, [chain]);

  return { address, shortAddress: short(address), connecting, available, connect, disconnect };
}