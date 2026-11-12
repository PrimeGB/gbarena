"use client";

import { useId } from "react";

type Trophy = { color: string; light: string; dark: string; mark: string; elite?: boolean };
type Palette = Pick<Trophy, "color" | "light" | "dark">;

const palettes: Record<string, Palette> = {
  ruby: { color: "#e52b43", light: "#ffb5a4", dark: "#590b22" },
  gold: { color: "#e9a626", light: "#fff1a7", dark: "#77430b" },
  blue: { color: "#168ce5", light: "#adeaff", dark: "#073b79" },
  emerald: { color: "#18bf83", light: "#bbffe0", dark: "#064b3d" },
  purple: { color: "#a34df0", light: "#edc2ff", dark: "#431476" },
  pink: { color: "#ed5e9d", light: "#ffd1e1", dark: "#80204d" },
  orange: { color: "#ed7024", light: "#ffe0a2", dark: "#823008" },
  ice: { color: "#48cfed", light: "#e5ffff", dark: "#126482" },
};

const definitions: [string, string, string, boolean?][] = [
  ["First Steps Trophy", "blue", "2"],
  ["Game On Trophy", "emerald", "5"],
  ["Battle Ready Trophy", "gold", "10"],
  ["Momentum Trophy", "orange", "20"],
  ["On the Grind Trophy", "ruby", "35"],
  ["Battle Tested Trophy", "purple", "50", true],
  ["Veteran Run Trophy", "ice", "75", true],
  ["Unstoppable Journey Trophy", "gold", "125", true],
  ["Double Victory Trophy", "blue", "2"],
  ["Triple Threat Trophy", "emerald", "3"],
  ["High Five Trophy", "orange", "5"],
  ["Victory Surge Trophy", "ruby", "15"],
  ["Winning Edge Trophy", "purple", "25"],
  ["Victory Vanguard Trophy", "gold", "40", true],
  ["Triumph Elite Trophy", "ice", "75", true],
  ["Victory Legend Trophy", "ruby", "125", true],
  ["Spring Bloom Trophy", "pink", "spring"],
  ["Summer Heat Trophy", "orange", "summer"],
  ["Autumn Harvest Trophy", "ruby", "autumn"],
  ["Winter Frost Trophy", "ice", "winter"],
  ["Season Starter Trophy", "blue", "2"],
  ["Season Challenger Trophy", "emerald", "5"],
  ["Season Contender Trophy", "purple", "10"],
  ["Season Warrior Trophy", "gold", "20", true],
  ["Season Spark Trophy", "orange", "2"],
  ["Season Surge Trophy", "ruby", "5"],
  ["Season Elite Trophy", "ice", "10", true],
  ["Season Conqueror Trophy", "purple", "20", true],
  ["Community Spark Trophy", "orange", "star"],
  ["Welcome Wagon Trophy", "emerald", "heart"],
  ["Team Builder Trophy", "blue", "star"],
  ["Creative Mind Trophy", "pink", "star"],
  ["Positive Play Trophy", "emerald", "heart"],
  ["Helpful Hand Trophy", "ice", "heart"],
  ["Clutch Moment Trophy", "ruby", "bolt", true],
  ["Rivalry Respect Trophy", "purple", "star", true],
  ["Comeback Story Trophy", "orange", "bolt", true],
  ["Squad Spirit Trophy", "blue", "star", true],
  ["Community Champion Trophy", "gold", "heart", true],
  ["Game Changer Trophy", "purple", "bolt", true],
];

const trophies = new Map<string, Trophy>(
  definitions.map(([name, palette, mark, elite]) => [name, { ...palettes[palette], mark, elite }])
);

export function hasNewTrophy(name: string) {
  return trophies.has(name);
}

export function newTrophyAccent(name: string) {
  return trophies.get(name)?.color;
}

function TrophyMark({ mark }: { mark: string }) {
  const common = { fill: "#fff4d5", stroke: "#572b10", strokeWidth: 1.5, strokeLinejoin: "round" as const };
  if (mark === "spring") return <g {...common}><circle cx="110" cy="72" r="7" fill="#ffcd41" />{[0, 60, 120, 180, 240, 300].map((angle) => <ellipse key={angle} cx="110" cy="59" rx="5" ry="10" transform={`rotate(${angle} 110 72)`} />)}<circle cx="110" cy="72" r="5" fill="#ffcd41" /></g>;
  if (mark === "summer") return <g {...common}><circle cx="110" cy="72" r="14" fill="#ffd55c" />{[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <path key={angle} d="M110 48 V54" stroke="#fff4d5" strokeWidth="4" strokeLinecap="round" transform={`rotate(${angle} 110 72)`} />)}</g>;
  if (mark === "autumn") return <path {...common} d="M110 47 L115 59 L124 55 L121 66 L132 69 L121 77 L125 84 L114 83 L110 97 L106 83 L95 84 L99 77 L88 69 L99 66 L96 55 L105 59 Z" />;
  if (mark === "winter") return <g stroke="#fff" strokeWidth="4" strokeLinecap="round">{[0, 60, 120].map((angle) => <path key={angle} d="M110 49 V95 M101 56 L110 64 L119 56 M101 88 L110 80 L119 88" transform={`rotate(${angle} 110 72)`} />)}</g>;
  if (mark === "heart") return <path {...common} d="M110 92 C75 73 87 49 101 55 C106 57 109 62 110 65 C111 62 114 57 119 55 C133 49 145 73 110 92 Z" />;
  if (mark === "bolt") return <path {...common} d="M114 47 L95 75 H107 L103 98 L126 67 H114 Z" />;
  if (mark === "star") return <path {...common} d="M110 47 L117 64 L136 65 L121 77 L126 95 L110 85 L94 95 L99 77 L84 65 L103 64 Z" />;
  return <text x="110" y="83" textAnchor="middle" fill="#fff9df" stroke="#60360f" strokeWidth="2" paintOrder="stroke" fontFamily="Tahoma, sans-serif" fontSize={mark.length > 2 ? 26 : 34} fontWeight="900">{mark}</text>;
}

export default function NewTrophyArt({ name, height = 150 }: { name: string; height?: number }) {
  const uid = useId().replace(/:/g, "");
  const trophy = trophies.get(name);
  if (!trophy) return null;
  const metal = `url(#trophy-metal-${uid})`;
  const edge = `url(#trophy-edge-${uid})`;

  return (
    <svg viewBox="0 0 220 180" role="img" aria-label={name} className="award-art" style={{ width: "100%", height }}>
      <defs>
        <linearGradient id={`trophy-metal-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={trophy.light} /><stop offset=".24" stopColor={trophy.color} />
          <stop offset=".52" stopColor={trophy.dark} /><stop offset=".76" stopColor={trophy.color} /><stop offset="1" stopColor={trophy.dark} />
        </linearGradient>
        <linearGradient id={`trophy-edge-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff5cb" /><stop offset=".4" stopColor="#dba746" /><stop offset="1" stopColor="#70431d" />
        </linearGradient>
        <radialGradient id={`trophy-bg-${uid}`}>
          <stop offset="0" stopColor={trophy.color} stopOpacity=".48" /><stop offset="1" stopColor={trophy.color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="90" rx="105" ry="84" fill={`url(#trophy-bg-${uid})`} />
      {trophy.elite && [false, true].map((flip) => (
        <g key={String(flip)} transform={flip ? "translate(220 0) scale(-1 1)" : undefined}>
          <path d="M65 72 L14 44 L30 73 L9 81 L35 90 L22 105 L67 94 Z" fill={edge} stroke="#301d18" strokeWidth="2" />
          <path d="M59 74 L27 58 M59 82 L23 82 M59 90 L36 96" fill="none" stroke={trophy.light} strokeWidth="2" />
        </g>
      ))}
      <path d="M65 42 C23 31 25 86 66 91 M155 42 C197 31 195 86 154 91" fill="none" stroke="#2b1d1b" strokeWidth="12" strokeLinecap="round" />
      <path d="M65 42 C23 31 25 86 66 91 M155 42 C197 31 195 86 154 91" fill="none" stroke={edge} strokeWidth="7" strokeLinecap="round" />
      <path d="M57 28 Q110 16 163 28 L157 77 Q152 106 124 118 L96 118 Q68 106 63 77 Z" fill={metal} stroke="#3b241b" strokeWidth="3" />
      <path d="M62 30 Q110 20 158 30 L155 39 Q110 32 65 39 Z" fill={edge} stroke="#69451e" strokeWidth="2" />
      <path d="M68 43 Q74 87 91 103" fill="none" stroke={trophy.light} strokeWidth="4" strokeLinecap="round" opacity=".8" />
      <path d="M151 44 Q146 80 136 96" fill="none" stroke={trophy.dark} strokeWidth="4" strokeLinecap="round" opacity=".75" />
      <circle cx="110" cy="72" r="30" fill="#17243a" stroke={edge} strokeWidth="4" />
      <circle cx="110" cy="72" r="24" fill={trophy.dark} stroke={trophy.light} strokeWidth="1.5" />
      <TrophyMark mark={trophy.mark} />
      <path d="M96 117 H124 L128 136 H92 Z" fill={metal} stroke="#3b241b" strokeWidth="2" />
      <path d="M83 135 H137 L144 144 H76 Z" fill={edge} stroke="#3b241b" strokeWidth="2" />
      <path d="M69 144 H151 V165 H69 Z" fill="#17202b" stroke={edge} strokeWidth="3" />
      <path d="M76 149 H144 V160 H76 Z" fill={metal} stroke="#f8d88b" strokeWidth="1" />
      <text x="110" y="158" textAnchor="middle" fill="#fff9df" fontFamily="Tahoma, sans-serif" fontSize="7" fontWeight="900" letterSpacing="2">{trophy.elite ? "ELITE" : "GAMEBATTLES"}</text>
      {trophy.elite && <path d="M110 8 L114 16 L123 17 L116 23 L118 32 L110 27 L102 32 L104 23 L97 17 L106 16 Z" fill={edge} stroke="#693a14" strokeWidth="1.5" />}
      <path d="M40 23 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z M182 103 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#fff5ce" />
    </svg>
  );
}
