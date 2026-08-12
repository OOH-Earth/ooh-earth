import {
  Loader2,
  AlertTriangle,
  Leaf,
  Droplet,
  Recycle,
  Users,
  TrendingUp,
  BadgeCheck,
} from 'lucide-react';

const riskColor = { low: '#39FF14', moderate: '#EDFF00', high: '#FF5C00', critical: '#FF007F' };
const usd = (n) => `$${Number(n || 0).toFixed(2)}`;

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="border border-slate2/60 bg-void p-3">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
        <Icon className="h-3 w-3" style={color ? { color } : undefined} /> {label}
      </div>
      <div className="mt-1 font-display text-lg font-black tabular text-silver">{value}</div>
    </div>
  );
}

export default function TrueCostResult({ data, loading, error }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 border border-slate2/60 bg-card p-12">
        <Loader2 className="h-6 w-6 animate-spin text-ozone" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          Auditing true cost…
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 border border-flare/50 bg-card p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
        <AlertTriangle className="h-4 w-4" /> {error}
      </div>
    );
  }
  if (!data) return null;

  const retail = Number(data.retail_price_usd) || 0;
  const trueCost = Number(data.true_cost_usd) || 0;
  const ext = Number(data.externality_usd) || Math.max(0, trueCost - retail);
  const max = Math.max(retail, trueCost, 1);
  const rc = riskColor[data.labor_risk] || '#B2B2B2';

  return (
    <div className="border border-slate2/60 bg-card">
      <div className="border-b border-slate2/60 p-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
            // TrueCost audit
          </span>
          {data.identified ? (
            <BadgeCheck className="h-3.5 w-3.5 text-ozone" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-flare" />
          )}
        </div>
        <h3 className="mt-1 font-display text-xl font-black text-silver">
          {data.product_name || 'Unknown product'}
        </h3>
        {data.brand_owner && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">
            {data.brand_owner}
          </p>
        )}
        {data.upc && <p className="mt-0.5 font-mono text-[9px] text-dim">UPC {data.upc}</p>}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <div className="mb-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            <span>Retail shelf price</span>
            <span className="tabular text-silver">{usd(retail)}</span>
          </div>
          <div className="h-2 w-full bg-void">
            <div className="h-full bg-silver/60" style={{ width: `${(retail / max) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            <span className="text-flare">True cost to society</span>
            <span className="tabular text-flare">{usd(trueCost)}</span>
          </div>
          <div className="h-2 w-full bg-void">
            <div className="h-full bg-flare" style={{ width: `${(trueCost / max) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between border border-flare/40 bg-flare/5 px-3 py-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
            <TrendingUp className="h-3.5 w-3.5" /> Unpriced externality
          </span>
          <span className="font-display text-lg font-black tabular text-flare">+{usd(ext)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 pt-0 md:grid-cols-4">
        <Stat
          icon={Leaf}
          label="Carbon"
          value={`${Number(data.carbon_kg || 0).toFixed(1)} kg`}
          color="#FF5C00"
        />
        <Stat
          icon={Droplet}
          label="Water"
          value={`${Number(data.water_liters || 0).toLocaleString()} L`}
          color="#1F51FF"
        />
        <Stat
          icon={Users}
          label="Labor risk"
          value={(data.labor_risk || '—').toUpperCase()}
          color={rc}
        />
        <Stat
          icon={Recycle}
          label="Packaging"
          value={data.packaging_recyclable ? 'Recyclable' : 'Landfill'}
          color={data.packaging_recyclable ? '#39FF14' : '#FF5C00'}
        />
      </div>

      {Array.isArray(data.greenwashing_flags) && data.greenwashing_flags.length > 0 && (
        <div className="border-t border-slate2/60 p-4">
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-flare">
            <AlertTriangle className="h-3 w-3" /> Greenwashing flags
          </div>
          <ul className="space-y-1">
            {data.greenwashing_flags.map((f, i) => (
              <li key={i} className="font-display text-sm text-silver">
                — {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.brand_accountability && (
        <div className="border-t border-slate2/60 p-4">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            // Brand accountability
          </div>
          <p className="font-display text-sm leading-relaxed text-darkgray">
            {data.brand_accountability}
          </p>
        </div>
      )}

      {data.verdict && (
        <div className="border-t border-ozone/40 bg-ozone/5 p-4">
          <p className="font-display text-base font-bold text-silver">“{data.verdict}”</p>
        </div>
      )}
    </div>
  );
}
