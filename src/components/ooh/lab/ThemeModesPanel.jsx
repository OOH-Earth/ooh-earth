import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { THEME_ORDER, SETTING_KEY } from "@/lib/themes";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Palette, Star } from "lucide-react";

const META = {
  dark: { label: "Dark" },
  light: { label: "Light" },
  matrix: { label: "Matrix" },
  beta: { label: "BETA" },
  crafty: { label: "Crafty" },
  guild: { label: "Guild" },
};

export default function ThemeModesPanel() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(null); // null = loading
  const [recId, setRecId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.SiteSetting.filter({ key: SETTING_KEY });
        const rec = rows?.[0];
        if (!active) return;
        if (rec) {
          setRecId(rec.id);
          const list = (rec.value || "").split(",").map((s) => s.trim()).filter(Boolean);
          setEnabled(list.length ? list : THEME_ORDER);
          // Dedup stale duplicate settings rows (keep the first / canonical)
          if (rows.length > 1) {
            rows.slice(1).forEach((r) => base44.entities.SiteSetting.delete(r.id).catch(() => {}));
          }
        } else {
          setEnabled(THEME_ORDER); // not configured → all on
        }
      } catch {
        if (active) setEnabled(THEME_ORDER);
      }
    })();
    return () => { active = false; };
  }, []);

  const toggle = (id) => {
    const cur = enabled && enabled.length ? enabled : THEME_ORDER;
    const next = cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id];
    const ordered = THEME_ORDER.filter((t) => next.includes(t));
    setEnabled(ordered);
    persist(ordered);
  };

  const persist = async (list) => {
    setSaving(true);
    const value = list.join(",");
    try {
      if (recId) {
        await base44.entities.SiteSetting.update(recId, { value });
      } else {
        const rec = await base44.entities.SiteSetting.create({ key: SETTING_KEY, value });
        if (rec?.id) setRecId(rec.id);
      }
      toast({ title: "Theme modes saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!enabled) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] text-silver/50">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" /> Loading theme modes…
      </div>
    );
  }

  return (
    <div className="px-4 py-3.5">
      <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/55">
        <Palette className="h-3.5 w-3.5 text-ozone" /> Theme modes · site-wide
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {THEME_ORDER.map((id) => {
          const on = enabled.includes(id);
          const isDefault = id === "matrix";
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all ${
                on ? "border-ozone bg-ozone text-void" : "border-slate2 text-silver/50 hover:border-silver/60"
              }`}
            >
              <span className={`h-1.5 w-1.5 ${on ? "bg-void/70" : "bg-silver/30"}`} />
              {META[id].label}
              {isDefault && <Star className="h-2.5 w-2.5 text-void/70" />}
            </button>
          );
        })}
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-ozone" />}
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.15em] text-silver/40">
        ★ matrix is the site default · toggles which modes appear in the header cycle · visitors on a disabled mode fall back to matrix
      </p>
    </div>
  );
}