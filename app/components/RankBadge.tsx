import { rankFromXp, type PlayerRank } from "@/lib/playerRank";

// Division buildup: lower divisions show the dim badge core; wings, crown and
// glow reveal outward each division until the full emblem appears at V.
const REVEAL = [
  { solid: 34, fade: 56, saturate: 0.62, brightness: 0.78 },
  { solid: 46, fade: 68, saturate: 0.74, brightness: 0.85 },
  { solid: 58, fade: 80, saturate: 0.86, brightness: 0.92 },
  { solid: 72, fade: 93, saturate: 0.95, brightness: 0.98 },
  { solid: 88, fade: 118, saturate: 1, brightness: 1.04 },
];

export function RankBadgeArt({ rank, size = 48 }: { rank: PlayerRank; size?: number }) {
  const { tier, division } = rank;
  const step = REVEAL[division - 1];
  const mask = `radial-gradient(ellipse closest-side at 50% 47%, #000 ${step.solid}%, transparent ${step.fade}%)`;
  const glow = division >= 4 ? ` drop-shadow(0 0 ${Math.max(4, size / 8)}px ${tier.glow})` : "";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/ranks/${tier.key}.png?v=2`}
      alt={`${rank.title} rank badge`}
      title={rank.title}
      width={size}
      height={Math.round(size * (320 / 360))}
      style={{
        objectFit: "contain",
        maskImage: mask,
        WebkitMaskImage: mask,
        filter: `saturate(${step.saturate}) brightness(${step.brightness})${glow}`,
      }}
    />
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
        <strong style={{ color: rank.tier.light, fontSize: 13 }}>{rank.title}</strong>
        <small style={{ color: "#8fa9c0", fontSize: 11 }}>Level {rank.level} · {rank.xp.toLocaleString()} XP</small>
      </span>
    </span>
  );
}
