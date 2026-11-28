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
      <h2>No Warranty &amp; Use at Your Own Risk</h2>
      <p>
        The platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or
        implied, including fitness for a particular purpose, accuracy, or uninterrupted availability.
        We do not guarantee that matches, rankings, results, or features will be error-free or always
        available. Use the site at your own risk.
      </p>
      <h2>Limitation of Liability</h2>
      <p>
        To the fullest extent allowed by law, GameBattles and its staff are not liable for any indirect,
        incidental, special, consequential, or punitive damages, or for loss of data, revenue, or profits,
        arising from your use of the site, match disputes, other players&apos; conduct, or third-party
        services. Our total liability for any claim is limited to the amount you paid us in the ninety (90)
        days before the claim.
      </p>
      <h2>Third-Party Services</h2>
      <p>
        Payments are processed by PayPal and games are provided by their respective publishers and
        platforms. We do not control and are not responsible for third-party services, their terms,
        outages, or actions. GameBattles is not affiliated with, endorsed by, or sponsored by any game
        publisher, console maker, or payment provider.
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
