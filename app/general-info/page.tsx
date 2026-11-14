import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GameBattles Community",
  description:
    "Discover GameBattles: compete on ladders, build a team, follow rankings, and connect with competitive gamers.",
};

const features = [
  {
    number: "01",
    title: "Compete on ladders",
    description:
      "Choose a game and platform, find a match, and follow your team's progress as results shape the standings.",
  },
  {
    number: "02",
    title: "Build your squad",
    description:
      "Create a team, bring your roster together, and meet players looking for their next competitive home.",
  },
  {
    number: "03",
    title: "Make every match count",
    description:
      "Follow player and team rankings, match history, community activity, and the awards you earn along the way.",
  },
  {
    number: "04",
    title: "Be part of the community",
    description:
      "Catch up on updates, join conversations in the forums, share ideas, and discover tournaments.",
  },
];

const destinations = [
  {
    title: "Explore ladders",
    description: "Find games and platforms with active competition.",
    href: "/ladders",
    action: "Browse ladders",
  },
  {
    title: "Create a team",
    description: "Start a roster and choose the ladder you want to play.",
    href: "/teams/create",
    action: "Build your team",
  },
  {
    title: "Find a match",
    description: "See available matches and get ready to compete.",
    href: "/matches/finder",
    action: "Open match finder",
  },
  {
    title: "Meet the community",
    description: "Discover players, teams, and conversations.",
    href: "/members",
    action: "Browse members",
  },
  {
    title: "Follow the standings",
    description: "See the players and teams making their mark.",
    href: "/players/top",
    action: "View rankings",
  },
  {
    title: "Join the conversation",
    description: "Read news, talk with players, and share suggestions.",
    href: "/forums",
    action: "Visit the forums",
  },
  {
    title: "Discover tournaments",
    description: "Explore events and find your next competition.",
    href: "/tournaments",
    action: "View tournaments",
  },
  {
    title: "Earn recognition",
    description: "See the awards and trophies players can earn.",
    href: "/awards",
    action: "Explore awards",
  },
];

export default function GeneralInfoPage() {
  return (
    <>
      <style>{`
        .gi-page {
          --gi-bg: #05090e;
          --gi-panel: #0a131d;
          --gi-line: #243746;
          --gi-muted: #a9bac8;
          --gi-white: #f5f8fb;
          --gi-red: #b20d17;
          --gi-red-bright: #e22b32;
          --gi-gold: #f2c14e;
          flex: 1;
          min-height: 100vh;
          padding: 18px 18px 68px;
          color: #d7e2ee;
          background:
            radial-gradient(ellipse at 50% 0, rgba(33, 71, 99, .34), transparent 46%),
            var(--gi-bg);
          font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
        }
        .gi-page * { box-sizing: border-box; }
        .gi-shell { width: min(1120px, 100%); margin: 0 auto; }
        .gi-page a { color: inherit; text-decoration: none; }
        .gi-page a:focus-visible { outline: 2px solid var(--gi-gold); outline-offset: 4px; }
        .gi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 8px 0 22px;
        }
        .gi-brand { display: inline-flex; align-items: center; gap: 13px; min-width: 0; }
        .gi-brand-copy { display: block; }
        .gi-logo { width: 58px; height: 58px; object-fit: contain; flex: 0 0 auto; }
        .gi-brand-name { display: block; color: var(--gi-white); font-size: 24px; font-weight: 900; letter-spacing: .4px; line-height: 1; }
        .gi-brand-tagline { display: block; margin-top: 6px; color: var(--gi-gold); font-size: 10px; font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; }
        .gi-header-actions { display: flex; align-items: center; gap: 18px; font-size: 13px; font-weight: 800; }
        .gi-login { color: #d2deea !important; }
        .gi-login:hover { color: #fff !important; }
        .gi-button {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          border: 1px solid transparent;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 900;
          transition: background .16s ease, border-color .16s ease, transform .16s ease;
        }
        .gi-button:hover { transform: translateY(-1px); }
        .gi-button-primary {
          color: #fff !important;
          border-color: #ef5c62;
          background: linear-gradient(180deg, var(--gi-red-bright), var(--gi-red));
          box-shadow: 0 6px 20px rgba(178, 13, 23, .24);
        }
        .gi-button-primary:hover { background: linear-gradient(180deg, #f33b42, #c20d19); }
        .gi-button-secondary {
          border-color: #526779;
          background: rgba(8, 17, 26, .72);
          color: #f5f8fb !important;
        }
        .gi-button-secondary:hover { border-color: #a9bac8; background: #112131; }
        .gi-hero {
          position: relative;
          overflow: hidden;
          padding: clamp(30px, 6vw, 68px);
          border: 1px solid #35495a;
          border-top: 3px solid var(--gi-red-bright);
          border-radius: 8px;
          background:
            radial-gradient(ellipse at 88% 10%, rgba(86, 128, 160, .24), transparent 38%),
            linear-gradient(116deg, #112333 0%, #0a131d 63%, #10151b 100%);
          box-shadow: 0 24px 70px rgba(0, 0, 0, .35);
        }
        .gi-hero::after {
          position: absolute;
          top: -150px;
          right: -100px;
          width: 360px;
          height: 360px;
          border: 1px solid rgba(201, 219, 232, .09);
          border-radius: 50%;
          box-shadow: 0 0 0 38px rgba(201, 219, 232, .025), 0 0 0 78px rgba(201, 219, 232, .02);
          content: "";
          pointer-events: none;
        }
        .gi-hero-content { position: relative; z-index: 1; max-width: 720px; }
        .gi-eyebrow { margin: 0 0 12px; color: var(--gi-gold); font-size: 11px; font-weight: 900; letter-spacing: 1.8px; text-transform: uppercase; }
        .gi-hero h1 {
          max-width: 680px;
          margin: 0;
          color: var(--gi-white);
          font-size: clamp(38px, 6vw, 64px);
          font-weight: 900;
          letter-spacing: -1.7px;
          line-height: 1.02;
        }
        .gi-hero-copy { max-width: 640px; margin: 20px 0 0; color: #c2d0db; font-size: clamp(15px, 1.7vw, 18px); line-height: 1.7; }
        .gi-hero-actions { display: flex; flex-wrap: wrap; gap: 11px; margin-top: 28px; }
        .gi-hero-note { margin: 19px 0 0; color: #91a4b4; font-size: 12px; line-height: 1.6; }
        .gi-section { margin-top: 68px; }
        .gi-section-heading { max-width: 680px; margin-bottom: 22px; }
        .gi-section-heading .gi-eyebrow { margin-bottom: 8px; }
        .gi-section-heading h2 { margin: 0; color: var(--gi-white); font-size: clamp(25px, 3.2vw, 34px); font-weight: 850; letter-spacing: -.5px; line-height: 1.15; }
        .gi-section-heading p:not(.gi-eyebrow) { margin: 10px 0 0; color: var(--gi-muted); font-size: 14px; line-height: 1.7; }
        .gi-feature-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .gi-feature {
          min-height: 194px;
          padding: 21px 19px;
          border: 1px solid var(--gi-line);
          border-radius: 6px;
          background: linear-gradient(155deg, rgba(16, 29, 42, .95), rgba(8, 15, 23, .94));
        }
        .gi-feature-number { color: #e45b61; font-size: 11px; font-weight: 900; letter-spacing: 1.2px; }
        .gi-feature h3 { margin: 16px 0 9px; color: #f1f5f8; font-size: 16px; }
        .gi-feature p { margin: 0; color: var(--gi-muted); font-size: 13px; line-height: 1.65; }
        .gi-vision {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(220px, .8fr);
          gap: 28px;
          align-items: center;
          padding: clamp(22px, 4vw, 38px);
          border: 1px solid #35495a;
          border-radius: 7px;
          background: linear-gradient(110deg, #111e29, #0b1118 75%);
        }
        .gi-vision h2 { margin: 0; color: #fff; font-size: clamp(23px, 3vw, 31px); line-height: 1.2; }
        .gi-vision p { margin: 12px 0 0; color: #b5c3ce; font-size: 14px; line-height: 1.75; }
        .gi-vision-aside { padding: 18px 20px; border-left: 3px solid var(--gi-red-bright); background: rgba(4, 9, 14, .55); color: #d8e1e8; font-size: 13px; line-height: 1.7; }
        .gi-vision-aside strong { display: block; margin-bottom: 5px; color: var(--gi-gold); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
        .gi-links { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .gi-link-card {
          display: flex;
          min-height: 106px;
          flex-direction: column;
          justify-content: space-between;
          padding: 17px 18px;
          border: 1px solid var(--gi-line);
          border-radius: 5px;
          background: #0a131d;
          transition: border-color .16s ease, background .16s ease, transform .16s ease;
        }
        .gi-link-card:hover { transform: translateY(-2px); border-color: #a94349; background: #101a25; }
        .gi-link-card strong { color: #f4f7fa; font-size: 14px; }
        .gi-link-card span { margin-top: 7px; color: #98aab9; font-size: 12px; line-height: 1.5; }
        .gi-link-card b { margin-top: 13px; color: #f16a70; font-size: 12px; }
        .gi-final-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          margin-top: 64px;
          padding: 24px 28px;
          border: 1px solid #3b4d5b;
          border-radius: 6px;
          background: linear-gradient(100deg, #32151a, #111922 75%);
        }
        .gi-final-cta h2 { margin: 0; color: #fff; font-size: 21px; }
        .gi-final-cta p { margin: 6px 0 0; color: #b8c5ce; font-size: 13px; line-height: 1.5; }
        .gi-footer { margin-top: 42px; padding-top: 18px; border-top: 1px solid #1e2b37; color: #788b9b; font-size: 11px; text-align: center; }
        @media (max-width: 900px) {
          .gi-feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 620px) {
          .gi-page { padding: 10px 12px 54px; }
          .gi-header { align-items: flex-start; }
          .gi-logo { width: 46px; height: 46px; }
          .gi-brand-name { font-size: 19px; }
          .gi-brand-tagline { font-size: 8px; letter-spacing: 1px; }
          .gi-header-actions { gap: 10px; font-size: 12px; }
          .gi-header-actions .gi-button { min-height: 39px; padding: 0 12px; }
          .gi-hero { padding: 32px 22px; }
          .gi-hero h1 { letter-spacing: -1px; }
          .gi-hero-actions .gi-button { flex: 1 1 150px; }
          .gi-section { margin-top: 50px; }
          .gi-feature-grid { grid-template-columns: 1fr; }
          .gi-feature { min-height: 0; }
          .gi-vision { grid-template-columns: 1fr; gap: 18px; }
          .gi-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gi-final-cta { align-items: flex-start; flex-direction: column; padding: 22px; }
        }
        @media (max-width: 390px) {
          .gi-header { flex-direction: column; gap: 14px; }
          .gi-links { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gi-button, .gi-link-card { transition: none; }
        }
      `}</style>

      <main className="gi-page">
        <div className="gi-shell">
          <header className="gi-header">
              <Link className="gi-brand" href="/home" aria-label="GameBattles home">
                <Image className="gi-logo" src="/logo-emblem.png" alt="" width={58} height={58} preload />
                <span className="gi-brand-copy">
                  <span className="gi-brand-name">GameBattles</span>
                  <span className="gi-brand-tagline">Where Gaming Finds Its Edge</span>
                </span>
            </Link>
            <nav className="gi-header-actions" aria-label="Account">
              <Link className="gi-login" href="/login">Log in</Link>
              <Link className="gi-button gi-button-primary" href="/join">Sign up</Link>
            </nav>
          </header>

          <section className="gi-hero" aria-labelledby="gi-hero-title">
            <div className="gi-hero-content">
              <p className="gi-eyebrow">A community built to compete</p>
              <h1 id="gi-hero-title">Find your game. Make your mark.</h1>
              <p className="gi-hero-copy">
                GameBattles brings players together around ladders, teams, and the rivalries that make
                competition worth coming back to. Find your platform, build a squad, play matches, and
                follow your progress.
              </p>
              <div className="gi-hero-actions">
                <Link className="gi-button gi-button-primary" href="/join">Join GameBattles</Link>
                <Link className="gi-button gi-button-secondary" href="/ladders">Explore ladders</Link>
                <Link className="gi-button gi-button-secondary" href="/teams/create">Create a team</Link>
              </div>
              <p className="gi-hero-note">Free to join. Built for players, teams, and the community around them.</p>
            </div>
          </section>

          <section className="gi-section" aria-labelledby="gi-features-title">
            <div className="gi-section-heading">
              <p className="gi-eyebrow">Your next match starts here</p>
              <h2 id="gi-features-title">More than a place to play</h2>
              <p>
                Bring your competition and community together in one place—from the first team invite
                to the final result.
              </p>
            </div>
            <div className="gi-feature-grid">
              {features.map((feature) => (
                <article className="gi-feature" key={feature.number}>
                  <span className="gi-feature-number">{feature.number}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="gi-section gi-vision" aria-labelledby="gi-vision-title">
            <div>
              <p className="gi-eyebrow">Where we’re headed</p>
              <h2 id="gi-vision-title">Competition shaped by its community.</h2>
              <p>
                We want GameBattles to bring back the excitement of building a team, finding a rival,
                and earning your place—while making room for new games, new players, and new memories.
                We’ll keep improving the experience with community feedback at the center.
              </p>
            </div>
            <aside className="gi-vision-aside">
              <strong>Our goal</strong>
              A welcoming, fair place to compete, connect, and help shape what GameBattles becomes.
            </aside>
          </section>

          <section className="gi-section" aria-labelledby="gi-destinations-title">
            <div className="gi-section-heading">
              <p className="gi-eyebrow">Pick your next step</p>
              <h2 id="gi-destinations-title">Jump into GameBattles</h2>
              <p>Start with a game, find your people, or see what the community is playing.</p>
            </div>
            <nav className="gi-links" aria-label="Explore GameBattles">
              {destinations.map((destination) => (
                <Link className="gi-link-card" href={destination.href} key={destination.href}>
                  <strong>{destination.title}</strong>
                  <span>{destination.description}</span>
                  <b>{destination.action} →</b>
                </Link>
              ))}
            </nav>
          </section>

          <section className="gi-final-cta" aria-label="Join GameBattles">
            <div>
              <h2>Ready to play your next match?</h2>
              <p>Create an account, bring your team, and find your place on the ladder.</p>
            </div>
            <Link className="gi-button gi-button-primary" href="/join">Create your account</Link>
          </section>

          <footer className="gi-footer">
            © 2026 Competitive Gaming Network
          </footer>
        </div>
      </main>
    </>
  );
}
