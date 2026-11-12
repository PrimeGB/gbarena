export function rapidRoyalDisplayName(value: string) {
  if (value === "rapid-royal-duos") return "Rapid Royal";
  return value.replace(/rapid royal duos/gi, "Rapid Royal");
}

export const rapidRoyalRules = {
  teams: "Teams may roster up to 3 players. Choose 2v2 or 3v3 when creating the match; both teams must use the same size.",
  duos: "In 2v2, teams take turns. Two players play while one opponent joins, eliminates themselves and spectates without interfering. Then the teams switch roles.",
  trios: "In 3v3, each team plays in its own lobby at the same time. At least one player on each team must stream the entire run, share it with the opposing team and staff, and show the final kill count.",
  winning: "The team with the higher total kills when its run ends wins the round.",
  proof: "Keep scoreboard screenshots or video for disputes. For 3v3, keep the stream recording available as proof.",
};
