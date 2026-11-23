import Link from "next/link";
import InfoPage from "../components/InfoPage";

export const metadata = { title: "Privacy Policy - GameBattles" };

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" eyebrow="Legal · Updated November 2026">
      <p>
        This policy explains what information GameBattles collects, how it is used, and the choices you have.
        We will never sell your personal information.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li><strong>Account details:</strong> email address, username, password (stored encrypted by our login provider), date of birth, country and region.</li>
        <li><strong>Profile and gaming details:</strong> gamertags and gaming IDs you link, avatar, bio, social links and profile settings.</li>
        <li><strong>Activity:</strong> teams, matches, results, evidence you upload, disputes, tournament entries, awards, forum posts, comments, suggestions and messages.</li>
        <li><strong>Credit purchases:</strong> the credit pack you request and its status. Payments are made through PayPal; we never see or store your PayPal password or card details.</li>
        <li><strong>Technical information:</strong> basic data needed to run and secure the site, such as login sessions and error logs.</li>
      </ul>

      <h2>How We Use It</h2>
      <ul>
        <li>To create and run your account, ladders, matches, tournaments and rankings.</li>
        <li>To decide which age- or location-restricted events and features you can access.</li>
        <li>To send account emails and notifications, such as match updates, messages and award alerts.</li>
        <li>To process credit purchase requests and add credits to your account.</li>
        <li>To prevent cheating, boosting, fraud and abuse, and to enforce the <Link href="/rules">rules</Link>.</li>
        <li>To improve the site and fix problems.</li>
      </ul>

      <h2>What Other Players Can See</h2>
      <p>
        Your username, profile, linked gamertags, teams, match history, rankings, awards and public forum posts can be
        seen by other visitors. Your email address, date of birth and private messages are never shown publicly.
      </p>

      <h2>Services We Use</h2>
      <p>We share only what is needed with trusted services that help run GameBattles:</p>
      <ul>
        <li><strong>Supabase</strong> stores account data and handles logins.</li>
        <li><strong>Vercel</strong> hosts the website.</li>
        <li><strong>Resend</strong> sends our emails.</li>
        <li><strong>PayPal</strong> processes credit payments you choose to send.</li>
      </ul>
      <p>
        We may also share information when the law requires it, or when needed to protect players, prevent fraud or
        enforce our rules.
      </p>

      <h2>Emails</h2>
      <p>
        We email you about your account and site activity. You can choose which notification emails you receive in{" "}
        <Link href="/profile/edit">Edit Profile</Link>. Important account and security emails may still be sent.
      </p>

      <h2>Keeping and Deleting Your Data</h2>
      <p>
        We keep your information while your account is active. You can delete your account at any time from{" "}
        <Link href="/profile/security">Account Security</Link>. Some records, such as completed match results,
        tournament history, credit records and moderation actions, may be kept so ladders stay accurate and to
        prevent fraud.
      </p>

      <h2>Younger Players</h2>
      <p>
        Players under 13, or under the age of digital consent where they live, should only use GameBattles with a
        parent or guardian&apos;s permission. Credit purchases are for players 18 and over. If you believe a child has
        given us information without permission, <Link href="/support">contact us</Link> and we will remove it.
      </p>

      <h2>Security</h2>
      <p>
        We use account protections and secure providers to protect your information, but no website can promise
        perfect security. Use a strong password and never share your login details. GameBattles staff will never ask
        for your password or PayPal login.
      </p>

      <h2>Your Choices</h2>
      <p>
        You can view and edit most of your information from your profile. To ask for a copy of your data, a correction
        or deletion, visit <Link href="/support">Support / Contact</Link>.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the site grows. Major changes will be posted in the Site Updates thread on the
        forums.
      </p>

      <div className="info-links">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/disclaimer">Disclaimer</Link>
        <Link href="/credits-terms">Credit Terms</Link>
      </div>
    </InfoPage>
  );
}
