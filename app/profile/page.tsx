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

type Award = {
  id: number;
  name: string;
  type: "gold" | "crimson" | "ribbon" | "diamond" | "elite";
  label: string;
  description: string;
};

type TopTeam = {
  id: string;
  name: string;
  record: string;
  logo_url?: string | null;
};

export default function ProfilePage() {
  const { user, loading } = useUser();
  const currentUser = user as AppUser | null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [topTeams, setTopTeams] = useState<TopTeam[]>([]);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const favoriteSystem = "PlayStation";

  const topAwards: Award[] = [
    {
      id: 1,
      name: "Founder",
      type: "gold",
      label: "GB",
      description: "Early member during the GameBattles launch era.",
    },
    {
      id: 2,
      name: "Crimson Champion",
      type: "crimson",
      label: "I",
      description: "Won a major ladder season or championship.",
    },
    {
      id: 3,
      name: "Beta Service",
      type: "ribbon",
      label: "B",
      description: "Helped test features before public release.",
    },
    {
      id: 4,
      name: "Diamond Division",
      type: "diamond",
      label: "D",
      description: "Reached Diamond division in ranked play.",
    },
    {
      id: 5,
      name: "Elite Operator",
      type: "elite",
      label: "E",
      description: "Earned for elite competitive performance.",
    },
  ];

  function favoriteSystemClass(system: string) {
    const cleanSystem = system.toLowerCase();

    if (cleanSystem.includes("xbox")) return "favorite-xbox";
    if (cleanSystem.includes("playstation")) return "favorite-playstation";
    if (cleanSystem.includes("nintendo")) return "favorite-nintendo";
    if (cleanSystem.includes("pc")) return "favorite-pc";

    return "favorite-default";
  }

  function getTeamInitials(name: string) {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }

  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setTopTeams([]);
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

    supabase
      .from("team_members")
      .select("team_id, teams(id, name, logo_url, wins, losses, created_at)")
      .eq("user_id", currentUser.id)
      .limit(4)
      .then(({ data }) => {
        const loadedTeams =
          data
            ?.map((row: any) => {
              const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;

              if (!team) return null;

              return {
                id: team.id,
                name: team.name || "Unnamed Team",
                record: `${team.wins || 0} - ${team.losses || 0}`,
                logo_url: team.logo_url || null,
              };
            })
            .filter(Boolean) || [];

        setTopTeams(loadedTeams as TopTeam[]);
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
  const emptyTeamSlots = Math.max(0, 4 - topTeams.length);

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

        .profile-page.favorite-xbox .wrapper{
          box-shadow:-18px 0 35px rgba(0,255,100,.22),18px 0 35px rgba(0,255,100,.22);
        }

        .profile-page.favorite-playstation .wrapper{
          box-shadow:-18px 0 35px rgba(40,120,255,.28),18px 0 35px rgba(40,120,255,.28);
        }

        .profile-page.favorite-nintendo .wrapper{
          box-shadow:-18px 0 35px rgba(255,45,45,.25),18px 0 35px rgba(255,45,45,.25);
        }

        .profile-page.favorite-pc .wrapper{
          box-shadow:-18px 0 35px rgba(140,90,255,.28),18px 0 35px rgba(140,90,255,.28);
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
        }

        .gb-ring{
          position:absolute;
          inset:5px;
          border-radius:50%;
          border:2px solid rgba(255,255,255,.16);
        }

        .profile-controller-svg{
          position:relative;
          z-index:3;
          width:58px;
          height:40px;
          transform:rotate(-2deg);
          filter:drop-shadow(2px 3px 3px rgba(0,0,0,.75));
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
          display:block;
          overflow:hidden;
          box-shadow:inset 0 0 8px rgba(0,0,0,.75);
        }

        .header-ad img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
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
          height:68px;
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
          gap:14px;
        }

        .title-avatar-upload{
          width:64px;
          height:60px;
          background:linear-gradient(to bottom,#081724,#050c14);
          border:1px solid #3f86bd;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#8aa7c0;
          font-size:9px;
          font-weight:bold;
          text-align:center;
          cursor:pointer;
          box-shadow:inset 0 0 10px rgba(0,0,0,.75), 0 0 8px rgba(47,111,159,.25);
        }

        .title-avatar-upload:hover{
          border-color:#f2c14e;
          color:#f2c14e;
        }

        .title-avatar-upload input{ display:none; }

        .profile-title-name{
          font-size:24px;
          font-weight:bold;
          text-transform:uppercase;
          color:#fff;
        }

        .prime-link{
          color:#f2c14e;
          font-weight:bold;
        }

        .prime-link:hover{
          color:#fff;
          text-decoration:underline;
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
          padding:6px 10px 0;
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
          margin-bottom:12px;
        }

        .username{
          color:#f2c14e;
          font-size:22px;
          font-weight:bold;
          margin-bottom:12px;
          display:block;
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

        .gb-rank-box{
          background:#07111b;
          border:1px solid #244b70;
          margin-bottom:5px;
          display:flex;
          align-items:stretch;
          min-height:88px;
        }

        .gb-rank{
          width:100%;
          padding:8px 12px;
          text-align:center;
          display:flex;
          flex-direction:column;
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
        }

        .gb-rank-points{
          color:#7f97aa;
          font-size:9px;
          border-top:1px solid #244b70;
          padding-top:4px;
          text-transform:uppercase;
        }

        .info-table{
          width:100%;
          border-collapse:collapse;
        }

        .info-table td{
          border-bottom:1px solid #172d40;
          padding:6px 8px;
          font-size:13px;
          white-space:nowrap;
        }

        .info-table td:nth-child(1){
          color:#f2c14e;
          width:120px;
          font-weight:bold;
        }

        .info-table td:nth-child(2){
          color:#d7e2ee;
          width:190px;
        }

        .info-table td:nth-child(3){
          width:95px;
          font-weight:bold;
          text-align:left;
          padding-left:18px;
        }

        .info-table td:nth-child(4){
          color:#d7e2ee;
          width:auto;
          text-align:left;
        }

        .system-link{
          font-weight:bold;
          text-decoration:none;
        }

        .system-link:hover{
          text-decoration:underline;
          color:#fff !important;
        }

        .system-xbox{
          color:#00ff88 !important;
        }

        .system-playstation{
          color:#5fa8ff !important;
        }

        .system-nintendo{
          color:#ff5a5a !important;
        }

        .system-pc{
          color:#d7d7d7 !important;
        }

        .main-lower-grid{
          flex:1;
          display:grid;
          grid-template-rows:1.08fr .92fr;
          gap:5px;
          min-height:300px;
        }

        .player-blog-box,
        .top-awards-box{
          margin-bottom:0;
          display:flex;
          flex-direction:column;
          min-height:0;
        }

        .player-blog-box .box-body,
        .top-awards-box .box-body{
          flex:1;
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

        .awards-grid{
          display:grid;
          grid-template-columns:repeat(5,1fr);
          gap:5px;
          height:100%;
        }

        .award-card{
          background:
            linear-gradient(to bottom,#0b1a27,#050b12);
          border:1px solid #345f86;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-start;
          text-align:center;
          min-height:132px;
          padding:7px 4px;
          box-shadow:inset 0 0 12px rgba(0,0,0,.75);
          overflow:hidden;
        }

        .award-card:hover{
          border-color:#d7ad4a;
          background:#10283d;
        }

        .award-emblem{
          width:46px;
          height:46px;
          position:relative;
          display:flex;
          align-items:center;
          justify-content:center;
          margin-bottom:6px;
          color:#fff;
          font-size:13px;
          font-weight:900;
          letter-spacing:.5px;
          text-shadow:0 1px 2px #000;
        }

        .award-emblem.gold{
          border-radius:50%;
          background:
            radial-gradient(circle at 35% 25%,#fff2a4 0,#d8a83d 42%,#5e3d00 100%);
          border:2px solid #f0c75e;
          box-shadow:0 0 10px rgba(215,173,74,.34), inset 0 0 10px rgba(0,0,0,.45);
        }

        .award-emblem.gold:before{
          content:"";
          position:absolute;
          inset:7px;
          border-radius:50%;
          border:1px solid rgba(255,255,255,.35);
        }

        .award-emblem.crimson{
          width:50px;
          height:48px;
          border-radius:6px 6px 13px 13px;
          background:
            linear-gradient(to bottom,#ffb3b3 0,#9d001f 48%,#310006 100%);
          border:2px solid #e9415d;
          box-shadow:0 0 12px rgba(180,0,40,.38), inset 0 0 12px rgba(0,0,0,.55);
        }

        .award-emblem.crimson:before{
          content:"";
          position:absolute;
          left:8px;
          right:8px;
          bottom:-7px;
          height:8px;
          background:linear-gradient(to bottom,#5f0010,#1b0004);
          border:1px solid #e9415d;
          border-top:none;
        }

        .award-emblem.ribbon{
          width:38px;
          height:50px;
          border-radius:4px 4px 2px 2px;
          background:
            linear-gradient(to right,#0e2f72 0,#3f85ff 32%,#b6d4ff 50%,#3f85ff 68%,#0e2f72 100%);
          border:2px solid #9fc7ff;
          box-shadow:0 0 11px rgba(50,120,255,.35), inset 0 0 10px rgba(0,0,0,.4);
        }

        .award-emblem.ribbon:after{
          content:"";
          position:absolute;
          left:7px;
          bottom:-10px;
          width:20px;
          height:20px;
          background:#0e2f72;
          transform:rotate(45deg);
          border-right:2px solid #9fc7ff;
          border-bottom:2px solid #9fc7ff;
        }

        .award-emblem.diamond{
          width:42px;
          height:42px;
          transform:rotate(45deg);
          border-radius:6px;
          background:
            linear-gradient(135deg,#eaffff 0,#62dcff 42%,#004f76 100%);
          border:2px solid #b8f7ff;
          box-shadow:0 0 12px rgba(80,220,255,.38), inset 0 0 10px rgba(0,0,0,.34);
        }

        .award-emblem.diamond span{
          transform:rotate(-45deg);
          display:block;
          color:#062b3a;
          text-shadow:none;
        }

        .award-emblem.elite{
          width:48px;
          height:48px;
          clip-path:polygon(50% 0%,61% 32%,96% 34%,68% 55%,78% 91%,50% 70%,22% 91%,32% 55%,4% 34%,39% 32%);
          background:
            linear-gradient(to bottom,#f5edff 0,#8050ff 47%,#1c084a 100%);
          border:2px solid #cbb6ff;
          box-shadow:0 0 13px rgba(140,90,255,.45), inset 0 0 10px rgba(0,0,0,.5);
        }

        .award-name{
          color:#f5d06a;
          font-size:10px;
          font-weight:900;
          text-transform:uppercase;
          line-height:12px;
          min-height:24px;
          display:flex;
          align-items:center;
          justify-content:center;
          text-shadow:0 1px 1px #000;
        }

        .award-desc{
          color:#e2edf8;
          font-size:9px;
          font-weight:700;
          line-height:12px;
          margin-top:5px;
          text-shadow:0 1px 1px #000;
        }

        .right-column{
          gap:5px;
        }

        .right-column .box{
          margin-bottom:0;
        }

        .right-box{
          display:flex;
          flex-direction:column;
        }

        .right-box .box-body{
          display:flex;
        }

        .display-grid{
          width:100%;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
        }

        .display-card{
          aspect-ratio:1 / 1;
          background:linear-gradient(to bottom,#081724,#03070c);
          border:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#6f8799;
          font-size:11px;
          font-weight:bold;
          text-align:center;
          overflow:hidden;
          box-shadow:inset 0 0 14px rgba(0,0,0,.75);
        }

        .team-card{
          aspect-ratio:1 / 1;
          background:#02060b;
          border:1px solid #2f6f9f;
          display:flex;
          flex-direction:column;
          overflow:hidden;
          box-shadow:inset 0 0 14px rgba(0,0,0,.75);
        }

        .team-logo-area{
          flex:1;
          width:100%;
          background:linear-gradient(to bottom,#0b1d2c,#03070c);
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
        }

        .team-logo-area img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .team-logo-placeholder{
          width:100%;
          height:100%;
          background:linear-gradient(to bottom,#15324b,#050c14);
          color:#f2c14e;
          font-size:28px;
          font-weight:bold;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:inset 0 0 16px rgba(0,0,0,.85);
        }

        .team-record{
          height:22px;
          background:linear-gradient(to bottom,#10283d,#050c14);
          border-top:1px solid #2f6f9f;
          color:#f2c14e;
          font-size:11px;
          font-weight:bold;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .display-card img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .complete-profile{
          padding:12px;
          font-size:13px;
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

      <div className={`profile-page ${favoriteSystemClass(favoriteSystem)}`}>
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
                    <path
                      d="M55 69 C67 38 96 45 112 59 C119 65 125 67 130 67 C135 67 141 65 148 59 C164 45 193 38 205 69 C218 101 237 145 215 159 C194 173 171 135 158 120 C150 111 141 108 130 108 C119 108 110 111 102 120 C89 135 66 173 45 159 C23 145 42 101 55 69Z"
                      fill="#d8dce0"
                      stroke="#3f4a55"
                      strokeWidth="4"
                    />
                    <path d="M73 88 H102 V101 H73Z" fill="#003e68" />
                    <path d="M81 80 H94 V109 H81Z" fill="#003e68" />
                    <circle cx="177" cy="83" r="8" fill="#003e68" />
                    <circle cx="198" cy="94" r="8" fill="#003e68" />
                    <circle cx="177" cy="105" r="8" fill="#003e68" />
                    <circle cx="156" cy="94" r="8" fill="#003e68" />
                    <circle cx="118" cy="85" r="5" fill="#4f5f6c" />
                    <circle cx="143" cy="85" r="5" fill="#4f5f6c" />
                  </svg>
                </div>

                <div>
                  <div className="gb-logo-text">GAMEBATTLES</div>
                  <div className="gb-logo-sub">WHERE GAMING FINDS ITS EDGE</div>
                </div>
              </div>
            </div>

            <a
              className="header-ad"
              href="https://discord.gg/Ue4af2QVCc"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/discord-ad.png" alt="Join the GameBattles Discord" />
            </a>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/profile">Profile</a>
            <a href="/teams/top">Teams</a>
            <a href="/profile/matches">Matches</a>
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
                {profile ? (
                  <a className="prime-link" href="/profile">
                    {playerName}
                  </a>
                ) : (
                  "Complete Your Profile"
                )}
              </div>
            </div>
          </div>

          <div className="tabs">
            <a className="tab active" href="/profile">Profile</a>
            <a className="tab" href="/profile/teams">Teams</a>
            <a className="tab" href="/profile/friends">Friends</a>
            <a className="tab" href="/profile/matches">Matches</a>
            <a className="tab" href="/profile/awards">Awards</a>
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
                <div className="box">
                  <div className="box-title">Profile</div>

                  <div className="box-body">
                    <div className="avatar-box">PLAYER IMAGE</div>

                    <a className="username prime-link" href="/profile">
                      {playerName}
                    </a>

                    <div className="stat-row"><span>Overall Record</span><span>0 - 0</span></div>
                    <div className="stat-row"><span>Reputation</span><span>100%</span></div>
                    <div className="stat-row"><span>Joined</span><span>3/12-2026</span></div>
                  </div>
                </div>

                <div className="box control-center-box">
                  <div className="box-title">Control Center</div>

                  <div className="box-body">
                    <a className="quick-link" href="/profile/edit-profile">Edit Profile</a>
                    <a className="quick-link" href="/profile/teams">My Teams</a>
                    <a className="quick-link" href="/profile/friends">My Friends</a>
                    <a className="quick-link" href="/profile/matches">My Matches</a>
                    <a className="quick-link" href="/profile/awards">My Awards</a>
                    <a className="quick-link" href="/profile/awards">Manage Displayed Awards</a>
                    <a className="quick-link" href="/profile/friends/invite">Invite Friends</a>
                    <a className="quick-link" href="#">Account Settings</a>
                    <a className="quick-link" href="#">Messages</a>
                  </div>
                </div>
              </aside>

              <main className="main-column">
                <div className="gb-rank-box">
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
                        <tr>
                          <td>Username</td>
                          <td>{playerName}</td>
                          <td>
                            <a className="system-link system-xbox" href="https://www.xbox.com/live" target="_blank" rel="noopener noreferrer">
                              Xbox
                            </a>
                          </td>
                          <td>{profile.xbox_gt || "Not Linked"}</td>
                        </tr>

                        <tr>
                          <td>Current Status</td>
                          <td>Online</td>
                          <td>
                            <a className="system-link system-playstation" href="https://www.playstation.com/" target="_blank" rel="noopener noreferrer">
                              PlayStation
                            </a>
                          </td>
                          <td>{profile.psn_gt || "Not Linked"}</td>
                        </tr>

                        <tr>
                          <td>Favorite Game</td>
                          <td>Not Set</td>
                          <td>
                            <a className="system-link system-nintendo" href="https://accounts.nintendo.com/" target="_blank" rel="noopener noreferrer">
                              Nintendo
                            </a>
                          </td>
                          <td>{profile.nintendo_gt || "Not Linked"}</td>
                        </tr>

                        <tr>
                          <td>Favorite System</td>
                          <td>{favoriteSystem}</td>
                          <td>
                            <a className="system-link system-pc" href="https://store.steampowered.com/login/" target="_blank" rel="noopener noreferrer">
                              PC
                            </a>
                          </td>
                          <td>{profile.pc_gt || "Not Linked"}</td>
                        </tr>

                        <tr>
                          <td>Location</td>
                          <td>Not Set</td>
                          <td></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="main-lower-grid">
                  <div className="box top-awards-box">
                    <div className="box-title">Top Awards</div>

                    <div className="box-body">
                      <div className="awards-grid">
                        {topAwards.map((award) => (
                          <div className="award-card" key={award.id}>
                            <div className={`award-emblem ${award.type}`}>
                              {award.type === "diamond" ? <span>{award.label}</span> : award.label}
                            </div>
                            <div className="award-name">{award.name}</div>
                            <div className="award-desc">{award.description}</div>
                          </div>
                        ))}
                      </div>
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
                </div>
              </main>

              <aside className="right-column">
                <div className="box right-box">
                  <div className="box-title">Top Teams</div>
                  <div className="box-body">
                    <div className="display-grid">
                      {topTeams.map((team) => (
                        <div className="team-card" key={team.id}>
                          <div className="team-logo-area">
                            {team.logo_url ? (
                              <img src={team.logo_url} alt={team.name} />
                            ) : (
                              <div className="team-logo-placeholder">
                                {getTeamInitials(team.name)}
                              </div>
                            )}
                          </div>

                          <div className="team-record">{team.record}</div>
                        </div>
                      ))}

                      {Array.from({ length: emptyTeamSlots }).map((_, index) => (
                        <div className="display-card" key={`empty-team-${index}`}>
                          Empty Slot
                        </div>
                      ))}
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
              </aside>
            </div>
          )}

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </div>
    </>
  );
}