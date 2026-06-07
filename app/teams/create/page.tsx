"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function cleanName(value: string | null) {
  if (!value) return "Team";

  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const gameNames: Record<string, string> = {
  "modern-warfare-4": "Call of Duty: Modern Warfare 4",
  "black-ops-6": "Call of Duty: Black Ops 6",
  "modern-warfare-iii": "Call of Duty: Modern Warfare III",
  warzone: "Call of Duty: Warzone",
  "modern-warfare-ii": "Call of Duty: Modern Warfare II",
  vanguard: "Call of Duty: Vanguard",
  "black-ops-cold-war": "Call of Duty: Black Ops Cold War",
};

export default function CreateTeamPage() {
  return (
    <Suspense fallback={<div className="create-team-loading">Loading Create Team...</div>}>
      <CreateTeamContent />
    </Suspense>
  );
}

function CreateTeamContent() {
  const searchParams = useSearchParams();

  const gameSlug = searchParams.get("game") || "modern-warfare-4";
  const ladderSlug = searchParams.get("ladder") || "team";

  const gameName = gameNames[gameSlug] || "Call of Duty: Modern Warfare 4";
  const ladderName = cleanName(ladderSlug);

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}

        .create-team-loading{
          min-height:100vh;
          background:#000;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        .page{
          min-height:100vh;
          background:radial-gradient(circle at top,rgba(20,80,130,.36),transparent 42%),#000;
          padding:40px 24px;
        }

        .wrap{
          max-width:900px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #2f6f9f;
          box-shadow:0 0 35px rgba(0,90,160,.5);
        }

        .top-strip{
          height:30px;
          background:linear-gradient(to bottom,#9a0000,#3a0000);
          border-bottom:1px solid #b10000;
          display:flex;
          justify-content:flex-end;
          align-items:center;
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
          min-height:96px;
          background:linear-gradient(to bottom,#15324b,#07111b);
          border-bottom:2px solid #2f6f9f;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 24px;
        }

        .logo-main{
          color:#f4f8ff;
          font-size:42px;
          font-weight:bold;
          font-style:italic;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
        }

        .logo-sub{
          color:#67bdff;
          font-size:12px;
          font-weight:bold;
          letter-spacing:3px;
          text-transform:uppercase;
          margin-top:7px;
        }

        .badge{
          color:#f2c14e;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#205077,#0a1724);
          padding:12px 18px;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
        }

        .title-bar{
          background:linear-gradient(to bottom,#205077,#0a1724);
          border-bottom:1px solid #2f638f;
          padding:24px;
        }

        .title-bar h1{
          color:#f2c14e;
          font-size:30px;
          text-transform:uppercase;
          margin-bottom:8px;
        }

        .title-bar p{
          color:#cfe2f2;
          font-size:14px;
        }

        .content{
          padding:24px;
        }

        .panel{
          background:#050c14;
          border:1px solid #244b70;
          padding:24px;
        }

        .label{
          color:#f2c14e;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:8px;
        }

        .input{
          width:100%;
          height:46px;
          background:#07111b;
          border:1px solid #244b70;
          color:#fff;
          padding:0 12px;
          font-size:15px;
          margin-bottom:18px;
        }

        .btn-row{
          display:flex;
          gap:12px;
          margin-top:8px;
        }

        .btn{
          min-width:170px;
          height:48px;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#205077,#0a1724);
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
        }

        .btn.gold{
          background:linear-gradient(to bottom,#f2c14e,#93670d);
          color:#06111b;
          border-color:#ffe08a;
        }

        .btn.red{
          background:linear-gradient(to bottom,#d60000,#700000);
          border-color:#ff4b4b;
        }

        .footer{
          height:36px;
          background:#07111b;
          border-top:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:11px;
        }
      `}</style>

      <main className="page">
        <div className="wrap">
          <div className="top-strip">
            <a href="/home">Home</a>
            <a href="/profile">My Profile</a>
            <a href="/forums">Forums</a>
          </div>

          <header className="header">
            <div>
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">Create Team</div>
            </div>

            <div className="badge">{ladderName} Ladder</div>
          </header>

          <section className="title-bar">
            <h1>Create Team</h1>
            <p>
              {gameName} · {ladderName} Ladder
            </p>
          </section>

          <section className="content">
            <div className="panel">
              <div className="label">Team Name</div>
              <input className="input" placeholder="Enter your team name" />

              <div className="label">Team Tag</div>
              <input className="input" placeholder="Example: GB" maxLength={5} />

              <div className="btn-row">
                <a className="btn gold" href="/profile/teams">
                  Create Team
                </a>

                <a
                  className="btn red"
                  href={`/team-hub?game=${gameSlug}&ladder=${ladderSlug}`}
                >
                  Back
                </a>
              </div>
            </div>
          </section>

          <footer className="footer">
            © 2026 Competitive Gaming Network
          </footer>
        </div>
      </main>
    </>
  );
}