"use client";

import { useId } from "react";

const awards = {
  "Community Origin": { metal: "#f0c75d", light: "#fff2bc", dark: "#725014", glow: "#ffd264", shape: "crown" },
  "Community Pioneer": { metal: "#9bc5e4", light: "#eef9ff", dark: "#365b79", glow: "#80c9ff", shape: "star" },
  "Community Trailblazer": { metal: "#db9970", light: "#ffe3c3", dark: "#744025", glow: "#ffad75", shape: "shield" },
} as const;

type AwardName = keyof typeof awards;

export function hasEarlyCommunityArt(name: string): name is AwardName {
  return Object.prototype.hasOwnProperty.call(awards, name);
}

export function earlyCommunityAccent(name: AwardName) {
  return awards[name].glow;
}

export default function EarlyCommunityArt({ name, height = 150 }: { name: AwardName; height?: number }) {
  const id = useId().replace(/:/g, "");
  const award = awards[name];
  const metal = `url(#community-metal-${id})`;
  const glow = `url(#community-glow-${id})`;

  return (
    <svg viewBox="0 0 220 180" role="img" aria-label={name} className="award-art" style={{ width: "100%", height }}>
      <defs>
        <linearGradient id={`community-metal-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={award.light} /><stop offset=".23" stopColor={award.metal} /><stop offset=".52" stopColor={award.dark} /><stop offset=".76" stopColor={award.metal} /><stop offset="1" stopColor={award.dark} />
        </linearGradient>
        <radialGradient id={`community-glow-${id}`}><stop stopColor={award.glow} stopOpacity=".4" /><stop offset="1" stopColor={award.glow} stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="110" cy="85" rx="100" ry="80" fill={glow} />
      {award.shape !== "shield" && [false, true].map((flip) => (
        <g key={String(flip)} transform={flip ? "translate(220 0) scale(-1 1)" : undefined}>
          <path d="M66 74 L22 49 L35 70 L15 76 L37 86 L24 99 L70 94 Z" fill={metal} stroke="#100e13" strokeWidth="2" strokeLinejoin="round" />
          <path d="M60 75 L33 61 M60 82 L28 77 M60 89 L35 94" stroke={award.light} strokeWidth="1.5" opacity=".8" />
        </g>
      ))}
      <path d="M73 122 L64 162 L88 153 L103 169 L110 134 L117 169 L132 153 L156 162 L147 122 Z" fill={metal} stroke="#151018" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M77 130 L73 151 M143 130 L147 151" stroke={award.light} strokeWidth="2" opacity=".7" />
      {award.shape === "shield" ? (
        <path d="M58 48 Q110 20 162 48 L157 100 Q151 126 110 146 Q69 126 63 100 Z" fill={metal} stroke="#120e12" strokeWidth="3" strokeLinejoin="round" />
      ) : (
        <path d="M110 19 L132 29 L155 31 L164 54 L174 75 L165 98 L157 120 L134 128 L110 140 L86 128 L63 120 L55 98 L46 75 L56 54 L65 31 L88 29 Z" fill={metal} stroke="#120e12" strokeWidth="3" strokeLinejoin="round" />
      )}
      <circle cx="110" cy="81" r="48" fill="#091624" stroke={award.light} strokeWidth="2" />
      <circle cx="110" cy="81" r="42" fill="#102c40" stroke={award.metal} strokeWidth="2" />
      <circle cx="110" cy="81" r="37" fill="none" stroke={award.light} strokeWidth="1" strokeDasharray="2 4" opacity=".6" />
      <path d="M83 100 C83 82 96 76 110 76 C124 76 137 82 137 100 Q110 113 83 100 Z" fill={metal} stroke="#0a1018" strokeWidth="2" />
      <circle cx="110" cy="67" r="10" fill={award.light} stroke={award.dark} strokeWidth="2" />
      <circle cx="87" cy="75" r="7" fill={award.metal} stroke={award.dark} strokeWidth="2" />
      <circle cx="133" cy="75" r="7" fill={award.metal} stroke={award.dark} strokeWidth="2" />
      <path d="M69 121 Q110 132 151 121 L147 136 Q110 148 73 136 Z" fill="#142b3c" stroke={award.metal} strokeWidth="2" />
      <text x="110" y="133" textAnchor="middle" fill={award.light} fontFamily="Tahoma, sans-serif" fontSize="8" fontWeight="900" letterSpacing="1.3">COMMUNITY</text>
      {award.shape === "crown" && <path d="M82 34 L76 14 L94 23 L110 7 L126 23 L144 14 L138 34 Z" fill={metal} stroke="#150f12" strokeWidth="2.5" strokeLinejoin="round" />}
      {award.shape === "star" && <path d="M110 10 L116 22 L130 24 L120 34 L122 47 L110 41 L98 47 L100 34 L90 24 L104 22 Z" fill={metal} stroke="#150f12" strokeWidth="2.5" strokeLinejoin="round" />}
      {award.shape === "shield" && <path d="M110 20 L117 31 L130 34 L121 43 L123 55 L110 49 L97 55 L99 43 L90 34 L103 31 Z" fill={metal} stroke="#150f12" strokeWidth="2.5" strokeLinejoin="round" />}
      <path d="M34 33 v8 M30 37 h8 M186 40 v8 M182 44 h8 M173 117 v6 M170 120 h6" stroke={award.light} strokeWidth="2" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}
