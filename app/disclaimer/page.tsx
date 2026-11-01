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
      <h2>Early Production</h2>
      <p>
        This site is still in early production. Features, ladders, rules, and match procedures
        may change as development continues, and some features may not work exactly as described.
      </p>
      <h2>Fair Play</h2>
      <p>
        Players are responsible for following the posted ladder rules. Staff decisions on disputes
        and reports are final, and accounts may be restricted for cheating, boosting, or abuse.
      </p>
      <h2>Contact</h2>
      <p>
        Questions? Visit the <a href="/contact">Contact page</a> or the <a href="/support">Support Center</a>.
      </p>
    </InfoPage>
  );
}
