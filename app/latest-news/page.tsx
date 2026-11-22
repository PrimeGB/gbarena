import Link from "next/link";
import Image from "next/image";
import { newsMenuCategories } from "./categoryData";

export default function LatestNewsPage() {
  return (
    <>
      <style>{`
        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{
          text-decoration:none;
        }

        .wrapper{
          width:100%;
          max-width:1240px;
          margin:0 auto;
        }

        .header{
          height:92px;
          background:#0a1622;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:2px solid #4f93d6;
          display:flex;
          align-items:center;
          padding:0 14px;
        }

        .logo-main{
          font-size:30px;
          font-weight:bold;
          color:#eaf5ff;
        }

        .logo-sub{
          color:#f2c14e;
          font-size:10px;
          text-transform:uppercase;
          margin-top:5px;
        }

        .layout{
          margin-top:8px;
          display:grid;
          grid-template-columns:minmax(150px,240px) minmax(0,1fr) minmax(150px,260px);
          gap:10px;
        }

        .panel{
          background:#0a1622;
          border:1px solid #3b7fc2;
        }

        .panel-title{
          height:24px;
          background:#0f2a40;
          border-bottom:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          padding-left:8px;
          font-size:10px;
          font-weight:bold;
          color:#f2c14e;
          text-transform:uppercase;
        }

        .side-link{
          display:block;
          padding:8px;
          border-bottom:1px solid #16324a;
          color:#d7eaff;
          font-size:10px;
        }

        .side-link:hover{
          background:#12324b;
          color:#fff;
        }

        .news-feed{
          padding:8px;
        }

        .news-post{
          background:#07111b;
          border:1px solid #16324a;
          margin-bottom:8px;
        }

        .news-head{
          background:#0f2a40;
          border-bottom:1px solid #3b7fc2;
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:6px 8px;
        }

        .news-title{
          color:#f2c14e;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .news-date{
          color:#9fb9cf;
          font-size:10px;
        }

        .news-body{
          padding:8px;
          font-size:11px;
          line-height:1.5;
          color:#d7e2ee;
        }
        .news-feature{padding:16px;line-height:1.65;font-size:12px}
        .news-feature p{margin:0 0 10px}
        .news-feature a{color:#8ed0ff;font-weight:bold}
        .news-concepts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}
        .news-concepts figure{margin:0;min-width:0}
        .news-concepts img{display:block;width:100%;height:auto;border:1px solid #6c5830}
        .news-concepts figcaption{padding:6px;color:#c9d6e0;font-size:10px;background:#101b25}
        .news-concept-note{color:#aabdc9;font-size:10px}

        .tag{
          display:inline-block;
          background:#6a0000;
          border:1px solid #c40000;
          color:#fff;
          font-size:9px;
          font-weight:bold;
          padding:2px 5px;
          margin-right:6px;
          text-transform:uppercase;
        }

        .mini-note{
          padding:8px;
          font-size:10px;
          line-height:1.45;
          color:#c8d8e8;
          border-bottom:1px solid #16324a;
        }

        .footer{
          margin-top:8px;
          height:26px;
          background:#0a1622;
          border:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:10px;
        }

        @media(max-width:768px){
          .layout.news-layout{
            width:100%;
            grid-template-columns:minmax(0,1fr);
          }
          .news-head{
            flex-wrap:wrap;
            gap:6px;
          }
          .news-title{overflow-wrap:anywhere;}
          .news-concepts{grid-template-columns:repeat(2,minmax(0,1fr))}
        }
      `}</style>

      <div className="wrapper">
        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Latest News & Community Updates</div>
          </div>
        </header>

        <div className="layout news-layout">
          <aside className="panel">
            <div className="panel-title">News Categories</div>
            {newsMenuCategories.map((category) => (
              <Link
                className="side-link"
                href={`/latest-news/${category.slug}`}
                key={category.slug}
              >
                {category.title}
              </Link>
            ))}
          </aside>

          <main className="panel">
            <div className="panel-title">Latest News</div>

            <div className="news-feed">
              <article className="news-post">
                <div className="news-head"><div className="news-title"><span className="tag">In Progress</span> 1v1 Rivals &amp; Creator Profiles</div><div className="news-date">November 22, 2026</div></div>
                <div className="news-body news-feature">
                  <p><b>Take it to 1v1.</b> Challenge a friend, settle a rivalry, and keep track of the results. We&apos;re putting more focus on making those head-to-head moments a bigger part of GameBattles.</p>
                  <p><Link href="/teams/create">Create a team and get started →</Link></p>
                  <p><b>Creators, make it yours.</b> Affiliates can personalize their profile&apos;s top section; Ambassadors can give the entire profile a new finish. Your existing layout and information stay in place. Here&apos;s a look at the creative direction we&apos;re exploring:</p>
                  <div className="news-concepts">
                    {[["gold", "Gold Elite"], ["ice", "Ice Commander"], ["red", "Inferno"], ["steel", "Legacy Steel"]].map(([image, label]) => <figure key={image}>
                      <Image src={`/news/creator-concepts/${image}.webp`} width={384} height={384} alt={`${label} creator profile concept`} />
                      <figcaption>{label}</figcaption>
                    </figure>)}
                  </div>
                  <p className="news-concept-note">Concept artwork with example information. The illustrated details are a preview of ideas being explored, not screenshots of finished profiles.</p>
                  <p><Link href="/profile/creator-style">Explore creator profile styles →</Link> · <Link href="/ambassadors">Learn about the creator program →</Link></p>
                </div>
              </article>
              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Community Update</span>
                    A More Connected GameBattles
                  </div>
                  <div className="news-date">November 5, 2026</div>
                </div>
                <div className="news-body">
                  Follow players and teams from their pages, with Following and
                  Followers counts on player profiles. The{" "}
                  <Link href="/activity">community activity feed</Link> brings match
                  results, team wins, awards, and other milestones together so you can
                  react and share the moments that matter.
                  <br /><br />
                  Free weekly Community Cups are scheduled for Saturdays at 8 PM
                  Eastern. Each winning player receives 5 credits and a winner award;
                  the monthly top team receives 25 credits and an award for each player.
                  New players can find active competitions and get started more easily
                  on mobile, while game art remains curated instead of automatically
                  rotating in unrelated storefront images. Visit the{" "}
                  <Link href="/tournaments">tournament hub</Link> to see available
                  events and the <Link href="/activity">activity feed</Link> to catch
                  up with the community.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Profile Update</span>
                    Simplified Profile Navigation
                  </div>
                  <div className="news-date">November 4, 2026</div>
                </div>
                <div className="news-body">
                  Removed the Ladders link from the navigation bar on player profiles
                  to keep profile navigation focused.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Profile Update</span>
                    Cleaner Player Profiles
                  </div>
                  <div className="news-date">November 4, 2026</div>
                </div>
                <div className="news-body">
                  Removed the extra Friends shortcut from the top of other players&apos;
                  profiles, keeping profile actions focused and easier to scan.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Just Updated</span>
                    Game-specific Ladders & Tournaments
                  </div>
                  <div className="news-date">November 4, 2026</div>
                </div>
                <div className="news-body">
                  Choose a game to see its relevant ladders and tournaments. Team pages
                  now link to competition pages for that team&apos;s game and platform, while
                  the <Link href="/ladders">ladders catalog</Link> and{" "}
                  <Link href="/tournaments">tournament hub</Link> let you browse across
                  GameBattles. When a game has no active tournaments, its page still
                  explains the status and links to all tournaments.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Account Update</span>
                    Email Confirmation & Account Privacy
                  </div>
                  <div className="news-date">November 4, 2026</div>
                </div>
                <div className="news-body">
                  New accounts must confirm their email before the welcome message is
                  sent. Email addresses are tied to accounts, and duplicate email
                  addresses and usernames are blocked. Phone contact is optional; SMS
                  verification is not currently available. Account information is used
                  to provide GameBattles services and is not intended for unrelated use.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Community</span>
                    GameBattles Forums
                  </div>
                  <div className="news-date">Now Open</div>
                </div>
                <div className="news-body">
                  Visit the <Link href="/forums">forums</Link> for site news, team
                  recruiting, general discussion, questions, suggestions, and community
                  clips. Keep an eye on the News & Updates section for announcements.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Now Available</span>
                    Founder Email Alerts for Feedback
                  </div>
                  <div className="news-date">November 4, 2026</div>
                </div>
                <div className="news-body">
                  Suggestions and bug reports now send an email alert to the site
                  founder so important player feedback can be reviewed.
                </div>
              </div>

              <div className="news-post" id="upcoming-updates">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Coming Up</span>
                    Upcoming GameBattles Improvements
                  </div>
                  <div className="news-date">In Progress</div>
                </div>
                <div className="news-body">
                  More site improvements are being worked on. Confirmed changes and
                  launch details will be posted here as they are ready.
                </div>
              </div>
            </div>
          </main>

          <aside className="panel">
            <div className="panel-title">Quick Notes</div>

            <div className="mini-note">
              <b>Newest updates</b><br />
              Explore 1v1 rivalries and preview upcoming creator profile looks.
            </div>

            <div className="mini-note">
              <b>Account setup</b><br />
              Confirm your email to activate your new account.
            </div>

            <div className="mini-note">
              <b>Browse ladders</b><br />
              <Link href="/ladders">Explore available games and platforms.</Link>
            </div>

            <div className="mini-note">
              <b>Tournaments</b><br />
              <Link href="/tournaments">See weekly cups and events across all games.</Link>
            </div>
          </aside>
        </div>

        <footer className="footer">
          © 2026 Competitive Gaming Network - News Center
        </footer>
      </div>
    </>
  );
}