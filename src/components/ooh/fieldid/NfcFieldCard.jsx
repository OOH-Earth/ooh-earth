import BrandMark from "@/components/ooh/BrandMark";
import { Nfc } from "lucide-react";

export default function NfcFieldCard({ handle = "operative", memberId = "OOH-0000-0" }) {
  return (
    <div className="relative w-[340px] select-none overflow-hidden border border-slate2 bg-void shadow-[0_24px_60px_rgba(0,0,0,0.6)]" style={{ height: "214px", transform: "perspective(900px) rotateY(-14deg) rotateX(4deg)" }}>
      <div className="hi-vis-stripes flex h-[26px] items-center justify-between px-3">
        <span className="bg-void px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-ozone">OOH Earth Union Card</span>
        <span className="bg-void px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-ozone">NFC</span>
      </div>

      <div className="absolute right-3 top-[34px]"><BrandMark className="h-7 w-7" /></div>

      <div className="px-3 pt-3">
        <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">Registered Operative</div>
        <div className="font-display text-xl font-bold leading-tight tracking-[-0.02em] text-silver">{handle}</div>
        <div className="mt-1 inline-block border border-ozone px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ozone">Field · Verified</div>
      </div>

      {/* NFC chip + waves */}
      <div className="absolute left-3 top-[108px] flex items-center gap-3">
        <div className="h-8 w-11 rounded-sm border border-slate2 bg-gradient-to-br from-slate2/80 to-void" />
        <div className="relative flex items-center gap-1">
          <Nfc className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">Tap to tag</span>
        </div>
      </div>

      {/* NFC wave rings */}
      <div className="absolute bottom-[10px] right-3 flex items-end gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="rounded-full border border-ozone/40" style={{ width: `${10 + i * 8}px`, height: `${10 + i * 8}px`, opacity: 1 - i * 0.28 }} />
        ))}
      </div>

      <div className="absolute bottom-[10px] left-3 font-mono text-[8px] leading-tight text-dim">
        <div>UN SDG 11.7 · A/69/286</div>
        <div className="text-silver/70">{memberId}</div>
      </div>
    </div>
  );
}