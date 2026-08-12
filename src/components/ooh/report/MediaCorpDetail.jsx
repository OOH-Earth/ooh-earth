import { Image } from '@/components/ui/image';
import {
  X,
  ExternalLink,
  Globe,
  Building2,
  MapPin,
  Layers,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  FileText,
  TrendingUp,
} from 'lucide-react';

function StatCell({ icon: Icon, label, value }) {
  if (!value || value === 0 || value === '—') return null;
  return (
    <div className="bg-void px-3 py-2.5">
      <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
      <div className="mt-0.5 font-display text-sm font-bold text-silver tabular">{value}</div>
    </div>
  );
}

export default function MediaCorpDetail({ corp, onClose }) {
  if (!corp) return null;
  const scopeColor =
    corp.scope === 'global'
      ? 'text-ozone'
      : corp.scope === 'regional'
        ? 'text-flare'
        : 'text-darkgray';

  return (
    <div
      className="absolute inset-0 z-[1100] flex justify-end bg-void/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-slate2/60 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand imagery header */}
        <div className="relative h-48 shrink-0 overflow-hidden border-b border-slate2/60">
          <Image
            src={corp.image_url}
            alt={corp.name}
            className="h-full w-full"
            fittingType="fill"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-slate2 bg-void/80 text-silver backdrop-blur-md transition-colors hover:border-flare hover:text-flare"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Scope badge */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 border border-slate2 bg-void/80 px-2 py-1 backdrop-blur-md">
            <span
              className={`h-2 w-2 rounded-full ${corp.scope === 'global' ? 'bg-ozone' : corp.scope === 'regional' ? 'bg-flare' : 'bg-darkgray'}`}
            />
            <span
              className={`font-mono text-[8px] font-bold uppercase tracking-[0.2em] ${scopeColor}`}
            >
              {corp.scope}
            </span>
          </div>
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-silver">
              {corp.name}
            </h2>
            <div className="mt-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
              <MapPin className="h-2.5 w-2.5" /> {corp.hq}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="font-display text-[13px] leading-[1.5] text-darkgray">{corp.desc}</p>

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40">
            <StatCell icon={Globe} label="Countries" value={corp.countries || '—'} />
            <StatCell
              icon={Layers}
              label="Panels"
              value={corp.panels ? corp.panels.toLocaleString() : '—'}
            />
            <StatCell icon={Building2} label="Parent" value={corp.parent || '—'} />
            <StatCell icon={Calendar} label="Founded" value={corp.founded_year || '—'} />
            <StatCell
              icon={DollarSign}
              label="Revenue (M USD)"
              value={corp.revenue_usd_m ? `$${corp.revenue_usd_m.toLocaleString()}` : '—'}
            />
            <StatCell
              icon={Users}
              label="Employees"
              value={corp.employees ? corp.employees.toLocaleString() : '—'}
            />
            <StatCell icon={TrendingUp} label="Ticker" value={corp.stock_ticker || '—'} />
            <StatCell icon={Globe} label="Scope" value={corp.scope} />
          </div>

          {/* Controversy tags */}
          {corp.controversy_tags && corp.controversy_tags.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-flare">
                <AlertTriangle className="h-3 w-3" /> Controversy flags
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {corp.controversy_tags.map((t) => (
                  <span
                    key={t}
                    className="border border-flare/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-flare"
                  >
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Operating regions */}
          {corp.regions && corp.regions.length > 0 && (
            <div className="mt-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
                Operating regions
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {corp.regions.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] border border-slate2 text-darkgray"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Data sources */}
          {corp.data_sources && corp.data_sources.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
                <FileText className="h-3 w-3" /> Sources
              </div>
              <div className="mt-2 space-y-1">
                {corp.data_sources.map((s, i) => (
                  <div key={i} className="font-mono text-[9px] text-dim/70">
                    · {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External links */}
          <div className="mt-5 flex flex-col gap-2">
            {corp.url && (
              <a
                href={corp.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 border border-ozone bg-ozone/10 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Visit {corp.name}
              </a>
            )}
            {corp.sustainability_url && (
              <a
                href={corp.sustainability_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 border border-slate2 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
              >
                <FileText className="h-3 w-3" /> Sustainability report
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
