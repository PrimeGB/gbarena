export default function HistoryPage() {
  return (
    <>
      <style>{`
        body{
          background:#000;
          color:#d7e2ee;
          font-family:Tahoma, Verdana, Arial, sans-serif;
          margin:0;
        }

        .wrapper{
          width:1100px;
          margin:0 auto;
        }

        .top-strip{
          height:22px;
          background:linear-gradient(to bottom,#c40000,#6a0000);
          border-bottom:1px solid #140000;
          display:flex;
          align-items:center;
          padding:0 12px;
        }

        .top-strip a{
          color:#fff;
          font-size:10px;
          margin-right:14px;
          font-weight:bold;
          text-decoration:none;
        }

        .header{
          height:92px;
          background:#0a1622;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:2px solid #4f93d6;
          display:flex;
          align-items:center;
          padding:0 16px;
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
        }

        .page{
          margin-top:10px;
          background:#0a1622;
          border:1px solid #3b7fc2;
        }

        .page-title{
          height:28px;
          background:#0f2a40;
          border-bottom:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          padding-left:10px;
          color:#f2c14e;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .content{
          padding:20px;
          line-height:22px;
          font-size:12px;
        }

        .content h1{
          color:#7fc0ff;
          font-size:28px;
        }

        .content h2{
          color:#f2c14e;
          margin-top:20px;
        }

        .highlight{
          color:#f2c14e;
          font-weight:bold;
        }

        .warning-box{
          margin-top:25px;
          background:#07111b;
          border:1px solid #3b7fc2;
          padding:14px;
        }
      `}</style>

      <div className="top-strip">
        <a href="/">Home</a>
        <a href="/about">About Us</a>
      </div>

      <div className="wrapper">

        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">
              Where Gaming Finds Its Edge
            </div>
          </div>
        </header>

        <div className="page">

          <div className="page-title">
            History
          </div>

          <div className="content">

            <h1>The Road From Old-School Ladders to Today</h1>

            <p>
              Before ranked playlists and esports broadcasts became normal,
              online ladder websites gave competitive gamers a place to build teams,
              challenge rivals, climb rankings, and prove themselves.
            </p>

            <h2>The Original GameBattles Era</h2>

            <p>
              GameBattles became one of the most recognizable online competitive
              gaming platforms of the early 2000s. Players competed across games
              like Halo, Call of Duty, Gears of War, and many others.
            </p>

            <p>
              The platform later became associated with Major League Gaming (MLG),
              which was founded in 2002 and helped grow console esports through
              tournaments, ladders, and live events.
            </p>

            <p>
              Activision Blizzard acquired MLG in 2016. Years later, the original
              GameBattles platform officially shut down in January 2024.
            </p>

            <h2>The Current Project</h2>

            <p>
              This project is inspired by that old-school competitive gaming era.
              The goal is to create a fun community-driven place where players
              can compete, build teams, make friends, and bring back some of the
              excitement competitive gaming once had.
            </p>

            <p className="highlight">
              This website is still heavily in development and will continue
              changing as new systems and features are added.
            </p>

            <div className="warning-box">

              <p>
                <span className="highlight">
                  Important Disclaimer:
                </span>
              </p>

              <p>
                This website is NOT affiliated with, endorsed by, sponsored by,
                or connected to Major League Gaming (MLG), Activision, Microsoft,
                Sony, Nintendo, or any other company or brand referenced.
              </p>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}