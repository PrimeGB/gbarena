import Link from "next/link";
import InfoPage from "../components/InfoPage";

export const metadata = { title: "Disclaimer - GameBattles" };

export default function DisclaimerPage() {
  return (
    <InfoPage title="Disclaimer" eyebrow="Legal">
      <h2>Independent Community</h2>
      <p>
        GameBattles is a community-run competitive platform. It is not affiliated with, endorsed
        by, or sponsored by any game publisher, developer, or console manufacturer. All game
        names, logos, and images are the property of their respective owners.
      </p>
      <h2>Platform Updates</h2>
      <p>
        GameBattles is actively maintained. Features, ladders, rules, and match
        procedures may be refined over time, and we communicate significant
        changes to the community.
      </p>
      <h2>Fair Play</h2>
      <p>
        Players are responsible for following the posted ladder rules. Staff decisions on disputes
        and reports are final, and accounts may be restricted for cheating, boosting, or abuse.
      </p>
      <h2>Contact</h2>
      <p>
        Questions? Visit <Link href="/support">Support / Contact</Link>.
      </p>
      <div className="info-links">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/credits-terms">Credit Terms</Link>
      </div>
    </InfoPage>
  );
}
