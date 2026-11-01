import InfoPage from "../components/InfoPage";

export const metadata = { title: "Credit Terms - GameBattles" };

export default function CreditTermsPage() {
  return (
    <InfoPage title="Credit Terms" eyebrow="Credits" backHref="/tournaments" backLabel="Back to Tournaments">
      <p>
        By buying, receiving or using GameBattles credits you agree to these terms. If you do not agree, do not buy
        credits.
      </p>
      <h2>What credits are</h2>
      <ul>
        <li>Credits are a virtual item used only on GameBattles for tournament entry and similar features.</li>
        <li>Credits have no cash value, are not money, are not a deposit, and cannot be cashed out, sold or exchanged for money.</li>
        <li>Credits cannot be transferred between accounts or sold to other people.</li>
        <li>Tournament prizes paid in credits are a promotional reward, not winnings of money.</li>
      </ul>
      <h2>Purchases are final</h2>
      <ul>
        <li>All credit purchases are final and non-refundable once credits are added to your account, except where the law requires otherwise.</li>
        <li>Prices are in US dollars. You are responsible for any taxes or fees from your payment provider.</li>
        <li>Payments are handled by PayPal. GameBattles never sees or stores your card or PayPal login details.</li>
        <li>Credits are added only after PayPal confirms the payment. If you were charged and did not get credits, contact Support with your PayPal receipt.</li>
      </ul>
      <h2>No chargebacks or disputes</h2>
      <ul>
        <li>You agree to contact GameBattles Support first about any problem with a purchase.</li>
        <li>
          Filing a chargeback, payment reversal or PayPal dispute for credits you received and used is a breach of these
          terms. We may remove any credits from your account, suspend or permanently ban your account, remove your prizes
          and team entries, and give the payment provider evidence of the purchase and your use of the credits.
        </li>
        <li>If a payment is reversed, the credits from that payment are removed and your balance may go to zero.</li>
      </ul>
      <h2>Entry fees and refunds</h2>
      <ul>
        <li>Entry fees paid in credits are refunded in credits if you withdraw before the tournament starts. They are not refunded after it starts.</li>
        <li>If we cancel a tournament, entry credits are returned to your account.</li>
        <li>Staff decisions about results, disqualifications and prize payouts are final.</li>
      </ul>
      <h2>Fair play and account safety</h2>
      <ul>
        <li>Cheating, boosting, fraud, using stolen payment methods or abusing credits will result in removal of credits and a ban.</li>
        <li>You are responsible for your account. We are not responsible for credits lost because someone else used your login.</li>
      </ul>
      <h2>Age</h2>
      <p>You must be 18 or older, or have permission from a parent or legal guardian, to buy credits.</p>
      <h2>Changes and liability</h2>
      <ul>
        <li>Credits are provided as is. We may change credit prices, packs and uses, and may end the credit system with notice.</li>
        <li>To the fullest extent allowed by law, GameBattles is not liable for indirect or lost-profit damages, and our total liability for any purchase is limited to the amount you paid for it.</li>
        <li>GameBattles is not affiliated with PayPal, EA, Microsoft, Sony, Nintendo or any game publisher.</li>
      </ul>
      <p>
        <small>
          This page is a general template and is not legal advice. Have a lawyer review it before you take payments,
          especially for your country or state.
        </small>
      </p>
    </InfoPage>
  );
}
