export default function SupportPage() {
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
          width:950px;
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

        .title-bar{
          background:linear-gradient(to bottom,#1d496e,#0a1724);
          border-bottom:1px solid #315f88;
          padding:18px 24px;
          text-align:center;
        }

        .title-bar h1{
          color:#d7ad4a;
          font-size:30px;
          text-transform:uppercase;
          text-shadow:0 1px 2px #000;
        }

        .title-bar p{
          margin-top:8px;
          color:#cfe2f2;
          font-size:13px;
          line-height:20px;
        }

        .content{
          padding:18px;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:14px;
        }

        .panel{
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
          padding:16px;
          color:#d7e2ee;
          font-size:13px;
          line-height:22px;
        }

        .panel-body p{
          margin-bottom:12px;
        }

        .highlight{
          color:#f2c14e;
          font-weight:900;
        }

        .button{
          height:42px;
          width:100%;
          margin-top:12px;
          border:1px solid #e8c46a;
          background:linear-gradient(to bottom,#d6a943,#7b560e);
          color:#07111b;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
        }

        .button.blue{
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
        }

        .button.red{
          border:1px solid #e34242;
          background:linear-gradient(to bottom,#bd1717,#5c0000);
          color:#fff;
        }

        .button:hover{
          filter:brightness(1.12);
        }

        .full{
          grid-column:1 / -1;
        }

        .warning{
          border:1px solid #7c1e1e;
          background:linear-gradient(to bottom,#2a0808,#100303);
          color:#ffd1d1;
          font-size:12px;
          line-height:20px;
          padding:14px;
        }

        .warning strong{
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

        @media(max-width:800px){
          .content{grid-template-columns:1fr;}

          .full{grid-column:auto;}

          .header{
            flex-direction:column;
            justify-content:center;
            gap:12px;
            padding:18px;
            text-align:center;
          }
        }
      `}</style>

      <main className="page-bg">
        <div className="wrapper">
          <div className="top-strip">
            <a href="/home">Home</a>
            <a href="/contact">Contact</a>
            <a href="/suggestions">Suggestions</a>
          </div>

          <header className="header">
            <div>
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">Support Center</div>
            </div>

            <div className="header-badge">Support</div>
          </header>

          <section className="title-bar">
            <h1>Support Center</h1>
            <p>
              Use this page when you need help with your account, the website,
              match issues, score problems, or something that needs staff attention.
            </p>
          </section>

          <section className="content">
            <section className="panel">
              <div className="panel-header">Account Help</div>
              <div className="panel-body">
                <p>
                  Use this for login issues, profile problems, linked accounts,
                  usernames, missing information, or anything related to your GB
                  Arena account.
                </p>

                <a className="button blue" href="/support/account">
                  Account Support
                </a>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">Match Help</div>
              <div className="panel-body">
                <p>
                  Use this for match problems, score issues, no-shows, proof,
                  or anything that needs staff help after a match is created.
                </p>

                <a className="button" href="/support/matches">
                  Match Support
                </a>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">Bug Reports</div>
              <div className="panel-body">
                <p>
                  If something on the website is broken, loading wrong, not saving,
                  or showing the wrong information, report it here or use the
                  Suggestions Box.
                </p>

                <a className="button blue" href="/suggestions">
                  Report Bug
                </a>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">Disputes</div>
              <div className="panel-body">
                <p>
                  Disputes are for official match problems only. Do not use general
                  contact messages to avoid the dispute system.
                </p>

                <a className="button red" href="/support/dispute-ticket">
  Submit Dispute Ticket
</a>
              </div>
            </section>

            <div className="warning full">
              <p>
                <strong>Important:</strong> Support is for real help requests.
                Do not spam staff, abuse tickets, fake reports, or use support to
                harass other players. Misusing support can lead to warnings,
                restrictions, or account consequences.
              </p>
            </div>
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}