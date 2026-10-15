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

        <section className="rule-section">
          <h2>Four Main Rules</h2>
          <ul>
            <li>No cheating, exploiting, or outside software.</li>
            <li>Report match results honestly.</li>
            <li>Save proof for disputes.</li>
            <li>Follow the correct roster limit.</li>
          </ul>
        </section>

        <section className="rule-section">
          <h2>Team Creation Confirmation</h2>
          <p>
            Before creating a team, players must confirm that they understand the current ladder rules.
          </p>
          <ul>
            <li>You understand this is the {gameName} {currentLadderName} Ladder.</li>
            <li>You agree to follow all match, roster, reporting, and dispute rules.</li>
            <li>You understand cheating, fake reports, or abuse can lead to removal.</li>
            <li>You understand staff may review match proof during disputes.</li>
          </ul>
        </section>

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
        .community-link{margin:24px 0 0;}
      `}</style>
    </main>
  );
}
