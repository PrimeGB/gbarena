"use client";

import { useId } from "react";
import AutoBadgeArt, { hasAutoBadge } from "./AutoBadges";

// Illustrated art (public/awards/art/N.png) for the awards that have a hand-made emblem.
const SPRITES: Record<string, number> = {
  "Founder Badge": 1,
  "Alpha Tester Medal": 2,
  "Beta Tester Medal": 3,
  "Community Contributor Plaque": 4,
  "Staff Pick Star": 5,
  "Hall of Fame Plaque": 6,
  "First Win Badge": 7,
  "10 Wins Badge": 8,
  "50 Wins Badge": 9,
  "100 Wins Badge": 10,
  "500 Wins Badge": 11,
  "1000 Wins Badge": 12,
  "Ladder Champion Shield": 13,
  "Season Champion Shield": 14,
  "Undefeated Season Shield": 15,
  "#1 Ranked Team Shield": 16,
  "Top 10 Team Ribbon": 17,
  "Top 100 Team Ribbon": 18,
  "Tournament Winner Trophy": 19,
  "Tournament Runner-Up Trophy": 20,
  "Tournament Finalist Trophy": 21,
  "Major Champion Shield": 22,
  "Grand Champion Crown": 23,
  "World Champion Trophy": 24,
  "1 Year Service Medal": 25,
  "3 Year Service Medal": 26,
  "5 Year Service Medal": 27,
  "Rival Slayer Shield": 28,
  "Community Legend Crown": 29,
  "GameBattles Immortal Crystal": 30,
};

type Tone = { rim: string; glow: string; text: string };

const TONES: Record<string, Tone> = {
  crimson: { rim: "#d6403f", glow: "#ff5a5a", text: "#ffb3ad" },
  gold: { rim: "#e2b34a", glow: "#f2c14e", text: "#ffe9a8" },
  azure: { rim: "#3a8fe0", glow: "#4db2ff", text: "#bfe3ff" },
  emerald: { rim: "#2fc48d", glow: "#38f2a7", text: "#c8ffe4" },
  violet: { rim: "#9b5de5", glow: "#c07bff", text: "#ecd4ff" },
  orange: { rim: "#ff8a3d", glow: "#ffa15c", text: "#ffd9b8" },
  ice: { rim: "#7ef0ff", glow: "#7ef0ff", text: "#e6fcff" },
};

function pickTone(name: string, group: string): Tone {
  const n = name.toLowerCase();
  const g = group.toLowerCase();
  if (n.includes("crystal")) return TONES.ice;
  if (/fortnite|pc champion|dynasty/.test(n)) return TONES.violet;
  if (/xbox|nintendo|call of duty|battlefield|rainbow|cross-platform|playstation|rocket|apex/.test(n)) return TONES.azure;
  if (g.includes("event")) return TONES.orange;
  if (g.includes("community") || g.includes("integrity") || g.includes("tester")) return TONES.emerald;
  if (g.includes("team") || g.includes("platform") || g.includes("game")) return TONES.azure;
  if (g.includes("tournament") || g.includes("season") || g.includes("champion") || g.includes("ranking")) return TONES.gold;
  if (g.includes("legacy")) return TONES.violet;
  return TONES.crimson;
}

export function awardAccent(name: string, group: string) {
  return SPRITES[name] ? TONES.crimson.glow : pickTone(name, group).glow;
}

export const AWARD_CSS = `
.award-card{position:relative;overflow:hidden;text-align:center;transition:transform .25s,box-shadow .25s,border-color .25s}
.award-card:hover{transform:translateY(-4px);border-color:var(--accent)!important;box-shadow:0 8px 26px -6px var(--accent)}
.award-stage{margin-bottom:8px;border-radius:6px;background:radial-gradient(circle at 50% 42%,#1b4163 0%,#0b1d30 55%,#050b12 100%);position:relative}
.award-stage:after{content:"";position:absolute;inset:0;border-radius:6px;box-shadow:inset 0 0 22px rgba(0,0,0,.55);pointer-events:none}
.award-art{filter:drop-shadow(0 6px 10px rgba(0,0,0,.65));transition:transform .3s}
.award-sprite{display:block;width:100%;height:150px;object-fit:contain;mix-blend-mode:screen;-webkit-mask-image:radial-gradient(ellipse at center,#000 66%,transparent 100%);mask-image:radial-gradient(ellipse at center,#000 66%,transparent 100%);transition:transform .3s,filter .3s;filter:saturate(1.25) contrast(1.15) brightness(1.55)}
.award-card:hover .award-art,.award-card:hover .award-sprite{transform:scale(1.09)}
.award-card:hover .award-sprite{filter:saturate(1.4) contrast(1.15) brightness(1.8) drop-shadow(0 0 10px var(--accent))}
.award-glow{animation:awardPulse 3.2s ease-in-out infinite;transform-origin:center}
.award-sparkles path{opacity:0;animation:awardTwinkle 2.8s ease-in-out infinite}
.award-sparkles .sp2{animation-delay:.9s}.award-sparkles .sp3{animation-delay:1.8s}
@keyframes awardPulse{50%{opacity:.5}}
@keyframes awardTwinkle{0%,100%{opacity:0}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.award-glow,.award-sparkles path{animation:none}.award-sparkles path{opacity:.8}}
`;

type Frame = "hex" | "shield" | "trophy" | "medal" | "crystal" | "plaque";

function pickFrame(name: string): Frame {
  const n = name.toLowerCase();
  if (n.includes("crystal")) return "crystal";
  if (n.includes("trophy")) return "trophy";
  if (n.includes("shield") || n.includes("crest")) return "shield";
  if (n.includes("medal")) return "medal";
  if (n.includes("plaque")) return "plaque";
  return "hex";
}

type Glyph = { text?: string; icon?: string; sub?: string };

// Centre emblem: short text, an icon key, or both.
function pickGlyph(name: string): Glyph {
  const n = name.toLowerCase();
  const top = n.match(/^top (\d+)/);
  if (top) return { text: top[1], sub: "TOP" };
  if (n.includes("first team")) return { icon: "crown" };
  if (n.includes("roster spot")) return { icon: "flag" };
  if (n.includes("gamertag") || n.includes("multi-platform")) return { icon: "globe" };
  if (n.includes("profile complete")) return { icon: "check" };
  if (n.includes("first match")) return { icon: "play" };
  const num = name.match(/^(\d+)/) || name.match(/streak (\d+)/i);
  if (n.includes("win streak") && num) return { text: num[1], icon: "bolt" };
  if (/matches played/.test(n) && num) return { text: num[1] };
  if (n.includes("xbox")) return { text: "XBOX" };
  if (n.includes("playstation")) return { text: "PS" };
  if (n.includes("pc champion")) return { text: "PC" };
  if (n.includes("nintendo")) return { text: "NS" };
  if (n.includes("call of duty")) return { text: "COD" };
  if (n.includes("rocket league")) return { text: "RL" };
  if (n.includes("battlefield")) return { text: "BF" };
  if (n.includes("rainbow six")) return { text: "R6" };
  if (n.includes("apex")) return { text: "AL" };
  if (n.includes("fortnite")) return { text: "FN" };
  if (n.includes("cross-platform")) return { icon: "globe" };
  if (n.includes("mvp")) return { text: "MVP" };
  if (/\bace\b/.test(n) || n.includes("fragger")) return { icon: "crosshair" };
  if (n.includes("streak") || n.includes("clutch") || n.includes("comeback")) return { icon: "bolt" };
  if (/flawless|fair play|clean record|honest/.test(n)) return { icon: "check" };
  if (/underdog|upset|rising|rookie/.test(n)) return { icon: "arrow" };
  if (n.includes("referee") || n.includes("organizer")) return { icon: "flag" };
  if (/mentor|helper|loyalty/.test(n)) return { icon: "heart" };
  if (n.includes("stream")) return { icon: "play" };
  if (n.includes("halloween")) return { icon: "pumpkin" };
  if (n.includes("holiday") || n.includes("anniversary")) return { icon: "burst" };
  if (/shotcaller|dynasty|captain/.test(n)) return { icon: "crown" };
  if (n.includes("grinder")) return { icon: "flame" };
  return { icon: "star" };
}

function Icon({ k, fill, stroke }: { k: string; fill: string; stroke: string }) {
  const common = { fill, stroke, strokeWidth: 1.2, strokeLinejoin: "round" as const };
  switch (k) {
    case "bolt":
      return <path d="M86 50 L64 86 H78 L72 112 L98 74 H83 Z" {...common} />;
    case "crosshair":
      return (
        <g fill="none" stroke={fill} strokeWidth="3" strokeLinecap="round">
          <circle cx="80" cy="80" r="18" />
          <circle cx="80" cy="80" r="3" fill={fill} />
          <path d="M80 54 V68 M80 92 V106 M54 80 H68 M92 80 H106" />
        </g>
      );
    case "check":
      return <path d="M60 82 L74 96 L102 62" fill="none" stroke={fill} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />;
    case "arrow":
      return <path d="M80 54 L102 80 H88 V108 H72 V80 H58 Z" {...common} />;
    case "flag":
      return (
        <g {...common}>
          <path d="M64 108 V54" fill="none" stroke={fill} strokeWidth="5" strokeLinecap="round" />
          <path d="M67 56 H100 L92 70 L100 84 H67 Z" />
        </g>
      );
    case "heart":
      return <path d="M80 106 C50 86 54 58 70 58 C76 58 80 63 80 66 C80 63 84 58 90 58 C106 58 110 86 80 106 Z" {...common} />;
    case "play":
      return (
        <g>
          <circle cx="80" cy="80" r="26" fill="none" stroke={fill} strokeWidth="4" />
          <path d="M72 66 L96 80 L72 94 Z" {...common} />
        </g>
      );
    case "pumpkin":
      return (
        <g {...common}>
          <ellipse cx="80" cy="84" rx="26" ry="22" />
          <path d="M80 62 V54 L86 50" fill="none" stroke={fill} strokeWidth="4" />
          <path d="M66 78 L74 78 L70 86 Z M86 78 L94 78 L90 86 Z M68 96 L74 92 L80 97 L86 92 L92 96" fill={stroke} stroke="none" />
        </g>
      );
    case "burst":
      return <path d="M80 48 L88 70 L110 62 L98 82 L116 96 L92 94 L88 116 L80 98 L72 116 L68 94 L44 96 L62 82 L50 62 L72 70 Z" {...common} />;
    case "crown":
      return <path d="M54 100 L50 62 L68 78 L80 54 L92 78 L110 62 L106 100 Z" {...common} />;
    case "flame":
      return <path d="M80 48 C84 66 104 72 100 94 C98 108 88 114 80 114 C70 114 60 106 60 94 C60 82 70 78 72 66 C76 72 78 70 80 48 Z" {...common} />;
    case "globe":
      return (
        <g fill="none" stroke={fill} strokeWidth="3">
          <circle cx="80" cy="80" r="26" />
          <ellipse cx="80" cy="80" rx="11" ry="26" />
          <path d="M54 80 H106 M58 66 H102 M58 94 H102" />
        </g>
      );
    default:
      return <path d="M80 52 L88 72 L110 74 L93 88 L98 110 L80 98 L62 110 L67 88 L50 74 L72 72 Z" {...common} />;
  }
}

function SpriteArt({ name, id, height }: { name: string; id: number; height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/awards/art/${id}.png`} alt={name} className="award-sprite" style={height ? { height } : undefined} loading="lazy" />
  );
}

function EmblemArt({ name, group, height = 150 }: { name: string; group: string; height?: number }) {
  const uid = useId().replace(/:/g, "");
  const frame = pickFrame(name);
  const tone = pickTone(name, group);
  const glyph = pickGlyph(name);
  const steel = `url(#s${uid})`;
  const dark = `url(#d${uid})`;
  const wings = /streak|mvp|top fragger|dynasty|\bace\b/i.test(name);
  const laurel = /season|tournament|referee|mentor|helper|master|fair|clean|honest|anniversary|completionist|organizer/i.test(name);
  const txt = glyph.text;
  const tSize = txt ? (txt.length >= 4 ? 17 : txt.length === 3 ? 22 : 32) : 0;
  const both = !!(txt && glyph.icon);

  let centreShift = "translate(0,0)";
  if (frame === "medal") centreShift = "translate(0,24)";
  else if (frame === "crystal") centreShift = "translate(0,6)";
  else if (frame === "trophy") centreShift = "translate(0,-14)";

  return (
    <svg viewBox="0 0 160 160" role="img" aria-label={name} className="award-art"     style={{ width: "100%", height }}>
      <defs>
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9d1da" />
          <stop offset=".3" stopColor="#6f7882" />
          <stop offset=".65" stopColor="#2c3239" />
          <stop offset="1" stopColor="#0f1318" />
        </linearGradient>
        <linearGradient id={`d${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#232a32" />
          <stop offset="1" stopColor="#070a0d" />
        </linearGradient>
        <linearGradient id={`r${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone.glow} />
          <stop offset="1" stopColor={tone.rim} stopOpacity=".55" />
        </linearGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="0" stopColor={tone.glow} stopOpacity=".45" />
          <stop offset="1" stopColor={tone.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="award-glow" cx="80" cy="80" r="76" fill={`url(#g${uid})`} />

      {wings &&
        [0, 1].map((s) => (
          <g key={s} transform={s === 1 ? "translate(160,0) scale(-1,1)" : undefined}>
            <path d="M44 74 L6 54 L16 76 L2 84 L20 94 L12 108 L42 100 Z" fill={steel} stroke="#05080b" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M42 80 L16 66 M42 88 L12 90 M42 96 L22 102" stroke={tone.rim} strokeWidth="1.4" opacity=".8" />
          </g>
        ))}

      {laurel &&
        [0, 1].map((s) => (
          <g key={s} transform={s === 1 ? "translate(160,0) scale(-1,1)" : undefined} fill={steel} stroke="#05080b" strokeWidth="1">
            {Array.from({ length: 7 }).map((_, i) => (
              <ellipse key={i} cx={22 + i * 1.5} cy={116 - i * 13} rx="4" ry="9" transform={`rotate(${-30 + i * 9} ${22 + i * 1.5} ${116 - i * 13})`} />
            ))}
          </g>
        ))}

      <g strokeLinejoin="round" stroke="#05080b" strokeWidth="1.6">
        {frame === "hex" && (
          <>
            <path d="M80 14 L134 44 V112 L80 142 L26 112 V44 Z" fill={steel} />
            <path d="M80 22 L127 49 V108 L80 135 L33 108 V49 Z" fill={dark} />
            <path d="M80 26 L123 51 V106 L80 131 L37 106 V51 Z" fill="none" stroke={`url(#r${uid})`} strokeWidth="2" />
            {[[80, 18], [130, 46], [130, 110], [80, 138], [30, 110], [30, 46]].map(([x, y]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill={tone.glow} stroke="none" />
            ))}
          </>
        )}
        {frame === "shield" && (
          <>
            <path d="M80 12 L134 30 V80 C134 112 110 134 80 150 C50 134 26 112 26 80 V30 Z" fill={steel} />
            <path d="M80 21 L125 36 V80 C125 107 105 126 80 140 C55 126 35 107 35 80 V36 Z" fill={dark} />
            <path d="M80 26 L120 39 V80 C120 104 102 122 80 134 C58 122 40 104 40 80 V39 Z" fill="none" stroke={`url(#r${uid})`} strokeWidth="2" />
            <path d="M62 20 L80 12 L98 20 L80 28 Z" fill={tone.rim} strokeWidth="1" />
          </>
        )}
        {frame === "plaque" && (
          <>
            <path d="M34 24 H126 L138 36 V124 L126 136 H34 L22 124 V36 Z" fill={steel} />
            <path d="M38 32 H122 L130 40 V120 L122 128 H38 L30 120 V40 Z" fill={dark} />
            <path d="M42 38 H118 L124 44 V116 L118 122 H42 L36 116 V44 Z" fill="none" stroke={`url(#r${uid})`} strokeWidth="2" />
          </>
        )}
        {frame === "medal" && (
          <>
            <path d="M48 8 L72 66 H96 L72 8 Z" fill={tone.rim} />
            <path d="M112 8 L88 66 H64 L88 8 Z" fill="#101419" />
            <circle cx="80" cy="104" r="42" fill={steel} />
            <circle cx="80" cy="104" r="34" fill={dark} />
            <circle cx="80" cy="104" r="30" fill="none" stroke={`url(#r${uid})`} strokeWidth="2.4" />
          </>
        )}
        {frame === "trophy" && (
          <>
            <path d="M42 36 C16 36 16 76 50 82 M118 36 C144 36 144 76 110 82" fill="none" stroke={steel} strokeWidth="7" strokeLinecap="round" />
            <path d="M42 28 H118 V60 C118 88 102 100 80 104 C58 100 42 88 42 60 Z" fill={steel} />
            <path d="M48 34 H112 V60 C112 84 98 94 80 98 C62 94 48 84 48 60 Z" fill={dark} />
            <path d="M74 102 H86 L90 122 H70 Z" fill={steel} />
            <rect x="50" y="122" width="60" height="9" rx="2" fill={steel} />
            <rect x="40" y="131" width="80" height="13" rx="3" fill={dark} />
            <rect x="46" y="136" width="68" height="3" rx="1" fill={tone.rim} stroke="none" />
          </>
        )}
        {frame === "crystal" && (
          <>
            <path d="M80 8 L120 48 L104 140 L80 154 L56 140 L40 48 Z" fill={tone.glow} fillOpacity=".18" />
            <path d="M80 8 L120 48 L80 62 L40 48 Z" fill="#fff" fillOpacity=".8" />
            <path d="M40 48 L80 62 L56 140 Z" fill={tone.rim} fillOpacity=".7" />
            <path d="M120 48 L80 62 L104 140 Z" fill="#0b2c4a" fillOpacity=".9" />
            <path d="M80 62 L56 140 L80 154 L104 140 Z" fill={tone.glow} fillOpacity=".5" />
          </>
        )}
      </g>

      <g transform={centreShift} style={{ filter: `drop-shadow(0 0 5px ${tone.glow})` }}>
        {glyph.icon && (
          <g transform={frame === "trophy" ? "translate(20,16) scale(.75)" : both ? "translate(20,2) scale(.75)" : undefined}>
            <Icon k={glyph.icon} fill={tone.glow} stroke="#05080b" />
          </g>
        )}
        {glyph.sub && (
          <text x="80" y="62" textAnchor="middle" fontSize="15" fontWeight="900" fill={tone.text} stroke="#05080b" strokeWidth="1" paintOrder="stroke" fontFamily="Impact, 'Arial Black', sans-serif" letterSpacing="3">
            {glyph.sub}
          </text>
        )}
        {txt && (
          <text
            x="80"
            y={both ? 108 : 80 + tSize * 0.36 + (glyph.sub ? 8 : 0)}
            textAnchor="middle"
            fontSize={both ? 18 : tSize}
            fontWeight="900"
            fill={tone.text}
            stroke="#05080b"
            strokeWidth="1.2"
            paintOrder="stroke"
            fontFamily="Impact, 'Arial Black', sans-serif"
            letterSpacing="1"
          >
            {txt}
          </text>
        )}
      </g>

      <g className="award-sparkles" fill="#fff">
        <path className="sp1" d="M26 30 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" />
        <path className="sp2" d="M132 24 l1.5 4.5 4.5 1.5 -4.5 1.5 -1.5 4.5 -1.5 -4.5 -4.5 -1.5 4.5 -1.5 z" />
        <path className="sp3" d="M136 112 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" />
      </g>
    </svg>
  );
}

export default function AwardArt({ name, group, height }: { name: string; group: string; height?: number }) {
  if (hasAutoBadge(name)) return <AutoBadgeArt name={name} height={height} />;
  const sprite = SPRITES[name];
  if (sprite) return <SpriteArt name={name} id={sprite} height={height} />;
  return <EmblemArt name={name} group={group} height={height} />;
}
