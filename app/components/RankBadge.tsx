import { DIVISIONS, rankFromXp, type PlayerRank } from "@/lib/playerRank";

const SHIELD = "M32 3 L59 16 L59 46 Q59 54 52 58.5 L32 70 L12 58.5 Q5 54 5 46 L5 16 Z";
const RANK_ARTS_LEGEND = 9;

function star(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const chevron = (y: number) => `M19 ${y + 8} L32 ${y} L45 ${y + 8} L45 ${y + 14} L32 ${y + 6} L19 ${y + 14} Z`;

function Insignia({ tier, fill }: { tier: number; fill: string }) {
  const stroke = "rgba(0,0,0,.45)";
  const common = { fill, stroke, strokeWidth: 1, strokeLinejoin: "round" as const };
  switch (tier) {
    case 0:
      return <path d={chevron(27)} fill="none" stroke={fill} strokeWidth={2} strokeLinejoin="round" />;
    case 1:
      return <path d={chevron(27)} {...common} />;
    case 2:
      return <><path d={chevron(22)} {...common} /><path d={chevron(32)} {...common} /></>;
    case 3:
      return <><path d={chevron(18)} {...common} /><path d={chevron(27)} {...common} /><path d={chevron(36)} {...common} /></>;
    case 4:
      return <rect x={18} y={31} width={28} height={8} rx={2} {...common} />;
    case 5:
      return <><rect x={18} y={25} width={28} height={7} rx={2} {...common} /><rect x={18} y={37} width={28} height={7} rx={2} {...common} /></>;
    case 6:
      return (
        <>
          <path d="M32 18 C45 25 45 41 32 50 C19 41 19 25 32 18 Z" {...common} />
          <path d="M32 22 L32 48 M32 30 L26 26 M32 30 L38 26 M32 37 L25 33 M32 37 L39 33 M32 44 L27 41 M32 44 L37 41" stroke={stroke} strokeWidth={1.2} fill="none" />
        </>
      );
    case 7:
      return (
        <>
          <path d="M32 29 L22 23 L11 22 L17 28 L10 29 L19 34 L14 37 L25 38 L32 46 L39 38 L50 37 L45 34 L54 29 L47 28 L53 22 L42 23 Z" {...common} />
          <circle cx={32} cy={27} r={3.4} {...common} />
        </>
      );
    case 8:
      return (
        <>
          <polygon points={star(20, 35, 7)} {...common} />
          <polygon points={star(32, 33, 8.5)} {...common} />
          <polygon points={star(44, 35, 7)} {...common} />
        </>
      );
    default:
      return (
        <>
          <path d="M17 44 L16 27 L24 34 L32 21 L40 34 L48 27 L47 44 Z" {...common} />
          <rect x={16.5} y={44} width={31} height={5} rx={1.5} {...common} />
          <circle cx={32} cy={36} r={2.6} fill="#ff5fae" stroke={stroke} strokeWidth={0.8} />
          <circle cx={23.5} cy={39} r={1.8} fill="#7fe3ff" stroke={stroke} strokeWidth={0.6} />
          <circle cx={40.5} cy={39} r={1.8} fill="#7fe3ff" stroke={stroke} strokeWidth={0.6} />
          <polygon points={star(32, 14.5, 4)} fill="#fff6c8" stroke={stroke} strokeWidth={0.6} />
        </>
      );
  }
}

export function RankBadgeArt({ rank, size = 48 }: { rank: PlayerRank; size?: number }) {
  const { tier, tierIndex, division } = rank;
  const id = `rk-${tier.key}`;
  const legend = tierIndex === RANK_ARTS_LEGEND;
  return (
    <svg
      viewBox="0 0 64 74"
      width={size}
      height={size * (74 / 64)}
      role="img"
      aria-label={`${rank.title} rank badge`}
      style={{ overflow: "visible", filter: tierIndex >= 4 ? `drop-shadow(0 0 ${size / 10}px ${tier.glow})` : undefined }}
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
          {legend ? (
            <>
              <stop offset="0" stopColor="#fff1a8" />
              <stop offset=".45" stopColor="#ff8ad8" />
              <stop offset="1" stopColor="#5fd3ff" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor={tier.light} />
              <stop offset="1" stopColor={tier.dark} />
            </>
          )}
        </linearGradient>
        <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#13263a" />
          <stop offset="1" stopColor="#04090f" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={SHIELD} fill={`url(#${id}-face)`} stroke="rgba(0,0,0,.6)" strokeWidth={1.5} />
      <path d={SHIELD} transform="translate(32 37) scale(.8) translate(-32 -37)" fill={`url(#${id}-core)`} stroke={legend ? "#fff1a8" : tier.light} strokeOpacity={0.55} strokeWidth={1.6} />
      <g>
        <Insignia tier={tierIndex} fill={`url(#${id}-face)`} />
      </g>
      <path d="M32 3 L59 16 L59 30 Q32 20 5 30 L5 16 Z" fill={`url(#${id}-shine)`} />
      <g>
        {DIVISIONS.map((_, i) => {
          const x = 22 + i * 5;
          const on = i < division;
          return (
            <path
              key={i}
              d={`M${x} 54.5 L${x + 1.9} 56.8 L${x} 59.1 L${x - 1.9} 56.8 Z`}
              fill={on ? (legend ? "#fff1a8" : tier.light) : "rgba(255,255,255,.14)"}
            />
          );
        })}
      </g>
    </svg>
  );
}

export default function RankBadge({
  xp,
  size = 48,
  showTitle = false,
}: {
  xp: number | null | undefined;
  size?: number;
  showTitle?: boolean;
}) {
  const rank = rankFromXp(xp);
  if (!showTitle) {
    return (
      <span title={`${rank.title} · Level ${rank.level} · ${rank.xp.toLocaleString()} XP`} style={{ display: "inline-flex" }}>
        <RankBadgeArt rank={rank} size={size} />
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <RankBadgeArt rank={rank} size={size} />
      <span style={{ display: "grid", lineHeight: 1.2 }}>
        <strong style={{ color: rank.tierIndex === RANK_ARTS_LEGEND ? "#fff1a8" : rank.tier.light, fontSize: 13 }}>{rank.title}</strong>
        <small style={{ color: "#8fa9c0", fontSize: 11 }}>Level {rank.level} · {rank.xp.toLocaleString()} XP</small>
      </span>
    </span>
  );
}
