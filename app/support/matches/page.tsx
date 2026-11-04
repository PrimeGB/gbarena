import Link from "next/link";
import InfoPage from "../../components/InfoPage";

export const metadata = { title: "Match Help - GameBattles" };

export default function MatchSupportPage() {
  return (
    <InfoPage title="Match Help" eyebrow="Support" backHref="/support" backLabel="Back to Support Center">
      <h2>Posting and accepting</h2>
      <p>
        See <Link href="/matches/finder/help">How Match Finder Works</Link> for the full flow.
      </p>
      <h2>Reporting results</h2>
      <p>
        Both teams report the score on the match page. If the reports disagree, the match is
        flagged for staff review.
      </p>
      <h2>No-shows and disputes</h2>
      <p>
        Open a <Link href="/support/dispute-ticket">dispute ticket</Link> and include screenshots or
        video. Staff will review and make a ruling.
      </p>
      <h2>Rules</h2>
      <p>
        Each ladder has its own rules page, linked from its rankings. General site rules are on
        the <Link href="/rules">Rules page</Link>.
      </p>
    </InfoPage>
  );
}
