"use client";

import Link from "next/link";
import { NEW_PROMOS, type NewPromoKind } from "../../lib/heroSlides";
import { featuredGameArtwork } from "../../lib/ladderCatalog";
import styles from "./NewHeroPromo.module.css";

export default function NewHeroPromo({ kind, onFocusChange }: {
  kind: NewPromoKind;
  onFocusChange: (focused: boolean) => void;
}) {
  const promo = NEW_PROMOS[kind];
  return (
    <div
      className={`${styles.scene} ${styles[promo.category]} ${styles[kind] || ""}`}
      onFocus={() => onFocusChange(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onFocusChange(false);
      }}
    >
      <div className={styles.copy}>
        <span className={styles.tag}>{promo.tag}</span>
        <h2>{promo.title}<br /><em>{promo.highlight}</em></h2>
        <p>{promo.body}</p>
        <Link className={styles.cta} href={promo.href}>{promo.action} <span aria-hidden="true">→</span></Link>
      </div>
      <div className={styles.art} aria-hidden="true">
        {promo.category === "rivalry" && (
          <div className={styles.versus}>
            <span className={styles.player}>PLAYER 01</span>
            <strong>VS</strong>
            <span className={styles.player}>PLAYER 02</span>
            <small>{kind === "rematch" ? "HEAD-TO-HEAD SERIES" : kind === "friends" ? "FRIENDLY RIVALRY" : kind === "teammate" ? "THE DEBATE ENDS HERE" : "ONE MATCH. TWO RIVALS."}</small>
          </div>
        )}
        {promo.category === "event" && (
          <div className={styles.bracket}>
            <span>{kind === "event-night" ? "GAME NIGHT" : kind === "event-community" ? "YOUR COMMUNITY" : "YOUR EVENT"}</span>
            <svg viewBox="0 0 300 180" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M10 15h55v35h50M10 85h55V50M10 95h55v35h50M10 165h55v-35M115 50h40v40h55M115 130h40V90h55" />
              <circle cx="224" cy="90" r="13" />
            </svg>
            <small>FRIENDS · COMPETITION · COMMUNITY</small>
          </div>
        )}
        {promo.category === "construction" && (
          <div className={styles.buildArt}>
            <div className={styles.stripes} />
            <strong>{kind === "blueprint" ? "GB / 01" : "WORK IN PROGRESS"}</strong>
            <span>BUILDING A BETTER GAMEBATTLES</span>
            <div className={styles.stripes} />
          </div>
        )}
        {promo.category === "games" && (
          <div className={styles.gameArtworkGrid}>
            {featuredGameArtwork.slice(0, 6).map((game) => (
              game.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={game.title} src={game.image} alt="" loading="lazy" decoding="async" />
              ) : null
            ))}
          </div>
        )}
        {promo.category === "affiliate" && (
          <div className={styles.medal}>
            <span>★</span><strong>GB</strong><small>AFFILIATE<br />&amp; AMBASSADOR</small>
          </div>
        )}
      </div>
      <div className={styles.footer}><strong>GAMEBATTLES</strong><span>{promo.tag}</span></div>
    </div>
  );
}
