export default function AboutPage() {
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
          font-family:Tahoma, Verdana, Arial, sans-serif;
          color:#d7e2ee;
        }

        a{
          text-decoration:none;
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

        .logo-area{
          display:flex;
          align-items:center;
          gap:10px;
        }

        .controller-mark{
          width:68px;
          height:40px;
          background:linear-gradient(to bottom,#1b4c78,#07111b);
          border:1px solid #6aa9e8;
          border-radius:22px;
          position:relative;
        }

        .controller-mark:before{
          content:"+";
          position:absolute;
          left:12px;
          top:8px;
          color:#f2c14e;
          font-size:18px;
          font-weight:bold;
        }

        .controller-mark:after{
          content:"● ●";
          position:absolute;
          right:10px;
          top:12px;
          color:#f2c14e;
          font-size:12px;
        }

        .logo-main{
          font-size:30px;
          font-weight:bold;
          color:#eaf5ff;
          line-height:1;
        }

        .logo-sub{
          color:#f2c14e;
          font-size:10px;
          text-transform:uppercase;
          margin-top:5px;
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
          color:#d7eaff;
        }

        .content h1{
          color:#7fc0ff;
          font-size:28px;
          margin-bottom:18px;
        }

        .content p{
          margin-bottom:18px;
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
          line-height:20px;
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
        <a href="/">Home</a>
        <a href="/forums">Forums</a>
        <a href="/support">Support</a>
      </div>

      <div className="wrapper">

        <header className="header">

          <div className="logo-area">
            <div className="controller-mark"></div>

            <div>
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">
                Where Gaming Finds Its Edge
              </div>
            </div>
          </div>

        </header>

        <div className="page">

          <div className="page-title">
            About Us
          </div>

          <div className="content">

            <h1>The Golden Era Never Left Us</h1>

            <p>
              Like many gamers who grew up during the early days of online
              competitive gaming, we spent countless nights talking about what
              made that era special. The rivalries, the ladders, the clan
              battles, the late-night matches, and the excitement of proving
              yourself against real competition created memories that lasted
              forever.
            </p>

            <p>
              This project started with three friends talking about how gaming
              once felt different. Back then, every match mattered. Building a
              team meant something. Meeting people online turned into real
              friendships and unforgettable moments. Competitive gaming had an
              energy that was hard to explain unless you lived through it.
            </p>

            <p>
              Over time, we realized that many players missed that feeling too.
              Modern gaming became bigger, faster, and more commercial, but
              somewhere along the way the community feeling began to disappear.
              We wanted to try bringing some of that atmosphere back while also
              creating a place where both old-school and new-school players
              could compete together.
            </p>

            <p>
              Our goal is simple:
            </p>

            <p className="highlight">
              Create a fun, competitive community that captures the thrill,
              intensity, and excitement that competitive gaming once gave so
              many people during its prime.
            </p>

            <p>
              This site is being built from the ground up and is currently a
              work in progress. Many sections, pages, systems, ladders, forums,
              rankings, and features will continue changing and evolving over
              time as we improve the experience and listen to community
              feedback.
            </p>

            <p>
              We want this platform to become a place where players can create
              teams, compete seriously, make friends, relive old memories, and
              create entirely new ones.
            </p>

            <div className="warning-box">

              <p>
                <span className="highlight">Important Disclaimer:</span>
              </p>

              <p>
                This website is an independent community project and is NOT
                affiliated with, endorsed by, sponsored by, or connected to
                Major League Gaming (MLG), Activision, Call of Duty, Microsoft,
                Sony, Nintendo, or any other company or brand referenced by the
                community.
              </p>

              <p>
                Any references to the "golden era" of gaming are purely for
                nostalgic and community discussion purposes. This project exists
                only to celebrate competitive gaming culture and build a fun
                community-driven platform for players.
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