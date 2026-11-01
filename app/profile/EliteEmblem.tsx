// Top 250 emblems: every position (1-250) renders differently and gets strictly more
// elaborate as the number drops. #1 is the most decorated emblem on the site.

export const ELITE_LIMIT = 250;

const BANDS = [
  { max: 250, name: "Vanguard", light: "#e2e8f0", mid: "#7c8da3", dark: "#1f2a38", accent: "#ff5a3c" },
  { max: 200, name: "Warlord", light: "#ff9a8a", mid: "#d41f3a", dark: "#4a0614", accent: "#ffb347" },
  { max: 150, name: "Overlord", light: "#e8c4ff", mid: "#8e3fe0", dark: "#2a0b5c", accent: "#5de6ff" },
  { max: 100, name: "Sovereign", light: "#b8fff4", mid: "#14c9b8", dark: "#06444a", accent: "#ffffff" },
  { max: 50, name: "Apex", light: "#fff0a8", mid: "#f0a417", dark: "#6a3a00", accent: "#ff5a1f" },
  { max: 25, name: "Mythic", light: "#ffd6f5", mid: "#e0359a", dark: "#4a0a3a", accent: "#ffe27a" },
  { max: 10, name: "Paragon", light: "#ffffff", mid: "#ffd45a", dark: "#7a4a00", accent: "#7ad7ff" },
  { max: 1, name: "Number One", light: "#ffffff", mid: "#ffe9a0", dark: "#8a5a00", accent: "#ff4fd8" },
];

export function getEliteBand(position: number) {
  let band = BANDS[0];
  for (const b of BANDS) if (position <= b.max) band = b;
  return band;
}

function pseudo(n: number, salt: number) {
  const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function EliteEmblem({ position }: { position: number }) {
  const p = Math.min(ELITE_LIMIT, Math.max(1, Math.round(position)));
  const band = getEliteBand(p);
  const t = (ELITE_LIMIT - p) / (ELITE_LIMIT - 1);
  const id = `elite${p}`;
  const metal = `url(#${id}-m)`;
  const plate = `url(#${id}-p)`;

  const rays = 6 + Math.floor(t * 18);
  const rayLen = 14 + t * 30;
  const wingPairs = 1 + Math.floor(t * 4.99);
  const crestCount = 3 + 2 * Math.floor(t * 5.99);
  const hasLaurel = p <= 25;
  const hasCrown = p <= 10;
  const hasHalo = p <= 3;
  const isFirst = p === 1;
  const sparks = p <= 50 ? Math.min(10, 2 + Math.floor((51 - p) / 6)) : 0;
  const glowPx = 3 + t * 14;

  const crestW = 70 / crestCount;
  let crest = "M65 40";
  for (let i = 0; i < crestCount; i++) {
    const mid = (crestCount - 1) / 2;
    const h = 14 + 24 * (1 - Math.abs(i - mid) / (mid + 1)) + t * 14;
    crest += ` L${65 + i * crestW + crestW / 2} ${40 - h} L${65 + (i + 1) * crestW} 40`;
  }
  crest += " Z";

  const label = String(p);
  const fontSize = label.length === 1 ? 52 : label.length === 2 ? 44 : 34;

  return (
    <svg
      className="pf-emblem"
      viewBox="-30 -30 260 260"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
      style={{ filter: `drop-shadow(0 0 ${glowPx}px ${band.mid}) contrast(1.12)`, overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={band.light} />
          <stop offset=".35" stopColor={band.mid} />
          <stop offset=".6" stopColor={band.dark} />
          <stop offset="1" stopColor={band.mid} />
        </linearGradient>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141c26" />
          <stop offset="1" stopColor="#04070b" />
        </linearGradient>
        <radialGradient id={`${id}-aura`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={band.light} stopOpacity=".55" />
          <stop offset="1" stopColor={band.mid} stopOpacity="0" />
        </radialGradient>
        {isFirst && (
          <linearGradient id={`${id}-rb`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff4fd8" />
            <stop offset=".25" stopColor="#ffe27a" />
            <stop offset=".5" stopColor="#7affc8" />
            <stop offset=".75" stopColor="#6ab8ff" />
            <stop offset="1" stopColor="#ff4fd8" />
          </linearGradient>
        )}
      </defs>

      {t > 0.3 && <circle cx="100" cy="100" r={92 + t * 20} fill={`url(#${id}-aura)`} />}

      <g>
        {p <= 150 && (
          <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur={isFirst ? "20s" : "60s"} repeatCount="indefinite" />
        )}
        <g stroke={band.light} strokeOpacity=".7" strokeWidth={1.5 + t * 2.5} strokeLinecap="round">
          {Array.from({ length: rays }).map((_, i) => {
            const a = (i / rays) * Math.PI * 2 + pseudo(p, 1) * 0.3;
            const len = rayLen * (i % 2 === 0 ? 1 : 0.6);
            return <path key={i} d={`M${100 + Math.cos(a) * 86} ${100 + Math.sin(a) * 86} L${100 + Math.cos(a) * (86 + len)} ${100 + Math.sin(a) * (86 + len)}`} />;
          })}
        </g>
      </g>

      {Array.from({ length: wingPairs }).map((_, i) => {
        const y = 104 - i * 15;
        const d = `M42 ${y} L${22 - i * 7} ${y - 26 - i * 3} L${26 - i * 7} ${y - 4} L${8 - i * 7} ${y + 2} L42 ${y + 18} Z`;
        return (
          <g key={i}>
            <path d={d} fill={metal} stroke={band.dark} strokeWidth="2" strokeLinejoin="miter" />
            <path d={d} transform="translate(200 0) scale(-1 1)" fill={metal} stroke={band.dark} strokeWidth="2" strokeLinejoin="miter" />
          </g>
        );
      })}

      <path d={crest} fill={metal} stroke={band.dark} strokeWidth="2" strokeLinejoin="miter" />

      <path d="M100 30 L162 46 L162 112 L100 188 L38 112 L38 46 Z" fill={metal} stroke={band.dark} strokeWidth="3" strokeLinejoin="miter" />
      <path d="M100 30 L38 46 L38 112 L100 188 Z" fill="#fff" opacity=".14" />
      <path d="M100 44 L150 57 L150 108 L100 170 L50 108 L50 57 Z" fill={plate} stroke={isFirst ? `url(#${id}-rb)` : band.light} strokeWidth={1.5 + t * 1.5} strokeLinejoin="miter" />
      <path d="M100 44 L150 57 L150 108 L100 170 L50 108 L50 57 Z" fill="none" stroke={band.accent} strokeOpacity={0.25 + t * 0.55} strokeWidth="1" transform="translate(100 107) scale(.84) translate(-100 -107)" />

      <text
        x="100"
        y={113 + fontSize * 0.1}
        textAnchor="middle"
        fontFamily="Impact, 'Arial Black', sans-serif"
        fontWeight="900"
        fontSize={fontSize}
        fill={isFirst ? `url(#${id}-rb)` : band.light}
        stroke={band.mid}
        strokeWidth="1.5"
      >
        {label}
      </text>
      <path d="M72 138 L100 124 L128 138" fill="none" stroke={band.accent} strokeWidth="3" strokeLinejoin="miter" opacity={0.5 + t * 0.5} />

      {hasLaurel && (
        <g fill={metal} stroke={band.dark} strokeWidth="1">
          {Array.from({ length: p <= 10 ? 9 : 6 }).map((_, i) => {
            const n = p <= 10 ? 9 : 6;
            const a = (110 + (i / (n - 1)) * 70) * (Math.PI / 180);
            const x = 100 + Math.cos(a) * 82;
            const y = 108 + Math.sin(a) * 76;
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx="4" ry="11" transform={`rotate(${(a * 180) / Math.PI - 90} ${x} ${y})`} />
                <ellipse cx={200 - x} cy={y} rx="4" ry="11" transform={`rotate(${180 - (a * 180) / Math.PI + 90} ${200 - x} ${y})`} />
              </g>
            );
          })}
        </g>
      )}

      {hasCrown && (
        <g>
          <path d="M70 36 L74 6 L88 26 L100 -6 L112 26 L126 6 L130 36 Z" fill={metal} stroke={band.dark} strokeWidth="2.5" strokeLinejoin="miter" />
          <path d="M74 36 H126" stroke={band.accent} strokeWidth="3" />
        </g>
      )}

      {hasHalo && (
        <g fill="none" stroke={isFirst ? `url(#${id}-rb)` : band.light} strokeWidth={isFirst ? 3 : 2}>
          <ellipse cx="100" cy="-14" rx={isFirst ? 46 : 38} ry="9" />
          {isFirst && <ellipse cx="100" cy="-14" rx="60" ry="13" strokeOpacity=".6" />}
        </g>
      )}

      {Array.from({ length: sparks }).map((_, i) => {
        const a = pseudo(p, i + 5) * Math.PI * 2;
        const r = 90 + pseudo(p, i + 40) * 38;
        const s = 4 + pseudo(p, i + 80) * 5 + t * 3;
        const x = 100 + Math.cos(a) * r;
        const y = 100 + Math.sin(a) * r;
        return (
          <path key={i} d={`M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`} fill="#fff">
            <animate attributeName="opacity" values="1;.2;1" dur={`${1.4 + pseudo(p, i) * 1.6}s`} repeatCount="indefinite" />
          </path>
        );
      })}
    </svg>
  );
}
