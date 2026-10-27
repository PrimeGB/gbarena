"use client";

import { useId } from "react";
import type { ReactNode } from "react";

type Pal = { rim: string; glow: string; light: string };

const PALS: Record<string, Pal> = {
  gold: { rim: "#8a5a0c", glow: "#d9a032", light: "#f3dc9a" },
  azure: { rim: "#1b4f94", glow: "#3d8fd6", light: "#b9d9f5" },
  violet: { rim: "#4d2a8f", glow: "#8a5fd0", light: "#d9c7f3" },
  emerald: { rim: "#0e6b4a", glow: "#27b883", light: "#bdf0da" },
  orange: { rim: "#8f3a0c", glow: "#d9712a", light: "#f6d1b0" },
};

const BADGES: Record<string, { pal: string; draw: (c: Ctx) => ReactNode }> = {
  "First Team Founded Badge": { pal: "gold", draw: teamFounded },
  "First Roster Spot Badge": { pal: "azure", draw: rosterSpot },
  "First Gamertag Linked Badge": { pal: "emerald", draw: gamertagLinked },
  "Multi-Platform Linker Badge": { pal: "violet", draw: multiPlatform },
  "Profile Complete Badge": { pal: "azure", draw: profileComplete },
  "First Match Played Badge": { pal: "orange", draw: matchPlayed },
};

type Ctx = { steel: string; dark: string; ring: string; pal: Pal };

export function hasAutoBadge(name: string) {
  return !!BADGES[name];
}

function Wing({ ctx, flip }: { ctx: Ctx; flip?: boolean }) {
  return (
    <g transform={flip ? "translate(160,0) scale(-1,1)" : undefined}>
      <path d="M38 70 L4 50 L14 72 L0 82 L18 92 L10 106 L38 98 Z" fill={ctx.steel} stroke="#05080b" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M36 76 L14 64 M36 84 L10 86 M36 92 L20 98" stroke={ctx.pal.glow} strokeWidth="1.3" opacity=".85" />
    </g>
  );
}

function Person({ x, y, s, fill, stroke }: { x: number; y: number; s: number; fill: string; stroke: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round">
      <circle cx="0" cy="-14" r="10" />
      <path d="M-20 18 C-20 -4 20 -4 20 18 Z" />
    </g>
  );
}

function teamFounded(c: Ctx) {
  return (
    <>
      {[false, true].map((f) => (
        <g key={String(f)} transform={f ? "translate(160,0) scale(-1,1)" : undefined}>
          <path d="M34 38 L8 52 L22 66 L8 80 L34 92 Z" fill={c.steel} stroke="#05080b" strokeWidth="1.4" strokeLinejoin="round" />
        </g>
      ))}
      <path d="M34 20 H126 V102 L80 146 L34 102 Z" fill={c.steel} stroke="#05080b" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M42 28 H118 V99 L80 135 L42 99 Z" fill={c.dark} stroke="#05080b" strokeWidth="1" />
      <path d="M47 33 H113 V96 L80 127 L47 96 Z" fill="none" stroke={c.ring} strokeWidth="2" />
      <Person x={56} y={78} s={0.55} fill={c.pal.rim} stroke="#05080b" />
      <Person x={104} y={78} s={0.55} fill={c.pal.rim} stroke="#05080b" />
      <Person x={80} y={80} s={0.85} fill={c.pal.light} stroke="#05080b" />
      <path d="M54 34 L48 6 L67 20 L80 0 L93 20 L112 6 L106 34 Z" fill={c.ring} stroke="#05080b" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="80" cy="26" r="3.2" fill={c.pal.light} />
      <path d="M55 108 L80 120 L105 108" fill="none" stroke={c.ring} strokeWidth="2.4" strokeLinecap="round" />
    </>
  );
}

function rosterSpot(c: Ctx) {
  return (
    <>
      <path d="M52 12 H108 L148 52 V108 L108 148 H52 L12 108 V52 Z" fill={c.steel} stroke="#05080b" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M55 22 H105 L138 55 V105 L105 138 H55 L22 105 V55 Z" fill={c.dark} stroke="#05080b" strokeWidth="1" />
      <path d="M58 27 H102 L133 58 V102 L102 133 H58 L27 102 V58 Z" fill="none" stroke={c.ring} strokeWidth="2" />
      {[[40, 82], [120, 82]].map(([x, y]) => (
        <g key={x} opacity=".5">
          <circle cx={x} cy={y - 10} r="6" fill="none" stroke={c.pal.glow} strokeWidth="2" strokeDasharray="3 3" />
          <path d={`M${x - 11} ${y + 10} C${x - 11} ${y - 2} ${x + 11} ${y - 2} ${x + 11} ${y + 10}`} fill="none" stroke={c.pal.glow} strokeWidth="2" strokeDasharray="3 3" />
        </g>
      ))}
      <Person x={80} y={86} s={1.25} fill={c.pal.light} stroke="#05080b" />
      <path d="M62 112 H98" stroke={c.pal.glow} strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(112,112)">
        <path d="M0 -17 L15 -8 V10 L0 19 L-15 10 V-8 Z" fill={c.ring} stroke="#05080b" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M0 -8 V10 M-9 1 H9" stroke="#05080b" strokeWidth="4" strokeLinecap="round" />
      </g>
    </>
  );
}

function gamertagLinked(c: Ctx) {
  return (
    <>
      <Wing ctx={c} />
      <Wing ctx={c} flip />
      <path d="M80 6 L152 80 L80 154 L8 80 Z" fill={c.steel} stroke="#05080b" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M80 18 L140 80 L80 142 L20 80 Z" fill={c.dark} stroke="#05080b" strokeWidth="1" />
      <path d="M80 24 L134 80 L80 136 L26 80 Z" fill="none" stroke={c.ring} strokeWidth="2" />
      <g transform="translate(80,76) scale(.78) translate(-80,-82)">
        <path d="M40 62 C40 52 48 48 58 48 H102 C112 48 120 52 120 62 L132 104 C134 114 126 120 118 116 L102 104 H58 L42 116 C34 120 26 114 28 104 Z" fill={c.pal.light} stroke="#05080b" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M52 66 V84 M43 75 H61" stroke={c.pal.rim} strokeWidth="6" strokeLinecap="round" />
        {[[108, 62], [118, 72], [108, 82], [98, 72]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="4.5" fill={c.pal.rim} />
        ))}
      </g>
      <g transform="translate(80,118) rotate(-30)" fill="none" strokeLinecap="round">
        <rect x="-20" y="-8" width="24" height="16" rx="8" stroke="#05080b" strokeWidth="9" />
        <rect x="-4" y="-8" width="24" height="16" rx="8" stroke="#05080b" strokeWidth="9" />
        <rect x="-20" y="-8" width="24" height="16" rx="8" stroke={c.ring} strokeWidth="5" />
        <rect x="-4" y="-8" width="24" height="16" rx="8" stroke={c.pal.light} strokeWidth="5" />
      </g>
    </>
  );
}

function multiPlatform(c: Ctx) {
  const nodes: [number, number, string][] = [[80, 58, "#58c0ff"], [50, 104, "#3df2ab"], [110, 104, "#ff6b6b"]];
  return (
    <>
      <path d="M80 6 L152 134 H8 Z" fill={c.steel} stroke="#05080b" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M80 24 L134 124 H26 Z" fill={c.dark} stroke="#05080b" strokeWidth="1" strokeLinejoin="round" />
      <path d="M80 32 L127 120 H33 Z" fill="none" stroke={c.ring} strokeWidth="2" strokeLinejoin="round" />
      <path d="M80 58 L50 104 H110 Z" fill="none" stroke={c.pal.glow} strokeWidth="3" strokeLinejoin="round" />
      <path d="M80 58 V90 M50 104 L74 94 M110 104 L86 94" stroke={c.pal.light} strokeWidth="2" opacity=".7" />
      <circle cx="80" cy="92" r="6" fill={c.pal.light} stroke="#05080b" strokeWidth="1.4" />
      {nodes.map(([x, y, col]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="13" fill="#05080b" />
          <circle cx={x} cy={y} r="10" fill={col} stroke={c.pal.light} strokeWidth="2" />
        </g>
      ))}
      <path d="M72 140 L80 154 L88 140" fill={c.ring} stroke="#05080b" strokeWidth="1.4" strokeLinejoin="round" />
    </>
  );
}

function profileComplete(c: Ctx) {
  return (
    <>
      <path d="M44 10 H116 L128 22 V138 L116 150 H44 L32 138 V22 Z" fill={c.steel} stroke="#05080b" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M48 18 H112 L120 26 V134 L112 142 H48 L40 134 V26 Z" fill={c.dark} stroke="#05080b" strokeWidth="1" />
      <rect x="68" y="20" width="24" height="7" rx="3.5" fill="#05080b" stroke={c.ring} strokeWidth="1.5" />
      <path d="M46 40 V34 H56 M114 40 V34 H104 M46 128 V134 H56 M114 128 V134 H104" fill="none" stroke={c.pal.glow} strokeWidth="2.2" strokeLinecap="round" />
      <Person x={80} y={64} s={1.05} fill={c.pal.light} stroke="#05080b" />
      <path d="M56 98 H104 M62 108 H98" stroke={c.pal.glow} strokeWidth="3.4" strokeLinecap="round" opacity=".85" />
      <g transform="translate(112,124)">
        <path d="M0 -22 L20 -14 V6 C20 18 10 24 0 28 C-10 24 -20 18 -20 6 V-14 Z" fill="#14b87c" stroke="#05080b" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M0 -15 L13 -9 V5 C13 13 6 17 0 20 C-6 17 -13 13 -13 5 V-9 Z" fill="none" stroke="#b9ffe0" strokeWidth="1.4" />
        <path d="M-9 3 L-2 10 L10 -6" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  );
}

function matchPlayed(c: Ctx) {
  const sword = (
    <g strokeLinejoin="round" stroke="#05080b" strokeWidth="1.6">
      <path d="M80 -6 L88 12 V92 H72 V12 Z" fill={c.pal.light} />
      <path d="M80 4 V90" stroke={c.pal.rim} strokeWidth="2" />
      <path d="M58 92 H102 V100 H58 Z" fill={c.ring} />
      <path d="M76 100 H84 V122 H76 Z" fill={c.steel} />
      <circle cx="80" cy="126" r="6" fill={c.ring} />
    </g>
  );
  return (
    <>
      <g transform="translate(80,92) scale(1.12) translate(-80,-92)">
        <g transform="rotate(42 80 96)">{sword}</g>
        <g transform="rotate(-42 80 96)">{sword}</g>
      </g>
      <g transform="translate(80,84) scale(.82) translate(-80,-84)">
        <path d="M80 28 L118 40 V84 C118 108 100 124 80 134 C60 124 42 108 42 84 V40 Z" fill={c.steel} stroke="#05080b" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M80 36 L111 46 V84 C111 103 96 117 80 126 C64 117 49 103 49 84 V46 Z" fill={c.dark} stroke="#05080b" strokeWidth="1" />
        <path d="M80 41 L106 49 V84 C106 100 93 112 80 120 C67 112 54 100 54 84 V49 Z" fill="none" stroke={c.ring} strokeWidth="2" />
        <path d="M69 62 L98 82 L69 102 Z" fill={c.pal.light} stroke="#05080b" strokeWidth="1.6" strokeLinejoin="round" />
      </g>
    </>
  );
}

export default function AutoBadgeArt({ name, height = 150 }: { name: string; height?: number }) {
  const uid = useId().replace(/:/g, "");
  const def = BADGES[name];
  if (!def) return null;
  const pal = PALS[def.pal];
  const ctx: Ctx = { steel: `url(#s${uid})`, dark: `url(#d${uid})`, ring: `url(#r${uid})`, pal };
  return (
    <svg viewBox="-6 -6 172 172" role="img" aria-label={name} className="award-art" style={{ width: "100%", height }}>
      <defs>
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d5dce4" />
          <stop offset=".2" stopColor="#7d8794" />
          <stop offset=".48" stopColor="#1c2229" />
          <stop offset=".56" stopColor="#5a6471" />
          <stop offset="1" stopColor="#0c1015" />
        </linearGradient>
        <linearGradient id={`d${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f1a27" />
          <stop offset="1" stopColor="#03070b" />
        </linearGradient>
        <linearGradient id={`r${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.light} />
          <stop offset=".35" stopColor={pal.glow} />
          <stop offset=".55" stopColor={pal.rim} />
          <stop offset="1" stopColor={pal.glow} />
        </linearGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="0" stopColor={pal.glow} stopOpacity=".28" />
          <stop offset="1" stopColor={pal.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="award-glow" cx="80" cy="80" r="82" fill={`url(#g${uid})`} />
      {def.draw(ctx)}
      <g className="award-sparkles" fill={pal.light}>
        <path className="sp1" d="M20 28 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" />
        <path className="sp2" d="M136 22 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" />
        <path className="sp3" d="M140 120 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" />
      </g>
    </svg>
  );
}
