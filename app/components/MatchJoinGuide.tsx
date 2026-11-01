const BF6_STEPS = [
  "Open Battlefield 6.",
  "Press R2, RT, or TAB to open EA Connect.",
  "Scroll to Player search.",
  "Type your opponent's or teammate's EA or platform ID into the search bar.",
  "Select Done.",
  "Scroll to find them, then select Add friend.",
  "They get a friend request they can accept in the Friend requests tab.",
];

export function isBattlefield(category?: string | null, game?: string | null) {
  return /battlefield/i.test(`${category || ""} ${game || ""}`);
}

export function MatchJoinGuide({ battlefield, compact }: { battlefield: boolean; compact?: boolean }) {
  return (
    <details
      open={!compact}
      style={{ margin: "12px 0", border: "1px solid #1d4f7a", background: "#0b2236", color: "#d7e2ee", fontSize: 13, lineHeight: 1.6 }}
    >
      <summary style={{ cursor: "pointer", padding: "10px 12px", fontWeight: "bold", color: "#f2c14e", textTransform: "uppercase", letterSpacing: 1 }}>
        How to get into this match
      </summary>
      <div style={{ padding: "0 14px 12px" }}>
        <p style={{ marginBottom: 6 }}>
          Swap in-game IDs with the other team (match comments or team chat), add each other as friends, then party up or
          invite into the lobby before the scheduled time.
        </p>
        {battlefield ? (
          <>
            <b style={{ color: "#fff" }}>Adding friends in Battlefield 6</b>
            <ol style={{ margin: "6px 0 8px 20px" }}>
              {BF6_STEPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p style={{ marginBottom: 6 }}>
              Once added, they appear in the EA Connect <b>Friends</b> tab. Invite them to your party from the <b>Party</b> tab to
              play together.
            </p>
            <p>
              Cross play: if you add a platform friend as an EA friend, you can keep playing together even when they are on a
              different platform.
            </p>
          </>
        ) : (
          <p>
            Add the other player&apos;s gamertag / platform ID on your console or PC, then invite them to a party or private
            lobby for the match.
          </p>
        )}
      </div>
    </details>
  );
}
