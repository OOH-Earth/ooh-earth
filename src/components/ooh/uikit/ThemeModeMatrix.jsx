import DarkSpecimen from "./modes/DarkSpecimen";
import LightSpecimen from "./modes/LightSpecimen";
import MatrixSpecimen from "./modes/MatrixSpecimen";
import BetaSpecimen from "./modes/BetaSpecimen";
import CraftySpecimen from "./modes/CraftySpecimen";

const MODES = [
  { key: "dark", label: "Dark · Orbital", Comp: DarkSpecimen },
  { key: "light", label: "Light · Solar Smoke", Comp: LightSpecimen },
  { key: "matrix", label: "Matrix · Terminal", Comp: MatrixSpecimen },
  { key: "beta", label: "BETA · Devtools", Comp: BetaSpecimen },
  { key: "crafty", label: "Crafty · Marker", Comp: CraftySpecimen },
];

export default function ThemeModeMatrix() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {MODES.map((m) => (
        <figure key={m.key} className="flex flex-col gap-1.5">
          <figcaption className="flex items-center justify-between px-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/70">{m.label}</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">.{m.key}</span>
          </figcaption>
          <m.Comp />
        </figure>
      ))}
    </div>
  );
}