type LadderRulesPageProps = {
  params: Promise<{
    platform: string;
    category: string;
    game: string;
    ladder: string;
  }>;
};

function prettyText(value: string) {
  if (value === "battlefield-6") return "Battlefield 6";
  if (value === "battlefield-2042") return "Battlefield 2042";
  if (value === "battlefield-v") return "Battlefield V";
  if (value === "battlefield-1") return "Battlefield 1";

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ladderName(ladder: string) {
  if (ladder === "redsec") return "RedSec";
  if (ladder === "singles") return "Solos";
  if (ladder === "duos") return "Duos";
  if (ladder === "team") return "Team";
  return prettyText(ladder);
}

export default async function LadderRulesPage({ params }: LadderRulesPageProps) {
  const { platform, category, game, ladder } = await params;
  const gameName = prettyText(game);
  const categoryName = prettyText(category);
  const currentLadderName = ladderName(ladder);

  return (
    <main className="page">
      <section className="rules-panel">
        <a
          className="back-link"
          href={`/ladders/${platform}/${category}/${game}/${ladder}/rankings`}
        >
          Back to {gameName} rankings
        </a>

        <header>
          <p>{prettyText(platform)} {categoryName} Ladder Rules</p>
          <h1>{gameName} {currentLadderName} Ladder</h1>
        </header>

        {ladder === "redsec" ? (
          <div className="redsec-rules">
            <h2>RedSec — Kill Race Rules</h2>
            <div className="disclaimer">
              <strong>Early Production Disclaimer</strong>
              <p>
                This website is still very early in production. This ladder may not function
                exactly as it will when finished, and rules, settings, and match procedures
                may be tweaked as development continues.
              </p>
              <p>
                With that being said — <strong>THANK YOU for playing GameBattles!</strong> Any
                and all feedback is welcome. Expect tweaks, changes, and improvements as we
                continue building the ladder.
              </p>
            </div>

            <h3>The Kill Race</h3>
            <p>The RedSec ladder is essentially a <strong>Kill Race</strong>.</p>
            <p>
              Because the available game settings cannot be changed very much, the rules
              are intentionally simple.
            </p>

            <h3>How a Match Works — 2v2</h3>
            <ol>
              <li>Both teams join the same game with their two opponents.</li>
              <li>The website determines which team hosts the first game.</li>
              <li><strong>The hosting team plays first.</strong></li>
              <li>
                When the game begins, the two non-host players will launch from the
                helicopter and eliminate themselves as quickly as possible.
              </li>
              <li>
                They will respawn and repeat this until they are no longer able to respawn
                and enter spectator mode.
              </li>
              <li>
                The hosting team then plays out the game, attempting to earn as many kills
                as possible.
              </li>
              <li><strong>Every kill is worth 1 point.</strong></li>
              <li>
                <div className="example">
                  <strong>Example:</strong>
                  <br />
                  Player A: 3 kills
                  <br />
                  Player B: 2 kills
                  <br />
                  Team Total: <strong>5 points</strong>
                </div>
              </li>
              <li>The team continues playing until they can no longer respawn.</li>
              <li>
                Winning the individual game does <strong>not</strong> determine the match
                winner. The only thing that matters is the total number of kills.
              </li>
              <li>Once the first game is complete, the teams <strong>switch hosts and run it back.</strong></li>
              <li>The team with the most total points after both games wins the match.</li>
            </ol>

            <h3>3v3</h3>
            <p>The same rules apply.</p>
            <p>
              The only difference is that <strong>only one player from the opposing team
              needs to enter spectator mode</strong> while the hosting team plays.
            </p>

            <h3>4v4</h3>
            <p>The same Kill Race rules apply.</p>
            <p>
              At least one player on the hosting team <strong>must be streaming their gameplay</strong>
              and have the stream verified with the opposing team before the game begins.
            </p>
            <p>
              The scoreboard must be shown <strong>clearly at the end of the game</strong> so
              the opposing team can verify the final kill count.
            </p>
            <p>
              <strong>
                Backing out of the game early, ending the stream before the game is
                complete, or closing the stream before the final scoreboard can be clearly
                seen may result in a loss.
              </strong>
            </p>

            <h3>Proof</h3>
            <p>
              Players should capture <strong>video and/or picture proof</strong> of their
              games in case there is a dispute or an issue with the reported score.
            </p>
            <p>Proof may be requested when a match result is disputed.</p>

            <h3>Keep It Simple</h3>
            <p>That&apos;s really all there is to it.</p>
            <p>
              The Kill Race is designed to be straightforward:
              <strong> play your game, get your kills, record the score, switch hosts,
              and run it back.</strong>
            </p>
            <p>
              These rules apply to all RedSec matches, with the only differences being the
              spectator requirements for <strong>3v3</strong> and the streaming/scoreboard
              requirements for <strong>4v4</strong>.
            </p>
            <p>
              As the ladder develops, rules may be <strong>tweaked, added, removed, or
              changed</strong> when necessary.
            </p>
          </div>
        ) : (
          <section className="rule-section">
            <h2>{currentLadderName} Ladder Match Rules</h2>
            <ul>
              <li>This match is being played on the {gameName} {currentLadderName} Ladder.</li>
              <li>Use the ladder&apos;s selected ruleset and the player count listed for the ladder.</li>
              <li>Maps are generated after the match is accepted based on the game, ladder, mode, ruleset, and Best Of.</li>
              <li>Report match results after the match.</li>
              <li>Keep screenshots or other proof in case a result is disputed.</li>
            </ul>
          </section>
        )}

        <p className="community-link">
          For general conduct and platform-wide rules, see the{" "}
          <a href="/rules">Community &amp; Match Rules</a>.
        </p>
      </section>

      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        .page{min-height:100vh;padding:32px 20px;background:linear-gradient(to bottom,#02060a,#000);}
        .rules-panel{max-width:900px;margin:0 auto;padding:24px;background:#07111b;border:1px solid #315f88;}
        .back-link,.community-link a{color:#7fc7ff;text-decoration:none;}
        .back-link:hover,.community-link a:hover{color:#d7ad4a;}
        header{margin:24px -24px 0;padding:20px 24px;background:linear-gradient(to bottom,#173956,#07111b);border-top:1px solid #244b70;border-bottom:1px solid #244b70;}
        header p{margin:0 0 8px;color:#f2c14e;font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase;}
        h1{margin:0;color:#fff;font-size:26px;text-transform:uppercase;}
        .rule-section{margin-top:24px;padding:18px;background:#050b12;border:1px solid #244b70;}
        h2{margin:0 0 12px;color:#d7ad4a;font-size:15px;text-transform:uppercase;}
        p,li{font-size:13px;line-height:1.7;}
        ul{margin:0;padding-left:22px;}
        li{margin:5px 0;}
        .redsec-rules{margin-top:24px;color:#cfe2f2;font-size:13px;line-height:1.7;}
        .redsec-rules h2{font-size:18px;}
        .redsec-rules h3{margin:22px 0 8px;padding-bottom:6px;border-bottom:1px solid #244b70;color:#fff;font-size:14px;text-transform:uppercase;}
        .redsec-rules p{margin:0 0 12px;}
        .redsec-rules ol{margin:8px 0 14px 22px;padding-left:18px;}
        .redsec-rules li{margin-bottom:7px;}
        .disclaimer,.example{padding:13px;border:1px solid #315b7d;background:#081522;}
        .disclaimer{margin-bottom:18px;}
        .example{margin:10px 0 14px;border-left:3px solid #d7ad4a;}
        .redsec-rules strong{color:#fff;}
        .community-link{margin:24px 0 0;}
      `}</style>
    </main>
  );
}
