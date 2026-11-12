import Link from "next/link";
import CompactTopBar from "../components/CompactTopBar";
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
          width:1240px;
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
          grid-template-columns:240px 1fr 260px;
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
        }
      `}</style>

      <div className="wrapper">
        <CompactTopBar />
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
                    Owner Email Alerts for Feedback
                  </div>
                  <div className="news-date">November 4, 2026</div>
                </div>
                <div className="news-body">
                  Suggestions and bug reports now send an email alert to the site
                  owner so important player feedback can be reviewed.
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
              Follow players and teams, catch community moments, and find free weekly cups.
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