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
          background:#050505;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{
          text-decoration:none;
        }

        .page{
          min-height:100vh;
          background:
            linear-gradient(to bottom,#1d1d1d 0%,#080808 160px,#000 100%);
          padding:12px;
        }

        .site-frame{
          max-width:1240px;
          margin:0 auto;
          border:1px solid #2c2c2c;
          background:#0a0a0a;
          box-shadow:0 0 18px rgba(0,0,0,.6);
        }

        .top-strip{
          height:24px;
          background:linear-gradient(to bottom,#5b5b5b,#2e2e2e);
          border-bottom:1px solid #111;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          padding:0 12px;
          font-size:11px;
          color:#d4dce5;
        }

        .main-header{
          min-height:86px;
          background:linear-gradient(to bottom,#343434,#181818);
          border-bottom:1px solid #000;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:14px 22px;
        }

        .branding{
          display:flex;
          flex-direction:column;
          justify-content:center;
        }

        .brand-title{
          color:#fff;
          font-size:42px;
          font-weight:bold;
          line-height:1;
          text-shadow:2px 2px #000;
          letter-spacing:-1px;
        }

        .brand-sub{
          color:#7eb8ff;
          font-size:12px;
          text-transform:uppercase;
          margin-top:8px;
          letter-spacing:1px;
        }

        .launch-box{
          text-align:right;
          margin-right:8px;
        }

        .launch-title{
          color:#7eb8ff;
          font-size:13px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:5px;
        }

        .launch-sub{
          color:#d4dde5;
          font-size:12px;
        }

        .hero{
          padding:18px;
          background:#090909;
          border-top:1px solid #2d2d2d;
          border-bottom:1px solid #1a1a1a;
        }

        .hero-grid{
          display:grid;
          grid-template-columns:2fr 1fr;
          gap:18px;
        }

        .video-panel{
          border:1px solid #2d2d2d;
          background:#000;
        }

        .panel-header{
          height:28px;
          background:linear-gradient(to bottom,#515151,#252525);
          border-bottom:1px solid #111;
          display:flex;
          align-items:center;
          padding:0 10px;
          color:#fff;
          font-size:11px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .video-wrap{
          background:#000;
        }

        .video-wrap video{
          width:100%;
          display:block;
        }

        .coming-panel{
          border:1px solid #2d2d2d;
          background:#101010;
        }

        .coming-content{
          padding:22px;
        }

        .coming-title{
          font-size:44px;
          color:#fff;
          font-weight:bold;
          text-transform:uppercase;
          line-height:1;
          margin-bottom:18px;
          text-shadow:2px 2px #000;
        }

        .coming-text{
          color:#c7d1da;
          font-size:14px;
          line-height:1.9;
          margin-bottom:24px;
        }

        .discord-link{
          width:100%;
          height:48px;
          background:linear-gradient(to bottom,#4f8fe0,#275fa5);
          border:1px solid #163c68;
          color:#fff;
          font-size:13px;
          font-weight:bold;
          text-transform:uppercase;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
        }

        .discord-link:hover{
          background:linear-gradient(to bottom,#63a5fa,#3476c6);
        }

        .content{
          padding:18px;
          display:grid;
          grid-template-columns:2fr 1fr;
          gap:18px;
        }

        .left-column{
          display:flex;
          flex-direction:column;
          gap:18px;
        }

        .panel{
          border:1px solid #2d2d2d;
          background:#101010;
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
          border:1px solid #242424;
          background:#000;
          overflow:hidden;
        }

        .shot img{
          width:100%;
          height:190px;
          object-fit:cover;
          display:block;
        }

        .why{
          color:#d0d8e0;
          font-size:14px;
          line-height:1.9;
        }

        .highlight{
          color:#7eb8ff;
          font-weight:bold;
        }

        .sidebar{
          display:flex;
          flex-direction:column;
          gap:18px;
        }

        .update-box{
          border:1px solid #272727;
          background:#151515;
          padding:12px;
        }

        .update-title{
          color:#7eb8ff;
          font-size:11px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:8px;
        }

        .update-text{
          color:#c8d2db;
          font-size:13px;
          line-height:1.8;
        }

        .footer{
          height:42px;
          background:linear-gradient(to bottom,#1d1d1d,#090909);
          border-top:1px solid #000;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#76828d;
          font-size:11px;
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

          .coming-title{
            font-size:36px;
          }

          .main-header{
            flex-direction:column;
            align-items:flex-start;
            gap:18px;
          }

        }

      `}</style>

      <div className="page">

        <div className="site-frame">

          <div className="top-strip">
            Competitive Gaming Is Coming Back
          </div>

          <div className="main-header">

            <div className="branding">

              <div className="brand-title">
                GameBattles
              </div>

              <div className="brand-sub">
                The old-school scene returns
              </div>

            </div>

            <div className="launch-box">

              <div className="launch-title">
                Launching Soon
              </div>

              <div className="launch-sub">
                Real ladders. Real rivalries.
              </div>

            </div>

          </div>

          <div className="hero">

            <div className="hero-grid">

              <div className="video-panel">

                <div className="panel-header">
                  Competitive Gaming Is Coming Back
                </div>

                <div className="video-wrap">

                  <video autoPlay muted loop playsInline>
                    <source src="/videos/teaser.mp4" type="video/mp4" />
                  </video>

                </div>

              </div>

              <div className="coming-panel">

                <div className="panel-header">
                  Coming Soon
                </div>

                <div className="coming-content">

                  <div className="coming-title">
                    COMING<br />SOON
                  </div>

                  <div className="coming-text">

                    Competitive gaming the way it used to feel.<br /><br />

                    Join the Discord community now to stay updated,
                    follow development progress, and be among the
                    first players eligible to secure rare profile
                    names when the platform officially launches.

                  </div>

                  <a
                    className="discord-link"
                    href="https://discord.gg/Ue4af2QVCc"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Official Discord
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
                      <img src="/home.jpeg" alt="home" />
                    </div>

                    <div className="shot">
                      <img src="/profile.jpg" alt="profile" />
                    </div>

                    <div className="shot">
                      <img src="/matches.jpg" alt="matches" />
                    </div>

                    <div className="shot">
                      <img src="/teams.jpg" alt="teams" />
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

                    Competitive gaming used to feel different.<br /><br />

                    Rivalries mattered.<br />
                    Communities mattered.<br />
                    Your name meant something.<br /><br />

                    We’re building that feeling again.<br /><br />

                    <span className="highlight">
                      Simple. Competitive. Community-driven.
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

                      Early members will receive an exclusive
                      founder badge on their profile recognizing
                      they were part of the return of old-school
                      competitive gaming.

                    </div>

                  </div>

                  <div style={{height:"12px"}} />

                  <div className="update-box">

                    <div className="update-title">
                      Beta Testing
                    </div>

                    <div className="update-text">

                      A select few players will receive early
                      access to create profiles, test features,
                      and help shape the platform before launch.<br /><br />

                      Beta testers will also receive a special
                      badge displayed on their profiles.

                    </div>

                  </div>

                  <div style={{height:"12px"}} />

                  <div className="update-box">

                    <div className="update-title">
                      Built For Competitors
                    </div>

                    <div className="update-text">

                      Focused on rivalry, progression,
                      community identity, and bringing back
                      the competitive gaming atmosphere many
                      players grew up with.

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="footer">
            Built by competitive gamers.
          </div>

        </div>

      </div>
    </>
  );
}