export default function GeneralInfoPage() {
  return (
    <>
      <style>{`
        body{margin:0;background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        a{text-decoration:none;}
        .wrapper{width:1100px;margin:0 auto;}
        .top-strip{height:22px;background:linear-gradient(to bottom,#c40000,#6a0000);border-bottom:1px solid #140000;display:flex;align-items:center;padding:0 12px;}
        .top-strip a{color:#fff;font-size:10px;margin-right:14px;font-weight:bold;}
        .header{height:92px;background:#0a1622;border-left:1px solid #3b7fc2;border-right:1px solid #3b7fc2;border-bottom:2px solid #4f93d6;display:flex;align-items:center;padding:0 16px;}
        .logo-main{font-size:30px;font-weight:bold;color:#eaf5ff;line-height:1;}
        .logo-sub{color:#f2c14e;font-size:10px;text-transform:uppercase;margin-top:5px;}
        .page{margin-top:10px;background:#0a1622;border:1px solid #3b7fc2;}
        .page-title{height:28px;background:#0f2a40;border-bottom:1px solid #3b7fc2;display:flex;align-items:center;padding-left:10px;color:#f2c14e;font-size:12px;font-weight:bold;text-transform:uppercase;}
        .content{padding:20px;line-height:22px;font-size:12px;color:#d7eaff;}
        .content h1{color:#7fc0ff;font-size:28px;margin-bottom:18px;}
        .content h2{color:#f2c14e;font-size:15px;margin-top:20px;margin-bottom:8px;}
        .content p{margin-bottom:14px;}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}
        .info-box{background:#07111b;border:1px solid #3b7fc2;}
        .info-box-title{height:24px;background:#0f2a40;border-bottom:1px solid #3b7fc2;color:#f2c14e;font-size:10px;font-weight:bold;text-transform:uppercase;display:flex;align-items:center;padding-left:8px;}
        .info-box-body{padding:10px;}
        .highlight{color:#f2c14e;font-weight:bold;}
        .footer{margin-top:8px;height:26px;background:#0a1622;border:1px solid #3b7fc2;display:flex;align-items:center;justify-content:center;color:#a9c3db;font-size:10px;}
      `}</style>

      <div className="top-strip">
        <a href="/">Home</a>
        <a href="/about">About Us</a>
        <a href="/test">History</a>
        <a href="/rules">Rules</a>
        <a href="/support">Support</a>
      </div>

      <div className="wrapper">
        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Where Gaming Finds Its Edge</div>
          </div>
        </header>

        <div className="page">
          <div className="page-title">General Info</div>

          <div className="content">
            <h1>Welcome to the Arena</h1>

            <p>
              This site is inspired by the old-school competitive ladder era, when players built teams,
              challenged rivals, climbed rankings, and spent hours competing for pride. The goal is to
              bring back that feeling in a modern community-built way.
            </p>

            <p>
              We are building a place for players to compete, create teams, join ladders, play matches,
              follow rankings, use forums, and connect with other competitive gamers.
            </p>

            <div className="info-grid">
              <div className="info-box">
                <div className="info-box-title">Ladder Rank</div>
                <div className="info-box-body">
                  Players and teams will compete on ladders. Winning matches helps you move up.
                  Losing matches can lower your standing.
                </div>
              </div>

              <div className="info-box">
                <div className="info-box-title">Team Rank</div>
                <div className="info-box-body">
                  Teams will have records, standings, and rankings based on their match results.
                  Strong teams will climb toward the top.
                </div>
              </div>

              <div className="info-box">
                <div className="info-box-title">Personal Rank</div>
                <div className="info-box-body">
                  Players will build their own profile reputation, record, and rank history as they
                  compete across games and teams.
                </div>
              </div>

              <div className="info-box">
                <div className="info-box-title">Earn & Lose Rank</div>
                <div className="info-box-body">
                  Wins should matter. Losses should matter too. The goal is to make every match feel
                  competitive and worth playing.
                </div>
              </div>
            </div>

            <h2>Community Features</h2>

            <p>
              Forums will be used for updates, community posts, team recruitment, match discussion,
              support information, and future announcements.
            </p>

            <h2>What We Are Trying To Build</h2>

            <p className="highlight">
              We are trying to build an active, fun, competitive gaming community that feels like the
              golden era of online competition while still growing into something new.
            </p>

            <p>
              The site is still a work in progress. Pages, ladders, ranks, forums, teams, tournaments,
              profiles, and rules will continue changing as the platform is built out.
            </p>
          </div>
        </div>

        <footer className="footer">
          © 2026 Competitive Gaming Network
        </footer>
      </div>
    </>
  );
}