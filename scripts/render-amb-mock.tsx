/* Renders a pixel-true ambassador profile mock using the REAL profile page
   CSS and REAL components (RankEmblemBold, RankBadgeArt, AwardArt, SiteNav). */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RankEmblemBold as RankEmblem } from "../app/profile/RankEmblemBold";
import { getRankTier } from "../app/profile/RankEmblem";
import { RankBadgeArt } from "../app/components/RankBadge";
import { rankFromXp } from "../lib/playerRank";
import AwardArt, { AWARD_CSS } from "../app/awards/AwardArt";
import SiteNav from "../app/components/SiteNav";

const root = process.cwd();
const pageSource = readFileSync(join(root, "app", "profile", "page.tsx"), "utf8");
const styleBlocks = [...pageSource.matchAll(/<style>\{`([\s\S]*?)`\}<\/style>/g)].map((m) => m[1]);
const pageCss = styleBlocks.join("\n").replace(/\$\{[^}]*\}/g, "");

const rankTier = getRankTier(185);
const playerLevel = rankFromXp(12640);

const EARNED = [
  { name: "GB Ambassador", group: "Ambassador Program" },
  { name: "Recruitment Legend", group: "Community" },
  { name: "First Win Badge", group: "Milestones" },
  { name: "Daily Grind Trophy", group: "Challenges" },
];

function Mock() {
  return (
    <div className="profile-page favorite-playstation amb-gold-frame">
      <div className="wrapper">
        <header className="header">
          <div className="logo-box">
            <div className="gb-logo-wrap">
              <div>
                <div className="gb-logo-text">GAMEBATTLES</div>
                <div className="gb-logo-sub">WHERE GAMING FINDS ITS EDGE</div>
              </div>
            </div>
          </div>
          <div className="header-ad">
            <a className="promo-banner promo-discord" href="#">
              <span className="promo-icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path d="M50.6 14.7a48 48 0 0 0-11.8-3.6l-1.5 3.1a44 44 0 0 0-10.6 0l-1.5-3.1a48 48 0 0 0-11.8 3.6C6 25.8 4 36.6 5 47.2a48 48 0 0 0 14.5 7.3l3.1-5.1a31 31 0 0 1-4.9-2.4l1.2-.9c9.4 4.4 19.7 4.4 29 0l1.2.9a31 31 0 0 1-4.9 2.4l3.1 5.1A48 48 0 0 0 57 47.2c1.2-12.3-2-23-6.4-32.5ZM23.8 39.4c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Zm16.4 0c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Z" />
                </svg>
              </span>
              <span className="promo-copy">
                <span className="promo-eyebrow">GameBattles community</span>
                <span className="promo-title">JOIN OUR DISCORD</span>
                <span className="promo-sub">Find players. Get in the game.</span>
              </span>
              <span className="promo-action">JOIN →</span>
            </a>
          </div>
        </header>

        <SiteNav
          showLadders={false}
          profileNavigation
          extra={
            <details className="nav-actions">
              <summary>Player Actions ▾</summary>
              <div className="nav-actions-menu">
                <a className="quick-link" href="#">Add Friend</a>
                <a className="quick-link" href="#">Message Player</a>
                <a className="quick-link" href="#">View Player Awards</a>
                <a className="quick-link" href="#">View Player Friends</a>
                <a className="quick-link" href="#">View Player Teams</a>
                <a className="quick-link" href="#">View Player Stats</a>
              </div>
            </details>
          }
        />

        <div className="pf-banner">
          <div className="pf-banner-top">
            <div className="pf-avatar pf-avatar-amb">
              <span>SZ</span>
            </div>
            <div className="pf-identity">
              <div className="pf-name-row">
                <div className="pf-name">SharpzOW</div>
                <a className="pf-amb-chip" href="#">★ Ambassador</a>
                <a className="pf-amb-stream" href="#">▶ WATCH STREAM</a>
              </div>
              <div className="pf-facts">
                <div><span>Member Since</span><strong className="pf-since">March 4, 2026</strong></div>
                <div><span>Status</span><strong className="status-online">Online</strong></div>
                <div><span>Profile Views</span><strong>4,218</strong></div>
                <div><span>Role</span><strong className="pf-role-amb">Ambassador</strong></div>
                <div><span>Credits</span><strong>215</strong></div>
                <div><span>Recruits</span><strong className="pf-role-amb">61</strong></div>
              </div>
            </div>
            <div className="pf-tags">
              <div className="pf-tag system-playstation-tag">
                <span className="pf-tag-platform">PlayStation</span>
                <span className="pf-tag-id">SharpzOW_TTV</span>
              </div>
              <div className="pf-tag system-pc-tag">
                <span className="pf-tag-platform">PC</span>
                <span className="pf-tag-id">SharpzOW#2210</span>
              </div>
            </div>
            <div className="pf-banner-actions">
              <a className="pf-btn pf-btn-primary" href="#">Add Friend</a>
              <a className="pf-btn" href="#">Send Message</a>
              <a className="pf-btn" href="#">Challenge</a>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          <aside className="left-column">
            <div className="box pf-rank-box">
              <RankEmblem tierIndex={rankTier.index} />
              <div className="pf-tier-name" style={{ color: rankTier.light }}>{rankTier.name}</div>
              <div className="pf-rank-label">GB RANK</div>
              <div className="pf-rank-value">14<sup>th</sup></div>
              <div className="pf-rank-points">185 points</div>
              <a href="#" className="pf-level" style={{ ["--lv" as string]: playerLevel.tier.light }}>
                <RankBadgeArt rank={playerLevel} size={46} />
                <span className="pf-level-text">
                  <strong>{playerLevel.title}</strong>
                  <small>Level {playerLevel.level} · {playerLevel.xp.toLocaleString()} XP</small>
                  <span className="pf-level-bar"><i style={{ width: `${Math.round(playerLevel.progress * 100)}%` }} /></span>
                </span>
              </a>
              <div className="stat-row"><span>Reputation</span><span>100%</span></div>
              <div className="stat-row"><span>Following</span><span>48</span></div>
              <div className="stat-row"><span>Followers</span><span>312</span></div>
            </div>

            {/* (nothing extra here yet — ambassador side card not built) */}

            <div className="box amb-box">
              <div className="box-title">★ Ambassador</div>
              <div className="amb-body">
                <div className="amb-row"><span>Tier</span><b>Ambassador (Gold)</b></div>
                <div className="amb-row"><span>Players recruited</span><b>61</b></div>
                <div className="amb-row"><span>Credits given out</span><b>190</b></div>
                <div className="amb-row"><span>Next: Icon at</span><b>75 qualified</b></div>
                <button className="amb-link" type="button">gamebattles.app/amb/<b>sharpz</b></button>
              </div>
            </div>
          </aside>

          <main className="main-column">
            <div className="pf-section">
              <div className="pf-section-title"><span>Top Awards</span></div>
              <div className="pf-award-row">
                {EARNED.map((award) => (
                  <div className="pf-award earned" key={award.name}>
                    <div className="pf-award-art">
                      <AwardArt name={award.name} group={award.group} height={92} />
                      <span className="pf-spark s1" aria-hidden="true" />
                      <span className="pf-spark s2" aria-hidden="true" />
                      <span className="pf-spark s3" aria-hidden="true" />
                    </div>
                    <div className="pf-award-name">{award.name}</div>
                  </div>
                ))}
                {[0, 1].map((i) => (
                  <div className="pf-award locked" key={i}>
                    <div className="pf-award-art">
                      <svg className="pf-award-ghost" viewBox="0 0 60 80" aria-hidden="true">
                        <path d="M30 4 L54 14 V40 C54 58 42 70 30 76 C18 70 6 58 6 40 V14 Z" fill="none" stroke="#4a7aa8" strokeWidth="2" strokeDasharray="4 4" />
                        <path d="M30 28 V46 M30 54 V56" stroke="#4a7aa8" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pf-section">
              <div className="pf-section-title"><span>Top Friends</span></div>
              <div className="pf-friend-row">
                {["NovaQueen", "DarkKnightTV", "FrostbiteYT", "LunaXplays"].map((name) => (
                  <a className="pf-friend" href="#" key={name}>
                    <div className="pf-friend-avatar">{name.slice(0, 2).toUpperCase()}</div>
                    <span>{name}</span>
                  </a>
                ))}
              </div>
              <a className="pf-showall" href="#">show all</a>
            </div>

            <div className="pf-two-col">
              <div className="pf-section">
                <div className="pf-section-title"><span>Featured Teams</span></div>
                <a className="pf-team" href="#">
                  <div className="pf-team-logo">SX</div>
                  <div>
                    <span className="pf-team-name">Sharpz Exiles</span>
                    <span className="pf-team-platform">Battlefield 6 · 4v4 · PC</span>
                  </div>
                  <div className="pf-team-meta"><strong>12-3</strong>Record</div>
                </a>
                <a className="pf-team pf-gap" href="#">
                  <div className="pf-team-logo">NW</div>
                  <div>
                    <span className="pf-team-name">Night Watch</span>
                    <span className="pf-team-platform">Call of Duty · 2v2 · PlayStation</span>
                  </div>
                  <div className="pf-team-meta"><strong>8-5</strong>Record</div>
                </a>
              </div>
              <div className="pf-section">
                <div className="pf-section-title"><span>Match Record</span></div>
                <div className="pf-record-head"><span>Opponent</span><span>Result</span><span>+/-</span></div>
                <div className="pf-record-row"><span>Iron Wolves</span><span>Win</span><span>+14</span></div>
                <div className="pf-record-row"><span>Night Watch</span><span>Win</span><span>+11</span></div>
                <div className="pf-record-row"><span>Shadow Unit</span><span>Loss</span><span>-6</span></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const body = renderToStaticMarkup(<Mock />)
  .replace(/src="\/ranks\//g, 'src="https://gamebattles.app/ranks/');

const extraCss = `
/* mock-only: proposed compact ambassador card */
.amb-card{ border-color:#6e5213; }
.amb-card-title{ color:#f2c14e; background:linear-gradient(to bottom,#2c2206,#171103) !important; }
.amb-gold{ color:#f2c14e; font-weight:bold; }
.amb-card-link{ margin:9px 6px 4px; padding:7px; border-radius:6px; border:1px dashed #6e5213; background:#050c13; color:#8fa9c2; font-size:10.5px; text-align:center; }
.amb-card-link b{ color:#ffdf8e; }
`;

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>MOCKUP — Ambassador Profile (real layout)</title>
<style>${AWARD_CSS}</style>
<style>${pageCss}</style>
<style>${extraCss}</style>
</head><body>
<div style="position:fixed;top:10px;right:10px;background:#c7a31b;color:#1a1403;font-size:10px;font-weight:900;letter-spacing:.12em;padding:5px 10px;border-radius:4px;z-index:99;font-family:Tahoma">MOCKUP · NOT LIVE</div>
${body}
</body></html>`;

const out = process.argv[2];
writeFileSync(out, html);
console.log("written", out);
