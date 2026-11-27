import Link from "next/link";
import InfoPage from "../components/InfoPage";

export const metadata = { title: "Terms of Service - GameBattles" };

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Service" eyebrow="Legal · Updated November 2026">
      <p>
        By creating an account or using GameBattles, you agree to these terms, the <Link href="/rules">rules</Link>,
        our <Link href="/privacy">Privacy Policy</Link> and the <Link href="/credits-terms">Credit Terms</Link>.
        If you do not agree, please do not use the site.
      </p>

      <h2>Independent Community</h2>
      <p>
        GameBattles is a community-run competitive platform. It is not affiliated with, endorsed by, or sponsored by
        any game publisher, developer, console manufacturer, esports organization, or previous competitive gaming
        website. All game names, logos, and images belong to their owners.
      </p>

      <h2>Platform Changes</h2>
      <p>
        GameBattles is actively maintained. Features, ladders, rankings, rules, events, prizes, awards and match procedures
        may be refined over time, and we aim to communicate significant changes to the community.
      </p>

      <h2>Your Account</h2>
      <ul>
        <li>One account per person, with accurate information.</li>
        <li>No selling, trading, sharing or lending accounts.</li>
        <li>No extra accounts to avoid bans, limits or penalties.</li>
        <li>You are responsible for keeping your login safe and for activity on your account.</li>
        <li>Some events, prizes and features may be limited by age or location.</li>
      </ul>

      <h2>Fair Play</h2>
      <p>
        No cheating, hacking, boosting, match fixing, exploiting bugs, false reports or fake evidence. Players and teams
        must follow all posted ladder, match and tournament rules.
      </p>

      <h2>Community Conduct</h2>
      <p>
        Treat everyone with respect. No harassment, hate speech, threats, sexual content, impersonation, spam, scams,
        doxxing, or posting private information. You are responsible for anything you post, and you must have the
        right to share it.
      </p>

      <h2>Results, Awards and Rankings</h2>
      <p>
        Match results, records, points, rankings, trophies, awards, prizes and rewards may be reviewed, adjusted,
        delayed, denied or reversed if cheating, abuse, fraud or rule breaking is found.
      </p>

      <h2>Credits and Payments</h2>
      <p>
        Credits are bought in Canadian dollars through PayPal Friends &amp; Family, are non-refundable, have no cash
        value, and can only be used on GameBattles, such as for paid tournament entries. Purchases are for players 18
        and over. Full details are in the <Link href="/credits-terms">Credit Terms</Link>.
      </p>

      <h2>Moderation and Enforcement</h2>
      <p>
        Staff may warn, mute, restrict, suspend or remove accounts, teams, posts, results, awards, credits or access to
        features when rules are broken or to protect the community. Staff decisions on disputes and reports are final.
        Appeals may be offered but do not guarantee a change.
      </p>

      <h2>No Guarantees</h2>
      <p>
        GameBattles is provided &quot;as is&quot;. We do our best to keep the site running, fair and secure, but we cannot
        promise it will always be available or error-free. To the extent allowed by law, GameBattles is not responsible
        for losses from downtime, data loss, other players&apos; actions, or third-party services.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms as the site grows. Major changes will be posted in the Site Updates thread on the
        forums. Continuing to use the site means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Visit <Link href="/support">Support / Contact</Link>.
      </p>

      <div className="info-links">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/disclaimer">Disclaimer</Link>
        <Link href="/credits-terms">Credit Terms</Link>
      </div>
    </InfoPage>
  );
}
