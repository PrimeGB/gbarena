"use client";

import Link from "next/link";

import { useState } from "react";

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Free & Paid Tournaments",
    items: [
      "Tournaments may be free to enter or may require an entry fee paid in GameBattles credits. The entry fee and prize are listed on each tournament.",
      "Prizes are awarded in credits unless the tournament page says otherwise. Per-player prizes are paid to each member of the winning team.",
      "Entry is not a purchase of a chance to win; results depend on skill. No purchase is ever required to enter a free tournament.",
    ],
  },
  {
    title: "Credits: No Refunds, No Cash Value",
    items: [
      "Credits are a virtual item for use on GameBattles only. They are not money, not a bank balance and have no cash value.",
      "All credit purchases are final. Credits are non-refundable, non-transferable and cannot be exchanged for cash.",
      "Entry fees are refunded only if you withdraw before the tournament starts or if staff cancel the event.",
      "Opening a chargeback or payment dispute removes the related credits and may result in a purchase block or account suspension.",
    ],
  },
  {
    title: "Eligibility",
    items: [
      "You must be 18+ (or the age of majority where you live) to buy credits. Younger players may enter free tournaments only with a parent or guardian's permission.",
      "Tournaments are void where prohibited by law. You are responsible for any laws that apply to you.",
      "One account per player. Sharing, selling or buying accounts is not allowed.",
    ],
  },
  {
    title: "Rules & Fair Play",
    items: [
      "Follow the rules listed on the tournament page. Staff rulings are final.",
      "No cheating, hacks, exploits, glitches, scripts, boosting, smurfing, collusion, win-trading or match-fixing.",
      "No harassment, hate speech or toxic behaviour. Keep it respectful.",
      "Teams must check in on time. No-shows and forfeits get no refund of entry fees.",
      "Staff may request proof such as clips, VODs or screenshots. Refusing may result in disqualification.",
      "Breaking the rules can lead to disqualification, loss of prizes and credits, and account bans.",
    ],
  },
  {
    title: "Prizes & Payouts",
    items: [
      "Prizes are paid after results are verified, usually within a few days. Staff may withhold prizes while investigating a result.",
      "Prize credits cannot be cashed out. Any taxes or fees are the winner's responsibility.",
      "Ties and disputes are settled by staff using the tie-break in the tournament rules.",
    ],
  },
  {
    title: "Disclaimer",
    items: [
      "Tournaments are provided as-is. We are not responsible for game outages, connection problems, lag or lost matches. Schedules and prizes may change or be cancelled.",
      "GameBattles is not affiliated with, endorsed by or sponsored by Activision, EA, Nintendo, Microsoft, Sony, Supercell, Valve or any game publisher. All game names and logos belong to their owners.",
      "To the fullest extent allowed by law, GameBattles' liability is limited to the credits you paid for the event in question.",
      "This page is a general summary and not legal advice. See the full Credits Terms for details.",
    ],
  },
];

export default function TournamentDisclaimerBox() {
  const [open, setOpen] = useState(false);

  return (
    <div className="td-box">
      <div className="td-head">Tournament Disclaimer</div>
      <p>Free and paid tournaments, credits, refunds, eligibility and fair play.</p>
      <button className="td-btn" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide Disclaimer" : "Read Disclaimer"}
      </button>
      {open && (
        <div className="td-body">
          {SECTIONS.map((s) => (
            <div key={s.title} className="td-sec">
              <div className="td-sec-title">{s.title}</div>
              <ul>
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
          <Link href="/credits-terms" className="td-link">Full Credits Terms</Link>
          <div className="td-note">By entering a tournament you agree to these terms.</div>
        </div>
      )}
    </div>
  );
}
