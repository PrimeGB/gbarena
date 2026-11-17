"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./HeroPromo.module.css";

export default function HeroPromo({ kind, onFocusChange }: {
  kind: "discord" | "invite";
  onFocusChange: (focused: boolean) => void;
}) {
  const [progressKey, setProgressKey] = useState(0);
  const isDiscord = kind === "discord";

  return (
    <div
      className={`${styles.scene} ${isDiscord ? styles.discord : styles.invite}`}
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
        <div className={styles.tag}>{isDiscord ? "GameBattles community" : "Bring your friends"}</div>
        <h2>{isDiscord ? <>Find your<br /><em>people.</em></> : <>Build our<br /><em>community.</em></>}</h2>
        <p>{isDiscord
          ? "Meet players, find your squad, and stay in the loop with the GameBattles community."
          : "Share your personal invite link, bring your friends to GameBattles, and work toward recruitment awards."}</p>
        {isDiscord ? (
          <a className={styles.cta} href="https://discord.gg/nKZdS2BDS6" target="_blank" rel="noopener noreferrer">
            Join our Discord <span aria-hidden="true">→</span>
          </a>
        ) : (
          <Link className={styles.cta} href="/profile/awards#invite-rewards">
            Get your invite link <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      <div className={styles.visual} aria-hidden="true">
        <div className={styles.halo} />
        <div className={styles.emblem}>
          {isDiscord ? (
            <svg viewBox="0 0 64 64"><path d="M50.6 14.7a48 48 0 0 0-11.8-3.6l-1.5 3.1a44 44 0 0 0-10.6 0l-1.5-3.1a48 48 0 0 0-11.8 3.6C6 25.8 4 36.6 5 47.2a48 48 0 0 0 14.5 7.3l3.1-5.1a31 31 0 0 1-4.9-2.4l1.2-.9c9.4 4.4 19.7 4.4 29 0l1.2.9a31 31 0 0 1-4.9 2.4l3.1 5.1A48 48 0 0 0 57 47.2c1.2-12.3-2-23-6.4-32.5ZM23.8 39.4c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Zm16.4 0c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Z" /></svg>
          ) : (
            <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="44" stroke="#fff1c8" strokeWidth="2" opacity=".8" /><circle cx="60" cy="43" r="12" fill="#fff5da" /><path d="M38 81c0-12 9-21 22-21s22 9 22 21" fill="#fff5da" /><circle cx="85" cy="50" r="8" fill="#fff5da" /><path d="M83 64c8 0 14 6 14 14H85" stroke="#fff5da" strokeWidth="6" strokeLinecap="round" /><circle cx="35" cy="50" r="8" fill="#fff5da" /><path d="M37 64c-8 0-14 6-14 14h12" stroke="#fff5da" strokeWidth="6" strokeLinecap="round" /></svg>
          )}
        </div>
        <span className={`${styles.signal} ${styles.one}`}><i />{isDiscord ? "Find players" : "Share your link"}</span>
        <span className={`${styles.signal} ${styles.two}`}><i />{isDiscord ? "Join the conversation" : "Unlock awards"}</span>
      </div>
      <div className={styles.bottom}><strong>GameBattles</strong><span>{isDiscord ? "Find players. Get in the game." : "Play together. Grow together."}</span></div>
      <div key={progressKey} className={styles.progress} aria-hidden="true" />
    </div>
  );
}
