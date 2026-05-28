import AuthNav from "../components/AuthNav";

export default function Home() {
  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}

        html,body{
          width:100%;
          height:100%;
          background:#000;
          overflow:hidden;
          font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        a{text-decoration:none;}

        .page{
          width:100vw;
          height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#000;
        }

        .homepage{
          position:relative;
          aspect-ratio:1535 / 1024;
          width:min(100vw, calc(100vh * 1.499));
          height:min(100vh, calc(100vw / 1.499));
          overflow:hidden;
          background:
            linear-gradient(to bottom,rgba(6,20,35,.08),rgba(5,18,32,.14)),
            url("/homepage.png");
          background-size:100% 100%;
          background-position:center;
          background-repeat:no-repeat;
          filter:brightness(1.13) contrast(1.05) saturate(1.08);
        }

        .dark-blue-blend{
          position:absolute;
          inset:0;
          z-index:20;
          pointer-events:none;
          background:
            linear-gradient(to bottom,rgba(0,12,25,.08),rgba(0,8,18,.12));
          mix-blend-mode:multiply;
        }

        .controller-overlay{
          position:absolute;
          left:3.15%;
          top:7.95%;
          width:9.9%;
          height:13.9%;
          z-index:35;
          pointer-events:none;
          display:flex;
          align-items:center;
          justify-content:center;
          filter:
            drop-shadow(2px 3px 3px rgba(0,0,0,.75))
            drop-shadow(0 0 5px rgba(255,255,255,.25))
            drop-shadow(0 0 8px rgba(0,130,220,.35));
        }

        .controller-overlay svg{
          width:100%;
          height:100%;
          transform:rotate(-2deg);
        }

        .real-top-bar{
          position:absolute;
          left:0;
          top:0;
          width:100%;
          height:4.7%;
          z-index:80;
          background:linear-gradient(to bottom,#9a0000,#3a0000);
          border-bottom:1px solid #b10000;
          overflow:hidden;
        }

        .auth-holder{
          position:absolute;
          right:6.6%;
          top:0;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          white-space:nowrap;
        }

        .auth-holder *{
          line-height:1 !important;
        }

        .auth-holder .top-right-group{
          margin:0 !important;
          height:100%;
          display:flex !important;
          align-items:center !important;
          gap:7px !important;
          white-space:nowrap !important;
        }

        .auth-holder .top-btn{
          color:#fff !important;
          font-size:clamp(9px,.82vw,13px) !important;
          font-weight:900 !important;
          padding:0 3px !important;
          display:inline-flex !important;
          align-items:center !important;
          height:100% !important;
          white-space:nowrap !important;
          text-shadow:0 1px 2px #000 !important;
        }

        .auth-holder .top-sep{
          color:#bde9ff !important;
          font-size:clamp(9px,.82vw,13px) !important;
          display:inline-flex !important;
          align-items:center !important;
          height:100% !important;
          text-shadow:0 1px 2px #000 !important;
        }

        .top-help{
          position:absolute;
          right:.35%;
          top:0;
          height:100%;
          width:5.6%;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .top-help a{
          color:#fff;
          font-size:clamp(8px,.68vw,11px);
          font-weight:900;
          line-height:1;
          white-space:nowrap;
          text-shadow:0 1px 2px #000;
        }

        .footer-cover{
          position:absolute;
          left:1.05%;
          bottom:.7%;
          width:97.9%;
          height:4.45%;
          z-index:45;
          background:linear-gradient(to bottom,#063456,#041421);
          border:1px solid #006bad;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#e8f8ff;
          font-weight:700;
          text-shadow:0 1px 2px #000;
          font-size:clamp(10px,.95vw,16px);
        }
      `}</style>

      <main className="page">
        <div className="homepage">
          <div className="dark-blue-blend"></div>

          <div className="real-top-bar">
            <div className="auth-holder">
              <AuthNav />
            </div>

            <div className="top-help">
              <a href="/support">Help</a>
            </div>
          </div>

          <footer className="footer-cover">
            © 2026 Competitive Gaming Network
          </footer>
        </div>
      </main>
    </>
  );
}