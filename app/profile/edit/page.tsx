"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "../../../lib/useUser";

type EditTab = "main" | "teams" | "awards" | "photos" | "friends" | "settings";

const realGames = [
  "Call of Duty",
  "Call of Duty 4: Modern Warfare",
  "Call of Duty: Modern Warfare 2",
  "Call of Duty: Black Ops",
  "Call of Duty: Black Ops II",
  "Call of Duty: Modern Warfare 3",
  "Call of Duty: Warzone",
  "Halo 2",
  "Halo 3",
  "Halo Reach",
  "Halo Infinite",
  "Gears of War",
  "Gears of War 2",
  "Gears of War 3",
  "Rainbow Six Siege",
  "Counter-Strike 2",
  "Valorant",
  "Fortnite",
  "Apex Legends",
  "Rocket League",
  "Overwatch 2",
  "Super Smash Bros. Ultimate",
  "Madden NFL",
  "NBA 2K",
  "EA Sports FC",
];

export default function EditProfilePage() {
  const { user, loading } = useUser();

  const [activeTab, setActiveTab] = useState<EditTab>("main");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState("Dynamic");
  const [favoriteGame, setFavoriteGame] = useState("");
  const [favoriteSystem, setFavoriteSystem] = useState("PlayStation");
  const [profileGlow, setProfileGlow] = useState("On");
  const [location, setLocation] = useState("");
  const [playerIntro, setPlayerIntro] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const favoriteGameIsValid = useMemo(() => {
    if (!favoriteGame.trim()) return true;
    return realGames.some(
      (game) => game.toLowerCase() === favoriteGame.trim().toLowerCase()
    );
  }, [favoriteGame]);

  useEffect(() => {
    function warnBeforeLeave(event: BeforeUnloadEvent) {
      if (!hasChanges) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [hasChanges]);

  function markChanged() {
    setHasChanges(true);
    setSavedMessage("");
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoPreview(URL.createObjectURL(file));
    markChanged();
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    markChanged();
  }

  function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (hasChanges) {
      const confirmLeave = window.confirm("Please save changes first. Leave without saving?");
      if (!confirmLeave) {
        event.preventDefault();
        return;
      }
    }

    window.location.href = href;
  }

  function handleTabChange(tab: EditTab) {
    if (hasChanges) {
      const confirmSwitch = window.confirm("Please save changes first. Switch sections without saving?");
      if (!confirmSwitch) return;
    }

    setActiveTab(tab);
  }

  function handleSave() {
    if (!favoriteGameIsValid) {
      setSavedMessage("Choose a real game before saving.");
      return;
    }

    setHasChanges(false);
    setSavedMessage("Changes saved for preview. Database saving will be connected later.");
  }

  if (loading) return <div className="profile-loading">Loading edit profile.</div>;

  if (!user) {
    return <div className="profile-loading">You must be logged in to edit your profile.</div>;
  }

  return (
    <>
      <style>{`
        *{ margin:0; padding:0; box-sizing:border-box; }

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{text-decoration:none;}
        button,input,select,textarea{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .profile-loading{
          min-height:100vh;
          background:#000;
          color:#fff;
          padding:30px;
        }

        .page{
          min-height:100vh;
          background:#000;
          color:#d7e2ee;
          font-size:13px;
          padding-bottom:6px;
        }

        .wrapper{
          width:1040px;
          margin:0 auto;
          box-shadow:-18px 0 35px rgba(40,120,255,.22),18px 0 35px rgba(40,120,255,.22);
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

        .header{
          height:82px;
          background:linear-gradient(to bottom,#0d2234,#07111b);
          border-left:1px solid #214d73;
          border-right:1px solid #214d73;
          border-bottom:2px solid #2f6f9f;
          display:flex;
          align-items:center;
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
          box-shadow:inset 0 0 12px rgba(0,0,0,.65);
        }

        .logo-circle{
          width:54px;
          height:54px;
          border-radius:50%;
          background:linear-gradient(to bottom,#1c78c7,#0c2236);
          border:2px solid #74b4e6;
          margin-right:16px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-weight:bold;
          box-shadow:0 0 10px rgba(50,120,200,.5);
          overflow:hidden;
        }

        .logo-circle img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .logo-text{
          color:#f4f8ff;
          font-size:40px;
          font-weight:bold;
          letter-spacing:-2px;
          line-height:34px;
          font-style:italic;
        }

        .logo-sub{
          color:#4daeff;
          font-size:10px;
          font-weight:bold;
          letter-spacing:5px;
          margin-top:4px;
        }

        .title-bar{
          margin-top:5px;
          height:56px;
          background:linear-gradient(to bottom,#15324b,#091521);
          border:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:0 14px;
        }

        .title-main{
          color:#f2c14e;
          font-size:24px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .title-sub{
          color:#a9c3db;
          font-size:12px;
          margin-top:3px;
        }

        .nav{
          height:36px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-left:1px solid #244b70;
          border-right:1px solid #244b70;
          border-bottom:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:0 12px;
          margin-top:5px;
        }

        .nav a,.nav button{
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          margin-right:14px;
          background:none;
          border:none;
          cursor:pointer;
        }

        .nav a:hover,.nav button:hover,.nav .active{
          color:#f2c14e;
        }

        .edit-grid{
          margin-top:6px;
          display:grid;
          grid-template-columns:280px 1fr;
          gap:6px;
        }

        .box{
          background:#07111b;
          border:1px solid #244b70;
          margin-bottom:6px;
        }

        .box-title{
          height:28px;
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
          padding:10px;
          font-size:13px;
          line-height:18px;
        }

        .editor-box{
          width:100%;
          height:145px;
          background:#050c14;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#8aa7c0;
          font-size:13px;
          font-weight:bold;
          overflow:hidden;
          cursor:pointer;
        }

        .editor-box:hover{
          border-color:#f2c14e;
          color:#f2c14e;
        }

        .editor-box img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .editor-box input{ display:none; }

        .edit-button{
          margin-top:8px;
          height:34px;
          width:100%;
          background:linear-gradient(to bottom,#1d5d90,#0a1f33);
          border:1px solid #4daeff;
          color:#fff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .edit-button:hover{
          color:#f2c14e;
          border-color:#f2c14e;
        }

        .edit-button input{ display:none; }

        .profile-preview{
          height:86px;
          background:linear-gradient(to bottom,#102841,#07111b);
          border:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:10px;
          margin-top:8px;
        }

        .avatar-mini{
          width:58px;
          height:58px;
          border-radius:50%;
          background:#050c14;
          border:2px solid #74b4e6;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          margin-right:12px;
          color:#8aa7c0;
          font-size:10px;
          font-weight:bold;
        }

        .avatar-mini img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .logo-mini{
          width:58px;
          height:58px;
          background:#050c14;
          border:2px solid #74b4e6;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          margin-right:12px;
          color:#8aa7c0;
          font-size:10px;
          font-weight:bold;
        }

        .logo-mini img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .preview-name{
          color:#f2c14e;
          font-size:17px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .preview-sub{
          color:#a9c3db;
          font-size:11px;
          margin-top:3px;
        }

        .help-text{
          color:#a9c3db;
          font-size:12px;
          margin-top:8px;
        }

        .form-row{ margin-bottom:12px; }

        .form-row label{
          display:block;
          color:#f2c14e;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:5px;
        }

        .form-row input,
        .form-row select,
        .form-row textarea{
          width:100%;
          background:#050c14;
          border:1px solid #244b70;
          color:#fff;
          padding:9px;
          font-size:13px;
        }

        .form-row textarea{
          min-height:130px;
          resize:vertical;
        }

        .field-note{
          color:#8aa7c0;
          font-size:11px;
          margin-top:5px;
        }

        .error-text{
          color:#ff7777;
          font-size:11px;
          margin-top:5px;
          font-weight:bold;
        }

        .save-row{
          display:flex;
          align-items:center;
          gap:12px;
          margin-top:4px;
        }

        .save-button{
          width:180px;
          height:36px;
          background:linear-gradient(to bottom,#1d5d90,#0a1f33);
          border:1px solid #4daeff;
          color:#fff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          cursor:pointer;
        }

        .save-button:hover{
          color:#f2c14e;
          border-color:#f2c14e;
        }

        .saved-message{
          color:#00ff88;
          font-size:12px;
          font-weight:bold;
        }

        .warning-message{
          color:#f2c14e;
          font-size:12px;
          font-weight:bold;
        }

        .notice{
          background:#050c14;
          border:1px solid #244b70;
          padding:10px;
          color:#d7e2ee;
          margin-bottom:10px;
        }

        .manage-grid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:8px;
        }

        .manage-card{
          min-height:92px;
          background:#050c14;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          padding:8px;
        }

        .manage-card.top{
          border-color:#f2c14e;
          color:#f2c14e;
          box-shadow:0 0 10px rgba(242,193,78,.35);
        }

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

      <div className="page">
        <div className="top-strip">
          <a href="/home" onClick={(event) => handleNavClick(event, "/home")}>Home</a>
          <a href="/profile" onClick={(event) => handleNavClick(event, "/profile")}>Back to Profile</a>
        </div>

        <div className="wrapper">
          <header className="header">
            <div className="logo-box">
              <div className="logo-circle">
                {logoPreview ? <img src={logoPreview} alt="Logo Preview" /> : "GB"}
              </div>

              <div>
                <div className="logo-text">GAMEBATTLES</div>
                <div className="logo-sub">WHERE GAMING FINDS ITS EDGE</div>
              </div>
            </div>
          </header>

          <div className="title-bar">
            <div>
              <div className="title-main">Edit Profile</div>
              <div className="title-sub">
                Manage the important details that appear on your public player profile.
              </div>
            </div>
          </div>

          <nav className="nav">
            <a href="/home" onClick={(event) => handleNavClick(event, "/home")}>Home</a>
            <a href="/profile" onClick={(event) => handleNavClick(event, "/profile")}>Profile</a>
            <button className={activeTab === "main" ? "active" : ""} onClick={() => handleTabChange("main")}>Main Edit</button>
            <button className={activeTab === "teams" ? "active" : ""} onClick={() => handleTabChange("teams")}>Teams</button>
            <button className={activeTab === "awards" ? "active" : ""} onClick={() => handleTabChange("awards")}>Awards</button>
            <button className={activeTab === "photos" ? "active" : ""} onClick={() => handleTabChange("photos")}>Photos</button>
            <button className={activeTab === "friends" ? "active" : ""} onClick={() => handleTabChange("friends")}>Friends</button>
            <button className={activeTab === "settings" ? "active" : ""} onClick={() => handleTabChange("settings")}>Settings</button>
          </nav>

          <div className="edit-grid">
            <aside>
              <div className="box">
                <div className="box-title">Logo Editor</div>
                <div className="box-body">
                  <label className="editor-box">
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                    {logoPreview ? <img src={logoPreview} alt="Logo Preview" /> : "LOGO PREVIEW"}
                  </label>

                  <label className="edit-button">
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                    Edit Logo
                  </label>

                  <div className="help-text">
                    This is the larger profile logo/banner-style image preview.
                  </div>
                </div>
              </div>

              <div className="box">
                <div className="box-title">Avatar Editor</div>
                <div className="box-body">
                  <label className="editor-box">
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                    {avatarPreview ? <img src={avatarPreview} alt="Avatar Preview" /> : "AVATAR PREVIEW"}
                  </label>

                  <label className="edit-button">
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                    Edit Avatar
                  </label>

                  <div className="profile-preview">
                    <div className="avatar-mini">
                      {avatarPreview ? <img src={avatarPreview} alt="Mini Avatar Preview" /> : "AVATAR"}
                    </div>

                    <div className="logo-mini">
                      {logoPreview ? <img src={logoPreview} alt="Mini Logo Preview" /> : "LOGO"}
                    </div>

                    <div>
                      <div className="preview-name">Player Preview</div>
                      <div className="preview-sub">Avatar and logo preview</div>
                    </div>
                  </div>

                  <div className="help-text">
                    Avatar preview works instantly while building. Permanent saving comes later.
                  </div>
                </div>
              </div>

              <div className="box">
                <div className="box-title">Save Reminder</div>
                <div className="box-body">
                  {hasChanges ? (
                    <div className="warning-message">You have unsaved changes.</div>
                  ) : (
                    <div className="help-text">No unsaved changes.</div>
                  )}
                </div>
              </div>
            </aside>

            <main>
              {activeTab === "main" && (
                <div className="box">
                  <div className="box-title">Main Profile Settings</div>

                  <div className="box-body">
                    <div className="form-row">
                      <label>Current Status</label>
                      <select value={currentStatus} onChange={(event) => { setCurrentStatus(event.target.value); markChanged(); }}>
                        <option>Dynamic</option>
                        <option>Private</option>
                      </select>
                      <div className="field-note">
                        Dynamic changes based on what you are doing on the site. Private displays private on your profile.
                      </div>
                    </div>

                    <div className="form-row">
                      <label>Favorite Game</label>
                      <input
                        value={favoriteGame}
                        onChange={(event) => { setFavoriteGame(event.target.value); markChanged(); }}
                        placeholder="Type the exact game name"
                      />
                      <div className="field-note">
                        This will only save if it matches a real game from the site game list.
                      </div>
                      {!favoriteGameIsValid && (
                        <div className="error-text">That game is not in the approved game list yet.</div>
                      )}
                    </div>

                    <div className="form-row">
                      <label>Favorite System</label>
                      <select value={favoriteSystem} onChange={(event) => { setFavoriteSystem(event.target.value); markChanged(); }}>
                        <option>PlayStation</option>
                        <option>Xbox</option>
                        <option>Nintendo</option>
                        <option>PC</option>
                      </select>
                      <div className="field-note">
                        Your favorite system can affect your profile glow color.
                      </div>
                    </div>

                    <div className="form-row">
                      <label>Profile Glow</label>
                      <select value={profileGlow} onChange={(event) => { setProfileGlow(event.target.value); markChanged(); }}>
                        <option>On</option>
                        <option>Off</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <label>Location</label>
                      <input
                        value={location}
                        onChange={(event) => { setLocation(event.target.value); markChanged(); }}
                        placeholder="Example: Canada"
                      />
                    </div>

                    <div className="form-row">
                      <label>Player Bio</label>
                      <textarea
                        value={playerIntro}
                        onChange={(event) => { setPlayerIntro(event.target.value); markChanged(); }}
                        placeholder="Write a short intro about your gaming style, favorite games, competitive history, and what kind of matches you are looking for."
                      />
                    </div>

                    <div className="save-row">
                      <button className="save-button" type="button" onClick={handleSave}>
                        Save Changes
                      </button>

                      {savedMessage && (
                        <div className={favoriteGameIsValid ? "saved-message" : "warning-message"}>
                          {savedMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "teams" && (
                <div className="box">
                  <div className="box-title">Manage Displayed Teams</div>
                  <div className="box-body">
                    <div className="notice">
                      This page shows all teams you belong to. The 4 glowing slots are the teams that appear on your main profile.
                    </div>

                    <div className="manage-grid">
                      <div className="manage-card top">Top Team Slot 1</div>
                      <div className="manage-card top">Top Team Slot 2</div>
                      <div className="manage-card top">Top Team Slot 3</div>
                      <div className="manage-card top">Top Team Slot 4</div>
                      <div className="manage-card">Owned Team</div>
                      <div className="manage-card">Joined Team</div>
                      <div className="manage-card">Past Team</div>
                      <div className="manage-card">Empty Team Slot</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "awards" && (
                <div className="box">
                  <div className="box-title">Manage Displayed Awards</div>
                  <div className="box-body">
                    <div className="notice">
                      View all awards you have earned. Choose which awards appear on your profile and arrange their order.
                    </div>

                    <div className="manage-grid">
                      <div className="manage-card top">Display Award 1</div>
                      <div className="manage-card top">Display Award 2</div>
                      <div className="manage-card top">Display Award 3</div>
                      <div className="manage-card top">Display Award 4</div>
                      <div className="manage-card">Founder Trophy</div>
                      <div className="manage-card">Beta Medal</div>
                      <div className="manage-card">Ladder Champion</div>
                      <div className="manage-card">First Win Badge</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "photos" && (
                <div className="box">
                  <div className="box-title">Manage Displayed Photos</div>
                  <div className="box-body">
                    <div className="notice">
                      View your uploaded photos. Choose which photos appear on your profile and arrange their order.
                    </div>

                    <div className="manage-grid">
                      <div className="manage-card top">Profile Photo 1</div>
                      <div className="manage-card top">Profile Photo 2</div>
                      <div className="manage-card top">Profile Photo 3</div>
                      <div className="manage-card top">Profile Photo 4</div>
                      <div className="manage-card">Uploaded Photo</div>
                      <div className="manage-card">Uploaded Photo</div>
                      <div className="manage-card">Uploaded Photo</div>
                      <div className="manage-card">Uploaded Photo</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "friends" && (
                <div className="box">
                  <div className="box-title">Manage Displayed Friends</div>
                  <div className="box-body">
                    <div className="notice">
                      View your friends list. Choose which friends appear on your profile and arrange their order.
                    </div>

                    <div className="manage-grid">
                      <div className="manage-card top">Top Friend 1</div>
                      <div className="manage-card top">Top Friend 2</div>
                      <div className="manage-card top">Top Friend 3</div>
                      <div className="manage-card top">Top Friend 4</div>
                      <div className="manage-card">Friend</div>
                      <div className="manage-card">Friend</div>
                      <div className="manage-card">Friend</div>
                      <div className="manage-card">Friend</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="box">
                  <div className="box-title">Settings</div>
                  <div className="box-body">
                    <div className="notice">
                      More personal account settings will be managed here later.
                    </div>

                    <div className="manage-grid">
                      <div className="manage-card">Email Settings</div>
                      <div className="manage-card">Password Settings</div>
                      <div className="manage-card">Privacy Settings</div>
                      <div className="manage-card">Notification Settings</div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </div>
    </>
  );
}