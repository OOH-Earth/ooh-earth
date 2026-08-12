import { PLATFORMS } from './digitalConfig';

// Signal constellation: platforms as nodes orbiting the OOH hub;
// each bust renders as a live pulse along its platform's signal line.
export default function SignalConstellation({ busts = [], selectedId, onSelect }) {
  const cx = 200,
    cy = 200,
    R = 145;
  const nodes = PLATFORMS.map((p, i) => {
    const a = (i / PLATFORMS.length) * Math.PI * 2 - Math.PI / 2;
    return { ...p, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
  const counts = {};
  busts.forEach((b) => {
    counts[b.platform] = (counts[b.platform] || 0) + 1;
  });
  const selPlatform = (() => {
    const b = busts.find((x) => x.id === selectedId);
    return b ? b.platform : null;
  })();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden grid-bg">
      <svg viewBox="0 0 400 400" className="h-full max-h-[560px] w-full max-w-[560px]">
        {nodes.map((n) => (
          <line
            key={`l${n.id}`}
            x1={cx}
            y1={cy}
            x2={n.x}
            y2={n.y}
            stroke="rgba(241,241,241,0.07)"
            strokeWidth="1"
          />
        ))}
        {nodes.map((n) => {
          const c = counts[n.id] || 0;
          return Array.from({ length: Math.min(c, 6) }).map((_, k) => {
            const t = (k + 1) / 7;
            return (
              <circle
                key={`p${n.id}${k}`}
                cx={cx + (n.x - cx) * t}
                cy={cy + (n.y - cy) * t}
                r="2.6"
                fill={n.accent}
                className="animate-blink"
              />
            );
          });
        })}
        <circle
          cx={cx}
          cy={cy}
          r="9"
          fill="#EDFF00"
          style={{ filter: 'drop-shadow(0 0 6px rgba(237,255,0,0.5))' }}
        />
        <text
          x={cx}
          y={cy + 24}
          textAnchor="middle"
          fill="#B2B2B2"
          fontSize="8"
          fontFamily="monospace"
          letterSpacing="2"
        >
          OOH HUB
        </text>
        {nodes.map((n) => {
          const c = counts[n.id] || 0;
          const sel = selPlatform === n.id;
          return (
            <g
              key={n.id}
              className="cursor-pointer"
              onClick={() => {
                const first = busts.find((b) => b.platform === n.id);
                if (first) onSelect(first.id);
              }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={sel ? 17 : 13}
                fill="#0a0a0a"
                stroke={n.accent}
                strokeWidth={sel ? 2 : 1.5}
              />
              <circle cx={n.x} cy={n.y} r="4" fill={n.accent} opacity={c ? 1 : 0.3} />
              <text
                x={n.x}
                y={n.y + 26}
                textAnchor="middle"
                fill="#F1F1F1"
                fontSize="7"
                fontFamily="monospace"
                letterSpacing="1"
              >
                {n.label.split(' ')[0].toUpperCase()}
              </text>
              {c > 0 && (
                <text
                  x={n.x}
                  y={n.y - 19}
                  textAnchor="middle"
                  fill={n.accent}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {c}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
