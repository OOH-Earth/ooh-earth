import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export default function InfoTip({ label, children, side = "top" }) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label={label} className="inline-flex shrink-0 align-middle text-dim transition-colors hover:text-ozone">
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[230px] border border-slate2/60 bg-card font-mono text-[10px] leading-relaxed text-darkgray normal-case tracking-normal">
          {children || label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}