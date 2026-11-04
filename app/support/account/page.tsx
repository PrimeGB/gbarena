import InfoPage from "../../components/InfoPage";

export const metadata = { title: "Account Help - GameBattles" };

export default function AccountSupportPage() {
  return (
    <InfoPage title="Account Help" eyebrow="Support" backHref="/support" backLabel="Back to Support Center">
      <h2>Login and password</h2>
      <p>
        Use the login page to sign in. If you forget your password, choose
        “Forgot password?” and check your email, including spam, for a reset
        link. Your password hint is only a reminder; use the reset link to
        choose a new password.
      </p>
      <h2>Gaming accounts</h2>
      <p>
        Link your Xbox, PlayStation, Nintendo, PC, EA, or mobile IDs from your profile. A linked
        ID is required to join rosters and play matches on that platform.
      </p>
      <h2>Profile changes</h2>
      <p>Update your avatar, bio, and favorites from Edit Profile.</p>
      <h2>Still stuck?</h2>
      <p>
        Send us a message from the <a href="/contact">Contact page</a> with your username and a
        description of the problem.
      </p>
    </InfoPage>
  );
}
