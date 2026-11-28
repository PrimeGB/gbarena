"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { HeroPromoKind } from "../../lib/heroSlides";
import styles from "./HeroPromo.module.css";

const DISCORD_SVG = (
  <svg viewBox="0 0 64 64"><path d="M50.6 14.7a48 48 0 0 0-11.8-3.6l-1.5 3.1a44 44 0 0 0-10.6 0l-1.5-3.1a48 48 0 0 0-11.8 3.6C6 25.8 4 36.6 5 47.2a48 48 0 0 0 14.5 7.3l3.1-5.1a31 31 0 0 1-4.9-2.4l1.2-.9c9.4 4.4 19.7 4.4 29 0l1.2.9a31 31 0 0 1-4.9 2.4l3.1 5.1A48 48 0 0 0 57 47.2c1.2-12.3-2-23-6.4-32.5ZM23.8 39.4c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Zm16.4 0c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Z" /></svg>
);

const TROPHY_SVG = (
  <svg viewBox="0 0 120 120" fill="#fff3d8"><path d="M38 20h44v10c0 22-9 36-22 40-13-4-22-18-22-40Z" /><path d="M38 26H22c0 16 7 26 18 29-2.6-4.8-4.5-10.6-5.4-17.4A86 86 0 0 1 38 26Zm44 0h16c0 16-7 26-18 29 2.6-4.8 4.5-10.6 5.4-17.4A86 86 0 0 0 82 26Z" opacity=".8" /><rect x="54" y="70" width="12" height="14" /><path d="M42 92h36v12H42z" /><path d="M36 104h48v8H36z" opacity=".85" /></svg>
);

const CROWN_SVG = (
  <svg viewBox="0 0 120 120" fill="#fff3d8"><path d="M18 44 38 60 60 30 82 60 102 44 94 86H26Z" /><rect x="26" y="90" width="68" height="10" rx="3" opacity=".85" /><circle cx="18" cy="38" r="6" /><circle cx="60" cy="22" r="7" /><circle cx="102" cy="38" r="6" /><path d="M60 52l5.3 10.7L77 64.4l-8.5 8.3 2 11.8L60 79l-10.5 5.5 2-11.8L43 64.4l11.7-1.7Z" fill="#8a2a12" /></svg>
);

type PromoConfig = {
  tag: string;
  heading: ReactNode;
  body: string;
  ctaLabel: string;
  href: string;
  external?: boolean;
  bottom: string;
  signalOne?: string;
  signalTwo?: string;
  emblem?: ReactNode;
};

const PROMOS: Record<HeroPromoKind, PromoConfig> = {
  discord: {
    tag: "GameBattles community",
    heading: <>Find your<br /><em>people.</em></>,
    body: "Meet players, find your squad, and stay in the loop with the GameBattles community.",
    ctaLabel: "Join our Discord",
    href: "https://discord.gg/nKZdS2BDS6",
    external: true,
    bottom: "Find players. Get in the game.",
    signalOne: "Find players",
    signalTwo: "Join the conversation",
    emblem: DISCORD_SVG,
  },
  invite: {
    tag: "Bring your friends",
    heading: <>Build our <em>community.</em></>,
    body: "Share your personal invite link, bring your friends to GameBattles, and work toward recruitment awards.",
    ctaLabel: "Get your invite link",
    href: "/profile/awards#invite-rewards",
    bottom: "Play together. Grow together.",
  },
  challenges: {
    tag: "Fresh every week",
    heading: <>Take the<br /><em>challenge.</em></>,
    body: "New challenges drop all the time. Complete them to earn exclusive trophies for your profile.",
    ctaLabel: "View the weekly challenges",
    href: "/challenges",
    bottom: "Rise to the challenge.",
  },
  tournaments: {
    tag: "Prove yourself",
    heading: <>Become a<br /><em>champion.</em></>,
    body: "Join a tournament, battle through the bracket, and take the title. Glory is waiting.",
    ctaLabel: "Join a tournament",
    href: "/tournaments",
    bottom: "Win the bracket. Take the crown.",
    signalOne: "Brackets forming now",
    signalTwo: "Claim the title",
    emblem: TROPHY_SVG,
  },
  ambassadors: {
    tag: "Creator program",
    heading: <>Become an<br /><em>ambassador.</em></>,
    body: "Grow your community as an Affiliate or Ambassador. Qualified recruits earn credits, and you earn credits and exclusive awards.",
    ctaLabel: "Learn more",
    href: "/ambassadors",
    bottom: "Represent GameBattles.",
    signalOne: "Gold profile status",
    signalTwo: "Events in your name",
    emblem: CROWN_SVG,
  },
  building: {
    tag: "Always improving",
    heading: <>Built in<br /><em>the open.</em></>,
    body: "GameBattles evolves every week, so expect new features and refinements. Your rank and every XP you earn are permanent - they stay with you.",
    ctaLabel: "See the player ranks",
    href: "/ranks",
    bottom: "Getting better every week.",
  },
};

const MISSIONS = [
  { text: "Win 3 ladder matches", state: "done" },
  { text: "Add 2 new friends", state: "done" },
  { text: "Complete today's daily", state: "open" },
];

export default function HeroPromo({ kind, onFocusChange }: {
  kind: HeroPromoKind;
  onFocusChange: (focused: boolean) => void;
}) {
  const [progressKey, setProgressKey] = useState(0);
  const promo = PROMOS[kind];
  const centered = kind === "invite";

  const cta = promo.external ? (
    <a className={styles.cta} href={promo.href} target="_blank" rel="noopener noreferrer">
      {promo.ctaLabel} <span aria-hidden="true">→</span>
    </a>
  ) : (
    <Link className={styles.cta} href={promo.href}>
      {promo.ctaLabel} <span aria-hidden="true">→</span>
    </Link>
  );

  return (
    <div
      className={`${styles.scene} ${styles[kind]}`}
      onFocus={() => onFocusChange(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onFocusChange(false);
          setProgressKey((value) => value + 1);
        }
      }}
    >
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.orb} aria-hidden="true" />

      {kind === "tournaments" && (
        <svg className={styles.bracket} viewBox="0 0 300 240" aria-hidden="true" fill="none" stroke="#ff8d97" strokeWidth="2.5">
          <path d="M10 20h46v40h46M10 60h46M10 100h46v40h46M10 140h46M102 40h40v60h40M102 160v-20M102 100h40" opacity=".55" />
          <path d="M10 180h46v40h46M10 220h46M102 200h40v-50" opacity=".3" />
          <circle cx="186" cy="100" r="5" fill="#ffb84d" stroke="none" />
        </svg>
      )}
      {kind === "ambassadors" && <div className={styles.beams} aria-hidden="true" />}

      <div className={centered ? styles.copyCenter : styles.copy}>
        {centered && (
          <div className={styles.avatars} aria-hidden="true">
            <span>GG</span><span className={styles.avMid}>+1</span><span>XP</span>
          </div>
        )}
        <div className={styles.tag}>{promo.tag}</div>
        <h2>{promo.heading}</h2>
        <p>{promo.body}</p>
        {cta}
      </div>

      {kind === "challenges" ? (
        <div className={styles.missions} aria-hidden="true">
          <div className={styles.missionHead}>THIS WEEK&apos;S CHALLENGES</div>
          {MISSIONS.map((m) => (
            <div key={m.text} className={`${styles.mission} ${m.state === "done" ? styles.missionDone : ""}`}>
              <i>{m.state === "done" ? "✓" : ""}</i>
              <span>{m.text}</span>
            </div>
          ))}
          <div className={styles.missionReward}>🏆 Reward: profile trophy</div>
        </div>
      ) : kind === "building" ? (
        <div className={styles.roadmap} aria-hidden="true">
          <div className={styles.roadHead}>THE ROADMAP</div>
          <div className={`${styles.road} ${styles.roadDone}`}><i>✓</i><span>Ladders, ranks &amp; XP</span><em>LIVE</em></div>
          <div className={`${styles.road} ${styles.roadDone}`}><i>✓</i><span>Ambassador program</span><em>LIVE</em></div>
          <div className={styles.road}><i>⟳</i><span>More games &amp; events</span><em>SOON</em></div>
          <div className={styles.roadKeep}>🔒 Your rank &amp; XP are never reset</div>
        </div>
      ) : promo.emblem ? (
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.halo} />
          <div className={styles.emblem}>{promo.emblem}</div>
          {promo.signalOne && <span className={`${styles.signal} ${styles.one}`}><i />{promo.signalOne}</span>}
          {promo.signalTwo && <span className={`${styles.signal} ${styles.two}`}><i />{promo.signalTwo}</span>}
        </div>
      ) : null}

      <div className={styles.bottom}><strong>GameBattles</strong><span>{promo.bottom}</span></div>
      <div key={progressKey} className={styles.progress} aria-hidden="true" />
    </div>
  );
}
