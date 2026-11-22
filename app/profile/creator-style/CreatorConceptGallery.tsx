"use client";

import { useState } from "react";
import "./creator-concepts.css";

const concepts = [
  { id: "sovereign", name: "Sovereign", tier: "Ambassador", description: "A championship crest, brushed gold and a bold personal mark." },
  { id: "aftershock", name: "Aftershock", tier: "Ambassador", description: "Electric blue energy built around the player's logo." },
  { id: "rival", name: "Rival", tier: "Ambassador", description: "A fierce red signature with a competitive broadcast feel." },
  { id: "spotlight", name: "Spotlight", tier: "Affiliate", description: "A custom identity banner while the rest of the profile stays classic." },
] as const;

function ExampleLogo({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 120 130" aria-hidden="true">
    <path d="M60 4 108 22 103 83 60 124 17 83 12 22Z" fill="#080e16" stroke="currentColor" strokeWidth="3" />
    <path d="M60 12 100 27 96 79 60 113 24 79 20 27Z" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" />
    <path d="M34 84V39l12-5 28 31V28l12-4v60l-10 5-30-33v28Z" fill="currentColor" />
    <path d="M28 94 60 116 92 94" fill="none" stroke="currentColor" strokeWidth="2" opacity=".7" />
  </svg>;
}

export default function CreatorConceptGallery() {
  const [selected, setSelected] = useState<(typeof concepts)[number]["id"]>("sovereign");
  const concept = concepts.find((item) => item.id === selected)!;
  return <section id="concepts" className="concept-gallery" aria-labelledby="concept-gallery-title">
    <div className="concept-gallery-heading">
      <div>
        <p className="concept-kicker">CREATOR DESIGN LAB</p>
        <h2 id="concept-gallery-title">Your name. Your mark. Your arena.</h2>
        <p>Imagine your logo and colors across a GameBattles profile. Explore four original directions below.</p>
      </div>
      <span className="concept-label">CONCEPTS ONLY</span>
    </div>
    <div className="concept-picker" aria-label="Profile concept examples">
      {concepts.map((item, index) => <button key={item.id} type="button" className={`concept-pick concept-pick-${item.id}`} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
        <span className="concept-pick-number">0{index + 1}</span><span><b>{item.name}</b><small>{item.tier}</small></span><i aria-hidden="true" />
      </button>)}
    </div>
    <div className="concept-detail"><div><strong>{concept.name}</strong><span>{concept.description}</span></div><b>{concept.tier} concept</b></div>
    <div className={`concept-profile concept-profile-${concept.id}`} aria-label={`${concept.name} ${concept.tier} profile concept, with example player information`}>
      <div className="concept-sitebar"><strong>GAMEBATTLES<span>®</span></strong><div><span>COMPETE</span><span>COMMUNITY</span><span>PROFILE</span></div><small>PLAYER PROFILE</small></div>
      <div className="concept-nav"><span>TOURNAMENTS</span><span>CREATE A TEAM</span><span>FIND PLAYERS</span><span>CONTROL CENTER</span></div>
      <div className="concept-hero">
        <div className="concept-hero-rings" aria-hidden="true" />
        <div className="concept-hero-slashes" aria-hidden="true" />
        <ExampleLogo className="concept-hero-mark" />
        <span className="concept-hero-word" aria-hidden="true">NOVA</span>
        <div className="concept-avatar"><ExampleLogo className="concept-avatar-logo" /></div>
        <div className="concept-identity"><div className="concept-player-line"><strong>NOVA</strong><span>★ {concept.tier.toUpperCase()}</span></div>
          <div className="concept-tagline">YOUR NAME. YOUR LEGACY.</div>
          <div className="concept-facts"><span>MEMBER SINCE <b>2024</b></span><span>STATUS <b className="concept-online">● ONLINE</b></span><span>ROLE <b>{concept.tier.toUpperCase()}</b></span></div>
        </div>
        <div className="concept-accounts"><span>GAMING ACCOUNTS</span><b>XBOX <em>NovaPlayer</em></b><b>PLAYSTATION <em>NovaPlayer</em></b><b>PC <em>NovaPlayer</em></b></div>
      </div>
      <div className="concept-body">
        <aside className="concept-panel concept-rank"><span>PLAYER RANK</span><div className="concept-rank-emblem">✦</div><b>ELITE</b><small>GB RANK</small><div className="concept-rank-line" /><small>THE COMPETITION STARTS HERE</small></aside>
        <div className="concept-main"><section className="concept-panel"><div className="concept-panel-title"><b>TOP AWARDS</b><span>VIEW ALL ›</span></div><div className="concept-awards"><span>✦<small>CHAMPION</small></span><span>◆<small>COMPETITOR</small></span><span>★<small>COMMUNITY</small></span><span>✹<small>VETERAN</small></span></div></section>
          <section className="concept-panel"><div className="concept-panel-title"><b>TOP FRIENDS</b><span>VIEW ALL ›</span></div><div className="concept-friends"><i>N</i><i>V</i><i>A</i><i>R</i><span>YOUR COMMUNITY</span></div></section>
          <div className="concept-bottom"><section className="concept-panel"><div className="concept-panel-title"><b>FEATURED TEAMS</b></div><p>◆ &nbsp; YOUR TEAM</p><small>COMPETE TOGETHER</small></section><section className="concept-panel"><div className="concept-panel-title"><b>RECORDS</b></div><p>YOUR MATCH HISTORY</p><small>EVERY MATCH COUNTS</small></section></div>
        </div>
      </div>
    </div>
    <p className="concept-disclaimer">Illustrative mockup with a fictional player and logo. These are ideas to explore, not selectable profile styles. Affiliate concepts customize only the top section; Ambassador concepts show a full-profile finish. Your existing profile layout and information stay in place.</p>
  </section>;
}
