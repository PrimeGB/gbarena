export default function GettingStartedPage() {
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
        .steps{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}
        .step-box{background:#07111b;border:1px solid #3b7fc2;}
        .step-title{height:24px;background:#0f2a40;border-bottom:1px solid #3b7fc2;color:#f2c14e;font-size:10px;font-weight:bold;text-transform:uppercase;display:flex;align-items:center;padding-left:8px;}
        .step-body{padding:10px;}
        .step-body ul{margin-left:18px;}
        .step-body li{margin-bottom:7px;}
        .highlight{color:#f2c14e;font-weight:bold;}
        .notice-box{margin-top:18px;background:#07111b;border:1px solid #3b7fc2;padding:14px;line-height:20px;}
        .footer{margin-top:8px;height:26px;background:#0a1622;border:1px solid #3b7fc2;display:flex;align-items:center;justify-content:center;color:#a9c3db;font-size:10px;}
      `}</style>

      <div className="top-strip">
        <a href="/">Home</a>
        <a href="/general-info">General Info</a>
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
          <div className="page-title">Getting Started</div>

          <div className="content">
            <h1>How To Get Started</h1>

            <p>
              This page explains the basic path for new players: create an account, confirm your email, set up your profile, find a ladder, create or join a team, read the rules, and start competing.
            </p>

            <p className="highlight">
              The site is still being built, so some features may not be active yet. This page shows the planned player flow.
            </p>

            <div className="steps">
              <div className="step-box">
                <div className="step-title">Step 1 — Sign Up</div>
                <div className="step-body">
                  <ul>
                    <li>Click Join or Sign Up.</li>
                    <li>Use a real email address.</li>
                    <li>Create your account login.</li>
                    <li>Confirm your email when prompted.</li>
                  </ul>
                </div>
              </div>

              <div className="step-box">
                <div className="step-title">Step 2 — Build Your Profile</div>
                <div className="step-body">
                  <ul>
                    <li>Choose your username.</li>
                    <li>Visit your profile page.</li>
                    <li>Add linked accounts when available.</li>
                    <li>Set your favorite games and player info later.</li>
                  </ul>
                </div>
              </div>

              <div className="step-box">
                <div className="step-title">Step 3 — Pick A Platform</div>
                <div className="step-body">
                  <ul>
                    <li>Use the top menu to choose PlayStation, Xbox, Nintendo, or PC.</li>
                    <li>Select the game you want to compete in.</li>
                    <li>Each game will lead to its own ladder page.</li>
                    <li>Check standings, rules, and team options.</li>
                  </ul>
                </div>
              </div>

              <div className="step-box">
                <div className="step-title">Step 4 — Join Or Create A Team</div>
                <div className="step-body">
                  <ul>
                    <li>Create your own team if you want to lead.</li>
                    <li>Join an existing team if invited.</li>
                    <li>Make sure your roster is correct before matches.</li>
                    <li>Team records and rankings will matter.</li>
                  </ul>
                </div>
              </div>

              <div className="step-box">
                <div className="step-title">Step 5 — Read The Rules</div>
                <div className="step-body">
                  <ul>
                    <li>Read the site rules before competing.</li>
                    <li>Check game-specific rules before each match.</li>
                    <li>Make sure match settings are correct.</li>
                    <li>Know what proof is required for disputes.</li>
                  </ul>
                </div>
              </div>

              <div className="step-box">
                <div className="step-title">Step 6 — Play Matches</div>
                <div className="step-body">
                  <ul>
                    <li>Use ladder pages to find opponents.</li>
                    <li>Accept or create matches when available.</li>
                    <li>Play the full match under the listed rules.</li>
                    <li>Report results honestly after the match.</li>
                  </ul>
                </div>
              </div>

              <div className="step-box">
                <div className="step-title">Step 7 — Keep Proof</div>
                <div className="step-body">
                  <ul>
                    <li>Save screenshots of final scores.</li>
                    <li>Use video proof when possible.</li>
                    <li>Keep messages if a dispute happens.</li>
                    <li>Clear proof helps admins make fair decisions.</li>
                  </ul>
                </div>
              </div>

              <div className="step-box">
                <div className="step-title">Step 8 — Use The Community</div>
                <div className="step-body">
                  <ul>
                    <li>Visit the forums for updates.</li>
                    <li>Recruit players for teams.</li>
                    <li>Ask questions and give feedback.</li>
                    <li>Help shape the site as it grows.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="notice-box">
              <h2>Where To Find Things</h2>
              <p>
                Use the top navigation to find ladders by platform and game. Use the About section for background, General Info for how the site works, Rules for competition rules, Support for help topics, and Forums for community updates once they are active.
              </p>
            </div>

            <div className="notice-box">
              <h2>Built For The Old-School Standard</h2>
              <p>
                The goal is to bring back the simple competitive flow that made old ladder sites fun: create a team, join a ladder, challenge opponents, report scores, climb rankings, and build a name in the community.
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