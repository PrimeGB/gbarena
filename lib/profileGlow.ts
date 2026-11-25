export function isFounderProfile(role: string | null | undefined, username: string | null | undefined): boolean {
  return role?.toLowerCase() === "owner" && username?.toLowerCase() === "prime";
}

export function hasFounderRgbGlow(role: string | null | undefined, username: string | null | undefined, glow: string | null | undefined): boolean {
  return isFounderProfile(role, username) && glow === "RGB";
}

export function favoriteSystemClass(system: string): string {
  const cleanSystem = system.toLowerCase();
  if (cleanSystem.includes("xbox")) return "favorite-xbox";
  if (cleanSystem.includes("playstation")) return "favorite-playstation";
  if (cleanSystem.includes("nintendo")) return "favorite-nintendo";
  if (cleanSystem.includes("pc")) return "favorite-pc";
  return "favorite-default";
}

export function friendProfileFrameClass(
  profile: { username: string | null; role: string | null; profile_glow: string | null; favorite_system: string | null },
  creator: { tier: string; theme: string } | null,
): string {
  if (hasFounderRgbGlow(profile.role, profile.username, profile.profile_glow)) return "friend-rgb";
  if (creator?.tier === "ambassador" && creator.theme !== "classic") return `creator-style-${creator.theme}`;
  if (creator) return "friend-gold";
  return favoriteSystemClass(profile.favorite_system || "PlayStation");
}
