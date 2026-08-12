import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import useCoinData from '@/components/ooh/zora/useCoinData';
import { PRIMARY_COIN, fmtPrice, fmtCompact } from '@/components/ooh/zora/zoraConfig';

export default function ZoraMarketPanel() {
  const { data: d, error } = useCoinData(PRIMARY_COIN.addr, 20000);

  if (error && !d) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 border border-flare/40 bg-card">
        <AlertTriangle className="h-4 w-4 text-flare" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">
          // market signal lost
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          dexscreener unreachable · retrying
        </span>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="flex h-48 items-center justify-center border border-slate2/60 bg-card">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim animate-flicker">
          // acquiring market signal…
        </span>
      </div>
    );
  }

  const up = (d.change ?? 0) >= 0;
  const totalTx = (d.buys || 0) + (d.sells || 0);
  const buyPct = totalTx > 0 ? Math.round(((d.buys || 0) / totalTx) * 100) : 50;

  return (
    <div className="border border-slate2/60 bg-card p-5 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate2/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-ozone px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void">
              {PRIMARY_COIN.symbol}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
              {PRIMARY_COIN.note}
            </span>
          </div>
          <div className="mt-3 font-display text-4xl font-bold tracking-[-0.02em] text-silver">
            {fmtPrice(d.price)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Stat
            label="24h"
            value={d.change == null ? '--' : `${Math.abs(d.change).toFixed(2)}%`}
            tone={up ? 'up' : 'down'}
            icon={up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          />
          <Stat label="mcap" value={fmtCompact(d.mcap)} />
          <Stat label="vol 24h" value={fmtCompact(d.vol)} />
        </div>
      </div>

      <div className="mt-4 h-40 w-full">
        {d.history.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.history} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(241,241,241,0.1)',
                  fontSize: 11,
                }}
                labelFormatter={() => ''}
                formatter={(v) => [fmtPrice(v), 'price']}
              />
              <Line
                type="monotone"
                dataKey="p"
                stroke={up ? '#EDFF00' : '#FF5C00'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[9px] uppercase tracking-[0.3em] text-dim">
            <Activity className="mr-2 h-3 w-3 animate-flicker" /> live session feed · streaming
          </div>
        )}
      </div>

      {/* Buy / sell pressure bar */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          <span>buys · {d.buys ?? '--'}</span>
          <span>pressure</span>
          <span>{d.sells ?? '--'} · sells</span>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden bg-slate2">
          <div className="bg-ozone" style={{ width: `${buyPct}%` }} />
          <div className="bg-flare" style={{ width: `${100 - buyPct}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={PRIMARY_COIN.chartUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare"
        >
          Trade ↗
        </a>
        <a
          href={PRIMARY_COIN.chartUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
        >
          Chart ↗
        </a>
      </div>
      {error && (
        <div className="mt-3 flex items-center gap-2 border border-flare/30 bg-flare/[0.06] px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-flare" />
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-flare/80">
            // stale data — last fetch failed, retrying
          </span>
        </div>
      )}
      <div className="mt-4 flex items-start gap-2 border border-slate2/60 bg-void/50 px-3 py-2.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim" />
        <p className="font-mono text-[10px] leading-relaxed text-darkgray">
          <span className="font-bold text-silver">Not financial advice.</span> Market data streamed
          from DexScreener — verify independently before any transaction. OOH Earth does not provide
          investment recommendations.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = '', icon = null }) {
  return (
    <div className="text-right">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{label}</div>
      <div
        className={`mt-0.5 flex items-center justify-end gap-1 font-mono text-sm font-bold ${tone === 'up' ? 'text-ozone' : tone === 'down' ? 'text-flare' : 'text-silver'}`}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}
