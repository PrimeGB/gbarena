export default function ComingSoonPage() {
  return (
    <>
      <style>{`

        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }

        body{
          background:#02050a;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{
          text-decoration:none;
        }

        .page{
          min-height:100vh;
          background:
            radial-gradient(circle at top,#1b3f66 0%,#07111d 34%,#020407 72%,#000 100%);
          padding:12px;
        }

        .site-frame{
          max-width:1240px;
          margin:0 auto;
          border:1px solid #315375;
          background:#06101b;
          box-shadow:
            0 0 24px rgba(0,0,0,.9),
            inset 0 0 0 1px rgba(120,180,255,.08);
        }

        .top-strip{
          height:24px;
          background:linear-gradient(to bottom,#12375d,#071929);
          border-bottom:1px solid #000;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 12px;
          font-size:11px;
          color:#d8eaff;
          text-transform:uppercase;
          letter-spacing:.5px;
        }

        .top-strip span{
          color:#ffd35a;
          font-weight:bold;
        }

        .main-header{
          min-height:96px;
          background:
            linear-gradient(to bottom,#1b4b78 0%,#0a223a 48%,#06111f 100%);
          border-top:1px solid #3e78a8;
          border-bottom:1px solid #000;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:14px 20px;
        }

        .brand-wrap{
          display:flex;
          align-items:center;
          gap:14px;
        }

        .logo-mark{
          width:68px;
          height:68px;
          border-radius:50%;
          border:2px solid #6fa8da;
          background:
            radial-gradient(circle at 35% 25%,#315f8b,#07111c 70%);
          box-shadow:
            inset 0 0 12px rgba(126,184,255,.35),
            0 0 12px rgba(0,0,0,.7);
          position:relative;
        }

        .logo-mark:before{
          content:"";
          position:absolute;
          width:42px;
          height:24px;
          border-radius:18px;
          background:#d8eaff;
          left:12px;
          top:24px;
          box-shadow:0 2px 0 #06111f;
        }

        .logo-mark:after{
          content:"";
          position:absolute;
          width:7px;
          height:7px;
          border-radius:50%;
          background:#06111f;
          right:18px;
          top:31px;
          box-shadow:
            10px 0 0 #06111f,
            -22px 0 0 #06111f,
            -14px -5px 0 #06111f;
        }

        .brand-title{
          color:#fff;
          font-size:43px;
          font-weight:bold;
          line-height:.95;
          letter-spacing:-1px;
          text-shadow:
            2px 2px #000,
            0 0 10px rgba(126,184,255,.25);
        }

        .brand-sub{
          margin-top:7px;
          color:#ffd35a;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          letter-spacing:1.2px;
        }

        .launch-box{
          width:250px;
          border:1px solid #4778a5;
          background:linear-gradient(to bottom,#102f4e,#071625);
          padding:11px 12px;
          text-align:center;
          box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);
        }

        .launch-title{
          color:#ffd35a;
          font-size:13px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:5px;
        }

        .launch-sub{
          color:#d4e7f7;
          font-size:12px;
          line-height:1.5;
        }

        .nav-strip{
          height:34px;
          background:linear-gradient(to bottom,#0f3356,#061421);
          border-top:1px solid #244d72;
          border-bottom:1px solid #000;
          display:flex;
          align-items:center;
          padding:0 12px;
          gap:10px;
          color:#b9cde0;
          font-size:11px;
          text-transform:uppercase;
          font-weight:bold;
        }

        .nav-pill{
          border:1px solid #284e70;
          background:linear-gradient(to bottom,#163c61,#071a2c);
          padding:6px 10px;
          color:#dbeeff;
        }

        .hero{
          padding:18px;
          background:#050b13;
          border-top:1px solid #163b5f;
          border-bottom:1px solid #000;
        }

        .hero-grid{
          display:grid;
          grid-template-columns:1.55fr 1fr;
          gap:18px;
        }

        .panel{
          border:1px solid #315375;
          background:#081524;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.03),
            0 0 12px rgba(0,0,0,.45);
        }

        .panel-header{
          height:30px;
          background:linear-gradient(to bottom,#245f91,#0b2742);
          border-bottom:1px solid #000;
          display:flex;
          align-items:center;
          padding:0 10px;
          color:#fff;
          font-size:11px;
          font-weight:bold;
          text-transform:uppercase;
          letter-spacing:.4px;
          text-shadow:1px 1px #000;
        }

        .panel-header span{
          color:#ffd35a;
        }

        .video-wrap{
          background:#000;
          border-top:1px solid #163a5f;
        }

        .video-wrap video{
          width:100%;
          display:block;
          min-height:330px;
          object-fit:cover;
          background:#000;
        }

        .hype-content{
          padding:20px;
        }

        .hype-title{
          color:#fff;
          font-size:34px;
          font-weight:bold;
          text-transform:uppercase;
          line-height:1.05;
          margin-bottom:14px;
          text-shadow:2px 2px #000;
        }

        .hype-title span{
          color:#ffd35a;
        }

        .hype-text{
          color:#c9d8e6;
          font-size:14px;
          line-height:1.85;
          margin-bottom:18px;
        }

        .memory-list{
          border:1px solid #203f5c;
          background:#06101c;
          padding:12px;
          margin-bottom:16px;
        }

        .memory-row{
          color:#dcecff;
          font-size:13px;
          line-height:1.8;
          border-bottom:1px solid rgba(126,184,255,.12);
          padding:4px 0;
        }

        .memory-row:last-child{
          border-bottom:0;
        }

        .memory-row span{
          color:#ffd35a;
          font-weight:bold;
        }

        .discord-link{
          width:100%;
          min-height:50px;
          background:linear-gradient(to bottom,#ffd35a,#b87912);
          border:1px solid #ffdf79;
          color:#06101b;
          font-size:14px;
          font-weight:bold;
          text-transform:uppercase;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          box-shadow:0 2px 0 #3f2600;
        }

        .discord-link:hover{
          background:linear-gradient(to bottom,#ffe27e,#d89418);
        }

        .content{
          padding:18px;
          display:grid;
          grid-template-columns:1.7fr 1fr;
          gap:18px;
        }

        .left-column{
          display:flex;
          flex-direction:column;
          gap:18px;
        }

        .panel-body{
          padding:14px;
        }

        .shots{
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:12px;
        }

        .shot{
          border:1px solid #244765;
          background:#000;
          overflow:hidden;
          position:relative;
        }

        .shot img{
          width:100%;
          height:190px;
          object-fit:cover;
          display:block;
          opacity:.95;
        }

        .shot-label{
          position:absolute;
          left:0;
          bottom:0;
          width:100%;
          background:linear-gradient(to right,rgba(0,0,0,.9),rgba(5,19,34,.78));
          border-top:1px solid rgba(126,184,255,.28);
          color:#ffd35a;
          font-size:11px;
          font-weight:bold;
          text-transform:uppercase;
          padding:7px 9px;
        }

        .why{
          color:#d0dbe6;
          font-size:14px;
          line-height:1.9;
        }

        .why-title{
          color:#fff;
          font-size:24px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:12px;
          text-shadow:2px 2px #000;
        }

        .why-title span{
          color:#ffd35a;
        }

        .highlight{
          color:#ffd35a;
          font-weight:bold;
        }

        .sidebar{
          display:flex;
          flex-direction:column;
          gap:18px;
        }

        .update-box{
          border:1px solid #244765;
          background:linear-gradient(to bottom,#0a1c30,#06101c);
          padding:12px;
          margin-bottom:12px;
        }

        .update-box:last-child{
          margin-bottom:0;
        }

        .update-title{
          color:#ffd35a;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:8px;
        }

        .update-text{
          color:#c8d8e7;
          font-size:13px;
          line-height:1.75;
        }

        .mini-badge{
          display:inline-block;
          margin-top:8px;
          border:1px solid #765900;
          background:linear-gradient(to bottom,#ffd35a,#9c6a08);
          color:#07111f;
          font-size:10px;
          font-weight:bold;
          text-transform:uppercase;
          padding:4px 7px;
        }

        .disclaimer{
          margin:0 18px 18px;
          border:1px solid #2b4c69;
          background:#050c14;
          color:#8fa7bb;
          font-size:11px;
          line-height:1.7;
          padding:12px;
          text-align:center;
        }

        .disclaimer strong{
          color:#ffd35a;
        }

        .footer{
          min-height:44px;
          background:linear-gradient(to bottom,#0b2238,#040a11);
          border-top:1px solid #244765;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#d9e9f8;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          letter-spacing:.5px;
        }

        @media(max-width:950px){

          .hero-grid{
            grid-template-columns:1fr;
          }

          .content{
            grid-template-columns:1fr;
          }

          .shots{
            grid-template-columns:1fr;
          }

          .main-header{
            flex-direction:column;
            align-items:flex-start;
            gap:16px;
          }

          .launch-box{
            width:100%;
          }

          .brand-title{
            font-size:36px;
          }

          .hype-title{
            font-size:28px;
          }

          .nav-strip{
            height:auto;
            flex-wrap:wrap;
            padding:10px;
          }

        }

      `}</style>

      <div className="page">

        <div className="site-frame">

          <div className="top-strip">
            <div>
              <span>GB Arena</span> Beta Landing Page
            </div>

            <div>
              Old-School Competitive Gaming Returns
            </div>
          </div>

          <div className="main-header">

            <div className="brand-wrap">

              <div className="logo-mark" />

              <div>
                <div className="brand-title">
                  GameBattles
                </div>

                <div className="brand-sub">
                  Competitive gaming the way it used to feel
                </div>
              </div>

            </div>

            <div className="launch-box">

              <div className="launch-title">
                Launching Soon
              </div>

              <div className="launch-sub">
                Ladders. Teams. Profiles. Rivalries. Rankings.
              </div>

            </div>

          </div>

          <div className="nav-strip">
            <div className="nav-pill">Ladders Returning</div>
            <div className="nav-pill">Founder Badges</div>
            <div className="nav-pill">Beta Access</div>
            <div className="nav-pill">Discord Open</div>
          </div>

          <div className="hero">

            <div className="hero-grid">

              <div className="panel">

                <div className="panel-header">
                  <span>Teaser Trailer</span>&nbsp; / Competitive Gaming Is Coming Back
                </div>

                <div className="video-wrap">

                  <video autoPlay muted loop playsInline>
                    <source src="/videos/teaser.mp4" type="video/mp4" />
                  </video>

                </div>

              </div>

              <div className="panel">

                <div className="panel-header">
                  Coming Soon
                </div>

                <div className="hype-content">

                  <div className="hype-title">
                    The Old Days <span>Are Coming Back</span>
                  </div>

                  <div className="hype-text">
                    Remember when your rank actually mattered?
                    When ladders felt alive?
                    When teams had real names, real rivalries, and everyone knew who was on top?
                  </div>

                  <div className="memory-list">

                    <div className="memory-row">
                      <span>✓</span> Team ladders that actually mean something
                    </div>

                    <div className="memory-row">
                      <span>✓</span> Profiles, records, ranks, badges, and bragging rights
                    </div>

                    <div className="memory-row">
                      <span>✓</span> A community built around competition again
                    </div>

                    <div className="memory-row">
                      <span>✓</span> That old GameBattles feeling people still miss
                    </div>

                  </div>

                  <a
                    className="discord-link"
                    href="https://discord.gg/Ue4af2QVCc"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join The Official Discord
                  </a>

                </div>

              </div>

            </div>

          </div>

          <div className="content">

            <div className="left-column">

              <div className="panel">

                <div className="panel-header">
                  Early Screenshots
                </div>

                <div className="panel-body">

                  <div className="shots">

                    <div className="shot">
                      <img src="/home.jpeg" alt="GB Arena homepage preview" />
                      <div className="shot-label">Homepage Preview</div>
                    </div>

                    <div className="shot">
                      <img src="/profile.jpg" alt="GB Arena profile preview" />
                      <div className="shot-label">Player Profile Preview</div>
                    </div>

                    <div className="shot">
                      <img src="/matches.jpg" alt="GB Arena matches preview" />
                      <div className="shot-label">Match History Preview</div>
                    </div>

                    <div className="shot">
                      <img src="/teams.jpg" alt="GB Arena teams preview" />
                      <div className="shot-label">Teams Preview</div>
                    </div>

                  </div>

                </div>

              </div>

              <div className="panel">

                <div className="panel-header">
                  Why We Built This
                </div>

                <div className="panel-body">

                  <div className="why">

                    <div className="why-title">
                      We Miss The <span>Old Scene</span>
                    </div>

                    Competitive gaming used to feel different.
                    You checked the ladders. You knew the top teams.
                    You cared about your record. You remembered rivalries.
                    Your profile was your identity.
                    Your team name meant something.
                    Winning actually felt good.
                    Losing made you want a rematch.
                    <br /><br />

                    GB Arena is being built to bring that feeling back for the players
                    who still remember what online competition used to feel like.
                    <br /><br />

                    <span className="highlight">
                      Simple. Competitive. Community-driven. Built for the players who never forgot.
                    </span>

                  </div>

                </div>

              </div>

            </div>

            <div className="sidebar">

              <div className="panel">

                <div className="panel-header">
                  Community Updates
                </div>

                <div className="panel-body">

                  <div className="update-box">

                    <div className="update-title">
                      Founder Access
                    </div>

                    <div className="update-text">
                      Early supporters will be remembered. Founder members will receive
                      a profile badge showing they were here before launch.
                      <br />
                      <span className="mini-badge">Founder Badge Planned</span>
                    </div>

                  </div>

                  <div className="update-box">

                    <div className="update-title">
                      Beta Testing
                    </div>

                    <div className="update-text">
                      Select players will help test profiles, teams, ladders, matches,
                      and early site features before the full public launch.
                      <br />
                      <span className="mini-badge">Beta Badge Planned</span>
                    </div>

                  </div>

                  <div className="update-box">

                    <div className="update-title">
                      Ladders Coming Back
                    </div>

                    <div className="update-text">
                      The goal is to bring back that ladder grind feeling:
                      records, rankings, team pages, match finder, rivalries,
                      and real bragging rights.
                    </div>

                  </div>

                  <div className="update-box">

                    <div className="update-title">
                      Built With The Community
                    </div>

                    <div className="update-text">
                      Suggestions, feedback, and player ideas will help shape the
                      site as it grows. This is not meant to feel corporate.
                      It is meant to feel like home again.
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="disclaimer">
            <strong>Disclaimer:</strong> GB Arena is an independent community project.
            It is not affiliated with, endorsed by, or connected to GameBattles,
            Major League Gaming (MLG), Activision, Microsoft, Sony, Nintendo,
            or any previous owners of the GameBattles platform.
          </div>

          <div className="footer">
            Built By Competitive Gamers. For Competitive Gamers.
          </div>

        </div>

      </div>
    </>
  );
}