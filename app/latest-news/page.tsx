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

        .top-strip{
          height:22px;
          background:linear-gradient(to bottom,#c40000,#6a0000);
          border-bottom:1px solid #140000;
          color:#fff;
          font-size:10px;
          display:flex;
          align-items:center;
          padding:0 12px;
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

        .nav{
          height:32px;
          background:#0a1622;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          padding:0 10px;
          gap:14px;
        }

        .nav a{
          font-size:10px;
          color:#e3f1ff;
          text-transform:uppercase;
        }

        .nav a:hover{
          color:#f2c14e;
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
      `}</style>

      <div className="top-strip">
        GameBattles News Center - Latest Updates, Ladders, Tournaments, Suggestions
      </div>

      <div className="wrapper">
        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Latest News & Community Updates</div>
          </div>
        </header>

        <nav className="nav">
          <a href="/">Home</a>
          <a href="/forums">Forums</a>
          <a href="/members">Members</a>
          <a href="/profile">Profile</a>
          <a href="/rules">Rules</a>
          <a href="/support">Support</a>
        </nav>

        <div className="layout">
          <aside className="panel">
            <div className="panel-title">News Categories</div>
            <a className="side-link" href="#">Latest Updates</a>
            <a className="side-link" href="#">Upcoming Updates</a>
            <a className="side-link" href="#">Accepted Suggestions</a>
            <a className="side-link" href="#">New Ladders</a>
            <a className="side-link" href="#">Tournaments</a>
            <a className="side-link" href="#">Top Clips</a>
            <a className="side-link" href="#">Rule Changes</a>
          </aside>

          <main className="panel">
            <div className="panel-title">Latest News</div>

            <div className="news-feed">
              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Update</span>
                    Forum System Being Built
                  </div>
                  <div className="news-date">Newest</div>
                </div>
                <div className="news-body">
                  Forum sections are being organized for News and Updates, Teams,
                  General Info, Top Clips, and community discussion. Posts should stay
                  sorted with newest posts first, while active posts with lots of replies
                  stay near the top.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Coming Soon</span>
                    New Ladders
                  </div>
                  <div className="news-date">Planned</div>
                </div>
                <div className="news-body">
                  New competitive ladders are planned for PlayStation, Xbox, Nintendo,
                  and PC. Each ladder will eventually support team rankings, match
                  records, wins, losses, and rank points.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Tournament</span>
                    Tournament Hub
                  </div>
                  <div className="news-date">Upcoming</div>
                </div>
                <div className="news-body">
                  A tournament area is planned so players can see upcoming events,
                  weekly cups, open brackets, featured games, and tournament rule updates.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Suggestion</span>
                    Top Clips Section Approved
                  </div>
                  <div className="news-date">Accepted</div>
                </div>
                <div className="news-body">
                  The Top Clips section is being added. Players will be able to submit
                  clips for review. Approved clips can be featured for everyone to see.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Safety</span>
                    Posting Cooldown
                  </div>
                  <div className="news-date">Planned</div>
                </div>
                <div className="news-body">
                  A five minute cooldown between posts is planned to stop spam and keep
                  the forums clean. This will help protect the old-school community feel.
                </div>
              </div>

              <div className="news-post">
                <div className="news-head">
                  <div className="news-title">
                    <span className="tag">Community</span>
                    What Players Should Watch For
                  </div>
                  <div className="news-date">Info</div>
                </div>
                <div className="news-body">
                  Players should watch this page for site updates, ladder launches,
                  tournament dates, accepted suggestions, rule changes, featured clips,
                  staff notes, and major community announcements.
                </div>
              </div>
            </div>
          </main>

          <aside className="panel">
            <div className="panel-title">Quick Notes</div>

            <div className="mini-note">
              <b>Newest updates</b><br />
              Site changes and new features will be posted here first.
            </div>

            <div className="mini-note">
              <b>Suggestions we liked</b><br />
              Good player ideas can be listed here before being added.
            </div>

            <div className="mini-note">
              <b>Upcoming ladders</b><br />
              New games, platforms, and ladders can be announced here.
            </div>

            <div className="mini-note">
              <b>Tournaments</b><br />
              Future cups, brackets, and special events can be shown here.
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