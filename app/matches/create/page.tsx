"use client";

import { useState } from "react";

export default function CreateMatchPage() {
  const [gameMode, setGameMode] = useState("Search and Destroy");
  const [players, setPlayers] = useState("4v4");
  const [matchTime, setMatchTime] = useState("8:00 PM");
  const [bestOf, setBestOf] = useState("Best of 3");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [preset, setPreset] = useState("GB Default");
  const [perks, setPerks] = useState("On");
  const [launchers, setLaunchers] = useState("Off");
  const [killstreaks, setKillstreaks] = useState("Off");
  const [fieldUpgrades, setFieldUpgrades] = useState("On");
  const [hardcore, setHardcore] = useState("Off");
  const [friendlyFire, setFriendlyFire] = useState("On");
  const [radar, setRadar] = useState("Normal");
  const [spectating, setSpectating] = useState("Team Only");
  const [thirdPerson, setThirdPerson] = useState("Off");
  const [roundLength, setRoundLength] = useState("1.5 Minutes");
  const [scoreLimit, setScoreLimit] = useState("Default");
  const [health, setHealth] = useState("Normal");
  const [respawnDelay, setRespawnDelay] = useState("None");
  const [bombTimer, setBombTimer] = useState("45 Seconds");
  const [plantTime, setPlantTime] = useState("5 Seconds");
  const [defuseTime, setDefuseTime] = useState("7.5 Seconds");
  const [attachments, setAttachments] = useState("On");

  const timeSlots = [
    "12:00 AM", "12:15 AM", "12:30 AM", "12:45 AM",
    "1:00 AM", "1:15 AM", "1:30 AM", "1:45 AM",
    "2:00 AM", "2:15 AM", "2:30 AM", "2:45 AM",
    "3:00 AM", "3:15 AM", "3:30 AM", "3:45 AM",
    "4:00 AM", "4:15 AM", "4:30 AM", "4:45 AM",
    "5:00 AM", "5:15 AM", "5:30 AM", "5:45 AM",
    "6:00 AM", "6:15 AM", "6:30 AM", "6:45 AM",
    "7:00 AM", "7:15 AM", "7:30 AM", "7:45 AM",
    "8:00 AM", "8:15 AM", "8:30 AM", "8:45 AM",
    "9:00 AM", "9:15 AM", "9:30 AM", "9:45 AM",
    "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
    "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
    "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
    "1:00 PM", "1:15 PM", "1:30 PM", "1:45 PM",
    "2:00 PM", "2:15 PM", "2:30 PM", "2:45 PM",
    "3:00 PM", "3:15 PM", "3:30 PM", "3:45 PM",
    "4:00 PM", "4:15 PM", "4:30 PM", "4:45 PM",
    "5:00 PM", "5:15 PM", "5:30 PM", "5:45 PM",
    "6:00 PM", "6:15 PM", "6:30 PM", "6:45 PM",
    "7:00 PM", "7:15 PM", "7:30 PM", "7:45 PM",
    "8:00 PM", "8:15 PM", "8:30 PM", "8:45 PM",
    "9:00 PM", "9:15 PM", "9:30 PM", "9:45 PM",
    "10:00 PM", "10:15 PM", "10:30 PM", "10:45 PM",
    "11:00 PM", "11:15 PM", "11:30 PM", "11:45 PM",
  ];

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{text-decoration:none;}

        .page{
          min-height:100vh;
          background:
            radial-gradient(circle at top,rgba(45,100,150,.22),transparent 42%),
            linear-gradient(to bottom,#02060a,#000);
          padding:32px 22px;
        }

        .wrap{
          max-width:1080px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #315f88;
          box-shadow:0 0 28px rgba(0,80,140,.35), inset 0 0 22px rgba(0,0,0,.7);
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
          background:linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 24px;
        }

        .game-header{
          display:flex;
          align-items:center;
          gap:18px;
        }

        .game-cover{
          width:126px;
          height:78px;
          border:1px solid #315f88;
          background:#050c14;
          overflow:hidden;
        }

        .game-cover img{
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:center;
          display:block;
        }

        .game-name{
          color:#f2c14e;
          font-size:15px;
          font-weight:900;
          letter-spacing:1.3px;
          text-transform:uppercase;
          margin-bottom:8px;
          text-shadow:0 1px 2px #000;
        }

        .ladder-name{
          color:#fff;
          font-size:30px;
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
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

        .nav{
          height:36px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:28px;
        }

        .nav a{
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .nav a:hover{color:#d7ad4a;}

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

        .content{padding:22px;}

        .old-grid{
          display:grid;
          grid-template-columns:240px 1fr;
          gap:18px;
        }

        .side-panel,.main-panel{
          background:#050b12;
          border:1px solid #244b70;
          box-shadow:inset 0 0 18px rgba(0,0,0,.75);
        }

        .panel-header{
          min-height:38px;
          background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          padding:0 14px;
          color:#d7ad4a;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:1.2px;
        }

        .side-body{padding:14px;}

        .steps-box{
          border:1px solid #1f3d5a;
          background:linear-gradient(to bottom,#091724,#06101a);
          padding:14px;
          margin-bottom:14px;
        }

        .steps-title{
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          margin-bottom:12px;
          border-bottom:1px solid rgba(255,255,255,.09);
          padding-bottom:8px;
        }

        .step-line{
          color:#cfe2f2;
          font-size:12px;
          line-height:22px;
          padding:3px 0;
          border-bottom:1px solid rgba(255,255,255,.04);
        }

        .step-line:last-child{border-bottom:none;}

        .step-arrow{
          color:#d7ad4a;
          font-weight:bold;
          margin-right:6px;
        }

        .match-info{
          border:1px solid #244b70;
          background:#081522;
          padding:12px;
        }

        .match-info div{
          color:#cfe2f2;
          font-size:12px;
          line-height:23px;
          border-bottom:1px solid rgba(255,255,255,.055);
        }

        .match-info div:last-child{border-bottom:none;}

        .main-body{padding:18px;}

        .form-section{
          border:1px solid #244b70;
          background:#07111b;
          margin-bottom:15px;
          box-shadow:inset 0 0 14px rgba(0,0,0,.35);
        }

        .form-title{
          height:33px;
          display:flex;
          align-items:center;
          padding:0 12px;
          background:linear-gradient(to bottom,#112b42,#07111b);
          border-bottom:1px solid #244b70;
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:.4px;
        }

        .form-body{padding:15px;}

        .row{
          display:grid;
          grid-template-columns:145px 1fr;
          gap:12px;
          align-items:center;
          margin-bottom:12px;
        }

        .row:last-child{margin-bottom:0;}

        .date-time-box{
          border:1px solid #315b7d;
          background:#02070c;
          padding:12px;
          display:grid;
          grid-template-columns:130px 180px;
          gap:12px;
          align-items:center;
          max-width:340px;
        }

        .locked-day{
          height:38px;
          border:1px solid #244b70;
          background:#07111b;
          color:#d7ad4a;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
        }

        label{
          color:#cfe2f2;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        input,select,textarea{
          width:100%;
          border:1px solid #315b7d;
          background:#02070c;
          color:#fff;
          font-size:13px;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          padding:9px 10px;
          outline:none;
        }

        input:focus,select:focus,textarea:focus{
          border-color:#6ba8d6;
          box-shadow:0 0 8px rgba(103,189,255,.28);
        }

        select{cursor:pointer;}

        .mode-select{max-width:310px;}
        .small-select{max-width:160px;}
        .time-select{max-width:170px;}

        .best-of-scroll{
          width:170px;
          height:78px;
          overflow-y:auto;
          border:1px solid #315b7d;
          background:#02070c;
        }

        .best-of-option{
          width:100%;
          height:26px;
          border:0;
          border-bottom:1px solid rgba(255,255,255,.07);
          background:#02070c;
          color:#cfe2f2;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
          text-align:left;
          padding-left:10px;
        }

        .best-of-option:hover,.best-of-option.active{
          background:#10283d;
          color:#d7ad4a;
        }

        .settings-summary{
          border:1px solid #315b7d;
          background:#02070c;
          padding:14px;
          display:grid;
          grid-template-columns:1fr auto;
          gap:14px;
          align-items:center;
        }

        .settings-title{
          color:#fff;
          font-size:14px;
          font-weight:900;
          text-transform:uppercase;
          margin-bottom:5px;
        }

        .settings-copy{
          color:#8aa7c0;
          font-size:12px;
          line-height:18px;
        }

        .settings-button{
          min-width:150px;
          height:38px;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .settings-button:hover{
          color:#d7ad4a;
          border-color:#d7ad4a;
        }

        .rules-box{
          border:1px solid #315b7d;
          background:#02070c;
          padding:13px;
          color:#cfe2f2;
          font-size:12px;
          line-height:22px;
        }

        .small-note{
          color:#8aa7c0;
          font-size:11px;
          line-height:18px;
          margin-top:8px;
        }

        .actions{
          display:flex;
          flex-wrap:wrap;
          gap:12px;
          margin-top:16px;
        }

        .action-btn{
          min-width:180px;
          height:44px;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:1px;
          text-shadow:0 1px 2px #000;
          cursor:pointer;
        }

        .action-btn.gold{
          background:linear-gradient(to bottom,#d6a943,#7b560e);
          border-color:#e8c46a;
          color:#07111b;
          text-shadow:none;
        }

        .action-btn.red{
          background:linear-gradient(to bottom,#bd1717,#5c0000);
          border-color:#e34242;
        }

        .action-btn:hover{filter:brightness(1.13);}

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

        .modal-backdrop{
          position:fixed;
          inset:0;
          background:rgba(0,0,0,.74);
          z-index:100;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:20px;
        }

        .settings-modal{
          width:760px;
          max-width:96vw;
          max-height:90vh;
          overflow:auto;
          border:1px solid #315f88;
          background:#050b12;
          box-shadow:0 0 30px rgba(0,80,140,.55);
        }

        .modal-title{
          height:38px;
          background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;
          color:#d7ad4a;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 12px;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
        }

        .modal-close{
          width:24px;
          height:24px;
          border:1px solid #315f88;
          background:#000;
          color:#fff;
          font-weight:900;
          cursor:pointer;
        }

        .modal-body{padding:15px;}

        .settings-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
        }

        .setting-row{
          display:grid;
          grid-template-columns:145px 1fr;
          gap:10px;
          align-items:center;
          border:1px solid #1f3d5a;
          background:#07111b;
          padding:10px;
        }

        .modal-actions{
          display:flex;
          justify-content:flex-end;
          gap:10px;
          margin-top:15px;
        }

        @media(max-width:850px){
          .old-grid{grid-template-columns:1fr;}
          .row,.settings-grid,.setting-row,.date-time-box{
            grid-template-columns:1fr;
            gap:8px;
          }

          .header{
            flex-direction:column;
            justify-content:center;
            gap:12px;
            padding:18px;
            text-align:center;
          }

          .nav{
            flex-wrap:wrap;
            height:auto;
            padding:10px;
            gap:14px;
          }

          .settings-summary{
            grid-template-columns:1fr;
          }
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
            <div className="game-header">
              <div className="game-cover">
                <img src="/mw4.jpeg" alt="Call of Duty: Modern Warfare 4" />
              </div>

              <div>
                <div className="game-name">Call of Duty: Modern Warfare 4</div>
                <div className="ladder-name">Team Ladder</div>
              </div>
            </div>

            <div className="header-badge">Create Match</div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/profile/teams">My Teams</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
          </nav>

          <section className="title-bar">
            <h1>Create Match</h1>
          </section>

          <section className="content">
            <div className="old-grid">
              <aside className="side-panel">
                <div className="panel-header">Match Setup</div>

                <div className="side-body">
                  <div className="steps-box">
                    <div className="steps-title">Create Match Steps</div>
                    <div className="step-line"><span className="step-arrow">►</span>Select Game Mode</div>
                    <div className="step-line"><span className="step-arrow">►</span>Choose Player Count</div>
                    <div className="step-line"><span className="step-arrow">►</span>Pick Match Time</div>
                    <div className="step-line"><span className="step-arrow">►</span>Set Match Settings</div>
                    <div className="step-line"><span className="step-arrow">►</span>Post Match</div>
                  </div>

                  <div className="match-info">
                    <div>Platform: Xbox</div>
                    <div>Game: Modern Warfare 4</div>
                    <div>Ladder: Team Ladder</div>
                    <div>Team: Team Name</div>
                    <div>Status: Match Draft</div>
                  </div>
                </div>
              </aside>

              <section className="main-panel">
                <div className="panel-header">Match Post Form</div>

                <div className="main-body">
                  <div className="form-section">
                    <div className="form-title">Match Details</div>

                    <div className="form-body">
                      <div className="row">
                        <label>Game Mode</label>
                        <select className="mode-select" value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                          <option>Search and Destroy</option>
                          <option>Hardpoint</option>
                          <option>Control</option>
                          <option>Domination</option>
                          <option>Team Deathmatch</option>
                          <option>Kill Confirmed</option>
                          <option>Headquarters</option>
                          <option>Capture the Flag</option>
                          <option>Gunfight</option>
                        </select>
                      </div>

                      <div className="row">
                        <label>Players</label>
                        <select className="small-select" value={players} onChange={(e) => setPlayers(e.target.value)}>
                          <option>3v3</option>
                          <option>4v4</option>
                          <option>5v5</option>
                          <option>6v6</option>
                          <option>7v7</option>
                          <option>8v8</option>
                        </select>
                      </div>

                      <div className="row">
                        <label>Date / Time</label>
                        <div>
                          <div className="date-time-box">
                            <div className="locked-day">Today</div>
                            <select className="time-select" value={matchTime} onChange={(e) => setMatchTime(e.target.value)}>
                              {timeSlots.map((slot) => (
                                <option key={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>

                          <div className="small-note">
                            Date is locked to today. Time can only be posted in 15 minute slots.
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <label>Best Of</label>
                        <div className="best-of-scroll">
                          {["Best of 1", "Best of 3", "Best of 5", "Best of 7"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={bestOf === option ? "best-of-option active" : "best-of-option"}
                              onClick={() => setBestOf(option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="form-title">Settings</div>

                    <div className="form-body">
                      <div className="settings-summary">
                        <div>
                          <div className="settings-title">Match Settings</div>
                          <div className="settings-copy">
                            Preset: {preset} · Perks {perks} · Launchers {launchers} · Killstreaks {killstreaks}
                          </div>
                        </div>

                        <button
                          className="settings-button"
                          type="button"
                          onClick={() => setSettingsOpen(true)}
                        >
                          Edit Settings
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="form-title">Rules Reminder</div>

                    <div className="form-body">
                      <div className="rules-box">
                        • Posted matches are available for eligible teams on this ladder.
                        <br />
                        • Match time is locked to today and must use a 15 minute slot.
                        <br />
                        • Teams cannot spam multiple match posts for the same time block.
                        <br />
                        • Results must be reported after the match.
                        <br />
                        • Screenshots or proof may be needed for disputes.
                        <br />
                        • Follow all ladder-specific rules.
                      </div>
                    </div>
                  </div>

                  <div className="actions">
                    <button className="action-btn gold" type="button">Post Match</button>
                    <a className="action-btn" href="/matches/finder">Match Finder</a>
                    <button className="action-btn red" type="button" onClick={() => history.back()}>Cancel</button>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>

      {settingsOpen && (
        <div className="modal-backdrop">
          <div className="settings-modal">
            <div className="modal-title">
              Match Settings
              <button className="modal-close" type="button" onClick={() => setSettingsOpen(false)}>
                X
              </button>
            </div>

            <div className="modal-body">
              <div className="settings-grid">
                <div className="setting-row">
                  <label>Preset</label>
                  <select value={preset} onChange={(e) => setPreset(e.target.value)}>
                    <option>GB Default</option>
                    <option>Competitive CDL Style</option>
                    <option>Hardcore Variant</option>
                    <option>Custom</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Perks</label>
                  <select value={perks} onChange={(e) => setPerks(e.target.value)}>
                    <option>On</option>
                    <option>Off</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Launchers</label>
                  <select value={launchers} onChange={(e) => setLaunchers(e.target.value)}>
                    <option>Off</option>
                    <option>On</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Killstreaks</label>
                  <select value={killstreaks} onChange={(e) => setKillstreaks(e.target.value)}>
                    <option>Off</option>
                    <option>On</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Field Upgrades</label>
                  <select value={fieldUpgrades} onChange={(e) => setFieldUpgrades(e.target.value)}>
                    <option>On</option>
                    <option>Off</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Attachments</label>
                  <select value={attachments} onChange={(e) => setAttachments(e.target.value)}>
                    <option>On</option>
                    <option>Off</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Hardcore</label>
                  <select value={hardcore} onChange={(e) => setHardcore(e.target.value)}>
                    <option>Off</option>
                    <option>On</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Friendly Fire</label>
                  <select value={friendlyFire} onChange={(e) => setFriendlyFire(e.target.value)}>
                    <option>On</option>
                    <option>Off</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Radar</label>
                  <select value={radar} onChange={(e) => setRadar(e.target.value)}>
                    <option>Normal</option>
                    <option>Always On</option>
                    <option>Off</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Spectating</label>
                  <select value={spectating} onChange={(e) => setSpectating(e.target.value)}>
                    <option>Team Only</option>
                    <option>Disabled</option>
                    <option>Free</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Third Person</label>
                  <select value={thirdPerson} onChange={(e) => setThirdPerson(e.target.value)}>
                    <option>Off</option>
                    <option>On</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Round Length</label>
                  <select value={roundLength} onChange={(e) => setRoundLength(e.target.value)}>
                    <option>1 Minute</option>
                    <option>1.5 Minutes</option>
                    <option>2 Minutes</option>
                    <option>2.5 Minutes</option>
                    <option>3 Minutes</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Score Limit</label>
                  <select value={scoreLimit} onChange={(e) => setScoreLimit(e.target.value)}>
                    <option>Default</option>
                    <option>50 Points</option>
                    <option>100 Points</option>
                    <option>150 Points</option>
                    <option>200 Points</option>
                    <option>250 Points</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Health</label>
                  <select value={health} onChange={(e) => setHealth(e.target.value)}>
                    <option>Normal</option>
                    <option>Reduced</option>
                    <option>Double</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Respawn Delay</label>
                  <select value={respawnDelay} onChange={(e) => setRespawnDelay(e.target.value)}>
                    <option>None</option>
                    <option>2.5 Seconds</option>
                    <option>5 Seconds</option>
                    <option>7.5 Seconds</option>
                    <option>10 Seconds</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Bomb Timer</label>
                  <select value={bombTimer} onChange={(e) => setBombTimer(e.target.value)}>
                    <option>30 Seconds</option>
                    <option>45 Seconds</option>
                    <option>60 Seconds</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Plant Time</label>
                  <select value={plantTime} onChange={(e) => setPlantTime(e.target.value)}>
                    <option>3 Seconds</option>
                    <option>5 Seconds</option>
                    <option>7.5 Seconds</option>
                  </select>
                </div>

                <div className="setting-row">
                  <label>Defuse Time</label>
                  <select value={defuseTime} onChange={(e) => setDefuseTime(e.target.value)}>
                    <option>5 Seconds</option>
                    <option>7.5 Seconds</option>
                    <option>10 Seconds</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button className="action-btn" type="button" onClick={() => setSettingsOpen(false)}>
                  Save Settings
                </button>

                <button className="action-btn red" type="button" onClick={() => setSettingsOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}