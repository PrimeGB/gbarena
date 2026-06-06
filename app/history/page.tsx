export default function HistoryPage() {
  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}

        body{
          background:#000;
          color:#d7e2ee;
          font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        a{text-decoration:none;}

        .page-bg{
          min-height:100vh;
          background:
            radial-gradient(circle at top,rgba(45,100,150,.28),transparent 42%),
            linear-gradient(to bottom,#02060a,#000);
          padding:32px 22px;
        }

        .wrapper{
          width:1100px;
          max-width:100%;
          margin:0 auto;
          background:#07111b;
          border:1px solid #315f88;
          box-shadow:0 0 28px rgba(0,80,140,.38), inset 0 0 22px rgba(0,0,0,.72);
        }

        .top-strip{
          height:30px;
          background:linear-gradient(to bottom,#8b0000,#3b0000);
          border-bottom:1px solid #b32222;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          gap:18px;
          padding:0 14px;
        }

        .top-strip a{
          color:#fff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .header{
          min-height:104px;
          background:
            linear-gradient(to right,rgba(0,0,0,.55),rgba(0,0,0,.08)),
            linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 24px;
        }

        .logo-main{
          color:#fff;
          font-size:34px;
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
        }

        .logo-sub{
          color:#f2c14e;
          font-size:12px;
          font-weight:900;
          letter-spacing:2px;
          text-transform:uppercase;
          margin-top:6px;
        }

        .header-badge{
          border:1px solid #6ba8d6;
          background:linear-gradient(to bottom,#214765,#0b1c2d);
          color:#f5f8ff;
          font-size:15px;
          font-weight:900;
          text-transform:uppercase;
          padding:14px 22px;
          text-shadow:0 2px 4px #000;
        }

        .page-title{
          background:linear-gradient(to bottom,#1d496e,#0a1724);
          border-bottom:1px solid #315f88;
          padding:18px 24px;
          text-align:center;
        }

        .page-title h1{
          color:#d7ad4a;
          font-size:30px;
          text-transform:uppercase;
          text-shadow:0 1px 2px #000;
        }

        .page-title p{
          margin-top:8px;
          color:#cfe2f2;
          font-size:13px;
          line-height:20px;
        }

        .content{
          padding:18px;
        }

        .main-panel{
          background:#050b12;
          border:1px solid #244b70;
          box-shadow:inset 0 0 18px rgba(0,0,0,.75);
        }

        .panel-header{
          min-height:36px;
          background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:1px;
        }

        .panel-body{
          padding:18px;
        }

        .story-block{
          border:1px solid #1f3d5a;
          background:linear-gradient(to bottom,#091724,#06101a);
          padding:18px;
          margin-bottom:14px;
        }

        .story-block h2{
          color:#f2c14e;
          font-size:18px;
          margin-bottom:10px;
          text-transform:uppercase;
        }

        .story-block p{
          color:#d7e2ee;
          font-size:13px;
          line-height:22px;
          margin-bottom:10px;
        }

        .story-block p:last-child{
          margin-bottom:0;
        }

        .highlight{
          color:#f2c14e;
          font-weight:900;
        }

        .quote-box{
          border:1px solid #315f88;
          background:#02070c;
          color:#fff;
          padding:16px;
          font-size:15px;
          font-weight:900;
          line-height:24px;
          text-align:center;
          text-transform:uppercase;
          margin-bottom:14px;
          box-shadow:inset 0 0 16px rgba(0,0,0,.7);
        }

        .warning-box{
          border:1px solid #7c1e1e;
          background:linear-gradient(to bottom,#2a0808,#100303);
          color:#ffd1d1;
          font-size:12px;
          line-height:20px;
          padding:14px;
          margin-top:14px;
        }

        .warning-box strong{
          color:#ff7777;
          text-transform:uppercase;
        }

        .footer{
          height:36px;
          background:#07111b;
          border-top:1px solid #244b70;
          display:flex;
          justify-content:center;
          align-items:center;
          color:#a9c3db;
          font-size:11px;
        }

        @media(max-width:850px){
          .header{
            flex-direction:column;
            justify-content:center;
            gap:12px;
            padding:18px;
            text-align:center;
          }

          .page-title h1{
            font-size:24px;
          }
        }
      `}</style>

      <main className="page-bg">
        <div className="wrapper">
          <div className="top-strip">
            <a href="/home">Home</a>
            <a href="/about">About Us</a>
            <a href="/rules">Rules</a>
            <a href="/support">Support</a>
          </div>

          <header className="header">
            <div>
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">Where Gaming Finds Its Edge</div>
            </div>

            <div className="header-badge">History</div>
          </header>

          <section className="page-title">
            <h1>The History of Competitive Ladders</h1>
            <p>
              From old-school clan wars and ladder matches to the golden era of
              online competition — this is the spirit GB Arena is bringing back.
            </p>
          </section>

          <section className="content">
            <section className="main-panel">
              <div className="panel-header">The Story</div>

              <div className="panel-body">
                <div className="quote-box">
                  Before ranked playlists felt automatic, players had to earn
                  their reputation one challenge at a time.
                </div>

                <div className="story-block">
                  <h2>The Early Days</h2>

                  <p>
                    In the early 2000s, competitive gaming was built by players,
                    not giant automated systems. Teams were formed through forums,
                    clan websites, message boards, friends lists, and word of
                    mouth. If you wanted a real match, you had to find another
                    team, agree on rules, show up on time, play it out, and prove
                    the result.
                  </p>

                  <p>
                    Games like <span className="highlight">Halo</span>,{" "}
                    <span className="highlight">SOCOM</span>,{" "}
                    <span className="highlight">Call of Duty</span>,{" "}
                    <span className="highlight">Gears of War</span>, and{" "}
                    <span className="highlight">Rainbow Six</span> helped create
                    a new kind of online rivalry. Winning was not just about one
                    lobby. It was about your team name, your clan tag, your record,
                    and where you stood on the ladder.
                  </p>

                  <p>
                    Before modern esports broadcasts, creator contracts, battle
                    passes, and ranked playlists, the competitive scene was raw.
                    You played because you wanted to prove your squad was better.
                    That simple feeling is what made the era special.
                  </p>
                </div>

                <div className="story-block">
                  <h2>The Rise of GameBattles</h2>

                  <p>
                    GameBattles became one of the most recognizable homes for
                    online ladder competition. Players created teams, joined
                    ladders, challenged rivals, reported scores, disputed bad
                    matches, climbed rankings, and built reputations that actually
                    mattered inside the community.
                  </p>

                  <p>
                    The site became closely tied to the{" "}
                    <span className="highlight">Major League Gaming</span> era,
                    where online ladders and live tournaments helped push console
                    esports into the spotlight. For many players, GameBattles was
                    the first place where gaming felt organized, competitive, and
                    meaningful.
                  </p>

                  <p>
                    It gave regular players a way to feel like they were part of
                    something bigger. You did not need to be famous. You needed a
                    team, a record, a good rank, and the confidence to accept the
                    next challenge.
                  </p>
                </div>

                <div className="story-block">
                  <h2>The Golden Era</h2>

                  <p>
                    For many players, logging into GameBattles after school or
                    work was part of the routine. You checked your team page,
                    searched for matches, watched the rankings, argued in forums,
                    accepted challenges, and waited for that next big win.
                  </p>

                  <p>
                    It was not just about matchmaking. It was about identity.
                    Your team name, clan tag, roster, record, rank, and match
                    history all told a story. Rival teams remembered you. Forum
                    posts had energy. A win over a higher-ranked team could make
                    your night.
                  </p>

                  <p>
                    Some players cared more about their ladder rank than public
                    matchmaking rank. Some teams stayed together for years. Some
                    rivalries were built from a single disputed match. That was
                    the magic of the old-school ladder scene — every match felt
                    like it counted.
                  </p>
                </div>

                <div className="story-block">
                  <h2>What Changed</h2>

                  <p>
                    Competitive gaming today is bigger than ever, but it does not
                    always feel better. A lot of modern gaming feels like it has
                    turned into a <span className="highlight">pay-to-play</span>{" "}
                    or pay-to-keep-up system. Battle passes, bundles, cosmetics,
                    yearly releases, locked content, and endless store updates
                    can make the game feel more focused on spending than competing.
                  </p>

                  <p>
                    Ranked modes are faster and easier to access, but they often
                    feel anonymous. You load in, play strangers, gain or lose a
                    number, and move on. The team identity, the rivalries, the
                    forums, the match pages, and the community pressure that made
                    old-school competition feel personal are mostly gone.
                  </p>

                  <p>
                    The old ladder era was not perfect, but it gave players
                    ownership. Your team page mattered. Your record mattered.
                    Your name mattered. That is the part worth bringing back.
                  </p>
                </div>

                <div className="story-block">
                  <h2>Bringing It Full Circle</h2>

                  <p>
                    <span className="highlight">GB Arena</span> is inspired by
                    that golden era of competitive gaming. The goal is not to
                    copy the past exactly, but to rebuild the feeling that made
                    it special: teams, ladders, rivalries, rankings, match finder,
                    disputes, records, and community-driven competition.
                  </p>

                  <p>
                    We want players to feel like they are part of a real scene
                    again. A place where creating a team means something. Where
                    climbing the ladder feels rewarding. Where winning a match
                    changes your standing. Where your history follows you.
                  </p>

                  <p>
                    Modern gaming gave players convenience. GB Arena aims to bring
                    back the edge, the pride, and the community competition that
                    made the old days unforgettable.
                  </p>
                </div>

                <div className="quote-box">
                  Built by the community. For the community. Competitive gaming
                  the way it used to feel.
                </div>

                <div className="warning-box">
                  <p>
                    <strong>Important Disclaimer:</strong>
                  </p>
                  <br />
                  <p>
                    This website is NOT affiliated with, endorsed by, sponsored
                    by, or connected to Major League Gaming (MLG), Activision,
                    Microsoft, Sony, Nintendo, or any other company or brand
                    referenced.
                  </p>
                </div>
              </div>
            </section>
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}