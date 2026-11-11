import { getGameRules } from "./matchRules";

export type ItemRestriction = {
  category: "Equipment" | "Perk";
  item: string;
  status: "Allowed" | "Banned";
};

export type AdditionalMatchRules = {
  settings: Record<string, string>;
  restrictions: ItemRestriction[];
};

type RulePost = {
  category?: string | null;
  game?: string | null;
  game_mode?: string | null;
  additional_rules?: AdditionalMatchRules | null;
} & Partial<Record<
  "perks" | "launchers" | "killstreaks" | "field_upgrades" | "hardcore" |
  "friendly_fire" | "radar" | "spectating" | "third_person" | "round_length" |
  "score_limit" | "health" | "respawn_delay" | "bomb_timer" | "plant_time" |
  "defuse_time" | "attachments",
  string | null
>>;

const codFields = [
  ["perks", "Perks"], ["launchers", "Launchers"], ["killstreaks", "Killstreaks"],
  ["field_upgrades", "Field Upgrades"], ["attachments", "Attachments"],
  ["hardcore", "Hardcore"], ["friendly_fire", "Friendly Fire"], ["radar", "Radar"],
  ["spectating", "Spectating"], ["third_person", "Third Person"],
  ["round_length", "Round Length"], ["score_limit", "Score Limit"], ["health", "Health"],
  ["respawn_delay", "Respawn Delay"], ["bomb_timer", "Bomb Timer"],
  ["plant_time", "Plant Time"], ["defuse_time", "Defuse Time"],
] as const;

export function postedRuleSettings(post: RulePost): { label: string; value: string }[] {
  const mode = getGameRules(post.category || "", post.game || "")?.modes
    .find((item) => item.value === post.game_mode);
  const fields = mode ? mode.fields.map((field) => [field.slot, field.label] as const) : codFields;
  const settings = fields.flatMap(([slot, label]) => {
    const value = post[slot];
    return typeof value === "string" && value.trim() ? [{ label, value }] : [];
  });
  const extra = post.additional_rules;
  if (extra?.settings && typeof extra.settings === "object" && !Array.isArray(extra.settings)) {
    for (const [label, value] of Object.entries(extra.settings)) {
      if (typeof value === "string" && value.trim()) settings.push({ label, value });
    }
  }
  if (Array.isArray(extra?.restrictions)) {
    for (const restriction of extra.restrictions) {
      if (
        restriction && (restriction.category === "Equipment" || restriction.category === "Perk") &&
        typeof restriction.item === "string" && restriction.item.trim() &&
        (restriction.status === "Allowed" || restriction.status === "Banned")
      ) {
        settings.push({ label: `${restriction.category}: ${restriction.item}`, value: restriction.status });
      }
    }
  }
  return settings;
}
