export function isFounderProfile(role: string | null | undefined, username: string | null | undefined): boolean {
  return role?.toLowerCase() === "owner" && username?.toLowerCase() === "prime";
}

export function hasFounderRgbGlow(role: string | null | undefined, username: string | null | undefined, glow: string | null | undefined): boolean {
  return isFounderProfile(role, username) && glow === "RGB";
}
