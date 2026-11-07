"use client";

import { useId } from "react";

type Frame =
  | "lens" | "bug" | "bug-emerald" | "bug-diamond" | "bug-mythic"
  | "crest" | "fracture" | "wings" | "beacon" | "anvil"
  | "citadel" | "compass" | "tome" | "maze" | "speech" | "bridge"
  | "hands" | "sun" | "scroll" | "blades" | "last-stand" | "target"
  | "objective" | "bulwark" | "breach" | "arrows" | "duel" | "anchor"
  | "helm" | "network" | "phoenix" | "road" | "bracket" | "clutch"
  | "podium" | "laurel" | "handshake" | "spear" | "scales" | "integrity"
  | "cup" | "steward" | "mentor" | "evidence" | "gavel" | "gear"
  | "lightning" | "clock" | "whistle" | "service" | "legacy";

type AwardDesign = {
  group: "COMMUNITY" | "PLAYER" | "STAFF";
  frame: Frame;
  accent: string;
};

const AWARDS: Record<string, AwardDesign> = {
  "Bug Finder": { group: "COMMUNITY", frame: "bug", accent: "#f4c14f" },
  "Bug Finder — Emerald": { group: "COMMUNITY", frame: "bug-emerald", accent: "#48e0a0" },
  "Bug Finder — Diamond": { group: "COMMUNITY", frame: "bug-diamond", accent: "#70ddff" },
  "Bug Finder — Mythic": { group: "COMMUNITY", frame: "bug-mythic", accent: "#c27bff" },
  "Bug Hunter": { group: "COMMUNITY", frame: "crest", accent: "#8df15b" },
  "Critical Discovery": { group: "COMMUNITY", frame: "fracture", accent: "#ffca62" },
  "Fix Investigator": { group: "COMMUNITY", frame: "wings", accent: "#4bc8ff" },
  "Quality Vanguard": { group: "COMMUNITY", frame: "crest", accent: "#58efa4" },
  "Early Warning": { group: "COMMUNITY", frame: "beacon", accent: "#ff765f" },
  "Idea Forge": { group: "COMMUNITY", frame: "anvil", accent: "#ff9d4f" },
  "Community Architect": { group: "COMMUNITY", frame: "citadel", accent: "#50d7ff" },
  "Newcomer Guide": { group: "COMMUNITY", frame: "compass", accent: "#74ecdb" },
  "Knowledge Keeper": { group: "COMMUNITY", frame: "tome", accent: "#75aaff" },
  "Problem Solver": { group: "COMMUNITY", frame: "maze", accent: "#c27bff" },
  "Community Voice": { group: "COMMUNITY", frame: "speech", accent: "#ff7eb6" },
  "Bridge Builder": { group: "COMMUNITY", frame: "bridge", accent: "#ffc568" },
  "Event Supporter": { group: "COMMUNITY", frame: "hands", accent: "#ff9159" },
  "Recruiting Ally": { group: "COMMUNITY", frame: "network", accent: "#72d6ff" },
  "Recruitment Recruit": { group: "COMMUNITY", frame: "network", accent: "#c78b4b" },
  "Community Recruiter": { group: "COMMUNITY", frame: "bridge", accent: "#c8cbd2" },
  "Recruitment Captain": { group: "COMMUNITY", frame: "compass", accent: "#f4c14f" },
  "Recruitment Legend": { group: "COMMUNITY", frame: "legacy", accent: "#70ddff" },
  "Positive Influence": { group: "COMMUNITY", frame: "sun", accent: "#ffe16b" },
  "Community Defender": { group: "COMMUNITY", frame: "bulwark", accent: "#6ce7a8" },
  "Community Historian": { group: "COMMUNITY", frame: "scroll", accent: "#d0adff" },
  "Opening Strike": { group: "PLAYER", frame: "blades", accent: "#ff735d" },
  "Last Stand": { group: "PLAYER", frame: "last-stand", accent: "#ffb54d" },
  "Precision Strike": { group: "PLAYER", frame: "target", accent: "#ff535b" },
  "Objective Specialist": { group: "PLAYER", frame: "objective", accent: "#65d6ff" },
  "Iron Defense": { group: "PLAYER", frame: "bulwark", accent: "#9bbcff" },
  "Breakthrough": { group: "PLAYER", frame: "breach", accent: "#ff9852" },
  "Battlefield Adaptation": { group: "PLAYER", frame: "arrows", accent: "#a6e66c" },
  "Rivalry Victor": { group: "PLAYER", frame: "duel", accent: "#ffcb55" },
  "Squad Anchor": { group: "PLAYER", frame: "anchor", accent: "#56d9e8" },
  "Tactical Commander": { group: "PLAYER", frame: "helm", accent: "#b28aff" },
  "Team Synergy": { group: "PLAYER", frame: "network", accent: "#6ff0b0" },
  "Resilient Competitor": { group: "PLAYER", frame: "phoenix", accent: "#ff7952" },
  "Road Warrior": { group: "PLAYER", frame: "road", accent: "#f7c75d" },
  "Bracket Breaker": { group: "PLAYER", frame: "bracket", accent: "#ff6d8d" },
  "Final Round Hero": { group: "PLAYER", frame: "clutch", accent: "#ffe071" },
  "Consistent Contender": { group: "PLAYER", frame: "podium", accent: "#7cc9ff" },
  "Veteran Competitor": { group: "PLAYER", frame: "laurel", accent: "#d2b077" },
  "Sportsmanship Standard": { group: "PLAYER", frame: "handshake", accent: "#7ce6ca" },
  "Staff Vanguard": { group: "STAFF", frame: "spear", accent: "#74c7ff" },
  "Dispute Specialist": { group: "STAFF", frame: "scales", accent: "#c8a4ff" },
  "Match Integrity Officer": { group: "STAFF", frame: "integrity", accent: "#68e5bd" },
  "Tournament Operations": { group: "STAFF", frame: "cup", accent: "#ffcb68" },
  "Community Steward": { group: "STAFF", frame: "steward", accent: "#81df9d" },
  "Staff Mentor": { group: "STAFF", frame: "mentor", accent: "#79baff" },
  "Investigation Excellence": { group: "STAFF", frame: "evidence", accent: "#71e5ee" },
  "Fair Decision": { group: "STAFF", frame: "gavel", accent: "#d4b8ff" },
  "Behind the Scenes": { group: "STAFF", frame: "gear", accent: "#a9b8cb" },
  "Rapid Response": { group: "STAFF", frame: "lightning", accent: "#ffe05c" },
  "Staff Reliability": { group: "STAFF", frame: "clock", accent: "#65d9c6" },
  "Event Commander": { group: "STAFF", frame: "whistle", accent: "#ff9d62" },
  "Service Above Self": { group: "STAFF", frame: "service", accent: "#ff83b7" },
  "Staff Legacy": { group: "STAFF", frame: "legacy", accent: "#cfadff" },
};

const BUG_GLYPH = "M80 38 A22 22 0 1 0 80 82 A22 22 0 1 0 80 38 M58 50 42 39 M57 62 H35 M58 74 42 86 M102 50 118 39 M103 62 H125 M102 74 118 86 M72 38 66 25 M88 38 94 25 M80 38 V25 M58 52 Q38 47 35 33 M58 72 Q38 77 35 91 M102 52 Q122 47 125 33 M102 72 Q122 77 125 91 M70 82 66 99 H94 L90 82";

const FRAME_PATHS: Record<Frame, string> = {
  lens: "M80 10 A62 62 0 1 0 80 134 A62 62 0 1 0 80 10 M80 20 A52 52 0 1 1 80 124 A52 52 0 1 1 80 20",
  bug: BUG_GLYPH,
  "bug-emerald": BUG_GLYPH,
  "bug-diamond": BUG_GLYPH,
  "bug-mythic": BUG_GLYPH,
  crest: "M80 9 139 35 129 103 80 143 31 103 21 35 Z",
  fracture: "M80 8 96 30 126 19 126 50 150 66 132 89 139 119 105 121 80 150 55 121 21 119 28 89 10 66 34 50 34 19 64 30 Z",
  wings: "M80 23 98 37 121 26 122 51 149 64 132 84 141 109 111 111 80 142 49 111 19 109 28 84 11 64 38 51 39 26 62 37 Z",
  beacon: "M80 8 91 23 109 14 112 34 133 32 128 53 149 62 134 79 150 96 130 106 136 128 113 128 108 150 88 137 80 154 72 137 52 150 47 128 24 128 30 106 10 96 26 79 10 62 31 53 26 32 48 34 51 14 69 23 Z",
  anvil: "M22 30 H138 L150 48 134 63 H111 V91 H127 V108 H105 L99 137 H61 L55 108 H33 V91 H49 V63 H28 L12 48 Z",
  citadel: "M16 140 V65 L36 65 V39 L56 52 V23 L80 42 104 23 V52 L124 39 V65 H144 V140 Z",
  compass: "M80 8 97 55 144 72 97 89 80 136 63 89 16 72 63 55 Z",
  tome: "M80 26 Q50 8 18 20 V125 Q50 112 80 137 Q110 112 142 125 V20 Q110 8 80 26 Z",
  maze: "M20 20 H140 V140 H20 Z M42 42 V66 H68 V91 H42 V117 H82 V104 H111 V77 H94 V53 H122",
  speech: "M17 33 Q17 17 35 17 H113 Q132 17 132 35 V82 Q132 99 114 99 H73 L45 126 V99 H35 Q17 99 17 82 Z M83 72 Q104 61 98 43 Q94 29 78 35 Q70 17 55 27 Q39 38 49 56 Q58 73 83 72 Z",
  bridge: "M15 115 H145 M24 115 Q27 48 80 39 Q133 48 136 115 M39 115 V82 M59 115 V58 M80 115 V47 M101 115 V58 M121 115 V82 M14 132 H146",
  hands: "M30 90 18 78 34 59 56 74 68 91 M150 78 138 90 100 91 112 74 134 59 Z M68 91 80 105 92 91 M80 105 V134 M66 134 H94 M80 43 V25 M70 35 H90",
  sun: "M80 38 A42 42 0 1 0 80 122 A42 42 0 1 0 80 38 M80 8 V23 M80 137 V152 M8 80 H23 M137 80 H152 M29 29 40 40 M120 120 131 131 M131 29 120 40 M40 120 29 131",
  scroll: "M42 20 Q20 20 24 42 V119 Q24 141 45 136 H130 V30 H47 Q37 30 37 42 V116 Q37 125 48 125 H113 M56 53 H112 M56 72 H112 M56 91 H98",
  blades: "M33 25 122 114 M147 25 58 114 M33 25 54 28 128 102 116 120 40 44 Z M147 25 126 28 52 102 64 120 140 44 Z M59 116 44 132 M121 116 136 132",
  "last-stand": "M80 18 133 38 V82 Q133 120 80 145 Q27 120 27 82 V38 Z M80 54 A13 13 0 1 0 80 80 A13 13 0 1 0 80 54 M57 117 Q58 91 80 91 Q102 91 103 117 M42 49 58 56 M118 49 102 56",
  target: "M80 20 A60 60 0 1 0 80 140 A60 60 0 1 0 80 20 M80 41 A39 39 0 1 0 80 119 A39 39 0 1 0 80 41 M80 62 A18 18 0 1 0 80 98 A18 18 0 1 0 80 62 M79 80 129 30 M111 30 H130 V49",
  objective: "M41 142 V22 M45 27 Q71 15 91 29 Q111 42 137 26 V85 Q111 101 91 86 Q69 72 45 86 M25 142 H58",
  bulwark: "M80 12 137 32 V81 Q137 121 80 149 Q23 121 23 81 V32 Z M51 76 H109 M80 47 V105 M58 106 80 123 102 106",
  breach: "M20 32 H68 V56 H48 V75 H69 V98 H48 V122 H70 V143 H20 Z M140 32 H92 V56 H112 V75 H91 V98 H112 V122 H90 V143 H140 Z M64 81 79 67 72 91 89 82 84 106",
  arrows: "M25 51 H104 L88 35 M104 51 88 67 M135 109 H56 L72 93 M56 109 72 125 M79 18 63 34 79 50",
  duel: "M27 29 122 124 M151 29 56 124 M27 29 53 34 129 110 116 135 36 55 Z M151 29 125 34 49 110 62 135 142 55 Z M67 20 80 8 93 20 80 31 Z",
  anchor: "M80 27 A13 13 0 1 0 80 53 A13 13 0 1 0 80 27 M80 53 V120 M53 73 H107 M36 93 Q39 132 80 137 Q121 132 124 93 M23 92 37 78 51 94 M109 94 123 78 137 92",
  helm: "M23 79 Q23 22 80 17 Q137 22 137 79 V116 L110 141 H50 L23 116 Z M23 78 62 87 80 69 98 87 137 78 M53 99 80 129 107 99 M52 42 H108",
  network: "M39 45 A14 14 0 1 0 39 73 A14 14 0 1 0 39 45 M121 45 A14 14 0 1 0 121 73 A14 14 0 1 0 121 45 M80 104 A14 14 0 1 0 80 132 A14 14 0 1 0 80 104 M52 61 H108 M47 75 69 108 M113 75 91 108 M80 74 V103",
  phoenix: "M80 16 91 52 124 29 110 64 148 72 113 88 137 121 101 108 80 148 59 108 23 121 47 88 12 72 50 64 36 29 69 52 Z M80 61 Q98 76 80 107 Q62 76 80 61",
  road: "M52 15 26 145 M128 15 154 145 M80 20 V39 M80 57 V76 M80 94 V113 M80 131 V148 M56 113 Q80 91 104 113 M47 125 H113",
  bracket: "M29 22 H77 V48 H52 V68 H82 V91 H52 V112 H77 V139 H29 Z M151 22 H103 V48 H128 V68 H98 V91 H128 V112 H103 V139 H151 Z M70 59 80 47 90 59 80 72 Z M70 101 80 89 90 101 80 114 Z",
  clutch: "M80 15 91 49 126 34 110 66 146 80 110 94 126 126 91 111 80 147 69 111 34 126 50 94 14 80 50 66 34 34 69 49 Z M80 59 A21 21 0 1 0 80 101 A21 21 0 1 0 80 59 M80 68 V82 L91 89",
  podium: "M21 122 H58 V91 H21 Z M71 122 H109 V57 H71 Z M122 122 H159 V76 H122 Z M13 137 H167 M90 25 96 39 112 40 100 51 103 67 90 59 77 67 80 51 68 40 84 39 Z",
  laurel: "M80 136 V96 M80 111 Q43 107 29 70 Q23 51 34 35 Q39 67 66 73 M80 121 Q117 115 131 78 Q137 57 126 41 Q121 72 94 81 M55 88 45 80 M105 96 115 86 M61 57 57 45 M99 62 105 49 M69 105 55 101 M93 109 108 103",
  handshake: "M23 66 49 48 69 58 82 50 112 56 137 72 120 91 101 82 83 98 71 91 57 103 43 92 30 101 17 87 Z M49 48 61 73 75 83 89 72 104 77 120 91 M61 73 47 86 M75 83 63 96 M89 72 101 82",
  spear: "M80 15 105 52 80 70 55 52 Z M80 70 V145 M53 88 H107 M60 88 47 112 H73 Z M100 88 87 112 H113 Z",
  scales: "M80 24 V129 M56 139 H104 M48 48 H112 M80 24 65 39 80 50 95 39 Z M48 48 29 93 H67 Z M112 48 93 93 H131 Z M25 94 Q48 112 71 94 M89 94 Q112 112 135 94",
  integrity: "M80 12 137 32 V81 Q137 121 80 149 Q23 121 23 81 V32 Z M51 81 71 101 111 57 M45 44 80 31 115 44",
  cup: "M45 25 H115 V65 Q115 93 80 102 Q45 93 45 65 Z M45 37 H25 Q25 75 55 79 M115 37 H135 Q135 75 105 79 M80 102 V125 M59 128 H101 M48 144 H112 L105 128 H55 Z M80 44 85 57 99 57 88 66 92 80 80 72 68 80 72 66 61 57 75 57 Z",
  steward: "M80 17 89 40 113 27 104 52 132 54 112 72 135 89 107 94 115 122 90 108 80 143 70 108 45 122 53 94 25 89 48 72 28 54 56 52 47 27 71 40 Z M80 53 V108 M65 78 80 67 95 78",
  mentor: "M80 56 Q50 37 22 49 V128 Q51 117 80 139 Q109 117 138 128 V49 Q110 37 80 56 Z M80 56 V139 M43 68 Q56 64 68 72 M92 72 Q105 64 117 68 M65 30 80 14 95 30 91 49 H69 Z M73 38 H87",
  evidence: "M68 29 A34 34 0 1 0 68 97 A34 34 0 1 0 68 29 M93 88 130 126 M55 63 H81 M68 50 V76 M48 112 H103 V140 H48 Z M60 122 H90 M60 131 H83",
  gavel: "M51 36 77 18 101 43 76 62 Z M89 60 111 82 M74 70 100 96 M58 84 83 109 M48 112 69 133 M94 130 H139 M104 119 H128 V130 H104 Z M42 56 32 67 71 106 82 95 Z",
  gear: "M80 14 91 29 109 22 114 40 133 42 129 61 146 72 134 88 145 105 126 112 127 132 107 131 97 149 80 137 63 149 53 131 33 132 34 112 15 105 26 88 14 72 31 61 27 42 46 40 51 22 69 29 Z M80 55 A25 25 0 1 0 80 105 A25 25 0 1 0 80 55",
  lightning: "M91 13 39 84 H72 L62 146 119 69 H85 Z M26 41 35 51 M134 40 125 51 M24 114 38 108 M136 113 122 108",
  clock: "M80 14 A65 65 0 1 0 80 144 A65 65 0 1 0 80 14 M80 30 V80 L114 99 M80 5 V17 M154 80 H142 M80 153 V141 M6 80 H18 M39 26 48 38 M121 26 112 38",
  whistle: "M33 75 H64 L90 51 Q114 34 135 50 Q152 64 145 87 Q139 111 113 113 H64 L45 99 H29 Z M95 50 V75 H129 M43 75 V96 M80 83 H104",
  service: "M80 19 97 55 137 60 108 88 115 128 80 109 45 128 52 88 23 60 63 55 Z M80 64 V96 M64 80 H96 M69 51 80 41 91 51 M59 118 46 140 M101 118 114 140",
  legacy: "M30 133 V38 H50 V133 M66 133 V23 H94 V133 M110 133 V38 H130 V133 M20 143 H140 M80 32 88 47 105 49 92 61 96 78 80 69 64 78 68 61 55 49 72 47 Z M45 21 52 31 M135 21 128 31",
};

type Outline =
  | "circle" | "shield" | "star" | "wings" | "burst" | "anvil"
  | "tower" | "diamond" | "book" | "maze" | "speech" | "arch"
  | "medal" | "scroll" | "swords" | "flag" | "split" | "chevron"
  | "anchor" | "crown" | "road" | "podium" | "wreath" | "scales"
  | "trophy" | "gear" | "ribbon";

const FRAME_OUTLINES: Record<Frame, Outline> = {
  lens: "circle",
  bug: "diamond",
  "bug-emerald": "star",
  "bug-diamond": "shield",
  "bug-mythic": "wings",
  crest: "shield",
  fracture: "star",
  wings: "wings",
  beacon: "burst",
  anvil: "anvil",
  citadel: "tower",
  compass: "diamond",
  tome: "book",
  maze: "maze",
  speech: "speech",
  bridge: "arch",
  hands: "medal",
  sun: "burst",
  scroll: "scroll",
  blades: "swords",
  "last-stand": "shield",
  target: "circle",
  objective: "flag",
  bulwark: "shield",
  breach: "split",
  arrows: "chevron",
  duel: "swords",
  anchor: "anchor",
  helm: "crown",
  network: "diamond",
  phoenix: "wings",
  road: "road",
  bracket: "maze",
  clutch: "star",
  podium: "podium",
  laurel: "wreath",
  handshake: "medal",
  spear: "diamond",
  scales: "scales",
  integrity: "shield",
  cup: "trophy",
  steward: "scroll",
  mentor: "book",
  evidence: "circle",
  gavel: "anvil",
  gear: "gear",
  lightning: "chevron",
  clock: "circle",
  whistle: "ribbon",
  service: "medal",
  legacy: "crown",
};

const OUTLINE_PATHS: Record<Outline, string> = {
  circle: "M80 7 A73 73 0 1 0 80 153 A73 73 0 1 0 80 7 M80 20 A60 60 0 1 1 80 140 A60 60 0 1 1 80 20",
  shield: "M80 8 140 31 V80 Q140 120 80 152 Q20 120 20 80 V31 Z",
  star: "M80 7 100 30 132 21 129 54 153 80 129 106 132 139 100 130 80 153 60 130 28 139 31 106 7 80 31 54 28 21 60 30 Z",
  wings: "M80 20 99 35 123 23 124 50 151 62 133 83 143 111 111 112 80 145 49 112 17 111 27 83 9 62 36 50 37 23 61 35 Z",
  burst: "M80 6 92 25 113 12 115 36 140 31 133 56 154 68 137 84 152 103 129 111 132 137 107 130 94 153 79 135 61 151 54 127 29 133 34 107 10 97 24 78 8 60 31 50 25 26 50 34 61 10 75 29 Z",
  anvil: "M22 30 H138 L150 48 134 63 H111 V91 H127 V108 H105 L99 137 H61 L55 108 H33 V91 H49 V63 H28 L12 48 Z",
  tower: "M16 145 V63 H35 V39 L55 51 V22 L80 41 105 22 V51 L125 39 V63 H144 V145 Z",
  diamond: "M80 7 143 43 143 117 80 153 17 117 17 43 Z",
  book: "M80 25 Q49 5 17 20 V133 Q50 118 80 146 Q110 118 143 133 V20 Q111 5 80 25 Z",
  maze: "M20 20 H140 V140 H20 Z M42 42 V66 H68 V91 H42 V117 H82 V104 H111 V77 H94 V53 H122",
  speech: "M18 27 Q18 15 34 15 H126 Q142 15 142 32 V91 Q142 108 124 108 H81 L48 140 V108 H34 Q18 108 18 91 Z",
  arch: "M12 145 V82 Q12 12 80 12 Q148 12 148 82 V145 H126 V84 Q126 34 80 34 Q34 34 34 84 V145 Z",
  medal: "M80 8 A57 57 0 1 0 80 122 A57 57 0 1 0 80 8 M80 20 A45 45 0 1 1 80 110 A45 45 0 1 1 80 20 M47 114 42 151 80 132 118 151 113 114 Z",
  scroll: "M37 14 Q13 14 13 39 V120 Q13 146 40 146 H143 V23 H43 Q30 23 30 39 V117 Q30 128 43 128 H121",
  swords: "M80 9 96 28 142 14 130 57 151 80 130 103 142 146 96 132 80 151 64 132 18 146 30 103 9 80 30 57 18 14 64 28 Z",
  flag: "M34 151 V10 H132 L116 40 132 70 H34 Z",
  split: "M17 16 H69 V47 H45 V70 H68 V96 H45 V121 H69 V151 H17 Z M143 16 H91 V47 H115 V70 H92 V96 H115 V121 H91 V151 H143 Z",
  chevron: "M9 35 80 7 151 35 V125 L80 153 9 125 Z",
  anchor: "M80 8 A19 19 0 1 0 80 46 A19 19 0 1 0 80 8 M70 44 H90 V112 H112 Q129 112 135 91 L151 96 Q140 137 109 137 H88 V151 H72 V137 H51 Q20 137 9 96 L25 91 Q31 112 48 112 H70 Z",
  crown: "M12 48 43 71 61 24 80 59 99 24 117 71 148 48 136 136 H24 Z",
  road: "M25 151 49 9 H111 L135 151 H104 L91 47 H69 L56 151 Z",
  podium: "M12 142 V91 H54 V142 H12 M60 142 V57 H100 V142 H60 M106 142 V24 H148 V142 H106",
  wreath: "M80 9 A65 65 0 1 0 80 139 A65 65 0 1 0 80 9 M80 22 A52 52 0 1 1 80 126 A52 52 0 1 1 80 22 M30 128 42 115 M130 128 118 115",
  scales: "M72 20 H88 V126 H72 Z M35 42 H125 M80 18 64 31 80 42 96 31 Z M39 44 14 88 H64 Z M121 44 96 88 H146 Z M48 125 H112 L122 145 H38 Z",
  trophy: "M49 10 H111 V44 Q111 70 95 83 V112 H124 V145 H36 V112 H65 V83 Q49 70 49 44 Z M49 27 H18 V43 Q18 76 63 78 M111 27 H142 V43 Q142 76 97 78",
  gear: "M68 8 H92 L97 24 111 29 126 21 143 38 135 53 140 68 156 74 V98 L140 103 135 118 143 133 126 150 111 142 97 147 92 163 H68 L63 147 49 142 34 150 17 133 25 118 20 103 4 98 V74 L20 68 25 53 17 38 34 21 49 29 63 24 Z",
  ribbon: "M80 8 A54 54 0 1 0 80 116 A54 54 0 1 0 80 8 M80 22 A40 40 0 1 1 80 102 A40 40 0 1 1 80 22 M45 109 39 151 80 132 121 151 115 109 Z",
};

export function hasServiceAward(name: string) {
  return Object.prototype.hasOwnProperty.call(AWARDS, name);
}

export function serviceAwardAccent(name: string) {
  return AWARDS[name]?.accent || "#f2c14e";
}

export default function ServiceAwardArt({ name, height = 150 }: { name: string; height?: number }) {
  const design = AWARDS[name];
  const id = useId().replace(/:/g, "");
  if (!design) return null;

  const frame = OUTLINE_PATHS[FRAME_OUTLINES[design.frame]];
  const glyph = FRAME_PATHS[design.frame];
  const frameColor = design.group === "COMMUNITY"
    ? "#123f48"
    : design.group === "PLAYER"
      ? "#4b2028"
      : "#29284d";

  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-label={name}
      className="award-art service-award-art"
      style={{ width: "100%", height, ["--service-accent" as string]: design.accent }}
    >
      <defs>
        <radialGradient id={`halo${id}`}>
          <stop offset="0" stopColor={design.accent} stopOpacity=".42" />
          <stop offset="1" stopColor={design.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`edge${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f0e2" />
          <stop offset=".23" stopColor={design.accent} />
          <stop offset=".56" stopColor={frameColor} />
          <stop offset=".82" stopColor={design.accent} />
          <stop offset="1" stopColor="#f4f0e2" />
        </linearGradient>
        <linearGradient id={`face${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1c2936" />
          <stop offset=".58" stopColor="#0b121c" />
          <stop offset="1" stopColor="#080d14" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="80" r="77" fill={`url(#halo${id})`} />
      <path d={frame} fill={`url(#edge${id})`} stroke="#070a10" strokeWidth="3" strokeLinejoin="round" fillRule="evenodd" />
      <path d={frame} transform="translate(7 7) scale(.9125)" fill={`url(#face${id})`} stroke={design.accent} strokeOpacity=".78" strokeWidth="1.4" strokeLinejoin="round" fillRule="evenodd" />
      <path d="M37 33 45 39 M123 33 115 39 M30 116 41 111 M130 116 119 111" stroke="#fff" strokeOpacity=".62" strokeWidth="2" />
      <circle cx="80" cy="77" r="43" fill="#060c14" fillOpacity=".82" stroke={design.accent} strokeOpacity=".75" strokeWidth="1.5" />
      <circle cx="80" cy="77" r="37" fill="none" stroke="#d8e6ee" strokeOpacity=".18" strokeWidth="1" strokeDasharray="1 5" />
      <g
        fill="none"
        stroke="#f3f5ef"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(40 37) scale(.5)"
        style={{ filter: `drop-shadow(0 0 5px ${design.accent})` }}
      >
        <path d={glyph} />
      </g>
      <path d="M43 128 H117 L110 145 H50 Z" fill="#0b121b" stroke={`url(#edge${id})`} strokeWidth="2" />
      <path d="M51 133 H109" stroke={design.accent} strokeOpacity=".8" strokeWidth="2" />
      <text x="80" y="141" textAnchor="middle" fill="#e9f2f5" fontFamily="Tahoma, Arial, sans-serif" fontSize="7" fontWeight="900" letterSpacing="2">
        {design.group}
      </text>
      <circle cx="35" cy="45" r="2" fill={design.accent} />
      <circle cx="125" cy="45" r="2" fill={design.accent} />
      <circle cx="39" cy="108" r="2" fill="#f3f5ef" />
      <circle cx="121" cy="108" r="2" fill="#f3f5ef" />
    </svg>
  );
}
