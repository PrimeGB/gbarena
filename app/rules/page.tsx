export default function RulesPage() {
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
        .content ul{margin-left:22px;margin-bottom:16px;}
        .content li{margin-bottom:8px;}
        .highlight{color:#f2c14e;font-weight:bold;}
        .warning-box{margin-top:25px;background:#07111b;border:1px solid #3b7fc2;padding:14px;line-height:20px;}
        .footer{margin-top:8px;height:26px;background:#0a1622;border:1px solid #3b7fc2;display:flex;align-items:center;justify-content:center;color:#a9c3db;font-size:10px;}
      `}</style>

      <div className="top-strip">
        <a href="/">Home</a>
        <a href="/about">About Us</a>
        <a href="/test">History</a>
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
          <div className="page-title">Rules</div>

          <div className="content">
            <h1>Community & Match Rules</h1>

            <p>
              These rules are here to keep matches fair, protect players, and help build a competitive community that feels active, fun, and respected.
            </p>

            <h2>1. General Conduct</h2>
            <ul>
              <li>Respect all players, teams, admins, and community members.</li>
              <li>No harassment, hate speech, threats, racism, sexism, or targeted abuse.</li>
              <li>No impersonating staff, players, teams, or official companies.</li>
              <li>Trash talk is allowed only if it stays within fair competitive banter.</li>
            </ul>

            <h2>2. Accounts</h2>
            <ul>
              <li>Account selling, buying, trading, or transferring is not allowed.</li>
              <li>Account sharing is not allowed.</li>
              <li>Players may not use another player’s account in matches.</li>
              <li>Ban evasion, alternate accounts to avoid penalties, and fake accounts are not allowed.</li>
            </ul>

            <h2>3. Cheating, Hacking & Exploits</h2>
            <ul>
              <li>Cheating, hacking, scripts, modded hardware/software, wallhacks, aimbots, macros, lag switching, or game manipulation are strictly banned.</li>
              <li>Using known exploits, glitches, or unintended mechanics to gain an unfair advantage is not allowed.</li>
              <li>Players caught cheating may be removed from matches, ladders, tournaments, and the platform.</li>
            </ul>

            <h2>4. Boosting & Rank Manipulation</h2>
            <ul>
              <li>Boosting is not allowed.</li>
              <li>Players may not intentionally lose, throw matches, manipulate standings, or play on another account to increase rank.</li>
              <li>Teams may not arrange fake wins, free wins, or staged matches.</li>
            </ul>

            <h2>5. Match Rules</h2>
            <ul>
              <li>Teams must play matches with the correct players listed on their roster.</li>
              <li>Players must follow the rules for the specific game, ladder, tournament, map, mode, and settings.</li>
              <li>Matches should be played fully unless both sides clearly agree to cancel or reschedule.</li>
              <li>Disputes must include clear proof such as screenshots, video, scoreboard, match ID, or messages.</li>
            </ul>

            <h2>6. Proof & Disputes</h2>
            <ul>
              <li>Proof must clearly show scores, players, teams, and match results.</li>
              <li>Fake, edited, cropped, or misleading proof may result in penalties.</li>
              <li>Admins may make final decisions when rules do not cover a situation directly.</li>
            </ul>

            <h2>7. Teams & Rosters</h2>
            <ul>
              <li>Only eligible rostered players may compete in official matches.</li>
              <li>Team names, player names, logos, and bios must follow community standards.</li>
              <li>Teams may not use offensive names, stolen branding, impersonation, or misleading identity.</li>
            </ul>

            <h2>8. Tournaments</h2>
            <ul>
              <li>Tournament-specific rules may override general rules.</li>
              <li>No-shows, late arrivals, wrong settings, or ineligible players may result in forfeits.</li>
              <li>Prize-related events may have stricter identity, proof, and eligibility requirements.</li>
            </ul>

            <h2>9. Admin Decisions</h2>
            <ul>
              <li>Admins may review evidence, reverse match reports, issue forfeits, remove players, suspend accounts, or update rules as needed.</li>
              <li>Attempts to lie to admins, hide evidence, pressure opponents, or abuse the dispute system may result in penalties.</li>
            </ul>

            <h2>10. Work In Progress</h2>
            <p className="highlight">
              These rules will change as the site grows. More detailed game-specific rules, ladder rules, tournament rules, and team rules will be added over time.
            </p>

            <div className="warning-box">
              <p><span className="highlight">Important Disclaimer:</span></p>
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