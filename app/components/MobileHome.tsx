import Link from "next/link";
import Image from "next/image";
import styles from "./MobileHome.module.css";

const platforms = [
  { name: "PlayStation", shortName: "PS", href: "/ladders/playstation" },
  { name: "Xbox", shortName: "XB", href: "/ladders/xbox" },
  { name: "Nintendo", shortName: "NW", href: "/ladders/nintendo" },
  { name: "PC", shortName: "PC", href: "/ladders/pc" },
  { name: "Mobile", shortName: "MO", href: "/ladders/mobile" },
];

export default function MobileHome() {
  return (
    <div className={styles.home}>
      <header className={styles.hero}>
        <div className={styles.brand}>
          <Image src="/logo-emblem.png" alt="" width={42} height={42} />
          <span>GAMEBATTLES</span>
        </div>
        <p className={styles.eyebrow}>YOUR NEXT MATCH STARTS HERE</p>
        <h1>Find your game.<br />Make your mark.</h1>
        <p className={styles.intro}>Build your team, compete on the ladder, and join a community that loves the game.</p>
        <form action="/search" className={styles.search} role="search">
          <input name="q" aria-label="Search GameBattles" placeholder="Search GameBattles" autoComplete="off" />
          <button type="submit">Search</button>
        </form>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/getting-started">Get started <span aria-hidden="true">→</span></Link>
          <Link className={styles.secondary} href="/matches/finder">Find a match</Link>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="mobile-play">
        <div className={styles.sectionHead}>
          <div><p className={styles.eyebrow}>READY TO COMPETE?</p><h2 id="mobile-play">Pick your platform</h2></div>
          <Link href="/ladders">All ladders <span aria-hidden="true">→</span></Link>
        </div>
        <div className={styles.platforms}>
          {platforms.map(({ name, shortName, href }) => (
            <Link className={styles.platform} key={href} href={href}>
              <span className={styles.platformIcon} aria-hidden="true">{shortName}</span>
              <span className={styles.platformName}>{name}<small>Browse ladders</small></span>
              <span className={styles.platformArrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.feature}>
        <div><p className={styles.eyebrow}>FRIENDS OR RIVALS</p><h2>Ready for a 1v1?</h2><p>Create a team for a solos ladder and challenge your friends.</p></div>
        <div className={styles.featureLinks}><Link href="/teams/create">Create a team →</Link><Link href="/teams/top">Top teams →</Link></div>
      </section>

      <section className={styles.section} aria-labelledby="mobile-discover">
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>MORE TO EXPLORE</p><h2 id="mobile-discover">The community</h2></div></div>
        <nav className={styles.list} aria-label="Community">
          <Link href="/tournaments"><span><strong>Tournaments</strong><small>Explore events and free weekly cups</small></span><b aria-hidden="true">→</b></Link>
          <Link href="/tournaments/request"><span><strong>Host a friendly tournament</strong><small>Tell staff about your event idea</small></span><b aria-hidden="true">→</b></Link>
          <Link href="/ambassadors"><span><strong>GB Ambassadors / Affiliates</strong><small>Help grow the community and earn recognition</small></span><b aria-hidden="true">→</b></Link>
          <Link href="/forums"><span><strong>Forums</strong><small>Join the conversation</small></span><b aria-hidden="true">→</b></Link>
          <Link href="/latest-news"><span><strong>Latest news</strong><small>Catch up on GameBattles</small></span><b aria-hidden="true">→</b></Link>
        </nav>
      </section>

      <footer className={styles.footer}>
        <nav aria-label="More GameBattles links">
          <Link href="/members">Members</Link><Link href="/awards">Awards &amp; Achievements</Link><Link href="/champions">Hall of Fame</Link><Link href="/general-info">General info</Link><Link href="/about">About</Link><Link href="/history">History</Link><Link href="/suggestions">Suggestions</Link><a href="https://discord.gg/nKZdS2BDS6">Discord</a>
          <span className={styles.footerSectionTitle}>Contact Us</span>
          <Link href="/support">Support / Contact</Link><Link href="/staff">Staff</Link>
          <Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/disclaimer">Disclaimer</Link><Link className={styles.footerLegalLink} href="/rules">Rules</Link>
        </nav>
        <p>© 2026 Competitive Gaming Network</p>
      </footer>
    </div>
  );
}
