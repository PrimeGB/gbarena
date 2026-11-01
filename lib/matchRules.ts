// Per-game match rules for every game except Call of Duty / Old School (which use the
// COD-style form) and RedSec (which has its own locked ruleset).
// Each field maps onto an existing match_posts / matches text column ("slot"), so no schema
// change is needed and the match page can look the label up from the same config.
//
// Sources: Rainbow Six Siege Pro League / Siege.gg bomb rules (3:00 rounds, 7s plant/defuse,
// 45s fuse, first to 7 of 12 rounds, 3-round overtime); Rocket League tournament standard
// (5:00 matches, unlimited sudden-death overtime, default mutators, standard arenas);
// Battlefield 6 modes per EA/Wikipedia (Conquest, Breakthrough, Rush, Domination, King of the
// Hill, Team Deathmatch, Escalation). Apex and Fortnite lobby formats follow each game's
// public playlists and common custom-lobby scrim formats. Mobile games follow each game's
// official friendly-battle / private-room formats (Supercell friendly battles, CODM esports
// settings, official UNO rules).

export type RuleSlot =
  | "score_limit"
  | "round_length"
  | "bomb_timer"
  | "plant_time"
  | "defuse_time"
  | "health"
  | "respawn_delay"
  | "friendly_fire"
  | "hardcore"
  | "killstreaks"
  | "perks"
  | "launchers"
  | "field_upgrades"
  | "radar"
  | "spectating"
  | "third_person"
  | "attachments";

export type RuleField = {
  slot: RuleSlot;
  label: string;
  options: string[];
  default: string;
};

export type ModeDef = {
  value: string;
  fields: RuleField[];
  rules: string[];
};

export type GameRuleSet = {
  modes: ModeDef[];
  teamSizes: string[];
  bestOf: string[];
  presetName: string;
  notes: string[];
};

const field = (slot: RuleSlot, label: string, options: string[], def?: string): RuleField => ({
  slot,
  label,
  options,
  default: def ?? options[0],
});

const rocketLeagueMode =  (value: string, extraRule?: string): ModeDef => ({
  value,
  fields: [
    field("round_length", "Match Length", ["5 Minutes", "3 Minutes", "7 Minutes"]),
    field("score_limit", "Overtime", ["Unlimited Sudden Death", "Max 5:00 Overtime"]),
    field("perks", "Mutators", ["Default"]),
    field("spectating", "Arena", ["Standard Arenas Only", "Any Arena (Host Choice)"]),
  ],
  rules: [
    "Private match lobby. The higher seed (or host team) creates it and invites the opponent.",
    "Default mutators and standard competitive arenas only unless both teams agree otherwise.",
    "5:00 game clock. A tie goes to sudden-death overtime — first goal wins.",
    ...(extraRule ? [extraRule] : []),
  ],
});

const rocketLeague: GameRuleSet = {
  modes: [],
  teamSizes: ["3v3"],
  bestOf: ["Best of 1", "Best of 3", "Best of 5", "Best of 7"],
  presetName: "GameBattles Standard",
  notes: ["Playlist ladders follow the same tournament-standard settings."],
};

const rainbowSixBomb: ModeDef = {
  value: "Bomb",
  fields: [
    field("score_limit", "Rounds To Win", ["7 (12 Round Match)", "4 (6 Round Match)"]),
    field("round_length", "Round Time", ["3 Minutes", "2 Minutes 30 Seconds"]),
    field("bomb_timer", "Prep Phase", ["45 Seconds", "30 Seconds"]),
    field("plant_time", "Plant Time", ["7 Seconds"]),
    field("defuse_time", "Defuse Time", ["7 Seconds"]),
    field("friendly_fire", "Friendly Fire", ["100%", "Off"]),
    field("health", "Injured HP", ["20 HP"]),
  ],
  rules: [
    "Sides swap after 6 rounds in a 12 round match.",
    "Tied at 6-6: overtime of 3 rounds per side, win by 2.",
    "Each team bans 1 attacker and 1 defender operator before the match.",
    "Pro League map pool only. Host team picks the side.",
  ],
};

const rules: Record<string, GameRuleSet> = {
  "rocket-league": {
    ...rocketLeague,
    modes: [
      rocketLeagueMode("Soccar"),
      rocketLeagueMode("Hoops", "Hoops uses the standard Hoops arena."),
      rocketLeagueMode("Rumble", "Rumble power-ups stay on default."),
      rocketLeagueMode("Dropshot", "Dropshot uses default floor and ball settings."),
      rocketLeagueMode("Snow Day", "Snow Day uses the default puck and arena."),
    ],
  },
  "rainbow-six": {
    modes: [
      rainbowSixBomb,
      {
        value: "Secure Area",
        fields: [
          field("score_limit", "Rounds To Win", ["7 (12 Round Match)", "4 (6 Round Match)"]),
          field("round_length", "Round Time", ["3 Minutes", "2 Minutes 30 Seconds"]),
          field("bomb_timer", "Prep Phase", ["45 Seconds", "30 Seconds"]),
          field("friendly_fire", "Friendly Fire", ["100%", "Off"]),
        ],
        rules: [
          "Attackers must secure the objective room; defenders must hold it.",
          "Sides swap after 6 rounds. Overtime is 3 rounds per side, win by 2.",
        ],
      },
      {
        value: "Hostage",
        fields: [
          field("score_limit", "Rounds To Win", ["7 (12 Round Match)", "4 (6 Round Match)"]),
          field("round_length", "Round Time", ["3 Minutes", "2 Minutes 30 Seconds"]),
          field("bomb_timer", "Prep Phase", ["45 Seconds", "30 Seconds"]),
          field("friendly_fire", "Friendly Fire", ["100%", "Off"]),
        ],
        rules: [
          "Attackers rescue the hostage; defenders protect or kill them.",
          "Sides swap after 6 rounds. Overtime is 3 rounds per side, win by 2.",
        ],
      },
    ],
    teamSizes: ["5v5", "4v4", "3v3"],
    bestOf: ["Best of 1", "Best of 2", "Best of 3"],
    presetName: "Pro League Standard",
    notes: ["Bomb is the competitive standard; Secure Area and Hostage are optional."],
  },
  battlefield: {
    modes: [
      {
        value: "Conquest",
        fields: [
          field("score_limit", "Tickets", ["Default", "400", "600"]),
          field("round_length", "Time Limit", ["Default", "20 Minutes", "30 Minutes"]),
          field("friendly_fire", "Friendly Fire", ["Off", "On"]),
          field("killstreaks", "Vehicles", ["Allowed", "Infantry Only"]),
        ],
        rules: ["Capture and hold flags to drain enemy tickets.", "Host team picks the map from the game's playlist."],
      },
      {
        value: "Breakthrough",
        fields: [
          field("score_limit", "Tickets", ["Default"]),
          field("round_length", "Time Limit", ["Default", "30 Minutes"]),
          field("friendly_fire", "Friendly Fire", ["Off", "On"]),
          field("killstreaks", "Vehicles", ["Allowed", "Infantry Only"]),
        ],
        rules: ["Attackers push through sector objectives; defenders hold the line.", "Teams swap sides for the second game of a series."],
      },
      {
        value: "Domination",
        fields: [
          field("score_limit", "Score Limit", ["Default", "200", "300"]),
          field("round_length", "Time Limit", ["Default", "15 Minutes"]),
          field("friendly_fire", "Friendly Fire", ["Off", "On"]),
        ],
        rules: ["Three-flag infantry mode on small maps."],
      },
      {
        value: "Team Deathmatch",
        fields: [
          field("score_limit", "Score Limit", ["Default", "50 Kills", "75 Kills", "100 Kills"]),
          field("round_length", "Time Limit", ["Default", "10 Minutes", "15 Minutes"]),
          field("friendly_fire", "Friendly Fire", ["Off", "On"]),
        ],
        rules: ["First team to the kill limit wins; higher score wins at time limit."],
      },
      {
        value: "King of the Hill",
        fields: [
          field("score_limit", "Score Limit", ["Default"]),
          field("round_length", "Time Limit", ["Default", "15 Minutes"]),
          field("friendly_fire", "Friendly Fire", ["Off", "On"]),
        ],
        rules: ["Control the moving hill to score."],
      },
      {
        value: "Rush",
        fields: [
          field("score_limit", "Tickets", ["Default"]),
          field("round_length", "Time Limit", ["Default", "30 Minutes"]),
          field("friendly_fire", "Friendly Fire", ["Off", "On"]),
        ],
        rules: ["Attackers arm and destroy M-COM stations; defenders stop them."],
      },
    ],
    teamSizes: ["4v4", "5v5", "6v6", "8v8"],
    bestOf: ["Best of 1", "Best of 3", "Best of 5"],
    presetName: "GameBattles Standard",
    notes: ["Agree on map and vehicles in match chat before starting."],
  },
  apex: {
    modes: [
      {
        value: "Battle Royale",
        fields: [
          field("score_limit", "Scoring", ["Placement + Kills", "Kills Only", "Placement Only"]),
          field("round_length", "Games Per Match", ["1 Game", "2 Games", "3 Games"]),
          field("spectating", "Lobby", ["Private Custom Lobby", "Public Squad Queue"]),
        ],
        rules: [
          "Both squads drop in the same lobby (custom lobby or same-server squad queue).",
          "Placement + Kills: placement points plus 1 point per kill. Higher total wins.",
          "Disputes require a full-lobby screenshot of the results screen.",
        ],
      },
      {
        value: "Arenas",
        fields: [
          field("score_limit", "Rounds To Win", ["3", "5", "9 (Win by 2)"]),
          field("round_length", "Round Time", ["Default"]),
          field("killstreaks", "Weapons", ["Standard Buy Rounds"]),
        ],
        rules: ["3v3 round-based mode. First team to the round limit wins."],
      },
      {
        value: "Control",
        fields: [
          field("score_limit", "Score Limit", ["Default", "First To 750"]),
          field("round_length", "Time Limit", ["Default", "15 Minutes"]),
        ],
        rules: ["Capture and hold objectives; higher score wins."],
      },
      {
        value: "Team Deathmatch",
        fields: [
          field("score_limit", "Score Limit", ["Default", "30 Kills", "50 Kills"]),
          field("round_length", "Time Limit", ["Default", "10 Minutes"]),
        ],
        rules: ["First team to the kill limit wins."],
      },
    ],
    teamSizes: ["3v3"],
    bestOf: ["Best of 1", "Best of 3"],
    presetName: "GameBattles Standard",
    notes: ["Both squads must be in the same lobby; no teaming with other squads."],
  },
  fortnite: {
    modes: [
      {
        value: "Battle Royale",
        fields: [
          field("score_limit", "Scoring", ["Placement + Eliminations", "Eliminations Only", "Placement Only"]),
          field("round_length", "Games Per Match", ["1 Game", "2 Games", "3 Games"]),
          field("killstreaks", "Building", ["Build", "Zero Build"]),
        ],
        rules: [
          "Both squads queue into the same match; start the queue within 3 seconds of each other.",
          "Placement + Eliminations: placement points plus 1 point per elimination.",
          "Disputes require a full results-screen screenshot.",
        ],
      },
      {
        value: "Zero Build",
        fields: [
          field("score_limit", "Scoring", ["Placement + Eliminations", "Eliminations Only", "Placement Only"]),
          field("round_length", "Games Per Match", ["1 Game", "2 Games", "3 Games"]),
        ],
        rules: ["No building. Same lobby rules and scoring as Battle Royale."],
      },
      {
        value: "Reload",
        fields: [
          field("score_limit", "Score Limit", ["Default", "First To 40 Eliminations"]),
          field("round_length", "Time Limit", ["Default", "15 Minutes"]),
        ],
        rules: ["Eliminated players respawn while a teammate is alive. Higher eliminations wins."],
      },
      {
        value: "Box Fights",
        fields: [
          field("score_limit", "First To", ["5 Rounds", "7 Rounds", "10 Rounds"]),
          field("round_length", "Map", ["Standard Box Fight Island"]),
        ],
        rules: ["Creative box-fight map. Win-by-1 round; swap sides every round."],
      },
    ],
    teamSizes: ["3v3", "4v4"],
    bestOf: ["Best of 1", "Best of 3"],
    presetName: "GameBattles Standard",
    notes: ["Host team provides the party or custom code when needed."],
  },
  "clash-of-clans": {
    modes: [
      {
        value: "Friendly Challenge",
        fields: [
          field("score_limit", "Winner", ["Most Stars, Then Destruction %", "Destruction % Only"]),
          field("round_length", "Attack Time", ["3 Minutes (Standard)"]),
          field("spectating", "Base Layout", ["Each Player's War Base", "Agreed Shared Base"]),
        ],
        rules: [
          "Friendly Challenges cost no troops or resources. Each player attacks the other's base once per game.",
          "Both players use the same Town Hall level. Max-level troops, spells and heroes only if both agree.",
          "Winner is decided by the most stars; destruction % breaks a star tie. A full tie is a draw and is replayed.",
          "Record or screenshot each attack result screen as proof.",
        ],
      },
    ],
    teamSizes: ["1v1"],
    bestOf: ["Best of 1", "Best of 3"],
    presetName: "GameBattles Standard",
    notes: ["Challenge your opponent from Clan Chat or the in-game Friendly Challenge menu."],
  },
  "clash-royale": {
    modes: [
      {
        value: "Friendly Battle",
        fields: [
          field("round_length", "Match Length", ["3 Minutes + 2 Minute Overtime"]),
          field("score_limit", "Card Levels", ["Tournament Standard (Level 11)", "Normal Levels"]),
          field("perks", "Deck Rule", ["Any Deck", "No Duplicate Champions"]),
        ],
        rules: [
          "Friendly Battle created from the Social tab or Clan Chat. Both players are on the same server.",
          "3:00 match with double elixir in the final minute. A tied match goes to a 2:00 sudden-death overtime.",
          "Most crowns wins. If still tied after overtime, the lowest-health tower is lost and the match can end in a draw.",
          "Tournament Standard levels every card to the same level, which keeps the match fair.",
          "Draws are replayed. Screenshot the post-battle screen as proof.",
        ],
      },
    ],
    teamSizes: ["1v1", "2v2"],
    bestOf: ["Best of 1", "Best of 3", "Best of 5"],
    presetName: "GameBattles Standard",
    notes: ["Friendly battles do not affect trophies or chests, so playing is free."],
  },
  "cod-mobile": {
    modes: [
      {
        value: "Hardpoint",
        fields: [
          field("score_limit", "Score Limit", ["250 Points"]),
          field("round_length", "Time Limit", ["10 Minutes"]),
          field("killstreaks", "Scorestreaks", ["Off", "UAV + Counter UAV Only"]),
          field("friendly_fire", "Friendly Fire", ["Off"]),
        ],
        rules: [
          "Private custom room. The host team creates the room and sets the password.",
          "Standard competitive map pool only. No operator skills.",
          "LMGs, shotguns, launchers and field upgrades are banned unless both teams agree.",
        ],
      },
      {
        value: "Search & Destroy",
        fields: [
          field("score_limit", "Rounds To Win", ["6 Rounds"]),
          field("round_length", "Round Time", ["1 Minute 30 Seconds"]),
          field("plant_time", "Plant Time", ["5 Seconds"]),
          field("defuse_time", "Defuse Time", ["7.5 Seconds"]),
          field("friendly_fire", "Friendly Fire", ["On"]),
        ],
        rules: [
          "One life per round. Teams switch sides every round.",
          "Standard competitive map pool only. No operator skills or scorestreaks.",
        ],
      },
      {
        value: "Team Deathmatch",
        fields: [
          field("score_limit", "Score Limit", ["75 Kills", "50 Kills"]),
          field("round_length", "Time Limit", ["10 Minutes"]),
          field("killstreaks", "Scorestreaks", ["Off"]),
        ],
        rules: ["Standard competitive map pool only. Highest kills at the limit wins."],
      },
      {
        value: "Battle Royale",
        fields: [
          field("score_limit", "Scoring", ["Placement + Eliminations", "Eliminations Only"]),
          field("round_length", "Games Per Match", ["1 Game", "2 Games", "3 Games"]),
          field("perks", "Mode", ["Solo", "Duo", "Squad"]),
        ],
        rules: [
          "Both teams queue into the same match; start the queue within 3 seconds of each other.",
          "Placement points plus 1 point per elimination. A full results-screen screenshot is required for disputes.",
        ],
      },
    ],
    teamSizes: ["5v5", "4v4", "3v3"],
    bestOf: ["Best of 1", "Best of 3", "Best of 5"],
    presetName: "GameBattles Standard",
    notes: ["Rooted or jailbroken devices and cheat tools are not allowed."],
  },
  uno: {
    modes: [
      {
        value: "Classic",
        fields: [
          field("score_limit", "Play To", ["500 Points", "Single Round"]),
          field("round_length", "Starting Hand", ["7 Cards"]),
          field("perks", "House Rules", ["Official Rules Only", "Stacking Draw Cards"]),
        ],
        rules: [
          "Each player starts with 7 cards. First to empty their hand wins the round.",
          "Winner scores the cards left in opponents' hands: number cards face value, Skip / Reverse / Draw Two 20, Wild and Wild Draw Four 50.",
          "A player with one card left must call UNO. If caught first, they draw 2 cards.",
          "First to 500 points wins the game. Screenshot the final score screen as proof.",
        ],
      },
      {
        value: "2v2 Team Play",
        fields: [
          field("score_limit", "Play To", ["500 Points", "Single Round"]),
          field("round_length", "Starting Hand", ["7 Cards"]),
        ],
        rules: [
          "Partners sit opposite each other. A team scores when either partner empties their hand.",
          "Partners may not share card information outside the game's built-in chat.",
          "Same scoring and UNO call rules as Classic. First team to 500 wins.",
        ],
      },
    ],
    teamSizes: ["1v1", "2v2"],
    bestOf: ["Best of 1", "Best of 3"],
    presetName: "Official UNO Rules",
    notes: ["Use a private room. All players must be in the same lobby."],
  },
};

export function getGameRules(category: string, game: string): GameRuleSet | null {
  if (category === "call-of-duty" || category === "old-school") return null;
  if (category === "battlefield" && game === "redsec") return null;
  const set = rules[category];
  if (!set) return null;

  if (category === "rocket-league") {
    // Each Rocket League ladder is a playlist, so only that playlist's mode is offered.
    const wanted: Record<string, string> = {
      soccar: "Soccar",
      hoops: "Hoops",
      rumble: "Rumble",
      dropshot: "Dropshot",
      "snow-day": "Snow Day",
    };
    const modes = set.modes.filter((mode) => mode.value === wanted[game]);
    return { ...set, modes: modes.length ? modes : set.modes };
  }

  if (category === "fortnite") {
    if (game === "zero-build") return { ...set, modes: set.modes.filter((m) => m.value === "Zero Build") };
    if (game === "reload") return { ...set, modes: set.modes.filter((m) => m.value === "Reload" || m.value === "Box Fights") };
    return { ...set, modes: set.modes.filter((m) => m.value === "Battle Royale" || m.value === "Box Fights") };
  }

  if (category === "apex") {
    if (game === "mixtape") return { ...set, modes: set.modes.filter((m) => m.value !== "Battle Royale") };
    if (game === "wildcard") return { ...set, modes: set.modes.filter((m) => m.value === "Team Deathmatch" || m.value === "Control") };
    return { ...set, modes: set.modes.filter((m) => m.value === "Battle Royale" || m.value === "Arenas") };
  }

  if (category === "battlefield" && game === "battlefield-2042") {
    return { ...set, modes: set.modes.filter((m) => m.value !== "King of the Hill") };
  }

  if (category === "cod-mobile") {
    return game === "battle-royale"
      ? { ...set, modes: set.modes.filter((m) => m.value === "Battle Royale"), teamSizes: ["3v3", "4v4"] }
      : { ...set, modes: set.modes.filter((m) => m.value !== "Battle Royale") };
  }

  if (category === "uno") {
    const wanted = game === "2v2" ? "2v2 Team Play" : "Classic";
    return { ...set, modes: set.modes.filter((m) => m.value === wanted) };
  }

  if (category === "clash-royale") {
    return { ...set, teamSizes: game === "2v2" ? ["2v2"] : ["1v1"] };
  }

  return set;
}

export function findModeFields(category: string, game: string, mode: string): RuleField[] | null {
  const set = getGameRules(category, game);
  if (!set) return null;
  const found = set.modes.find((item) => item.value === mode) || set.modes[0];
  return found ? found.fields : null;
}
