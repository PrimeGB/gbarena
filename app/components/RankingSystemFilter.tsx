"use client";

import { ladderPlatformLabel } from "../../lib/ladderCatalog";

export default function RankingSystemFilter({ systems, value, onChange }: {
  systems: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="ranking-filter">
      System{" "}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">{systems.length > 1 ? "All Systems" : "All available systems"}</option>
        {systems.map((system) => <option key={system} value={system}>{ladderPlatformLabel(system) || system}</option>)}
      </select>
      <style>{`
        .ranking-filter{display:inline-flex;align-items:center;gap:6px;margin:6px 12px;color:#cfe2f2;font:11px Tahoma,sans-serif}
        .ranking-filter select{padding:5px;color:#eaf6ff;background:#071522;border:1px solid #315f88}
      `}</style>
    </label>
  );
}
