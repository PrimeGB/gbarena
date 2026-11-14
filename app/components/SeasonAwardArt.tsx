import { useId } from "react";

const finishes: Record<string, { light: string; metal: string; dark: string; glow: string }> = {
  champion: { light: "#fff5c3", metal: "#efbc58", dark: "#805025", glow: "#dfa83d" },
  top10: { light: "#e5fcff", metal: "#70ddfa", dark: "#205992", glow: "#36bbf1" },
  undefeated: { light: "#ffe9ff", metal: "#fa89dc", dark: "#7b2c9b", glow: "#ee4cba" },
  iron_competitor: { light: "#fff0ce", metal: "#eea06a", dark: "#633b31", glow: "#f48142" },
  dynasty: { light: "#fff3d4", metal: "#c5a2ff", dark: "#493282", glow: "#a17bff" },
};

export default function SeasonAwardArt({ honour, place }: { honour: string; place?: number }) {
  const id = `season-art-${useId().replace(/:/g, "")}`;
  const finish = finishes[honour] || finishes.champion;
  const paint = (name: string) => `url(#${id}-${name})`;
  return (
    <svg className={`season-award-art season-award-art-${honour}`} viewBox="0 0 240 180" width="240" height="180" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor={finish.light} /><stop offset=".23" stopColor={finish.metal} />
          <stop offset=".48" stopColor={finish.dark} /><stop offset=".52" stopColor={finish.light} />
          <stop offset=".7" stopColor={finish.metal} /><stop offset="1" stopColor={finish.dark} />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={finish.light} /><stop offset=".45" stopColor={finish.metal} /><stop offset="1" stopColor={finish.dark} />
        </linearGradient>
        <linearGradient id={`${id}-onyx`} x1="0" y1="0" x2=".7" y2="1">
          <stop stopColor="#36485e" /><stop offset=".45" stopColor="#0d192b" /><stop offset="1" stopColor="#030a13" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor={finish.glow} stopOpacity=".4" /><stop offset="1" stopColor={finish.glow} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="220%">
          <feDropShadow dy="6" stdDeviation="4" floodColor="#000" floodOpacity=".65" />
        </filter>
      </defs>
      <ellipse cx="120" cy="90" rx="114" ry="84" fill={paint("halo")} />
      <ellipse cx="120" cy="166" rx="63" ry="5" fill="#000" opacity=".35" />
      <g fill="none" stroke={finish.metal} opacity=".35">
        <path d="M37 99h19m128 0h19M51 49l13 9m112 0 13-9M77 21l6 13m74 0 6-13" />
        <circle cx="120" cy="89" r="67" strokeDasharray="1 9" />
      </g>
      <g filter={paint("shadow")} strokeLinejoin="round">
        {honour === "champion" && <>
          <path d="m82 84-23-9-24-34 29 13-8-17 29 27m73 20 23-9 24-34-29 13 8-17-29 27" fill={paint("metal")} stroke={finish.light} strokeWidth=".7" />
          <path d="M82 68H61c0 25 12 38 34 39m63-39h21c0 25-12 38-34 39" fill="none" stroke={paint("metal")} strokeWidth="9" />
          <path d="M83 47h74l-7 44c-3 19-17 26-30 26S93 110 90 91Z" fill={paint("metal")} stroke={finish.light} />
          <path d="m93 51 7 39c3 12 8 17 14 19l-5-58Z" fill={finish.light} opacity=".48" />
          <ellipse cx="120" cy="47" rx="38" ry="7" fill={paint("edge")} stroke={finish.light} />
          <ellipse cx="120" cy="46" rx="30" ry="3" fill={finish.dark} />
          <path d="m120 64 4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1Z" fill="#fff3b7" stroke={finish.dark} />
          <path d="M115 116h10v18l13 7h-36l13-7Z" fill={paint("metal")} />
          <path d="M92 140h56l8 13H84Z" fill={paint("onyx")} stroke={finish.metal} />
          <path d="M82 153h76v9H82Z" fill={paint("metal")} />
          <path d="m120 13 3 8 9 1-7 6 2 9-7-5-7 5 2-9-7-6 9-1Z" fill={finish.light} />
        </>}
        {honour === "top10" && <>
          <path d="m84 113-13 53 30-12 17 14 8-49m30-6 13 53-30-12-17 14-8-49" fill={paint("onyx")} stroke={finish.metal} strokeWidth="2" />
          <path d="m86 131-9 27 23-10m54-17 9 27-23-10" fill="none" stroke={finish.metal} opacity=".6" />
          <path d="m120 12 19 26 31-4 3 32 25 20-21 25-1 32-32 2-24 21-24-21-32-2-1-32-21-25 25-20 3-32 31 4Z" fill={paint("metal")} stroke={finish.light} />
          <circle cx="120" cy="88" r="52" fill={paint("onyx")} stroke={finish.light} strokeWidth="2" />
          <circle cx="120" cy="88" r="45" fill="none" stroke={finish.metal} strokeDasharray="2 4" />
          <path d="m120 42 13 28 31 4-23 22 5 31-26-15-26 15 5-31-23-22 31-4Z" fill={paint("metal")} stroke={finish.light} />
          <path d="m120 42 1 43-27 42 5-31-23-22 31-4Z" fill={finish.light} opacity=".25" />
          <text x="120" y="96" textAnchor="middle" fill="#071729" stroke={finish.light} strokeWidth=".3" fontSize="27" fontWeight="950" fontFamily="Arial,sans-serif">{place || 10}</text>
          <path d="M105 138h30" stroke={finish.light} strokeWidth="2" />
        </>}
        {honour === "undefeated" && <>
          <path d="M135 24a62 62 0 1 0 37 96 58 58 0 0 1-37-96Z" fill={paint("metal")} stroke={finish.light} />
          <path d="M119 143c-39-12-61-48-45-83-9 41 13 66 45 83Z" fill={finish.light} opacity=".6" />
          <path d="m122 112-17-8-25-37 27 11-11-31 25 23 14-44 10 41 38-21-23 35 37-3-39 29-19 6-4 25-10-12-13 20Z" fill={paint("metal")} stroke={finish.light} strokeWidth="1.2" />
          <path d="m141 68-14 30 22-13-15 33 4-19-20 8Z" fill="#fff7ff" />
          <path d="m154 20 5-10 4 11 12 3-11 5-3 11-5-10-10-4Z" fill={finish.light} />
          <path d="m56 111 4 7 8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1Z" fill={finish.light} />
          <path d="M83 155h76" stroke={finish.metal} opacity=".7" />
          <text x="120" y="161" textAnchor="middle" fill={finish.light} fontSize="11" fontWeight="800" letterSpacing="3">UNBROKEN</text>
        </>}
        {honour === "iron_competitor" && <>
          <path d="m81 20 10 9 14-4 7 12 16 1 5 14 14 6-1 16 10 11-7 14 5 14-12 10-2 15-15 3-10 12-15-5-14 6-10-11-16-1-4-15-12-9 5-15-6-14 11-11V57l14-6 4-15 15-2Z" fill={paint("metal")} stroke={finish.light} transform="translate(24 0)" />
          <circle cx="120" cy="86" r="47" fill={paint("onyx")} stroke={finish.metal} strokeWidth="3" />
          <circle cx="120" cy="86" r="38" fill="none" stroke="#718194" strokeDasharray="7 4" opacity=".5" />
          <path d="m101 54 15-10 34 12-5 16-14-2-26 62-12-5 25-62-12 6Z" fill={paint("metal")} stroke={finish.light} strokeWidth="1.2" />
          <path d="m90 101 12 10h38l12-10h13l-12 17-17 5v10h13v9H92v-9h13v-10l-18-5-12-17Z" fill={paint("edge")} stroke={finish.light} />
          <path d="m87 25-7-11m74 14 8-12m3 116 11 10" stroke={finish.light} strokeWidth="2" />
          <path d="M77 152h86l-8 12H85Z" fill={paint("onyx")} stroke={finish.metal} />
          <text x="120" y="162" textAnchor="middle" fill={finish.light} fontSize="10" fontWeight="900" letterSpacing="2">L / 50</text>
        </>}
        {honour === "dynasty" && <>
          <ellipse cx="120" cy="91" rx="83" ry="42" transform="rotate(-27 120 91)" fill="none" stroke={paint("metal")} strokeWidth="3" />
          <ellipse cx="120" cy="91" rx="83" ry="42" transform="rotate(27 120 91)" fill="none" stroke={paint("metal")} strokeWidth="2" />
          <path d="m67 65 26 19 27-48 27 48 26-19-13 64H80Z" fill={paint("metal")} stroke={finish.light} strokeWidth="1.5" />
          <path d="m80 80 13 49h16L101 87l19-38 4 80h20l16-49-13 17-27-43-27 43Z" fill={paint("onyx")} opacity=".7" />
          <path d="m120 73 11 17-11 18-11-18Z" fill={finish.light} stroke={finish.metal} strokeWidth="2" />
          <path d="m120 78 5 12-5 11-5-11Z" fill="#c19cff" />
          <path d="M79 129h82v12H79Z" fill={paint("metal")} stroke={finish.light} />
          <path d="M83 133h74" stroke="#fff4cc" opacity=".65" />
          <circle cx="67" cy="64" r="5" fill={finish.light} /><circle cx="120" cy="35" r="6" fill={finish.light} /><circle cx="173" cy="64" r="5" fill={finish.light} />
          <path d="m92 151 4 6 7 1-5 5 1 7-7-3-6 3 1-7-5-5 7-1Zm28 0 4 6 7 1-5 5 1 7-7-3-6 3 1-7-5-5 7-1Zm28 0 4 6 7 1-5 5 1 7-7-3-6 3 1-7-5-5 7-1Z" fill={paint("metal")} />
        </>}
      </g>
      <g fill={finish.light}>
        <path d="m62 44 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
        <circle cx="181" cy="119" r="1.5" /><circle cx="48" cy="87" r="1" /><circle cx="172" cy="34" r="1.5" />
      </g>
    </svg>
  );
}
