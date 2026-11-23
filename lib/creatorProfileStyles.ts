export const CREATOR_THEMES = [
  { id: "classic", name: "Original", description: "Keep your current GameBattles look." },
  { id: "gold", name: "Gold Elite", description: "Black and gold championship details." },
  { id: "ice", name: "Ice Commander", description: "Electric blue and steel accents." },
  { id: "inferno", name: "Inferno", description: "Dark panels with a red competitive edge." },
  { id: "legacy", name: "Legacy Steel", description: "Polished silver and classic black." },
  { id: "viper", name: "Viper Circuit", description: "Tactical green with digital circuit details." },
  { id: "eclipse", name: "Royal Eclipse", description: "Violet energy and a deep-space finish." },
  { id: "champion", name: "Champion's Forge", description: "Burnished bronze and a battle-worn finish." },
  { id: "sovereign", name: "Sovereign", description: "A championship crest with brushed-gold details." },
  { id: "aftershock", name: "Aftershock", description: "Electric-blue energy and a lightning-mark finish." },
  { id: "rival", name: "Rival", description: "A fierce red signature with a competitive edge." },
  { id: "spotlight", name: "Spotlight", description: "A cool silver-blue identity with broadcast polish." },
] as const;

export type CreatorTheme = typeof CREATOR_THEMES[number]["id"];
export type CreatorStyle = { tier: "affiliate" | "ambassador"; theme: CreatorTheme; show_name: boolean; show_logo: boolean };

export function isCreatorTheme(value: string): value is CreatorTheme {
  return CREATOR_THEMES.some((theme) => theme.id === value);
}
