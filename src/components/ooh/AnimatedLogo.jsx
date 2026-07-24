import MatrixSymbol from "@/components/ooh/MatrixSymbol";

export default function AnimatedLogo({ className = "" }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <MatrixSymbol className="h-6 w-6" />
      <span className="font-brand text-sm font-black tracking-tight text-silver transition-colors group-hover:text-ozone">
        ooh<span className="text-ozone">.</span>earth
      </span>
    </span>
  );
}