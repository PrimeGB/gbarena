import Link from "next/link";
import InfoPage from "../../../components/InfoPage";
import { MatchJoinGuide } from "../../../components/MatchJoinGuide";

export const metadata = { title: "How Match Finder Works - GameBattles" };

export default function MatchFinderHelpPage() {
  return (
    <InfoPage
      title="How Match Finder Works"
      eyebrow="Matches"
      backHref="/matches/finder"
      backLabel="Back to Match Finder"
    >
      <h2>1. Post a match</h2>
      <p>
        Team leaders pick a time, Best Of, and cross play setting, then post an open match for
        their ladder.
      </p>
      <h2>2. Accept a match</h2>
      <p>
        Teams on the same game and ladder can accept an open post. If cross play is off, only
        teams on the same platform can accept.
      </p>
      <h2>3. Play and report</h2>
      <ul>
        <li>Follow the ladder rules shown on the match page.</li>
        <li>Both teams report the result after the match.</li>
        <li>Keep screenshots or video in case a dispute is needed.</li>
      </ul>
      <h2>4. Getting into the match</h2>
      <MatchJoinGuide battlefield />
      <h2>5. Disputes</h2>
      <p>
        If the reports do not match, open a <Link href="/support/dispute-ticket">dispute ticket</Link> and
        staff will review the proof.
      </p>
    </InfoPage>
  );
}
