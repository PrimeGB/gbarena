import { RANK_TIERS } from "./RankEmblem";

// Hard-edged, faceted military insignia. Flat metal, sharp blades, no round jewels.
const CHEVRONS = [0, 1, 2, 3, 1, 2, 3, 1, 2, 3];

function mirror(d: string, fill: string, stroke: string) {
  return (
    <>
      <path d={d} fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="miter" />
      <path d={d} transform="translate(200 0) scale(-1 1)" fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="miter" />
    </>
  );
}

export function RankEmblemBold({ tierIndex }: { tierIndex: number }) {
  const t = RANK_TIERS[tierIndex];
  const id = `bold${tierIndex}`;
  const metal = `url(#${id}-m)`;
  const plate = `url(#${id}-p)`;
  const chev = CHEVRONS[tierIndex];
  const glow = tierIndex >= 3 ? `drop-shadow(0 0 ${3 + tierIndex}px ${t.mid}) contrast(1.15)` : "contrast(1.1)";

  const crestCount = t.level === 1 ? 3 : t.level === 2 ? 5 : 7;
  const spikeW = 88 / crestCount;
  let crest = "M56 44";
  for (let i = 0; i < crestCount; i++) {
    const x0 = 56 + i * spikeW;
    const mid = (crestCount - 1) / 2;
    const h = 22 + 30 * (1 - Math.abs(i - mid) / (mid + 1));
    crest += ` L${x0 + spikeW / 2} ${44 - h} L${x0 + spikeW} 44`;
  }
  crest += " Z";

  return (
    <svg className="pf-emblem" viewBox="0 0 200 200" aria-hidden="true" shapeRendering="geometricPrecision" style={{ filter: glow }}>
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.light} />
          <stop offset=".35" stopColor={t.mid} />
          <stop offset=".6" stopColor={t.dark} />
          <stop offset="1" stopColor={t.mid} />
        </linearGradient>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141c26" />
          <stop offset="1" stopColor="#05080c" />
        </linearGradient>
      </defs>

      {tierIndex >= 5 && mirror("M40 70 L4 38 L16 84 L0 104 L40 112 Z", metal, t.dark)}
      {tierIndex >= 2 && mirror("M40 52 L14 40 L22 70 L10 86 L40 96 Z", metal, t.dark)}

      {t.stage === "crown" && <path d={crest} fill={metal} stroke={t.dark} strokeWidth="2" strokeLinejoin="miter" />}
      {t.stage === "sword" && <path d="M100 6 L110 34 V104 H90 V34 Z" fill={metal} stroke={t.dark} strokeWidth="2" strokeLinejoin="miter" />}

      <path d="M100 30 L160 46 L160 112 L100 184 L40 112 L40 46 Z" fill={metal} stroke={t.dark} strokeWidth="3" strokeLinejoin="miter" />
      <path d="M100 30 L40 46 L40 112 L100 184 Z" fill="#fff" opacity=".12" />
      <path d="M100 44 L148 57 L148 108 L100 166 L52 108 L52 57 Z" fill={plate} stroke={t.light} strokeWidth="1.5" strokeLinejoin="miter" />
      <path d="M100 44 V166" stroke={t.mid} strokeOpacity=".3" strokeWidth="1.5" />

      {t.stage === "sword" && <path d="M100 12 V100" stroke={t.light} strokeWidth="2" opacity=".8" />}

      {chev === 0 && <path d="M100 84 L122 108 L100 132 L78 108 Z" fill="none" stroke={t.mid} strokeWidth="3" strokeDasharray="6 5" />}
      {Array.from({ length: chev }).map((_, i) => {
        const y = 146 - i * 22;
        return (
          <path
            key={i}
            d={`M70 ${y} L100 ${y - 22} L130 ${y} L130 ${y + 10} L100 ${y - 12} L70 ${y + 10} Z`}
            fill={metal}
            stroke={t.dark}
            strokeWidth="1.5"
            strokeLinejoin="miter"
          />
        );
      })}
    </svg>
  );
}
