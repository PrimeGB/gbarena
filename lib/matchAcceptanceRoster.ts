export function initialAcceptanceRoster(playerIds: string[], requiredPlayers: number) {
  return requiredPlayers === 1 && playerIds.length === 1 ? [playerIds[0]] : [];
}

export function toggleAcceptancePlayer(
  selected: string[],
  playerId: string,
  requiredPlayers: number,
) {
  if (selected.includes(playerId)) return selected.filter((id) => id !== playerId);
  if (requiredPlayers === 1) return [playerId];
  return selected.length < requiredPlayers ? [...selected, playerId] : selected;
}
