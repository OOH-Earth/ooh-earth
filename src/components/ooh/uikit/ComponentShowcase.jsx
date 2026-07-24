import CopyField from "./CopyField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ComponentShowcase() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button className="bg-ozone px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare">Primary</button>
        <button className="border border-slate2/70 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone/60 hover:text-ozone">Secondary</button>
        <button className="border-2 border-flare bg-flare px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare/80">Flare</button>
        <span className="flex items-center border border-ozone/50 bg-ozone/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">Badge · verified</span>
        <span className="flex items-center border border-flare/50 bg-flare/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">Badge · urgent</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <CopyField label="Primary button" value="bg-ozone px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void" />
        <CopyField label="Secondary button" value="border border-slate2/70 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver" />
        <CopyField label="Flare button" value="border-2 border-flare bg-flare px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void" />
        <CopyField label="Badge · verified" value="border border-ozone/50 bg-ozone/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone" />
      </div>

      <div className="max-w-sm space-y-2">
        <Label className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">Field label</Label>
        <Input className="border-slate2 bg-card font-mono text-sm text-silver" placeholder="enter callsign" />
        <CopyField label="Input" value="border-slate2 bg-card font-mono text-sm text-silver" />
      </div>

      <div className="border border-slate2/60 bg-card p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Card</span>
        <h3 className="mt-2 font-display text-lg font-bold tracking-[-0.02em] text-silver">Surface card</h3>
        <p className="mt-1 font-body text-sm leading-[1.6] text-darkgray">Sharp 0px radius, void canvas, slate borders, ozone accents — the core surface unit.</p>
      </div>
      <CopyField label="Card" value="border border-slate2/60 bg-card p-5" />

      <div className="hi-vis-stripes h-3 w-full" />
      <CopyField label="Hi-vis stripes" value="background: repeating-linear-gradient(45deg,#EDFF00 0,#EDFF00 12px,#000 12px,#000 24px);" />
    </div>
  );
}