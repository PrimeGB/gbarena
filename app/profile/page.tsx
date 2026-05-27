"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabase";

type Profile = {
  username: string;
  email: string | null;
  xbox_gt?: string | null;
  psn_gt?: string | null;
  nintendo_gt?: string | null;
  pc_gt?: string | null;
};

type AppUser = {
  id: string;
  email?: string | null;
};

export default function ProfilePage() {
  const { user, loading } = useUser();
  const currentUser = user as AppUser | null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    supabase
      .from("profiles")
      .select("username, email, xbox_gt, psn_gt, nintendo_gt, pc_gt")
      .eq("id", currentUser.id)
      .single()
      .then(({ data }) => {
        const loadedProfile = data || null;
        setProfile(loadedProfile);

        if (!loadedProfile && currentUser.email && usernameInput === "") {
          setUsernameInput(currentUser.email.split("@")[0] || "");
        }
      });
  }, [currentUser, usernameInput]);

  async function handleSave() {
    if (!currentUser) return;

    const trimmedUsername = usernameInput.trim();

    if (!trimmedUsername) {
      setError("Please enter a username.");
      return;
    }

    setSaving(true);
    setError("");

    const { data: usernameTaken } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", trimmedUsername)
      .maybeSingle();

    if (usernameTaken) {
      setError("This username is already taken.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert([
      {
        id: currentUser.id,
        username: trimmedUsername,
        email: currentUser.email,
        xbox_gt: null,
        psn_gt: null,
        nintendo_gt: null,
        pc_gt: null,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    await supabase.auth.updateUser({
      data: {
        username: trimmedUsername,
        display_name: trimmedUsername,
      },
    });

    setProfile({
      username: trimmedUsername,
      email: currentUser.email || null,
      xbox_gt: null,
      psn_gt: null,
      nintendo_gt: null,
      pc_gt: null,
    });

    setSaved(true);
    setSaving(false);
  }

  if (loading) {
    return <div className="profile-loading">Loading profile.</div>;
  }

  if (!currentUser) {
    return (
      <div className="profile-loading">
        You must be logged in to view your profile.
      </div>
    );
  }

  const playerName = profile?.username || "Prime";

  return (
    <>
      <style>{`
        *{ margin:0; padding:0; box-sizing:border-box; }

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
          overflow-x:hidden;
        }

        a{text-decoration:none;}
        button{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .profile-loading{
          min-height:100vh;
          background:#000;
          color:#fff;
          padding:30px;
          font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        .profile-page{
          min-height:100vh;
          background:#000;
          color:#d7e2ee;
          font-size:13px;
          padding-bottom:4px;
        }

        .top-strip{
          height:22px;
          background:linear-gradient(to bottom,#13304b,#060d14);
          border-bottom:1px solid #214d73;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          padding:0 12px;
        }

        .top-strip a{
          color:#d7eaff;
          font-size:11px;
          font-weight:bold;
          margin-left:14px;
        }

        .wrapper{ width:1040px; margin:0 auto; }

        .header{
          height:82px;
          background:linear-gradient(to bottom,#0d2234,#07111b);
          border-left:1px solid #214d73;
          border-right:1px solid #214d73;
          border-bottom:2px solid #2f6f9f;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 14px;
        }

        .logo-box{
          height:62px;
          width:510px;
          background:linear-gradient(to bottom,#102841,#07111b);
          border:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:0 18px;
          position:relative;
          overflow:hidden;
          box-shadow:inset 0 0 12px rgba(0,0,0,.65);
        }

        .logo-box:before{
          content:"";
          position:absolute;
          inset:0;
          background:radial-gradient(circle at top,#4b9ee033 0%,transparent 45%);
          pointer-events:none;
        }

        .gb-logo-wrap{
          display:flex;
          align-items:center;
          gap:16px;
          position:relative;
          z-index:2;
        }

        .gb-circle{
          width:54px;
          height:54px;
          border-radius:50%;
          background:linear-gradient(to bottom,#1c78c7,#0c2236);
          border:2px solid #74b4e6;
          position:relative;
          box-shadow:0 0 10px rgba(50,120,200,.5), inset 0 0 8px rgba(255,255,255,.08);
          flex:none;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:visible;
        }

        .gb-ring{
          position:absolute;
          inset:5px;
          border-radius:50%;
          border:2px solid rgba(255,255,255,.16);
          pointer-events:none;
        }

        .profile-controller-svg{
          position:relative;
          z-index:3;
          width:58px;
          height:40px;
          transform:rotate(-2deg);
          filter:drop-shadow(2px 3px 3px rgba(0,0,0,.75)) drop-shadow(0 0 5px rgba(255,255,255,.18)) drop-shadow(0 0 6px rgba(0,130,220,.28));
        }

        .gb-text-area{
          display:flex;
          flex-direction:column;
          justify-content:center;
        }

        .gb-logo-text{
          color:#f4f8ff;
          font-size:40px;
          font-weight:bold;
          letter-spacing:-2px;
          line-height:34px;
          font-style:italic;
          text-transform:uppercase;
        }

        .gb-logo-sub{
          color:#4daeff;
          font-size:10px;
          font-weight:bold;
          letter-spacing:5px;
          margin-top:4px;
          text-transform:uppercase;
        }

        .header-ad{
          width:300px;
          height:52px;
          background:#050c14;
          border:1px solid #244b70;
          color:#8aa7c0;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:12px;
        }

        .nav{
          height:32px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-left:1px solid #244b70;
          border-right:1px solid #244b70;
          border-bottom:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:0 12px;
        }

        .nav a{
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          margin-right:22px;
        }

        .nav a:hover{ color:#f2c14e; }

        .profile-title-bar{
          margin-top:5px;
          height:56px;
          background:linear-gradient(to bottom,#15324b,#091521);
          border:1px solid #2f6f9f;
          color:#fff;
          display:flex;
          align-items:center;
          padding:0 12px;
        }

        .profile-title-left{
          display:flex;
          align-items:center;
          gap:12px;
        }

        .title-avatar-upload{
          width:50px;
          height:50px;
          background:#050c14;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#8aa7c0;
          font-size:8px;
          font-weight:bold;
          text-align:center;
          line-height:10px;
          cursor:pointer;
          overflow:hidden;
          flex:none;
          box-shadow:inset 0 0 8px rgba(0,0,0,.65);
        }

        .title-avatar-upload:hover{
          border-color:#2f6f9f;
          color:#f2c14e;
          background:#10283d;
        }

        .title-avatar-upload input{ display:none; }

        .profile-title-name{
          font-size:22px;
          font-weight:bold;
          text-transform:uppercase;
          color:#fff;
          line-height:24px;
        }

        .tabs{
          height:30px;
          background:#050c14;
          border-left:1px solid #244b70;
          border-right:1px solid #244b70;
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:flex-end;
          padding-left:8px;
        }

        .tab{
          height:25px;
          padding:6px 12px 0;
          background:#0b1d2c;
          border:1px solid #244b70;
          border-bottom:none;
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          margin-right:4px;
          display:block;
        }

        .tab.active{
          background:#15324b;
          color:#f2c14e;
          border-color:#2f6f9f;
        }

        .profile-grid{
          margin-top:5px;
          display:grid;
          grid-template-columns:250px 1fr 250px;
          gap:6px;
          align-items:stretch;
        }

        .left-column,.main-column,.right-column{
          display:flex;
          flex-direction:column;
          min-height:530px;
        }

        .box{
          background:#07111b;
          border:1px solid #244b70;
          margin-bottom:5px;
        }

        .box-title{
          height:26px;
          background:linear-gradient(to bottom,#15324b,#091521);
          border-bottom:1px solid #244b70;
          color:#fff;
          display:flex;
          align-items:center;
          padding-left:10px;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .box-body{
          padding:8px;
          font-size:13px;
          line-height:18px;
          color:#d7e2ee;
        }

        .profile-box{ margin-bottom:5px; }

        .avatar-box{
          width:100%;
          height:170px;
          background:#050c14;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#8aa7c0;
          font-size:13px;
          margin-bottom:8px;
        }

        .username{
          color:#f2c14e;
          font-size:22px;
          font-weight:bold;
          margin-bottom:4px;
        }

        .rank{
          color:#d7e2ee;
          font-size:13px;
          margin-bottom:5px;
        }

        .stat-row{
          display:flex;
          justify-content:space-between;
          border-bottom:1px solid #172d40;
          padding:5px 0;
          color:#d7e2ee;
          font-size:13px;
        }

        .control-center-box{
          flex:1;
          margin-bottom:0;
        }

        .control-center-box .box-body{ height:100%; }

        .quick-link,.mini-list a{
          display:block;
          color:#d7eaff;
          padding:7px 4px;
          border-bottom:1px solid #172d40;
          font-size:13px;
        }

        .quick-link:hover,.mini-list a:hover{
          color:#f2c14e;
          background:#10283d;
        }

        .linked-rank-box{
          background:#07111b;
          border:1px solid #244b70;
          padding:8px;
          margin-bottom:5px;
          display:grid;
          grid-template-columns:1fr 160px;
          gap:12px;
        }

        .linked-title{
          color:#f2c14e;
          font-size:17px;
          font-weight:bold;
          margin-bottom:8px;
        }

        .linked-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:6px;
        }

        .linked-account{
          border:1px solid #244b70;
          background:#050c14;
          padding:6px;
          color:#d7eaff;
          font-size:13px;
          min-height:48px;
          display:flex;
          align-items:center;
          gap:8px;
        }

        .system-icon{
          width:30px;
          height:30px;
          border-radius:4px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
          font-weight:bold;
          color:#fff;
          flex:none;
        }

        .xbox-icon{ background:#107c10; }
        .playstation-icon{ background:#00439c; }
        .nintendo-icon{ background:#e60012; }
        .pc-icon{ background:#555; }

        .account-text span{
          display:block;
          color:#f2c14e;
          font-weight:bold;
          margin-bottom:2px;
          text-transform:uppercase;
          font-size:12px;
        }

        .gb-rank{
          border-left:1px solid #244b70;
          padding-left:12px;
          text-align:center;
          display:flex;
          flex-direction:column;
          min-height:100px;
        }

        .gb-rank-title{
          color:#f2c14e;
          font-size:13px;
          font-weight:bold;
          text-transform:uppercase;
          padding-bottom:6px;
          border-bottom:1px solid #244b70;
        }

        .gb-rank-name{
          color:#fff;
          font-size:32px;
          font-weight:bold;
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          line-height:34px;
        }

        .gb-rank-points{
          color:#7f97aa;
          font-size:9px;
          border-top:1px solid #244b70;
          padding-top:4px;
          text-transform:uppercase;
          letter-spacing:.4px;
        }

        .info-table{
          width:100%;
          border-collapse:collapse;
        }

        .info-table td{
          border-bottom:1px solid #172d40;
          padding:6px 8px;
          font-size:13px;
        }

        .info-table td:first-child{
          color:#f2c14e;
          width:130px;
          font-weight:bold;
        }

        .player-blog-box{
          flex:1;
          margin-bottom:0;
        }

        .player-blog-box .box-body{ height:100%; }

        .post{
          font-size:13px;
          line-height:18px;
        }

        .post-title{
          color:#f2c14e;
          font-size:15px;
          font-weight:bold;
          margin-bottom:2px;
        }

        .post-meta{
          color:#8aa7c0;
          font-size:12px;
          margin-bottom:4px;
        }

        .right-column{ gap:5px; }
        .right-column .box{ margin-bottom:0; }

        .right-box{
          flex:1;
          display:flex;
          flex-direction:column;
        }

        .right-box .box-body{
          flex:1;
          display:flex;
        }

        .display-grid{
          width:100%;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:6px;
        }

        .display-card{
          background:#050c14;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#6f8799;
          font-size:11px;
          font-weight:bold;
          text-align:center;
          min-height:58px;
        }

        .photo-grid{
          width:100%;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:6px;
        }

        .photo{
          background:#050c14;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#4d6b83;
          font-size:10px;
          min-height:58px;
        }

        .complete-profile{
          padding:12px;
          font-size:13px;
        }

        .complete-profile p{
          margin-bottom:10px;
          line-height:22px;
        }

        .complete-profile input{
          width:100%;
          padding:10px;
          margin-bottom:10px;
          background:#050c14;
          border:1px solid #244b70;
          color:#fff;
          font-size:13px;
        }

        .complete-profile button{
          width:100%;
          padding:10px;
          background:linear-gradient(to bottom,#15324b,#091521);
          border:1px solid #2f6f9f;
          color:#fff;
          font-weight:bold;
          cursor:pointer;
          font-size:13px;
        }

        .success{ color:#00ff88; margin-top:10px; }
        .error{ color:#ff6b6b; margin-top:10px; }

        .footer{
          margin-top:5px;
          height:24px;
          background:#07111b;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:11px;
        }
      `}</style>

      <div className="profile-page">
        <div className="top-strip">
          <a href="/">Home</a>
          <a href="/profile">My Profile</a>
        </div>

        <div className="wrapper">
          <header className="header">
            <div className="logo-box">
              <div className="gb-logo-wrap">
                <div className="gb-circle">
                  <div className="gb-ring"></div>

                  <svg className="profile-controller-svg" viewBox="0 0 260 180" aria-hidden="true">
                    <defs>
                      <linearGradient id="profileControllerBody" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="38%" stopColor="#d8dce0" />
                        <stop offset="72%" stopColor="#a7afb7" />
                        <stop offset="100%" stopColor="#6e7882" />
                      </linearGradient>
                      <linearGradient id="profileControllerEdge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#3f4a55" />
                      </linearGradient>
                      <filter id="profileControllerShadow" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity=".8" />
                      </filter>
                    </defs>

                    <path
                      d="M55 69 C67 38 96 45 112 59 C119 65 125 67 130 67 C135 67 141 65 148 59 C164 45 193 38 205 69 C218 101 237 145 215 159 C194 173 171 135 158 120 C150 111 141 108 130 108 C119 108 110 111 102 120 C89 135 66 173 45 159 C23 145 42 101 55 69Z"
                      fill="url(#profileControllerBody)"
                      stroke="url(#profileControllerEdge)"
                      strokeWidth="4"
                      filter="url(#profileControllerShadow)"
                    />

                    <path d="M73 88 H102 V101 H73Z" fill="#003e68" />
                    <path d="M81 80 H94 V109 H81Z" fill="#003e68" />
                    <circle cx="177" cy="83" r="8" fill="#003e68" />
                    <circle cx="198" cy="94" r="8" fill="#003e68" />
                    <circle cx="177" cy="105" r="8" fill="#003e68" />
                    <circle cx="156" cy="94" r="8" fill="#003e68" />
                    <circle cx="118" cy="85" r="5" fill="#4f5f6c" />
                    <circle cx="143" cy="85" r="5" fill="#4f5f6c" />
                    <path d="M82 54 C88 20 125 16 143 48" fill="none" stroke="#e5edf4" strokeWidth="10" strokeLinecap="round" />
                    <path d="M86 54 C92 28 122 25 137 49" fill="none" stroke="#6d7a86" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="gb-text-area">
                  <div className="gb-logo-text">GAMEBATTLES</div>
                  <div className="gb-logo-sub">WHERE GAMING FINDS ITS EDGE</div>
                </div>
              </div>
            </div>

            <div className="header-ad">ADVERTISEMENT</div>
          </header>

          <nav className="nav">
            <a href="/">Home</a>
            <a href="/profile">Profile</a>
            <a href="/teams/top">Teams</a>
            <a href="#">Matches</a>
            <a href="/forums">Forums</a>
            <a href="#">Ladders</a>
          </nav>

          <div className="profile-title-bar">
            <div className="profile-title-left">
              <label className="title-avatar-upload">
                <input type="file" accept="image/*" />
                AVATAR
              </label>

              <div className="profile-title-name">
                {profile ? playerName : "Complete Your Profile"}
              </div>
            </div>
          </div>

          <div className="tabs">
            <a className="tab active" href="/profile">Profile</a>
            <a className="tab" href="/profile/teams">Teams</a>
            <a className="tab" href="/profile/matches">Matches</a>
            <a className="tab" href="/profile/photos">Photos</a>
            <a className="tab" href="/teams/create">Create Team</a>
            <a className="tab" href="/players">Find Players</a>
          </div>

          {!profile ? (
            <div className="box" style={{ marginTop: 8 }}>
              <div className="box-title">Create Profile</div>

              <div className="complete-profile">
                <p>Enter a username to complete your profile.</p>

                <input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Username"
                />

                <button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving." : "Complete Profile"}
                </button>

                {saved && <p className="success">Profile completed.</p>}
                {error && <p className="error">{error}</p>}
              </div>
            </div>
          ) : (
            <div className="profile-grid">
              <aside className="left-column">
                <div className="box profile-box">
                  <div className="box-title">Profile</div>

                  <div className="box-body">
                    <div className="avatar-box">PLAYER IMAGE</div>
                    <div className="username">{playerName}</div>
                    <div className="rank">Member Rank: Amateur</div>

                    <div className="stat-row"><span>Record</span><span>0 - 0</span></div>
                    <div className="stat-row"><span>Reputation</span><span>100%</span></div>
                    <div className="stat-row"><span>Joined</span><span>2026</span></div>
                  </div>
                </div>

                <div className="box control-center-box">
                  <div className="box-title">Control Center</div>

                  <div className="box-body">
                    <a className="quick-link" href="#">Edit Profile</a>
                    <a className="quick-link" href="/profile/teams">My Teams</a>
                    <a className="quick-link" href="/profile/matches">My Matches</a>
                    <a className="quick-link" href="/profile/friends/invite">Invite Friends</a>
                    <a className="quick-link" href="#">Account Settings</a>
                    <a className="quick-link" href="#">Messages</a>
                  </div>
                </div>
              </aside>

              <main className="main-column">
                <div className="linked-rank-box">
                  <div>
                    <div className="linked-title">Linked Accounts</div>

                    <div className="linked-grid">
                      <div className="linked-account"><div className="system-icon xbox-icon">X</div><div className="account-text"><span>Xbox</span>Not Linked</div></div>
                      <div className="linked-account"><div className="system-icon playstation-icon">PS</div><div className="account-text"><span>PlayStation</span>Not Linked</div></div>
                      <div className="linked-account"><div className="system-icon nintendo-icon">N</div><div className="account-text"><span>Nintendo</span>Not Linked</div></div>
                      <div className="linked-account"><div className="system-icon pc-icon">PC</div><div className="account-text"><span>PC</span>Not Linked</div></div>
                    </div>
                  </div>

                  <div className="gb-rank">
                    <div className="gb-rank-title">GB Rank</div>
                    <div className="gb-rank-name">0-0</div>
                    <div className="gb-rank-points">GB Rank Points</div>
                  </div>
                </div>

                <div className="box">
                  <div className="box-title">Member Information</div>

                  <div className="box-body">
                    <table className="info-table">
                      <tbody>
                        <tr><td>Username</td><td>{playerName}</td></tr>
                        <tr><td>Current Status</td><td>Online</td></tr>
                        <tr><td>Favorite Game</td><td>Not Set</td></tr>
                        <tr><td>Location</td><td>Not Set</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="box player-blog-box">
                  <div className="box-title">Player Blog</div>

                  <div className="box-body">
                    <div className="post">
                      <div className="post-title">About {playerName}</div>
                      <div className="post-meta">100 word player intro</div>
                      <p>
                        This player has not written an intro yet. Later, this
                        section will let players write a short profile blog
                        about their gaming style, favorite games, teams,
                        competitive history, and what kind of matches they are
                        looking for.
                      </p>
                    </div>
                  </div>
                </div>
              </main>

              <aside className="right-column">
                <div className="box right-box">
                  <div className="box-title">Top Teams</div>
                  <div className="box-body">
                    <div className="display-grid">
                      <div className="display-card">Empty Slot</div>
                      <div className="display-card">Empty Slot</div>
                      <div className="display-card">Empty Slot</div>
                      <div className="display-card">Empty Slot</div>
                    </div>
                  </div>
                </div>

                <div className="box right-box">
                  <div className="box-title">Top Friends</div>
                  <div className="box-body">
                    <div className="display-grid">
                      <div className="display-card">Top Friends</div>
                      <div className="display-card">Top Friends</div>
                      <div className="display-card">Top Friends</div>
                      <div className="display-card">Top Friends</div>
                    </div>
                  </div>
                </div>

                <div className="box right-box">
                  <div className="box-title">Photos</div>
                  <div className="box-body">
                    <div className="photo-grid">
                      <div className="photo">PHOTO</div>
                      <div className="photo">PHOTO</div>
                      <div className="photo">PHOTO</div>
                      <div className="photo">PHOTO</div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </div>
    </>
  );
}