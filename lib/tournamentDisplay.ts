export function tournamentSystemLabel(platform: string | null | undefined) {
  const normalized = String(platform || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized || ["any", "anyplatform", "all", "allplatforms", "crossplay"].includes(normalized)) {
    return "Crossplay";
  }

  const systems: Record<string, string> = {
    xbox: "Xbox",
    playstation: "PlayStation",
    nintendo: "Nintendo Switch",
    nintendoswitch: "Nintendo Switch",
    pc: "PC",
    mobile: "Mobile",
  };
  return `System only · ${systems[normalized] || platform?.trim() || "Unknown"}`;
}
