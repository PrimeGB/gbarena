// Rank ladder: Shield (Unranked-Gold) -> Sword (Platinum-Master) -> Crown (Champion-Immortal).
// Each step within a stage adds detail, so the emblem keeps getting better.

export type RankStage = "shield" | "sword" | "crown";

export const RANK_TIERS = [
  { name: "Unranked", min: 0, stage: "shield" as RankStage, level: 0, light: "#8fa9c2", mid: "#4b6178", dark: "#1c2a3a" },
  { name: "Bronze", min: 1, stage: "shield" as RankStage, level: 1, light: "#f0b27a", mid: "#b8702f", dark: "#5a2f0e" },
  { name: "Silver", min: 100, stage: "shield" as RankStage, level: 2, light: "#f4f8fc", mid: "#a9b8c8", dark: "#46566a" },
  { name: "Gold", min: 250, stage: "shield" as RankStage, level: 3, light: "#ffe27a", mid: "#e0a020", dark: "#7a4a08" },
  { name: "Platinum", min: 500, stage: "sword" as RankStage, level: 1, light: "#9ff3ee", mid: "#2fbfc0", dark: "#0b5560" },
  { name: "Diamond", min: 1000, stage: "sword" as RankStage, level: 2, light: "#b8dcff", mid: "#3b8dff", dark: "#14307a" },
  { name: "Master", min: 2000, stage: "sword" as RankStage, level: 3, light: "#e3b8ff", mid: "#9b5de5", dark: "#35146b" },
  { name: "Champion", min: 3500, stage: "crown" as RankStage, level: 1, light: "#ffd9a0", mid: "#ff8a3d", dark: "#6b2a06" },
  { name: "Legend", min: 5500, stage: "crown" as RankStage, level: 2, light: "#ff9a8a", mid: "#e8233b", dark: "#5a0a1c" },
  { name: "Immortal", min: 8000, stage: "crown" as RankStage, level: 3, light: "#ffffff", mid: "#ffd45a", dark: "#8a5a00" },
];

export function getRankTier(points: number) {
  let index = 0;
  RANK_TIERS.forEach((tier, i) => {
    if (points >= tier.min && (i > 0 ? points > 0 : true)) index = i;
  });
  return { ...RANK_TIERS[index], index };
}

const OUT = { strokeLinejoin: "round" as const };

function Wings({ fill, stroke, big }: { fill: string; stroke: string; big?: boolean }) {
  return (
    <>
      {[1, -1].map((side) => (
        <g key={side} transform={side === 1 ? "" : "translate(200 0) scale(-1 1)"}>
          <path d="M44 88 L8 60 L16 94 L2 98 L18 120 L10 136 L36 132 L48 146 Z" fill={fill} stroke={stroke} strokeWidth="2" {...OUT} />
          {big && <path d="M42 66 L18 30 L26 68 L8 60 L30 86 Z" fill={fill} stroke={stroke} strokeWidth="2" {...OUT} />}
        </g>
      ))}
    </>
  );
}

function Sparkle({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return <path d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`} fill={fill} />;
}

export function RankEmblem({ tierIndex }: { tierIndex: number }) {
  const tier = RANK_TIERS[tierIndex];
  const id = `emb${tierIndex}`;
  const body = `url(#${id}-body)`;
  const core = `url(#${id}-core)`;
  const L = tier.level;
  const glow = tierIndex >= 3 ? `drop-shadow(0 0 ${2 + tierIndex * 0.8}px ${tier.mid}) saturate(.9) contrast(1.12)` : "saturate(.85) contrast(1.1)";

  return (
    <svg className="pf-emblem" viewBox="0 0 200 200" aria-hidden="true" shapeRendering="geometricPrecision" style={{ filter: glow }}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tier.light} />
          <stop offset=".22" stopColor={tier.mid} />
          <stop offset=".5" stopColor={tier.dark} />
          <stop offset=".58" stopColor={tier.mid} />
          <stop offset="1" stopColor={tier.dark} />
        </linearGradient>
        <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1a29" />
          <stop offset="1" stopColor="#03080e" />
        </linearGradient>
        <radialGradient id={`${id}-gem`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".4" stopColor={tier.light} />
          <stop offset="1" stopColor={tier.dark} />
        </radialGradient>
      </defs>

      {tier.stage === "shield" && (
        <>
          {L >= 2 && <Wings fill={body} stroke={tier.dark} big={L >= 3} />}
          <path d="M100 26 L158 44 V102 C158 140 130 166 100 182 C70 166 42 140 42 102 V44 Z" fill={body} stroke={tier.dark} strokeWidth="3" {...OUT} />
          <path d="M100 38 L146 52 V102 C146 132 124 154 100 168 C76 154 54 132 54 102 V52 Z" fill={core} stroke={tier.light} strokeWidth="1.5" {...OUT} />
          {L === 0 && <circle cx="100" cy="104" r="14" fill="none" stroke={tier.mid} strokeWidth="3" strokeDasharray="5 5" />}
          {L >= 1 && <path d="M100 38 V168" stroke={tier.mid} strokeOpacity=".35" strokeWidth="2" />}
          {Array.from({ length: L }).map((_, i) => {
            const y = 138 - i * 20;
            return <path key={i} d={`M72 ${y} L100 ${y - 22} L128 ${y} L128 ${y + 11} L100 ${y - 11} L72 ${y + 11} Z`} fill={body} stroke={tier.dark} strokeWidth="1" {...OUT} />;
          })}
          {L >= 3 && <path d="M100 30 L106 46 L124 47 L110 58 L115 75 L100 65 L85 75 L90 58 L76 47 L94 46 Z" fill={`url(#${id}-gem)`} stroke={tier.dark} strokeWidth="1.2" {...OUT} />}
        </>
      )}

      {tier.stage === "sword" && (
        <>
          {L >= 2 && <Wings fill={body} stroke={tier.dark} big={L >= 3} />}
          {L >= 3 && (
            <>
              {[1, -1].map((side) => (
                <g key={side} transform={`rotate(${side * 38} 100 100)`}>
                  <path d="M92 150 L92 34 L100 14 L108 34 L108 150 Z" fill={body} stroke={tier.dark} strokeWidth="2" {...OUT} />
                  <path d="M100 18 V146" stroke={tier.light} strokeOpacity=".6" strokeWidth="2" />
                </g>
              ))}
            </>
          )}
          {/* main blade */}
          <path d="M100 6 L112 30 V128 H88 V30 Z" fill={body} stroke={tier.dark} strokeWidth="3" {...OUT} />
          <path d="M100 12 V124" stroke={tier.light} strokeWidth="3" strokeOpacity=".75" />
          <path d="M94 30 V124 M106 30 V124" stroke={tier.dark} strokeOpacity=".35" strokeWidth="1.5" />
          {/* guard */}
          <path
            d={L >= 2 ? "M48 128 L74 120 L100 128 L126 120 L152 128 L140 142 H60 Z" : "M58 128 H142 V140 H58 Z"}
            fill={body}
            stroke={tier.dark}
            strokeWidth="3"
            {...OUT}
          />
          {/* grip & pommel */}
          <rect x="93" y="142" width="14" height="30" fill={core} stroke={tier.mid} strokeWidth="2" />
          <path d="M93 150 H107 M93 158 H107 M93 166 H107" stroke={tier.light} strokeOpacity=".5" />
          <circle cx="100" cy="180" r="10" fill={body} stroke={tier.dark} strokeWidth="3" />
          {L >= 2 && <circle cx="100" cy="132" r="6" fill={`url(#${id}-gem)`} stroke={tier.dark} strokeWidth="1.2" />}
          {L >= 3 && <Sparkle x={100} y={10} s={11} fill="#fff" />}
        </>
      )}

      {tier.stage === "crown" && (
        <>
          {L >= 3 && (
            <g stroke={tier.light} strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round">
              {Array.from({ length: 9 }).map((_, i) => {
                const a = (-80 + i * 20) * (Math.PI / 180);
                return <path key={i} d={`M${100 + Math.cos(a) * 62} ${100 + Math.sin(a) * 62} L${100 + Math.cos(a) * 92} ${100 + Math.sin(a) * 92}`} />;
              })}
            </g>
          )}
          {L >= 2 && <Wings fill={body} stroke={tier.dark} big={L >= 3} />}
          {L >= 2 && (
            <g fill={tier.mid} stroke={tier.dark} strokeWidth="1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <ellipse key={i} cx="46" cy={150 - i * 9} rx="5" ry="9" transform={`rotate(${-40 + i * 9} 46 ${150 - i * 9})`} />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <ellipse key={`r${i}`} cx="154" cy={150 - i * 9} rx="5" ry="9" transform={`rotate(${40 - i * 9} 154 ${150 - i * 9})`} />
              ))}
            </g>
          )}
          {/* crown body: 3 / 5 / 7 points by level */}
          {L === 1 && <path d="M44 150 L38 70 L72 100 L100 52 L128 100 L162 70 L156 150 Z" fill={body} stroke={tier.dark} strokeWidth="3" {...OUT} />}
          {L === 2 && <path d="M40 150 L30 74 L58 104 L74 56 L100 98 L126 56 L142 104 L170 74 L160 150 Z" fill={body} stroke={tier.dark} strokeWidth="3" {...OUT} />}
          {L === 3 && <path d="M36 150 L24 80 L46 104 L58 50 L78 98 L100 36 L122 98 L142 50 L154 104 L176 80 L164 150 Z" fill={body} stroke={tier.dark} strokeWidth="3" {...OUT} />}
          <rect x={L === 3 ? 36 : L === 2 ? 40 : 44} y="146" width={L === 3 ? 128 : L === 2 ? 120 : 112} height="22" rx="4" fill={body} stroke={tier.dark} strokeWidth="3" />
          <path d={`M${L === 3 ? 46 : 52} 157 H${L === 3 ? 154 : 148}`} stroke={tier.light} strokeOpacity=".6" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
          {/* jewels */}
          <circle cx="100" cy={L === 3 ? 34 : L === 2 ? 96 : 50} r={L === 3 ? 9 : 7} fill={`url(#${id}-gem)`} stroke={tier.dark} strokeWidth="1.5" />
          {L >= 2 && [74, 126].map((x) => <circle key={x} cx={x} cy="54" r="6" fill={`url(#${id}-gem)`} stroke={tier.dark} strokeWidth="1.2" />)}
          {[64, 100, 136].map((x) => <circle key={x} cx={x} cy="157" r={L === 3 ? 6 : 5} fill={`url(#${id}-gem)`} stroke={tier.dark} strokeWidth="1.2" />)}
          {L >= 3 && <Sparkle x={158} y={44} s={10} fill="#fff" />}
          {L >= 3 && <Sparkle x={44} y={52} s={8} fill="#fff" />}
        </>
      )}
    </svg>
  );
}
