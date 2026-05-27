export default function SupportPage() {
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
        .support-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}
        .support-box{background:#07111b;border:1px solid #3b7fc2;}
        .support-box-title{height:24px;background:#0f2a40;border-bottom:1px solid #3b7fc2;color:#f2c14e;font-size:10px;font-weight:bold;text-transform:uppercase;display:flex;align-items:center;padding-left:8px;}
        .support-box-body{padding:10px;}
        .support-box-body ul{margin-left:18px;}
        .support-box-body li{margin-bottom:7px;}
        .highlight{color:#f2c14e;font-weight:bold;}
        .notice-box{margin-top:18px;background:#07111b;border:1px solid #3b7fc2;padding:14px;line-height:20px;}
        .fake-button{display:inline-block;margin-top:8px;background:linear-gradient(to bottom,#c40000,#6a0000);border:1px solid #ff4d4d;color:#fff;font-size:11px;font-weight:bold;padding:8px 12px;text-transform:uppercase;}
        .footer{margin-top:8px;height:26px;background:#0a1622;border:1px solid #3b7fc2;display:flex;align-items:center;justify-content:center;color:#a9c3db;font-size:10px;}
      `}</style>

      <div className="top-strip">
        <a href="/">Home</a>
        <a href="/about">About Us</a>
        <a href="/test">History</a>
        <a href="/rules">Rules</a>
      </div>

      <div className="wrapper">
        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Where Gaming Finds Its Edge</div>
          </div>
        </header>

        <div className="page">
          <div className="page-title">Support Center</div>

          <div className="content">
            <h1>How Can We Help?</h1>

            <p>
              This support page is being built as the main help center for players, teams, ladders, tournaments, disputes, account issues, and community questions.
            </p>

            <p className="highlight">
              Contact methods are not active yet. No emails, staff names, or social links are being listed until the site is ready.
            </p>

            <div className="support-grid">
              <div className="support-box">
                <div className="support-box-title">Account Help</div>
                <div className="support-box-body">
                  <ul>
                    <li>Login problems</li>
                    <li>Profile setup</li>
                    <li>Username questions</li>
                    <li>Linked gaming accounts</li>
                    <li>Account security</li>
                  </ul>
                </div>
              </div>

              <div className="support-box">
                <div className="support-box-title">Match Disputes</div>
                <div className="support-box-body">
                  <ul>
                    <li>Wrong score reported</li>
                    <li>No-show disputes</li>
                    <li>Opponent left early</li>
                    <li>Missing proof</li>
                    <li>Match rule questions</li>
                  </ul>
                </div>
              </div>

              <div className="support-box">
                <div className="support-box-title">Cheating Reports</div>
                <div className="support-box-body">
                  <ul>
                    <li>Hacking or cheating claims</li>
                    <li>Boosting reports</li>
                    <li>Account sharing reports</li>
                    <li>Suspicious match behavior</li>
                    <li>Video or screenshot proof</li>
                  </ul>
                </div>
              </div>

              <div className="support-box">
                <div className="support-box-title">Teams & Rosters</div>
                <div className="support-box-body">
                  <ul>
                    <li>Create a team</li>
                    <li>Join a team</li>
                    <li>Leave a team</li>
                    <li>Roster eligibility</li>
                    <li>Team ownership issues</li>
                  </ul>
                </div>
              </div>

              <div className="support-box">
                <div className="support-box-title">Tournaments</div>
                <div className="support-box-body">
                  <ul>
                    <li>Bracket questions</li>
                    <li>Check-in issues</li>
                    <li>Late matches</li>
                    <li>Tournament rules</li>
                    <li>Prize questions for future events</li>
                  </ul>
                </div>
              </div>

              <div className="support-box">
                <div className="support-box-title">Technical Issues</div>
                <div className="support-box-body">
                  <ul>
                    <li>Pages not loading</li>
                    <li>Broken links</li>
                    <li>Profile display bugs</li>
                    <li>Mobile layout problems</li>
                    <li>Feature bugs during development</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="notice-box">
              <h2>Before Requesting Support</h2>
              <p>
                When support tickets become active, players should include clear details such as username, team name, ladder, game, platform, match date, opponent, score, screenshots, videos, and a short explanation of the issue.
              </p>

              <p>
                For disputes, proof will matter. Clear screenshots, match results, scoreboard images, messages, and video clips will help staff review problems faster.
              </p>

              <span className="fake-button">Support Ticket System Coming Soon</span>
            </div>

            <div className="notice-box">
              <h2>Current Status</h2>
              <p>
                The support system is not live yet. This page is here so players understand what types of help will be available once the site becomes active.
              </p>

              <p className="highlight">
                No official support emails, staff names, Discord links, or social media contacts are listed yet.
              </p>
            </div>

            <div className="notice-box">
              <h2>Important Disclaimer</h2>
              <p>
                This website is an independent community project and is NOT affiliated with, endorsed by, sponsored by, or connected to Major League Gaming (MLG), Activision, Microsoft, Sony, Nintendo, Call of Duty, Halo, or any other company, game, publisher, or brand referenced by the community.
              </p>
            </div>
          </div>
        </div>

        <footer className="footer">
          © 2026 Competitive Gaming Network
        </footer>
      </div>
    </>
  );
}