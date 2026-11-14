import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Getting Started | GameBattles",
  description:
    "Set up your GameBattles account, choose a ladder, find a team, and get ready to compete.",
};

const steps = [
  {
    number: "01",
    title: "Create your player account",
    description:
      "Join with an email address you can confirm, then add the profile details you want other players to see.",
    details: ["Confirm your email when prompted.", "You can update your profile as you go."],
    action: "Create an account",
    href: "/join",
  },
  {
    number: "02",
    title: "Choose a game and ladder",
    description:
      "Browse the available platforms and games, then open a ladder that fits what you want to play.",
    details: ["Check the ladder rules before competing.", "Review match settings before each game."],
    action: "Explore ladders",
    href: "/ladders",
  },
  {
    number: "03",
    title: "Find your team",
    description:
      "Create a team or join one by invitation. Make sure your roster is ready before entering a match.",
    details: ["Playing solo? You can start by creating a team.", "Coordinate with your teammates before match time."],
    action: "Create a team",
    href: "/teams/create",
  },
  {
    number: "04",
    title: "Play fair and climb",
    description:
      "Follow the listed match settings, report the result honestly, and keep proof in case a result needs review.",
    details: ["Save a screenshot of the final score.", "Video proof can help resolve a dispute."],
    action: "Find a match",
    href: "/matches/finder",
  },
];

const resources = [
  { label: "Competition rules", href: "/rules" },
  { label: "General information", href: "/general-info" },
  { label: "Get support", href: "/support" },
  { label: "Visit the forums", href: "/forums" },
];

export default function GettingStartedPage() {
  return (
    <>
      <style>{`
        .gs-page {
          --gs-bg: #050b12;
          --gs-panel: #0a1622;
          --gs-line: #24425b;
          --gs-muted: #a9bac8;
          --gs-white: #f5f8fb;
          --gs-blue: #2a78ad;
          --gs-gold: #f2c14e;
          min-height: 100vh;
          padding: 18px 18px 56px;
          color: #d7e2ee;
          background:
            radial-gradient(ellipse at 50% 0, rgba(33, 71, 99, .32), transparent 46%),
            var(--gs-bg);
          font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
        }
        .gs-page * { box-sizing: border-box; }
        .gs-page a { color: inherit; text-decoration: none; }
        .gs-page a:focus-visible { outline: 2px solid var(--gs-gold); outline-offset: 4px; }
        .gs-shell { width: min(1120px, 100%); margin: 0 auto; }
        .gs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 8px 0 17px;
        }
        .gs-brand { display: inline-flex; align-items: center; gap: 13px; min-width: 0; }
        .gs-logo { width: 54px; height: 54px; flex: 0 0 auto; object-fit: contain; }
        .gs-brand-copy { display: block; }
        .gs-brand-name { display: block; color: var(--gs-white); font-size: 23px; font-weight: 900; letter-spacing: .3px; line-height: 1; }
        .gs-brand-tagline { display: block; margin-top: 6px; color: var(--gs-gold); font-size: 9px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; }
        .gs-account { display: flex; align-items: center; gap: 17px; font-size: 13px; font-weight: 800; }
        .gs-account-link { color: #d2deea !important; }
        .gs-account-link:hover { color: #fff !important; }
        .gs-button {
          display: inline-flex;
          min-height: 41px;
          align-items: center;
          justify-content: center;
          padding: 0 16px;
          border: 1px solid #78b7df;
          border-radius: 4px;
          background: linear-gradient(180deg, #2a78ad, #174b70);
          box-shadow: 0 6px 20px rgba(30, 94, 139, .2);
          color: #fff !important;
          font-size: 12px;
          font-weight: 900;
          transition: background .16s ease, transform .16s ease;
        }
        .gs-button:hover { transform: translateY(-1px); background: linear-gradient(180deg, #398cc3, #1d5e89); }
        .gs-secondary {
          display: inline-flex;
          min-height: 41px;
          align-items: center;
          justify-content: center;
          padding: 0 16px;
          border: 1px solid #526779;
          border-radius: 4px;
          background: rgba(8, 17, 26, .72);
          color: var(--gs-white) !important;
          font-size: 12px;
          font-weight: 800;
          transition: background .16s ease, border-color .16s ease;
        }
        .gs-secondary:hover { border-color: #9fb3c3; background: #112131; }
        .gs-hero {
          position: relative;
          overflow: hidden;
          padding: clamp(24px, 4vw, 40px);
          border: 1px solid #31516b;
          border-top: 3px solid var(--gs-blue);
          border-radius: 8px;
          background:
            radial-gradient(ellipse at 88% 10%, rgba(49, 112, 157, .3), transparent 39%),
            linear-gradient(116deg, #12334d 0%, #0a1622 65%, #0b1118 100%);
        }
        .gs-hero::after {
          position: absolute;
          top: -190px;
          right: -85px;
          width: 360px;
          height: 360px;
          border: 1px solid rgba(201, 219, 232, .08);
          border-radius: 50%;
          box-shadow: 0 0 0 36px rgba(201, 219, 232, .025), 0 0 0 74px rgba(201, 219, 232, .02);
          content: "";
          pointer-events: none;
        }
        .gs-hero-content { position: relative; z-index: 1; max-width: 760px; }
        .gs-eyebrow { margin: 0 0 10px; color: var(--gs-gold); font-size: 10px; font-weight: 900; letter-spacing: 1.7px; text-transform: uppercase; }
        .gs-hero h1 { margin: 0; color: var(--gs-white); font-size: clamp(34px, 4.5vw, 50px); font-weight: 900; letter-spacing: -1.1px; line-height: 1.06; }
        .gs-hero-copy { max-width: 650px; margin: 12px 0 0; color: #c2d0db; font-size: 15px; line-height: 1.65; }
        .gs-hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
        .gs-guide { display: grid; grid-template-columns: minmax(0, 1fr) 286px; gap: clamp(30px, 5vw, 64px); align-items: start; margin-top: 34px; }
        .gs-section-heading { margin-bottom: 5px; }
        .gs-section-heading h2 { margin: 0; color: var(--gs-white); font-size: clamp(22px, 2.7vw, 28px); font-weight: 850; letter-spacing: -.4px; line-height: 1.2; }
        .gs-section-intro { margin: 8px 0 0; color: var(--gs-muted); font-size: 13px; line-height: 1.6; }
        .gs-steps { margin-top: 18px; border-top: 1px solid rgba(100, 137, 165, .3); }
        .gs-step { display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: 14px; padding: 18px 0 20px; border-bottom: 1px solid rgba(100, 137, 165, .25); }
        .gs-step-number { padding-top: 1px; color: #78b7df; font-size: 18px; font-weight: 900; letter-spacing: -.5px; }
        .gs-step h3 { margin: 0; color: #f0f5f9; font-size: 16px; font-weight: 800; }
        .gs-step p { max-width: 650px; margin: 6px 0 0; color: #b7c5d0; font-size: 12px; line-height: 1.65; }
        .gs-step ul { display: flex; flex-wrap: wrap; gap: 6px 24px; margin: 9px 0 0; padding: 0; list-style: none; }
        .gs-step li { position: relative; padding-left: 12px; color: #91a5b5; font-size: 11px; line-height: 1.55; }
        .gs-step li::before { position: absolute; top: .55em; left: 0; width: 4px; height: 4px; border-radius: 50%; background: var(--gs-gold); content: ""; }
        .gs-step-action { display: inline-flex; margin-top: 10px; color: #8bc9f2 !important; font-size: 11px; font-weight: 800; }
        .gs-step-action:hover { color: #c5e8ff !important; }
        .gs-aside { margin-top: 2px; padding: 21px 20px; border-left: 3px solid var(--gs-gold); background: linear-gradient(145deg, rgba(16, 36, 53, .9), rgba(8, 17, 26, .75)); }
        .gs-aside h2 { margin: 0; color: var(--gs-white); font-size: 18px; line-height: 1.25; }
        .gs-aside-copy { margin: 7px 0 0; color: var(--gs-muted); font-size: 12px; line-height: 1.6; }
        .gs-ready-list { display: grid; gap: 11px; margin: 17px 0 0; padding: 0; list-style: none; }
        .gs-ready-list li { display: grid; grid-template-columns: 20px 1fr; gap: 8px; align-items: start; color: #d1dce5; font-size: 12px; line-height: 1.5; }
        .gs-ready-list span { color: var(--gs-gold); font-weight: 900; }
        .gs-aside-divider { height: 1px; margin: 19px 0 14px; background: rgba(116, 148, 173, .25); }
        .gs-aside-label { margin: 0 0 8px; color: #8fa4b4; font-size: 9px; font-weight: 900; letter-spacing: 1.3px; text-transform: uppercase; }
        .gs-aside-link { display: inline-flex; color: #8bc9f2 !important; font-size: 12px; font-weight: 800; }
        .gs-aside-link:hover { color: #c5e8ff !important; }
        .gs-resources { display: flex; flex-wrap: wrap; gap: 8px 22px; align-items: center; margin-top: 26px; padding-top: 17px; border-top: 1px solid #1e3547; }
        .gs-resources-label { width: 100%; margin: 0; color: #8398a9; font-size: 9px; font-weight: 900; letter-spacing: 1.2px; text-transform: uppercase; }
        .gs-resource-link { color: #b6c8d5 !important; font-size: 11px; font-weight: 700; }
        .gs-resource-link:hover { color: #fff !important; }
        .gs-disclaimer { margin: 22px 0 0; color: #74899a; font-size: 10px; line-height: 1.6; }
        .gs-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #1e3547; color: #8196a7; font-size: 10px; text-align: center; }
        @media (max-width: 760px) {
          .gs-page { padding: 10px 14px 40px; }
          .gs-header { padding: 4px 0 13px; }
          .gs-logo { width: 46px; height: 46px; }
          .gs-brand { gap: 9px; }
          .gs-brand-name { font-size: 19px; }
          .gs-brand-tagline { font-size: 7px; letter-spacing: 1px; }
          .gs-account { gap: 10px; font-size: 11px; }
          .gs-account .gs-button { min-height: 36px; padding: 0 11px; }
          .gs-hero { padding: 24px 20px; }
          .gs-hero h1 { letter-spacing: -.7px; }
          .gs-hero-copy { font-size: 14px; }
          .gs-guide { grid-template-columns: 1fr; gap: 25px; margin-top: 28px; }
          .gs-aside { margin-top: 0; }
          .gs-step { grid-template-columns: 42px minmax(0, 1fr); gap: 10px; padding: 16px 0; }
          .gs-step-number { font-size: 16px; }
        }
        @media (max-width: 420px) {
          .gs-page { padding-right: 12px; padding-left: 12px; }
          .gs-brand-tagline { letter-spacing: .6px; }
          .gs-account { gap: 8px; }
          .gs-account .gs-button { padding: 0 9px; }
          .gs-hero { padding: 21px 17px; }
          .gs-step ul { display: grid; gap: 6px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gs-button, .gs-secondary { transition: none; }
        }
      `}</style>

      <main className="gs-page">
        <div className="gs-shell">
          <header className="gs-header">
            <Link className="gs-brand" href="/home" aria-label="GameBattles home">
              <Image className="gs-logo" src="/logo-emblem.png" alt="" width={54} height={54} preload />
              <span className="gs-brand-copy">
                <span className="gs-brand-name">GameBattles</span>
                <span className="gs-brand-tagline">Where Gaming Finds Its Edge</span>
              </span>
            </Link>
            <nav className="gs-account" aria-label="Account">
              <Link className="gs-account-link" href="/login">Log in</Link>
              <Link className="gs-button" href="/join">Sign up</Link>
            </nav>
          </header>

          <section className="gs-hero" aria-labelledby="gs-title">
            <div className="gs-hero-content">
              <p className="gs-eyebrow">New to GameBattles?</p>
              <h1 id="gs-title">Your first match starts here.</h1>
              <p className="gs-hero-copy">
                Set up your player account, choose a ladder, and find your team. Follow these four
                steps to get ready to compete.
              </p>
              <div className="gs-hero-actions">
                <Link className="gs-button" href="/join">Create an account</Link>
                <Link className="gs-secondary" href="/ladders">Browse ladders</Link>
              </div>
            </div>
          </section>

          <div className="gs-guide">
            <section aria-labelledby="gs-steps-title">
              <div className="gs-section-heading">
                <p className="gs-eyebrow">The quick start</p>
                <h2 id="gs-steps-title">Four steps to get in the game</h2>
                <p className="gs-section-intro">
                  Some parts of the site are still being built, so availability may vary as new
                  features come online.
                </p>
              </div>

              <div className="gs-steps">
                {steps.map((step) => (
                  <article className="gs-step" key={step.number}>
                    <span className="gs-step-number" aria-hidden="true">{step.number}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                      <ul>
                        {step.details.map((detail) => <li key={detail}>{detail}</li>)}
                      </ul>
                      <Link className="gs-step-action" href={step.href}>
                        {step.action} <span aria-hidden="true">&nbsp;→</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="gs-aside" aria-labelledby="gs-ready-title">
              <p className="gs-eyebrow">Before you queue</p>
              <h2 id="gs-ready-title">A few things to have ready</h2>
              <p className="gs-aside-copy">
                You don’t need a full roster to get started. Begin with the basics and build from there.
              </p>
              <ul className="gs-ready-list">
                <li><span aria-hidden="true">01</span><span>An email address you can confirm</span></li>
                <li><span aria-hidden="true">02</span><span>A platform and game you want to play</span></li>
                <li><span aria-hidden="true">03</span><span>Teammates, or a plan to find them</span></li>
              </ul>
              <div className="gs-aside-divider" />
              <p className="gs-aside-label">Need a hand?</p>
              <Link className="gs-aside-link" href="/support">Visit player support <span aria-hidden="true">&nbsp;→</span></Link>
            </aside>
          </div>

          <nav className="gs-resources" aria-label="Helpful pages">
            <p className="gs-resources-label">Helpful pages</p>
            {resources.map((resource) => (
              <Link className="gs-resource-link" href={resource.href} key={resource.href}>
                {resource.label}
              </Link>
            ))}
          </nav>

          <p className="gs-disclaimer">
            This website is an independent community project and is NOT affiliated with, endorsed
            by, sponsored by, or connected to Major League Gaming (MLG), Activision, Microsoft,
            Sony, Nintendo, Call of Duty, Halo, or any other company, game, publisher, or brand
            referenced by the community.
          </p>
          <footer className="gs-footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}
