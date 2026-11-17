"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { HeroPromoKind } from "../../lib/heroSlides";
import styles from "./HeroPromo.module.css";

const DISCORD_SVG = (
  <svg viewBox="0 0 64 64"><path d="M50.6 14.7a48 48 0 0 0-11.8-3.6l-1.5 3.1a44 44 0 0 0-10.6 0l-1.5-3.1a48 48 0 0 0-11.8 3.6C6 25.8 4 36.6 5 47.2a48 48 0 0 0 14.5 7.3l3.1-5.1a31 31 0 0 1-4.9-2.4l1.2-.9c9.4 4.4 19.7 4.4 29 0l1.2.9a31 31 0 0 1-4.9 2.4l3.1 5.1A48 48 0 0 0 57 47.2c1.2-12.3-2-23-6.4-32.5ZM23.8 39.4c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Zm16.4 0c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Z" /></svg>
);

const INVITE_SVG = (
  <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="44" stroke="#fff1c8" strokeWidth="2" opacity=".8" /><circle cx="60" cy="43" r="12" fill="#fff5da" /><path d="M38 81c0-12 9-21 22-21s22 9 22 21" fill="#fff5da" /><circle cx="85" cy="50" r="8" fill="#fff5da" /><path d="M83 64c8 0 14 6 14 14H85" stroke="#fff5da" strokeWidth="6" strokeLinecap="round" /><circle cx="35" cy="50" r="8" fill="#fff5da" /><path d="M37 64c-8 0-14 6-14 14h12" stroke="#fff5da" strokeWidth="6" strokeLinecap="round" /></svg>
);

const CHALLENGES_SVG = (
  <svg viewBox="0 0 120 120" fill="none" stroke="#eafff2" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><path d="M60 16 72 40l26 4-19 18 5 26-24-13-24 13 5-26-19-18 26-4z" fill="#eafff2" stroke="none" /><path d="M24 96h72" opacity=".75" /><path d="M36 108h48" opacity=".45" /></svg>
);

const TOURNAMENTS_SVG = (
  <svg viewBox="0 0 120 120" fill="#fff3d8"><path d="M38 20h44v10c0 22-9 36-22 40-13-4-22-18-22-40Z" /><path d="M38 26H22c0 16 7 26 18 29-2.6-4.8-4.5-10.6-5.4-17.4A86 86 0 0 1 38 26Zm44 0h16c0 16-7 26-18 29 2.6-4.8 4.5-10.6 5.4-17.4A86 86 0 0 0 82 26Z" opacity=".8" /><rect x="54" y="70" width="12" height="14" /><path d="M42 92h36v12H42z" /><path d="M36 104h48v8H36z" opacity=".85" /></svg>
);

type PromoConfig = {
  tag: string;
  heading: ReactNode;
  body: string;
  ctaLabel: string;
  href: string;
  external?: boolean;
  emblem: ReactNode;
  signalOne: string;
  signalTwo: string;
  bottom: string;
};

const PROMOS: Record<HeroPromoKind, PromoConfig> = {
  discord: {
    tag: "GameBattles community",
    heading: <>Find your<br /><em>people.</em></>,
    body: "Meet players, find your squad, and stay in the loop with the GameBattles community.",
    ctaLabel: "Join our Discord",
    href: "https://discord.gg/nKZdS2BDS6",
    external: true,
    emblem: DISCORD_SVG,
    signalOne: "Find players",
    signalTwo: "Join the conversation",
    bottom: "Find players. Get in the game.",
  },
  invite: {
    tag: "Bring your friends",
    heading: <>Build our<br /><em>community.</em></>,
    body: "Share your personal invite link, bring your friends to GameBattles, and work toward recruitment awards.",
    ctaLabel: "Get your invite link",
    href: "/profile/awards#invite-rewards",
    emblem: INVITE_SVG,
    signalOne: "Share your link",
    signalTwo: "Unlock awards",
    bottom: "Play together. Grow together.",
  },
  challenges: {
    tag: "Fresh every week",
    heading: <>Take the<br /><em>challenge.</em></>,
    body: "New challenges drop all the time. Complete them to earn exclusive trophies for your profile.",
    ctaLabel: "View the weekly challenges",
    href: "/challenges",
    emblem: CHALLENGES_SVG,
    signalOne: "New challenges weekly",
    signalTwo: "Earn trophies",
    bottom: "Rise to the challenge.",
  },
  tournaments: {
    tag: "Prove yourself",
    heading: <>Become a<br /><em>champion.</em></>,
    body: "Join a tournament, battle through the bracket, and take the title. Glory is waiting.",
    ctaLabel: "Join a tournament",
    href: "/tournaments",
    emblem: TOURNAMENTS_SVG,
    signalOne: "Brackets forming now",
    signalTwo: "Claim the title",
    bottom: "Win the bracket. Take the crown.",
  },
};

export default function HeroPromo({ kind, onFocusChange }: {
  kind: HeroPromoKind;
  onFocusChange: (focused: boolean) => void;
}) {
  const [progressKey, setProgressKey] = useState(0);
  const promo = PROMOS[kind];

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
      <div className={styles.copy}>
        <div className={styles.tag}>{promo.tag}</div>
        <h2>{promo.heading}</h2>
        <p>{promo.body}</p>
        {promo.external ? (
          <a className={styles.cta} href={promo.href} target="_blank" rel="noopener noreferrer">
            {promo.ctaLabel} <span aria-hidden="true">→</span>
          </a>
        ) : (
          <Link className={styles.cta} href={promo.href}>
            {promo.ctaLabel} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      <div className={styles.visual} aria-hidden="true">
        <div className={styles.halo} />
        <div className={styles.emblem}>{promo.emblem}</div>
        <span className={`${styles.signal} ${styles.one}`}><i />{promo.signalOne}</span>
        <span className={`${styles.signal} ${styles.two}`}><i />{promo.signalTwo}</span>
      </div>
      <div className={styles.bottom}><strong>GameBattles</strong><span>{promo.bottom}</span></div>
      <div key={progressKey} className={styles.progress} aria-hidden="true" />
    </div>
  );
}

