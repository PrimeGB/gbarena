"use client";

import { useId } from "react";

const AWARDS = [
  ["Bug Finder", "bug"], ["Bug Hunter", "bug"], ["Critical Discovery", "bug"],
  ["Fix Investigator", "scope"], ["Quality Vanguard", "scope"], ["Early Warning", "signal"],
  ["Idea Forge", "forge"], ["Community Architect", "forge"], ["Newcomer Guide", "compass"],
  ["Knowledge Keeper", "book"], ["Problem Solver", "forge"], ["Community Voice", "signal"],
  ["Bridge Builder", "link"], ["Event Supporter", "flag"], ["Recruiting Ally", "link"],
  ["Positive Influence", "compass"], ["Community Defender", "shield"], ["Community Historian", "book"],
  ["Opening Strike", "blade"], ["Last Stand", "shield"], ["Precision Strike", "target"],
  ["Objective Specialist", "flag"], ["Iron Defense", "shield"], ["Breakthrough", "blade"],
  ["Battlefield Adaptation", "compass"], ["Rivalry Victor", "blade"], ["Squad Anchor", "anchor"],
  ["Tactical Commander", "helm"], ["Team Synergy", "link"], ["Resilient Competitor", "helm"],
  ["Road Warrior", "compass"], ["Bracket Breaker", "blade"], ["Final Round Hero", "target"],
  ["Consistent Contender", "helm"], ["Veteran Competitor", "anchor"], ["Sportsmanship Standard", "flag"],
  ["Staff Vanguard", "helm"], ["Dispute Specialist", "scales"], ["Match Integrity Officer", "shield"],
  ["Tournament Operations", "flag"], ["Community Steward", "anchor"], ["Staff Mentor", "book"],
  ["Investigation Excellence", "scope"], ["Fair Decision", "scales"], ["Behind the Scenes", "forge"],
  ["Rapid Response", "signal"], ["Staff Reliability", "anchor"], ["Event Commander", "helm"],
  ["Service Above Self", "shield"], ["Staff Legacy", "book"],
] as const;

type Motif = (typeof AWARDS)[number][1];
const awardLookup = new Map<string, { motif: Motif; index: number }>(
  AWARDS.map(([name, motif], index) => [name, { motif, index }]),
);

export function hasServiceAward(name: string) {
  return awardLookup.has(name);
}

function MotifArt({ motif }: { motif: Motif }) {
  switch (motif) {
    case "bug":
      return <><path d="M66 66 56 56 M94 66 104 56 M62 75 48 69 M62 85 47 87 M65 95 52 105 M98 75 112 69 M98 85 113 87 M95 95 108 105" /><path d="M69 62 Q80 49 91 62 L94 72 H66 Z" /><path d="M65 72 Q80 64 95 72 L96 88 Q94 105 80 111 Q66 105 64 88 Z" /><path d="M80 71 V110 M69 78 L76 82 M91 78 L84 82 M70 91 L76 95 M90 91 L84 95" /></>;
    case "scope":
      return <><circle cx="74" cy="72" r="20" /><circle cx="74" cy="72" r="13" /><path d="M89 87 108 106 M85 91 104 110 M67 72 H81 M74 65 V79" /></>;
    case "signal":
      return <><path d="M80 57 V103 M69 103 H91 M72 95 H88 M68 63 Q56 75 68 87 M92 63 Q104 75 92 87 M59 56 Q40 75 59 94 M101 56 Q120 75 101 94" /><circle cx="80" cy="60" r="4" /></>;
    case "forge":
      return <><path d="M52 77 H108 L99 88 H87 V101 H101 V108 H59 V101 H73 V88 H62 Z M61 77 V69 H99 V77 M72 69 V59 H88 V69" /><path d="M58 88 47 82 M102 88 113 82" /></>;
    case "compass":
      return <><circle cx="80" cy="80" r="29" /><circle cx="80" cy="80" r="22" /><path d="M91 64 85 85 69 96 75 75 Z M80 49 V55 M80 105 V111 M49 80 H55 M105 80 H111" /></>;
    case "book":
      return <><path d="M80 67 Q67 58 52 62 V101 Q67 97 80 106 Q93 97 108 101 V62 Q93 58 80 67 Z M80 67 V106 M58 71 Q67 69 74 74 M86 74 Q93 69 102 71 M58 81 Q67 79 74 84 M86 84 Q93 79 102 81" /></>;
    case "link":
      return <><path d="M72 71 65 64 Q57 56 50 64 Q43 71 51 79 L65 93 Q72 100 79 93 M88 89 95 96 Q103 104 110 96 Q117 89 109 81 L95 67 Q88 60 81 67 M68 92 92 68" /></>;
    case "flag":
      return <><path d="M60 110 V53 M63 57 Q75 50 84 57 Q94 64 105 56 V84 Q94 92 84 84 Q74 77 63 84 M53 110 H69" /><path d="M71 69 H97" /></>;
    case "shield":
      return <><path d="M80 51 106 60 V79 Q106 100 80 111 Q54 100 54 79 V60 Z M80 58 99 65 V79 Q99 94 80 103 Q61 94 61 79 V65 Z M80 64 V98 M66 80 H94" /></>;
    case "blade":
      return <><path d="M57 54 102 99 M103 54 58 99 M57 54 54 70 88 104 96 96 62 62 Z M103 54 106 70 72 104 64 96 98 62 Z M56 93 67 104 M93 104 104 93 M52 108 58 102 M108 108 102 102" /></>;
    case "target":
      return <><circle cx="80" cy="80" r="26" /><circle cx="80" cy="80" r="16" /><circle cx="80" cy="80" r="5" /><path d="M80 49 V61 M80 99 V111 M49 80 H61 M99 80 H111" /></>;
    case "anchor":
      return <><circle cx="80" cy="58" r="6" /><path d="M80 64 V105 M66 72 H94 M57 87 Q59 106 80 108 Q101 106 103 87 M50 90 57 84 64 91 M96 91 103 84 110 90" /></>;
    case "helm":
      return <><path d="M55 76 Q55 53 80 51 Q105 53 105 76 V96 L92 107 H68 L55 96 Z M55 77 75 83 80 77 85 83 105 77 M72 87 80 102 88 87 M65 62 H95 M63 93 71 96 M97 93 89 96" /></>;
    case "scales":
      return <><path d="M80 53 V105 M66 108 H94 M57 65 H103 M57 65 48 88 H66 Z M103 65 94 88 H112 Z M52 88 Q57 98 63 88 M97 88 Q103 98 109 88" /><circle cx="80" cy="59" r="4" /></>;
  }
}

export default function ServiceAwardArt({ name, height = 150 }: { name: string; height?: number }) {
  const award = awardLookup.get(name);
  const id = useId().replace(/:/g, "");
  if (!award) return null;
  const { motif, index } = award;
  const color = index < 18 ? "#9a7951" : index < 36 ? "#a1493c" : "#7d8b98";
  const frame = index % 3;
  const outline = frame === 0
    ? "M80 10 136 36 130 106 80 150 30 106 24 36 Z"
    : frame === 1
      ? "M48 13 H112 L141 44 V107 L80 150 19 107 V44 Z"
      : "M80 9 135 45 V100 L112 132 80 150 48 132 25 100 V45 Z";

  return (
    <svg viewBox="0 0 160 160" role="img" aria-label={name} className="award-art service-award-art" style={{ width: "100%", height }}>
      <defs>
        <linearGradient id={`metal${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d0c8b7" /><stop offset=".25" stopColor="#736f67" />
          <stop offset=".52" stopColor="#282b2d" /><stop offset=".76" stopColor="#96918a" />
          <stop offset="1" stopColor="#353637" />
        </linearGradient>
        <linearGradient id={`face${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#343638" /><stop offset="1" stopColor="#101214" />
        </linearGradient>
      </defs>
      <path d={outline} fill={`url(#metal${id})`} stroke="#090a0b" strokeWidth="3" strokeLinejoin="round" />
      <path d={outline} transform="translate(9 9) scale(.8875)" fill={`url(#face${id})`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M43 45 52 39 M108 39 117 45 M41 108 50 115 M110 115 119 108" fill="none" stroke="#a8a399" strokeWidth="2" />
      <circle cx="80" cy="80" r="36" fill="#17191a" stroke={color} strokeWidth="2" />
      <circle cx="80" cy="80" r="32" fill="none" stroke="#77746b" strokeWidth=".7" strokeDasharray="2 3" />
      <g fill="none" stroke="#c7c0af" strokeWidth="2.8" strokeLinecap="square" strokeLinejoin="round">
        <MotifArt motif={motif} />
      </g>
      <path d="M53 119 H107 L103 132 H57 Z" fill="#17191a" stroke={color} strokeWidth="1.5" />
      <text x="80" y="129" textAnchor="middle" fill="#c7c0af" fontFamily="Georgia, serif" fontSize="9" fontWeight="bold" letterSpacing="2">
        {String(index + 1).padStart(2, "0")}
      </text>
      <circle cx="43" cy="53" r="2" fill="#c0b9ab" /><circle cx="117" cy="53" r="2" fill="#c0b9ab" />
    </svg>
  );
}
