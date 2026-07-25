import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useWallet } from "@/hooks/useWallet";
import { Coins, Loader2, Copy, Check, ExternalLink, Wallet, BadgeCheck, Lock } from "lucide-react";

const SDG_BY_TYPE = {
  billboard: "11",
  painted: "11",
  digital: "9",
  projection: "11",
  sticker: "11",
  mural: "11",
  transit: "11",
  other: "11",
};

export function buildMetadata(loc) {
  const sdg = SDG_BY_TYPE[loc.type] || "11";
  return {
    name: `OOH · ${loc.title}`.slice(0, 96),
    description: `Documented ${loc.type || "out-of-home"} advertising surface${loc.address ? ` at ${loc.address}` : ""}. Field-logged on the OOH Earth resistance atlas. Minting this location mints permanent on-chain proof of the intervention — and a claimable AR / metaverse surface.`,
    image: loc.image_url || "",
    external_url: loc.source_link || `https://oohearth.app/location/${loc.id}/`,
    attributes: [
      { trait_type: "Type", value: loc.type || "other" },
      { trait_type: "Latitude", value: loc.lat },
      { trait_type: "Longitude", value: loc.lng },
      { trait_type: "Access Key", value: loc.access_key || "none" },
      { trait_type: "SDG", value: sdg },
      { trait_type: "Status", value: loc.status || "pending" },
      { trait_type: "Source", value: "oohearth.app" },
    ],
  };
}

export default function MintLocationPanel({ loc }) {
  const evm = useWallet("evm");
  const [phase, setPhase] = useState("idle"); // idle | preparing | done | minted
  const [metadataUri, setMetadataUri] = useState(null);
  const [mintId, setMintId] = useState(null);
  const [tokenAddr, setTokenAddr] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState(null);

  const canMint = !!loc.image_url && loc.status === "verified";

  const prepare = async () => {
    setErr(null);
    setPhase("preparing");
    try {
      const meta = buildMetadata(loc);
      const sdg = meta.attributes.find((a) => a.trait_type === "SDG").value;
      const blob = new Blob([JSON.stringify(meta, null, 2)], { type: "application/json" });
      const file = new File([blob], `ooh-${loc.id}-metadata.json`, { type: "application/json" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMetadataUri(file_url);
      const rec = await base44.entities.Mint.create({
        location_id: String(loc.id),
        location_title: loc.title,
        operative_address: evm.address || "",
        chain: "base",
        name: meta.name,
        symbol: "OOH",
        metadata_uri: file_url,
        image_url: loc.image_url,
        sdg,
        status: "prepared",
      });
      setMintId(rec.id);
      setPhase("done");
    } catch (e) {
      setErr(e?.message || "Mint preparation failed");
      setPhase("idle");
    }
  };

  const markMinted = async () => {
    if (!mintId || !tokenAddr.trim()) return;
    setErr(null);
    try {
      await base44.entities.Mint.update(mintId, { token_address: tokenAddr.trim(), status: "minted" });
      setPhase("minted");
    } catch (e) {
      setErr(e?.message || "Could not record token address");
    }
  };

  const copy = async () => {
    if (!metadataUri) return;
    try {
      await navigator.clipboard.writeText(metadataUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className={`mt-8 border p-4 ${canMint ? "border-ozone/50" : "border-slate2/60"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
          <Coins className="h-3.5 w-3.5" /> On-chain · mint this location
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">zora · base</span>
      </div>

      {!canMint ? (
        <div className="mt-3 flex items-start gap-2">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim" />
          <p className="text-[12px] leading-relaxed text-darkgray">
            Minting unlocks once the location is <span className="text-silver">verified</span> with a field photo. File a report or field check to clear it.
          </p>
        </div>
      ) : phase === "idle" ? (
        <div className="mt-3 space-y-3">
          <p className="text-[12px] leading-relaxed text-darkgray">
            Mint this documented ad surface as a Zora coin on Base. The snap, coordinates, access key and SDG tag become permanent on-chain metadata — and a claimable AR / metaverse surface owned by you.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {evm.address ? (
              <>
                <span className="flex items-center gap-1.5 border border-slate2 px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ozone">
                  <Wallet className="h-3.5 w-3.5" /> {evm.shortAddress}
                  {evm.verified && <BadgeCheck className="h-3 w-3 text-brand-green" />}
                </span>
                {!evm.verified && (
                  <button
                    onClick={evm.verifyOwnership}
                    disabled={evm.verifying}
                    className="flex items-center gap-1.5 border border-flare px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare hover:text-void"
                  >
                    {evm.verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                    {evm.verifying ? "Verifying…" : "Verify ownership"}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={evm.connect}
                disabled={evm.connecting}
                className="flex items-center gap-1.5 border border-slate2 px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
              >
                <Wallet className="h-3.5 w-3.5" /> {evm.connecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
            <button
              onClick={prepare}
              disabled={!evm.address || !evm.verified}
              className="flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Coins className="h-3.5 w-3.5" /> Prepare mint
            </button>
          </div>
          {!evm.address && (
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">// connect first so the mint is attributed to your address</p>
          )}
          {evm.address && !evm.verified && (
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-flare/80">// verify wallet ownership to unlock minting — signs a message, no transaction</p>
          )}
        </div>
      ) : phase === "preparing" ? (
        <div className="mt-3 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Preparing metadata…</span>
        </div>
      ) : phase === "done" ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-start gap-2 border border-ozone/30 bg-ozone/[0.04] p-2.5">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ozone" />
            <p className="text-[12px] leading-relaxed text-silver/85">
              Metadata prepared &amp; stored. Copy the token URI below, then mint on Zora — paste it as your content / metadata when creating the coin.
            </p>
          </div>
          <div className="flex items-center gap-2 border border-slate2 bg-card px-2.5 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-silver/80">{metadataUri}</span>
            <button onClick={copy} className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ozone transition-colors hover:text-flare">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <a
            href="https://zora.co/create"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Zora create
          </a>
          <div className="border-t border-slate2/40 pt-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">// minted? paste the coin address to record it</span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={tokenAddr}
                onChange={(e) => setTokenAddr(e.target.value)}
                placeholder="0x… coin address"
                className="min-w-0 flex-1 border border-slate2 bg-card px-2.5 py-2 font-mono text-[10px] text-silver outline-none focus:border-ozone"
              />
              <button
                onClick={markMinted}
                disabled={!tokenAddr.trim()}
                className="flex items-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone disabled:opacity-40"
              >
                <BadgeCheck className="h-3.5 w-3.5" /> Mark minted
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-2 border border-ozone/30 bg-ozone/[0.04] p-2.5">
          <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ozone" />
          <div>
            <p className="text-[12px] font-semibold text-silver">On-chain · minted</p>
            <a
              href={`https://zora.co/coin/base:${tokenAddr.trim()}`}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-ozone transition-colors hover:text-flare"
            >
              View on Zora <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {err && <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-flare">// {err}</p>}
    </div>
  );
}