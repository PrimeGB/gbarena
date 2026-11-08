import Link from "next/link";
import Image from "next/image";
import styles from "./MobileHome.module.css";

const platforms = [
  ["PlayStation", "/ladders/playstation"],
  ["Xbox", "/ladders/xbox"],
  ["Nintendo", "/ladders/nintendo"],
  ["PC", "/ladders/pc"],
  ["Mobile", "/ladders/mobile"],
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
          {platforms.map(([name, href]) => <Link key={href} href={href}>{name}<span aria-hidden="true">↗</span></Link>)}
        </div>
      </section>

      <section className={styles.feature}>
        <div><p className={styles.eyebrow}>PLAY TOGETHER</p><h2>Find your squad.</h2><p>Create a team or see who is leading the competition.</p></div>
        <div className={styles.featureLinks}><Link href="/teams/create">Create a team →</Link><Link href="/teams/top">Top teams →</Link></div>
      </section>

      <section className={styles.section} aria-labelledby="mobile-discover">
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>MORE TO EXPLORE</p><h2 id="mobile-discover">The community</h2></div></div>
        <nav className={styles.list} aria-label="Community">
          <Link href="/tournaments"><span><strong>Tournaments</strong><small>Explore events and free weekly cups</small></span><b aria-hidden="true">→</b></Link>
          <Link href="/activity"><span><strong>Community activity</strong><small>See what players are up to</small></span><b aria-hidden="true">→</b></Link>
          <Link href="/forums"><span><strong>Forums</strong><small>Join the conversation</small></span><b aria-hidden="true">→</b></Link>
          <Link href="/latest-news"><span><strong>Latest news</strong><small>Catch up on GameBattles</small></span><b aria-hidden="true">→</b></Link>
        </nav>
      </section>

      <footer className={styles.footer}>
        <nav aria-label="More GameBattles links">
          <Link href="/members">Members</Link><Link href="/players/top">Top players</Link><Link href="/awards">Awards</Link><Link href="/rules">Rules</Link><Link href="/support">Support</Link><Link href="/general-info">General info</Link><Link href="/about">About</Link><Link href="/history">History</Link><Link href="/staff">Staff</Link><Link href="/suggestions">Suggestions</Link><Link href="/contact">Contact</Link><a href="https://discord.gg/nKZdS2BDS6">Discord</a>
        </nav>
        <p>© 2026 Competitive Gaming Network</p>
      </footer>
    </div>
  );
}
