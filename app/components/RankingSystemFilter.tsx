"use client";

import { ladderPlatformLabel } from "../../lib/ladderCatalog";

export default function RankingSystemFilter({ systems, value, onChange }: {
  systems: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="ranking-filter">
      <span className="ranking-label">Standings:</span>
      <div className="ranking-systems" role="group" aria-label="Choose standings system">
        <button type="button" aria-pressed={value === "all"} onClick={() => onChange("all")}>
          All Systems
        </button>
        {systems.map((system) => (
          <button key={system} type="button" aria-pressed={value === system} onClick={() => onChange(system)}>
            {ladderPlatformLabel(system) || system}
          </button>
        ))}
      </div>
      <span className="ranking-note">Ranks are per system</span>
      <style>{`
        .ranking-filter{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0;color:#cfe2f2;font:11px Tahoma,sans-serif}
        .ranking-label{font-weight:700}
        .ranking-systems{display:flex;flex-wrap:wrap;gap:4px}
        .ranking-systems button{min-height:28px;padding:4px 9px;border:1px solid #467ca2;border-radius:3px;background:linear-gradient(#1b4666,#0b263c);color:#cbeaff;font:700 11px Tahoma,sans-serif;cursor:pointer}
        .ranking-systems button:hover{border-color:#9bd8ff;color:#fff}
        .ranking-systems button[aria-pressed="true"]{border-color:#a1d6f7;background:linear-gradient(#c9edff,#68b5e6 45%,#3278a7);color:#061727}
        .ranking-systems button:focus-visible{outline:2px solid #f2c14e;outline-offset:2px}
        .ranking-note{color:#c1d5e4}
      `}</style>
    </div>
  );
}
