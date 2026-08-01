import { useEffect, useRef, useState } from "react";

// Polls DexScreener for a single token; accumulates a session sparkline.
// Returns { data, error } — error is true after 2 consecutive fetch failures
// so the UI can distinguish "loading" from "API down".
export default function useCoinData(address, intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const histRef = useRef([]);
  const lastRef = useRef(null);

  useEffect(() => {
    let active = true;
    histRef.current = [];
    setError(false);
    let failCount = 0;

    const load = async () => {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
        const j = await res.json();
        const pairs = (j && j.pairs) || [];
        const p = pairs.find((x) => x.priceUsd) || pairs[0];
        if (!p || !active) {
          if (!p) { failCount++; if (failCount >= 2) setError(true); }
          return;
        }
        const price = parseFloat(p.priceUsd);
        const change = p.priceChange ? parseFloat(p.priceChange.h24) : null;
        const mcap = p.marketCap ? parseFloat(p.marketCap) : (p.fdv ? parseFloat(p.fdv) : null);
        const vol = p.volume ? parseFloat(p.volume.h24) : null;
        const txns = p.txns?.h24 || null;
        if (lastRef.current !== price) {
          histRef.current = [...histRef.current, { t: Date.now(), p: price }].slice(-60);
          lastRef.current = price;
        }
        setError(false);
        failCount = 0;
        setData({
          price,
          change,
          mcap,
          vol,
          buys: txns ? txns.buys : null,
          sells: txns ? txns.sells : null,
          symbol: p.baseToken?.symbol,
          history: histRef.current,
        });
      } catch {
        failCount++;
        if (failCount >= 2) setError(true);
      }
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [address, intervalMs]);

  return { data, error };
}