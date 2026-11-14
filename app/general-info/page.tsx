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
    title: "Ladders & matches",
    description: "Play ladder matches and climb the standings.",
  },
  {
    number: "02",
    title: "Teams & recruiting",
    description: "Create a roster and find teammates.",
  },
  {
    number: "03",
    title: "Rankings & community",
    description: "Follow rankings, awards, tournaments, and forums.",
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
    title: "Discover tournaments",
    description: "Explore events and find your next competition.",
    href: "/tournaments",
    action: "View tournaments",
  },
];

export default function GeneralInfoPage() {
  return (
    <>
      <style>{`
        .gi-page {
          --gi-bg: #050b12;
          --gi-panel: #0a1622;
          --gi-line: #24425b;
          --gi-muted: #a9bac8;
          --gi-white: #f5f8fb;
          --gi-blue: #174b70;
          --gi-blue-bright: #2a78ad;
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
          padding: 8px 0 16px;
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
          border-color: #78b7df;
          background: linear-gradient(180deg, var(--gi-blue-bright), var(--gi-blue));
          box-shadow: 0 6px 20px rgba(30, 94, 139, .25);
        }
        .gi-button-primary:hover { background: linear-gradient(180deg, #398cc3, #1d5e89); }
        .gi-button-secondary {
          border-color: #526779;
          background: rgba(8, 17, 26, .72);
          color: #f5f8fb !important;
        }
        .gi-button-secondary:hover { border-color: #a9bac8; background: #112131; }
        .gi-hero {
          position: relative;
          overflow: hidden;
          padding: clamp(24px, 3vw, 36px);
          border: 1px solid #31516b;
          border-top: 3px solid var(--gi-blue-bright);
          border-radius: 8px;
          background:
            radial-gradient(ellipse at 88% 10%, rgba(49, 112, 157, .32), transparent 38%),
            linear-gradient(116deg, #12334d 0%, #0a1622 63%, #0b1118 100%);
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
        .gi-hero-content { position: relative; z-index: 1; max-width: 900px; }
        .gi-eyebrow { margin: 0 0 12px; color: var(--gi-gold); font-size: 11px; font-weight: 900; letter-spacing: 1.8px; text-transform: uppercase; }
        .gi-hero h1 {
          max-width: 900px;
          margin: 0;
          color: var(--gi-white);
          font-size: clamp(36px, 4.4vw, 54px);
          font-weight: 900;
          letter-spacing: -1.2px;
          line-height: 1.02;
        }
        .gi-hero-copy { max-width: 680px; margin: 12px 0 0; color: #c2d0db; font-size: clamp(15px, 1.4vw, 17px); line-height: 1.55; }
        .gi-hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 17px; }
        .gi-section { margin-top: 26px; }
        .gi-section-heading { max-width: 680px; margin-bottom: 12px; }
        .gi-section-heading .gi-eyebrow { margin-bottom: 8px; }
        .gi-section-heading h2 { margin: 0; color: var(--gi-white); font-size: clamp(23px, 3vw, 30px); font-weight: 850; letter-spacing: -.5px; line-height: 1.15; }
        .gi-section-heading p:not(.gi-eyebrow) { margin: 7px 0 0; color: var(--gi-muted); font-size: 13px; line-height: 1.6; }
        .gi-feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .gi-feature {
          min-height: 120px;
          padding: 14px 16px;
          border: 1px solid var(--gi-line);
          border-radius: 6px;
          background: linear-gradient(155deg, rgba(16, 36, 53, .96), rgba(8, 17, 26, .96));
        }
        .gi-feature-number { color: var(--gi-gold); font-size: 10px; font-weight: 900; letter-spacing: 1.2px; }
        .gi-feature h3 { margin: 8px 0 6px; color: #f1f5f8; font-size: 14px; }
        .gi-feature p { margin: 0; color: var(--gi-muted); font-size: 12px; line-height: 1.55; }
        .gi-links { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .gi-link-card {
          display: flex;
          min-height: 72px;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px 14px;
          border: 1px solid var(--gi-line);
          border-radius: 5px;
          background: #0a1622;
          transition: border-color .16s ease, background .16s ease, transform .16s ease;
        }
        .gi-link-card:hover { transform: translateY(-2px); border-color: #5b91b6; background: #10263a; }
        .gi-link-card strong { color: #f4f7fa; font-size: 14px; }
        .gi-link-card span { margin-top: 4px; color: #a9bac8; font-size: 11px; line-height: 1.4; }
        .gi-link-card b { margin-top: 7px; color: #8bc9f2; font-size: 11px; }
        .gi-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #1e3547; color: #8196a7; font-size: 11px; text-align: center; }
        @media (max-width: 900px) {
          .gi-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 620px) {
          .gi-page { padding: 8px 12px 28px; }
          .gi-header { gap: 10px; padding-bottom: 12px; }
          .gi-brand { gap: 8px; }
          .gi-logo { width: 42px; height: 42px; }
          .gi-brand-name { font-size: 17px; }
          .gi-brand-tagline { margin-top: 4px; font-size: 7px; letter-spacing: .7px; }
          .gi-header-actions { gap: 8px; font-size: 11px; }
          .gi-header-actions .gi-button { min-height: 35px; padding: 0 10px; }
          .gi-hero { padding: 21px 17px; }
          .gi-hero h1 { font-size: clamp(34px, 9vw, 42px); letter-spacing: -.8px; }
          .gi-hero-copy { font-size: 14px; }
          .gi-hero-actions { gap: 8px; margin-top: 14px; }
          .gi-hero-actions .gi-button { flex: 1 1 140px; min-height: 40px; padding: 0 11px; }
          .gi-section { margin-top: 22px; }
          .gi-section-heading { margin-bottom: 10px; }
          .gi-feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gi-feature { min-height: 0; padding: 12px; }
          .gi-feature h3 { font-size: 13px; }
          .gi-feature p { font-size: 11px; line-height: 1.45; }
          .gi-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gi-link-card { min-height: 58px; padding: 9px 11px; }
          .gi-link-card strong { font-size: 12px; }
          .gi-link-card span { display: none; }
          .gi-link-card b { margin-top: 7px; font-size: 10px; }
          .gi-footer { margin-top: 16px; }
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
                Choose your game, build a team, and climb through ladder matches. We’re bringing back
                the rivalries players love in a community shaped by its players.
              </p>
              <div className="gi-hero-actions">
                <Link className="gi-button gi-button-primary" href="/join">Join GameBattles</Link>
                <Link className="gi-button gi-button-secondary" href="/ladders">Explore ladders</Link>
              </div>
            </div>
          </section>

          <section className="gi-section" aria-labelledby="gi-features-title">
            <div className="gi-section-heading">
              <p className="gi-eyebrow">What you can do here</p>
              <h2 id="gi-features-title">Play, build, and make your mark</h2>
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

          <section className="gi-section" aria-labelledby="gi-destinations-title">
            <div className="gi-section-heading">
              <p className="gi-eyebrow">Pick your next step</p>
              <h2 id="gi-destinations-title">Jump into GameBattles</h2>
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

          <footer className="gi-footer">
            © 2026 Competitive Gaming Network
          </footer>
        </div>
      </main>
    </>
  );
}
