"use client";

import { useId } from "react";

type Trophy = { color: string; light: string; dark: string; mark: string; shape: "cup" | "shield" | "medal" | "crystal"; elite?: boolean };
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
  ["First Steps Trophy", "blue", "footsteps"],
  ["Game On Trophy", "emerald", "controller"],
  ["Battle Ready Trophy", "gold", "armor"],
  ["Momentum Trophy", "orange", "arrow"],
  ["On the Grind Trophy", "ruby", "mountain"],
  ["Battle Tested Trophy", "purple", "crossed", true],
  ["Veteran Run Trophy", "ice", "compass", true],
  ["Unstoppable Journey Trophy", "gold", "comet", true],
  ["Double Victory Trophy", "blue", "laurel"],
  ["Triple Threat Trophy", "emerald", "trident"],
  ["High Five Trophy", "orange", "hand"],
  ["Victory Surge Trophy", "ruby", "flame"],
  ["Winning Edge Trophy", "purple", "target"],
  ["Victory Vanguard Trophy", "gold", "banner", true],
  ["Triumph Elite Trophy", "ice", "diamond", true],
  ["Victory Legend Trophy", "ruby", "crown", true],
  ["Spring Bloom Trophy", "pink", "spring"],
  ["Summer Heat Trophy", "orange", "summer"],
  ["Autumn Harvest Trophy", "ruby", "autumn"],
  ["Winter Frost Trophy", "ice", "winter"],
  ["Season Starter Trophy", "blue", "sunrise"],
  ["Season Challenger Trophy", "emerald", "helmet"],
  ["Season Contender Trophy", "purple", "shield"],
  ["Season Warrior Trophy", "gold", "swords", true],
  ["Season Spark Trophy", "orange", "spark"],
  ["Season Surge Trophy", "ruby", "wave"],
  ["Season Elite Trophy", "ice", "wings", true],
  ["Season Conqueror Trophy", "purple", "fortress", true],
  ["Community Spark Trophy", "orange", "lantern"],
  ["Welcome Wagon Trophy", "emerald", "welcome"],
  ["Team Builder Trophy", "blue", "team"],
  ["Creative Mind Trophy", "pink", "lightbulb"],
  ["Positive Play Trophy", "emerald", "handshake"],
  ["Helpful Hand Trophy", "ice", "lifebuoy"],
  ["Clutch Moment Trophy", "ruby", "bolt", true],
  ["Rivalry Respect Trophy", "purple", "rivals", true],
  ["Comeback Story Trophy", "orange", "comeback", true],
  ["Squad Spirit Trophy", "blue", "squad", true],
  ["Community Champion Trophy", "gold", "heartcrown", true],
  ["Game Changer Trophy", "purple", "wand", true],
];

const trophies = new Map<string, Trophy>(
  definitions.map(([name, palette, mark, elite], index) => [name, {
    ...palettes[palette], mark, elite, shape: (["cup", "shield", "medal", "crystal"] as const)[index % 4],
  }])
);

export function hasNewTrophy(name: string) {
  return trophies.has(name);
}

export function newTrophyAccent(name: string) {
  return trophies.get(name)?.color;
}

const symbols: Record<string, string> = {
  footsteps: "M97 66 Q90 65 91 58 Q92 50 98 51 Q104 52 102 59 Q101 65 97 66 Z M99 69 Q92 71 93 79 Q96 84 102 80 L106 75 Q105 69 99 69 Z M119 75 Q113 74 114 67 Q115 60 121 61 Q127 62 125 69 Q124 75 119 75 Z M121 78 Q114 79 115 87 Q118 92 124 88 L128 83 Q127 77 121 78 Z",
  controller: "M94 61 H126 Q132 61 134 69 L137 82 Q137 88 132 89 L121 81 H99 L88 89 Q83 88 83 82 L86 69 Q88 61 94 61 Z M96 66 V76 M91 71 H101 M120 68 H121 M126 74 H127",
  armor: "M110 48 L130 56 V71 Q129 86 110 96 Q91 86 90 71 V56 Z M98 64 L110 58 L122 64 M110 58 V87",
  arrow: "M89 84 L117 56 H105 M117 56 V68 M92 72 L101 63 M102 87 L121 68 M117 88 L130 75",
  mountain: "M86 89 L102 55 L110 70 L117 58 L135 89 Z M97 66 L102 71 L106 66 M113 66 L117 71 L122 67 M96 88 L106 78",
  crossed: "M92 52 L125 86 M128 52 L95 86 M88 86 L97 77 M123 77 L132 86 M91 51 L98 53 L94 59 Z M129 51 L122 53 L126 59 Z",
  compass: "M110 49 A23 23 0 1 1 109.9 49 Z M118 61 L113 75 L102 83 L107 69 Z M110 52 V56 M110 88 V92 M90 72 H94 M126 72 H130",
  comet: "M121 61 L128 68 L124 78 L114 82 L105 75 L108 65 Z M105 62 L91 53 M101 70 L87 65 M103 79 L91 83",
  laurel: "M110 91 Q92 84 91 61 M110 91 Q128 84 129 61 M93 76 L87 71 M94 69 L89 62 M97 82 L91 80 M127 76 L133 71 M126 69 L131 62 M123 82 L129 80 M105 90 L110 94 L115 90",
  trident: "M110 91 V52 M110 76 Q95 76 95 59 M110 76 Q125 76 125 59 M91 64 L95 57 L99 64 M106 57 L110 50 L114 57 M121 64 L125 57 L129 64",
  hand: "M96 78 L92 72 Q91 68 94 67 L100 72 V57 Q100 53 103 53 Q106 53 106 57 V67 V54 Q106 51 109 51 Q112 51 112 54 V67 V57 Q112 54 115 54 Q118 54 118 57 V68 V61 Q118 58 121 58 Q124 58 124 62 V76 Q124 87 116 91 H106 Q100 88 96 78 Z",
  flame: "M110 49 Q112 62 120 62 Q118 69 125 73 Q131 87 118 92 Q106 98 97 89 Q89 80 96 68 Q97 76 104 73 Q101 62 110 49 Z M109 84 Q107 79 112 74 Q117 80 115 85 Q113 88 109 84 Z",
  target: "M110 50 A22 22 0 1 1 109.9 50 Z M110 59 A13 13 0 1 1 109.9 59 Z M110 68 A4 4 0 1 1 109.9 68 Z M110 72 L125 57 M121 57 H127 V63",
  banner: "M96 94 V50 M97 52 Q108 48 118 54 Q124 57 130 54 V75 Q124 78 117 75 Q107 70 97 74 M91 94 H101",
  diamond: "M89 65 L98 54 H122 L131 65 L110 91 Z M89 65 H131 M98 54 L104 65 L110 91 L116 65 L122 54",
  crown: "M90 85 L86 57 L99 67 L110 51 L121 67 L134 57 L130 85 Z M91 91 H129 M96 79 H124",
  sunrise: "M88 85 H132 M94 80 A16 16 0 0 1 126 80 M110 52 V58 M90 60 L95 65 M130 60 L125 65 M87 73 H92 M128 73 H133 M95 91 H125",
  helmet: "M90 75 Q90 52 110 52 Q130 52 130 75 V82 H122 V70 H98 V82 H90 Z M98 72 H122 M105 70 V91 H115 V70 M102 58 H118",
  shield: "M110 49 L130 57 V71 Q129 86 110 95 Q91 86 90 71 V57 Z M110 57 V86 M99 70 H121",
  swords: "M95 50 L120 80 M125 50 L100 80 M93 85 L104 76 M116 76 L127 85 M90 48 L98 51 L95 58 Z M130 48 L122 51 L125 58 Z M92 88 L96 92 M124 92 L128 88",
  spark: "M110 48 L114 65 L131 72 L114 77 L110 95 L105 77 L89 72 L105 65 Z M93 52 V59 M89 55 H97 M128 83 V90 M124 86 H132",
  wave: "M88 78 Q98 64 108 75 T132 70 M88 87 Q98 73 108 84 T132 79 M95 58 L102 51 L110 60 L119 51 L126 58",
  wings: "M110 88 L104 77 L88 72 L94 69 L86 61 L101 65 L95 54 L110 63 L125 54 L119 65 L134 61 L126 69 L132 72 L116 77 Z",
  fortress: "M91 91 V58 H98 V64 H105 V58 H115 V64 H122 V58 H129 V91 Z M104 91 V81 Q110 74 116 81 V91 M98 71 H101 M119 71 H122",
  lantern: "M103 54 Q110 47 117 54 M99 61 H121 L125 87 H95 Z M95 87 H125 M103 61 L101 82 M117 61 L119 82 M110 65 L113 72 L110 79 L107 72 Z",
  welcome: "M88 72 L110 52 L132 72 M94 69 V90 H126 V69 M104 90 V79 H116 V90 M124 55 L130 51 M127 62 H134",
  team: "M110 53 A6 6 0 1 1 109.9 53 Z M94 63 A5 5 0 1 1 93.9 63 Z M126 63 A5 5 0 1 1 125.9 63 Z M100 87 V80 Q100 71 110 71 Q120 71 120 80 V87 Z M87 87 V80 Q87 73 95 73 M133 87 V80 Q133 73 125 73",
  lightbulb: "M110 50 A17 17 0 0 0 99 80 Q103 83 103 87 H117 Q117 83 121 80 A17 17 0 0 0 110 50 Z M104 91 H116 M107 95 H113 M106 72 L110 77 L114 72 M110 77 V86",
  handshake: "M88 65 L99 58 L108 62 L116 58 L132 65 L125 81 L120 84 L116 88 L111 90 L99 82 L94 79 Z M108 62 L101 69 Q100 73 104 74 L112 69 L125 81 M99 82 L104 77 M105 86 L109 81 M111 89 L114 85",
  lifebuoy: "M110 50 A22 22 0 1 1 109.9 50 Z M110 63 A9 9 0 1 1 109.9 63 Z M94 56 L104 66 M126 56 L116 66 M94 88 L104 78 M126 88 L116 78",
  bolt: "M114 49 L96 75 H107 L103 94 L125 67 H114 Z",
  rivals: "M90 56 L105 70 L99 84 L89 75 Z M130 56 L115 70 L121 84 L131 75 Z M105 70 L110 74 L115 70 M99 84 L110 90 L121 84",
  comeback: "M91 75 A19 19 0 1 1 98 88 M91 75 V63 M91 75 H103 M109 61 L105 72 H114 L110 84",
  squad: "M110 51 L130 59 V72 Q129 86 110 94 Q91 86 90 72 V59 Z M100 68 A4 4 0 1 1 99.9 68 Z M120 68 A4 4 0 1 1 119.9 68 Z M110 61 A4 4 0 1 1 109.9 61 Z M98 82 Q110 73 122 82",
  heartcrown: "M110 91 C78 74 89 56 101 62 Q107 64 110 70 Q113 64 119 62 C131 56 142 74 110 91 Z M96 55 L93 47 L102 51 L110 44 L118 51 L127 47 L124 55 Z",
  wand: "M95 89 L121 62 M120 49 L122 56 L129 58 L122 60 L120 67 L118 60 L111 58 L118 56 Z M92 57 V65 M88 61 H96 M126 79 V87 M122 83 H130",
};

function TrophyMark({ mark }: { mark: string }) {
  const common = { fill: "#fff4d5", stroke: "#572b10", strokeWidth: 1.5, strokeLinejoin: "round" as const };
  if (mark === "spring") return <g {...common}><circle cx="110" cy="72" r="7" fill="#ffcd41" />{[0, 60, 120, 180, 240, 300].map((angle) => <ellipse key={angle} cx="110" cy="59" rx="5" ry="10" transform={`rotate(${angle} 110 72)`} />)}<circle cx="110" cy="72" r="5" fill="#ffcd41" /></g>;
  if (mark === "summer") return <g {...common}><circle cx="110" cy="72" r="14" fill="#ffd55c" />{[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <path key={angle} d="M110 48 V54" stroke="#fff4d5" strokeWidth="4" strokeLinecap="round" transform={`rotate(${angle} 110 72)`} />)}</g>;
  if (mark === "autumn") return <path {...common} d="M110 47 L115 59 L124 55 L121 66 L132 69 L121 77 L125 84 L114 83 L110 97 L106 83 L95 84 L99 77 L88 69 L99 66 L96 55 L105 59 Z" />;
  if (mark === "winter") return <g stroke="#fff" strokeWidth="4" strokeLinecap="round">{[0, 60, 120].map((angle) => <path key={angle} d="M110 49 V95 M101 56 L110 64 L119 56 M101 88 L110 80 L119 88" transform={`rotate(${angle} 110 72)`} />)}</g>;
  return <path d={symbols[mark]} fill="none" stroke="#fff4d5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
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
      {trophy.shape === "cup" && <>
        <path d="M65 42 C23 31 25 86 66 91 M155 42 C197 31 195 86 154 91" fill="none" stroke="#2b1d1b" strokeWidth="12" strokeLinecap="round" />
        <path d="M65 42 C23 31 25 86 66 91 M155 42 C197 31 195 86 154 91" fill="none" stroke={edge} strokeWidth="7" strokeLinecap="round" />
        <path d="M57 28 Q110 16 163 28 L157 77 Q152 106 124 118 L96 118 Q68 106 63 77 Z" fill={metal} stroke="#3b241b" strokeWidth="3" />
        <path d="M62 30 Q110 20 158 30 L155 39 Q110 32 65 39 Z" fill={edge} stroke="#69451e" strokeWidth="2" />
      </>}
      {trophy.shape === "shield" && <path d="M57 35 L75 26 L110 31 L145 26 L163 35 L157 84 Q151 106 110 124 Q69 106 63 84 Z" fill={metal} stroke={edge} strokeWidth="4" strokeLinejoin="round" />}
      {trophy.shape === "medal" && <>
        <path d="M69 30 L86 17 L110 26 L134 17 L151 30 L145 43 L75 43 Z" fill={edge} stroke="#3b241b" strokeWidth="3" />
        <path d="M110 22 L130 29 L151 34 L160 54 L165 75 L157 96 L142 111 L122 120 H98 L78 111 L63 96 L55 75 L60 54 L69 34 L90 29 Z" fill={metal} stroke={edge} strokeWidth="4" strokeLinejoin="round" />
      </>}
      {trophy.shape === "crystal" && <>
        <path d="M110 17 L157 46 L150 88 L110 122 L70 88 L63 46 Z" fill={metal} stroke={edge} strokeWidth="4" strokeLinejoin="round" />
        <path d="M110 17 L110 43 M63 46 L81 58 M157 46 L139 58 M70 88 L85 83 M150 88 L135 83 M110 101 V122" stroke={trophy.light} strokeWidth="3" opacity=".8" />
      </>}
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
