"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabase";

type Profile = {
  id?: string;
  username: string | null;
  email: string | null;
  xbox_gt?: string | null;
  psn_gt?: string | null;
  nintendo_gt?: string | null;
  pc_gt?: string | null;
  gt_xbox?: string | null;
  gt_playstation?: string | null;
  gt_nintendo?: string | null;
  gt_pc?: string | null;
  gb_wins?: number | null;
  gb_losses?: number | null;
  gb_rank_points?: number | null;
  favorite_system?: string | null;
  favorite_game?: string | null;
  location?: string | null;
  player_bio?: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
  profile_glow?: string | null;
  display_awards?: string[] | null;
  created_at?: string | null;
};

type AppUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
};

type Award = {
  id: number;
  name: string;
  type: "trophy" | "medal" | "ribbon" | "shield" | "plaque";
  label: string;
  description: string;
};

type TopTeam = {
  id: string;
  name: string;
  record: string;
  role: string;
  logo_url?: string | null;
};

type TopFriend = {
  id: string;
  username: string;
};

function ProfilePageContent() {
  const { user, loading } = useUser();
  const searchParams = useSearchParams();
  const currentUser = user as AppUser | null;
  const requestedUserId = String(searchParams.get("userId") || "");
  const viewedUserId = requestedUserId || currentUser?.id || "";
  const isViewingOwnProfile =
    !!currentUser?.id && (!requestedUserId || requestedUserId === currentUser.id);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [topTeams, setTopTeams] = useState<TopTeam[]>([]);
  const [topFriends, setTopFriends] = useState<TopFriend[]>([]);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [currentProfileName, setCurrentProfileName] = useState("");
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [gbRankDisplay, setGbRankDisplay] = useState("Unranked");

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

  function ordinalRank(value: number) {
    const mod100 = value % 100;
    let suffix = "th";

    if (mod100 < 11 || mod100 > 13) {
      const mod10 = value % 10;
      if (mod10 === 1) suffix = "st";
      if (mod10 === 2) suffix = "nd";
      if (mod10 === 3) suffix = "rd";
    }

    return { number: String(value), suffix };
  }

  function prettyRole(value: string | null | undefined) {
    const clean = String(value || "member").toLowerCase();
    if (clean === "leader") return "Leader";
    if (clean === "co-leader" || clean === "coleader") return "Co-Leader";
    if (clean === "captain") return "Captain";
    return "Member";
  }

  function formatJoinedDate(value: string | null | undefined) {
    if (!value) return "Not Set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not Set";

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}-${year}`;
  }

  useEffect(() => {
    if (!currentUser?.id) {
      setCurrentProfileName("");
      setUnreadInboxCount(0);
      return;
    }

    supabase
      .from("profiles")
      .select("username")
      .eq("id", currentUser.id)
      .maybeSingle()
      .then(({ data }) => {
        setCurrentProfileName(data?.username || "");
      });

    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", currentUser.id)
      .eq("is_read", false)
      .eq("is_archived", false)
      .then(({ count }) => {
        setUnreadInboxCount(count || 0);
      });
  }, [currentUser?.id]);

  useEffect(() => {
    if (!viewedUserId) {
      setProfile(null);
      setTopTeams([]);
      setTopFriends([]);
      setGbRankDisplay("Unranked");
      return;
    }

    supabase
      .from("profiles")
      .select("id, username, email, xbox_gt, psn_gt, nintendo_gt, pc_gt, gt_xbox, gt_playstation, gt_nintendo, gt_pc, gb_wins, gb_losses, gb_rank_points, favorite_system, favorite_game, location, player_bio, avatar_url, logo_url, profile_glow, display_awards, created_at")
      .eq("id", viewedUserId)
      .single()
      .then(async ({ data }) => {
        const loadedProfile = data || null;
        setProfile(loadedProfile);

        const rankPoints = loadedProfile?.gb_rank_points || 0;

        if (rankPoints <= 0) {
          setGbRankDisplay("Unranked");
        } else {
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .gt("gb_rank_points", rankPoints);

          setGbRankDisplay(`${(count || 0) + 1}`);
        }

        if (
          isViewingOwnProfile &&
          !loadedProfile &&
          currentUser?.email &&
          usernameInput === ""
        ) {
          setUsernameInput(currentUser.email.split("@")[0] || "");
        }
      });

    supabase
      .from("team_members")
      .select("team_id, role, teams(id, name, logo_url, wins, losses, created_at)")
      .eq("user_id", viewedUserId)
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
                role: prettyRole((row as any).role),
                logo_url: team.logo_url || null,
              };
            })
            .filter(Boolean) || [];

        setTopTeams(loadedTeams as TopTeam[]);
      });

    supabase
      .from("friend_requests")
      .select("requester_id, recipient_id, status")
      .eq("status", "accepted")
      .or(`requester_id.eq.${viewedUserId},recipient_id.eq.${viewedUserId}`)
      .then(async ({ data }) => {
        const requests = data || [];

        const friendIds = requests
          .map((request: any) =>
            request.requester_id === viewedUserId
              ? request.recipient_id
              : request.requester_id
          )
          .filter(Boolean)
          .slice(0, 4);

        if (friendIds.length === 0) {
          setTopFriends([]);
          return;
        }

        const { data: friendProfiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", friendIds);

        const loadedFriends =
          friendProfiles?.map((friend: any) => ({
            id: friend.id,
            username: friend.username || "Unknown Player",
          })) || [];

        setTopFriends(loadedFriends as TopFriend[]);
      });
  }, [viewedUserId, isViewingOwnProfile, currentUser?.email, usernameInput]);

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
        gb_wins: 0,
        gb_losses: 0,
        gb_rank_points: 0,
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
      id: currentUser.id,
      username: trimmedUsername,
      email: currentUser.email || null,
      xbox_gt: null,
      psn_gt: null,
      nintendo_gt: null,
      pc_gt: null,
      gt_xbox: null,
      gt_playstation: null,
      gt_nintendo: null,
      gt_pc: null,
      gb_wins: 0,
      gb_losses: 0,
      gb_rank_points: 0,
      favorite_system: "PlayStation",
      favorite_game: null,
      location: null,
      player_bio: null,
      avatar_url: null,
      logo_url: null,
      profile_glow: "On",
      display_awards: [],
      created_at: new Date().toISOString(),
    });

    setSaved(true);
    setSaving(false);
  }

  if (loading) {
    return <div className="profile-loading">Loading profile.</div>;
  }

  if (!viewedUserId) {
    return (
      <div className="profile-loading">
        You must be logged in to view your profile.
      </div>
    );
  }

  const playerName = profile?.username || "Prime";
  const gbWins = profile?.gb_wins || 0;
  const gbLosses = profile?.gb_losses || 0;
  const gbRankPoints = profile?.gb_rank_points || 0;
  const favoriteSystem = profile?.favorite_system || "PlayStation";
  const favoriteGame = profile?.favorite_game || "Not Set";
  const playerLocation = profile?.location || "Not Set";
  const playerBio = profile?.player_bio || "";
  const avatarUrl = profile?.avatar_url || "";
  const logoUrl = profile?.logo_url || "";
  const xboxGT = profile?.gt_xbox || profile?.xbox_gt || "";
  const psnGT = profile?.gt_playstation || profile?.psn_gt || "";
  const nintendoGT = profile?.gt_nintendo || profile?.nintendo_gt || "";
  const pcGT = profile?.gt_pc || profile?.pc_gt || "";
  const displayAwards = Array.isArray(profile?.display_awards) ? profile?.display_awards || [] : [];
  const topAwards: Award[] = Array.from({ length: 6 }).map((_, index) => ({
    id: index + 1,
    name: displayAwards[index] || "Award Slot",
    type: "shield",
    label: "?",
    description: displayAwards[index] ? "Displayed award." : "Waiting to earn.",
  }));
  const statusText = isViewingOwnProfile ? "Online" : "Offline";
  const statusClass = isViewingOwnProfile ? "status-online" : "status-offline";
  const rankNumber = Number(gbRankDisplay);
  const rankParts = Number.isFinite(rankNumber) && rankNumber > 0 ? ordinalRank(rankNumber) : null;
  const emptyTeamSlots = Math.max(0, 4 - topTeams.length);
  const joinedDate = profile?.created_at || (isViewingOwnProfile ? currentUser?.created_at : null) || null;

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
          box-shadow:-10px 0 22px rgba(0,255,100,.16),10px 0 22px rgba(0,255,100,.16);
        }

        .profile-page.favorite-playstation .wrapper{
          box-shadow:-10px 0 22px rgba(0,120,255,.20),10px 0 22px rgba(0,120,255,.20);
        }

        .profile-page.favorite-nintendo .wrapper{
          box-shadow:-10px 0 22px rgba(255,45,45,.17),10px 0 22px rgba(255,45,45,.17);
        }

        .profile-page.favorite-pc .wrapper{
          box-shadow:-10px 0 22px rgba(170,95,255,.20),10px 0 22px rgba(170,95,255,.20);
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
          background:transparent;
          border:none;
          display:flex;
          align-items:center;
          padding:0 0 0 2px;
          position:relative;
          overflow:visible;
          box-shadow:none;
        }

        .gb-logo-wrap{
          display:flex;
          align-items:center;
          gap:0;
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
          color:#ffffff;
          font-size:48px;
          font-weight:900;
          letter-spacing:-3px;
          line-height:38px;
          font-style:italic;
          text-transform:uppercase;
          text-shadow:0 2px 0 #02101d,0 0 14px rgba(255,255,255,.25);
        }

        .gb-logo-sub{
          color:#dfeaff;
          font-size:11px;
          font-weight:900;
          letter-spacing:6px;
          margin-top:5px;
          text-transform:uppercase;
          text-shadow:0 0 8px rgba(255,255,255,.16);
        }

        .header-ad{
          width:360px;
          height:64px;
          background:linear-gradient(to bottom,#07111b,#03070c);
          border:1px solid #214d73;
          display:flex;
          align-items:stretch;
          justify-content:stretch;
          overflow:hidden;
          box-shadow:inset 0 0 16px rgba(0,0,0,.9),0 0 10px rgba(47,111,159,.18);
          opacity:.96;
          position:relative;
        }

        .header-ad:after{
          content:"";
          position:absolute;
          inset:0;
          background:linear-gradient(to right,rgba(7,17,27,.25),rgba(7,17,27,0) 42%,rgba(7,17,27,.35));
          pointer-events:none;
        }

        .header-ad:hover{
          opacity:1;
          border-color:#4daeff;
          box-shadow:inset 0 0 16px rgba(0,0,0,.9),0 0 12px rgba(77,174,255,.22);
        }

        .header-ad img{
          width:100%;
          height:100%;
          object-fit:cover;
          object-position:center;
          display:block;
          filter:brightness(.82) contrast(1.12) saturate(.95);
        }

        .header-ad:hover img{
          filter:brightness(.9) contrast(1.14) saturate(1);
        }


        .profile-title-bar{
          margin-top:5px;
          height:78px;
          background:linear-gradient(to bottom,#183b58,#091521);
          border:1px solid #2f6f9f;
          color:#fff;
          display:flex;
          align-items:center;
          padding:0 14px;
          box-shadow:inset 0 0 18px rgba(0,0,0,.72);
        }

        .profile-title-left{
          display:flex;
          align-items:center;
          gap:16px;
          width:100%;
        }

        .title-avatar{
          width:72px;
          height:66px;
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

        .title-avatar:hover{
          border-color:#f2c14e;
          color:#f2c14e;
        }

        
        .title-avatar img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .profile-title-name{
          font-size:34px;
          font-weight:900;
          text-transform:uppercase;
          color:#fff;
          min-height:66px;
          display:flex;
          align-items:center;
          letter-spacing:-.5px;
          text-shadow:2px 2px 0 #000,0 0 10px rgba(242,193,78,.18);
        }

        .prime-link{
          color:#f2c14e;
          font-weight:900;
          line-height:1;
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

        .inbox-tab{
          position:relative;
          padding-right:22px;
        }

        .mail-dot{
          position:absolute;
          right:6px;
          top:4px;
          width:10px;
          height:10px;
          border-radius:50%;
          background:#e60000;
          border:1px solid #ff9a9a;
          box-shadow:0 0 6px rgba(255,0,0,.85);
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
          overflow:hidden;
        }

        .avatar-box img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
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
          background:linear-gradient(to bottom,#142f47,#07111b 62%,#050b12);
          border:1px solid #244b70;
          margin-bottom:5px;
          display:flex;
          align-items:stretch;
          min-height:112px;
          box-shadow:inset 0 0 18px rgba(0,0,0,.82),0 0 14px rgba(242,193,78,.16);
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
          font-size:14px;
          font-weight:900;
          text-transform:uppercase;
          padding-bottom:1px;
          border-bottom:1px solid rgba(242,193,78,.35);
          letter-spacing:1.4px;
          text-shadow:0 1px 2px #000;
        }

        .gb-rank-name{
          color:#fff;
          font-size:42px;
          font-weight:900;
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          padding-top:10px;
        }

        .rank-ordinal{
          display:inline-flex;
          align-items:flex-start;
          justify-content:center;
          line-height:1;
          color:#fff;
        }

        .rank-suffix{
          font-size:14px;
          color:#fff;
          margin-left:2px;
          margin-top:9px;
          line-height:1;
          text-transform:lowercase;
        }

        .gb-rank-points{
          color:#7f8892;
          font-size:10px;
          border-top:1px solid rgba(242,193,78,.35);
          padding-top:3px;
          margin-top:14px;
          text-transform:uppercase;
          font-weight:bold;
          letter-spacing:.8px;
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
          padding-left:28px;
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
          color:#0078ff !important;
        }

        .system-nintendo{
          color:#ff5a5a !important;
        }

        .system-pc{
          color:#b98cff !important;
        }

        .status-online{
          color:#00ff88 !important;
          font-weight:bold;
        }

        .status-away{
          color:#ffd35a !important;
          font-weight:bold;
        }

        .status-offline{
          color:#ff5a5a !important;
          font-weight:bold;
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
          grid-template-columns:repeat(6,1fr);
          gap:6px;
          height:100%;
        }

        .award-card{
          background:linear-gradient(to bottom,#101b25,#05080d);
          border:1px solid #4b5c6b;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-start;
          text-align:center;
          min-height:132px;
          padding:8px 4px;
          box-shadow:inset 0 0 14px rgba(0,0,0,.85);
          overflow:hidden;
        }

        .award-card:hover{
          border-color:#c79b3b;
          background:linear-gradient(to bottom,#172b3c,#080d13);
        }

        .award-card.empty-award{
          border-color:#2f4d66;
          background:linear-gradient(to bottom,#0b1b2a,#03070c);
          opacity:.95;
        }

        .award-card.empty-award:hover{
          border-color:#4d86b8;
          background:linear-gradient(to bottom,#102b43,#050b12);
        }

        .award-icon{
          width:52px;
          height:52px;
          margin-bottom:6px;
          position:relative;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-size:12px;
          font-weight:900;
          text-shadow:0 1px 2px #000;
        }

        .award-icon.trophy{
          background:linear-gradient(to bottom,#f7d778,#9a6713 55%,#352006);
          clip-path:polygon(24% 5%,76% 5%,76% 22%,90% 22%,90% 45%,76% 50%,67% 65%,58% 65%,58% 80%,72% 80%,72% 94%,28% 94%,28% 80%,42% 80%,42% 65%,33% 65%,24% 50%,10% 45%,10% 22%,24% 22%);
          border:1px solid #d1a447;
        }

        .award-icon.medal{
          border-radius:50%;
          background:radial-gradient(circle at 35% 25%,#fff0ad,#b48220 48%,#392405);
          border:3px solid #d8b45a;
          box-shadow:0 0 8px rgba(210,170,75,.28), inset 0 0 8px rgba(0,0,0,.5);
        }

        .award-icon.medal:before{
          content:"";
          position:absolute;
          top:-12px;
          width:30px;
          height:18px;
          background:linear-gradient(to right,#13294d,#c8c8c8,#13294d);
          clip-path:polygon(0 0,100% 0,70% 100%,30% 100%);
        }

        .award-icon.ribbon{
          width:38px;
          height:54px;
          background:linear-gradient(to right,#5b000b,#b30f20,#e5e5e5,#b30f20,#5b000b);
          border:1px solid #c9c9c9;
          clip-path:polygon(0 0,100% 0,100% 76%,50% 100%,0 76%);
        }

        .award-icon.shield{
          background:linear-gradient(to bottom,#d9e7f5,#426d91 50%,#10283d);
          clip-path:polygon(50% 0,90% 14%,84% 68%,50% 100%,16% 68%,10% 14%);
          border:1px solid #b8d6ef;
          color:#07111b;
          text-shadow:none;
        }

        .award-icon.plaque{
          width:58px;
          height:44px;
          border-radius:4px;
          background:linear-gradient(to bottom,#63421c,#b47b2c 50%,#3b2309);
          border:3px solid #221306;
          box-shadow:inset 0 0 8px rgba(255,220,130,.2), 0 2px 4px rgba(0,0,0,.7);
        }

        .award-icon.locked-award{
          width:52px;
          height:52px;
          border-radius:6px;
          background:
            linear-gradient(to bottom,rgba(255,255,255,.12),rgba(0,0,0,.3)),
            linear-gradient(135deg,#27384a,#08111b 58%,#020407);
          border:1px solid #4d86b8;
          color:#8aa7c0;
          box-shadow:inset 0 0 14px rgba(0,0,0,.85),0 0 8px rgba(35,115,190,.18);
          font-size:22px;
          font-weight:900;
        }

        .award-icon.locked-award:before{
          content:"";
          position:absolute;
          top:10px;
          width:21px;
          height:15px;
          border:4px solid #6c8aa3;
          border-bottom:0;
          border-radius:12px 12px 0 0;
        }

        .award-icon.locked-award:after{
          content:"";
          position:absolute;
          bottom:9px;
          width:28px;
          height:23px;
          border-radius:3px;
          background:linear-gradient(to bottom,#7f99b0,#34495d);
          box-shadow:inset 0 0 6px rgba(0,0,0,.55);
        }

        .award-name{
          color:#f2c14e;
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
          color:#d9e6f0;
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

        .friend-card{
          aspect-ratio:1 / 1;
          background:linear-gradient(to bottom,#10283d,#050c14);
          border:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#7fc7ff;
          font-size:12px;
          font-weight:bold;
          text-align:center;
          overflow:hidden;
          padding:6px;
          text-transform:uppercase;
          box-shadow:inset 0 0 14px rgba(0,0,0,.75);
        }

        .friend-card:hover{
          border-color:#f2c14e;
          color:#f2c14e;
          background:linear-gradient(to bottom,#173a56,#06101a);
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

        .team-card:hover{
          border-color:#f2c14e;
        }

        .team-logo-link{
          flex:1;
          width:100%;
          display:block;
          overflow:hidden;
        }

        .team-logo-area{
          width:100%;
          height:100%;
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
          object-position:center;
          display:block;
          transform:scale(1.08);
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
          min-height:32px;
          background:linear-gradient(to bottom,#10283d,#050c14);
          border-top:1px solid #2f6f9f;
          color:#f2c14e;
          font-size:10px;
          font-weight:bold;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          line-height:13px;
          text-transform:uppercase;
        }

        .team-role{
          color:#fff;
          font-size:10px;
          font-weight:900;
          letter-spacing:.4px;
          text-shadow:0 1px 2px #000;
        }

        .team-score{
          color:#f2c14e;
          font-size:11px;
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
                <div>
                  <div className="gb-logo-text">GAMEBATTLES</div>
                  <div className="gb-logo-sub">WHERE GAMING FINDS ITS EDGE</div>
                </div>
              </div>
            </div>

            <a
              className="header-ad"
              href="https://discord.gg/nKZdS2BDS6"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/bc4b22ea-8e19-47ac-8e15-b369edac44fa.png" alt="Join the GameBattles Discord" />
            </a>
          </header>

          <div className="profile-title-bar">
            <div className="profile-title-left">
              <div className="title-avatar">
                {avatarUrl ? <img src={avatarUrl} alt={playerName} /> : "AVATAR"}
              </div>

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
            <a className="tab inbox-tab" href="/profile/inbox">
              Inbox
              {unreadInboxCount > 0 && <span className="mail-dot"></span>}
            </a>
          </div>

          {!profile ? (
            isViewingOwnProfile ? (
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
              <div className="box" style={{ marginTop: 8 }}>
                <div className="box-title">Profile Not Found</div>
                <div className="complete-profile">
                  This player profile could not be found.
                </div>
              </div>
            )
          ) : (
            <div className="profile-grid">
              <aside className="left-column">
                <div className="box">
                  <div className="box-title">Profile</div>

                  <div className="box-body">
                    <div className="avatar-box">{logoUrl ? <img src={logoUrl} alt={`${playerName} Logo`} /> : avatarUrl ? <img src={avatarUrl} alt={playerName} /> : "PLAYER IMAGE"}</div>

                    
                    <div className="stat-row"><span>Reputation</span><span>100%</span></div>
                    <div className="stat-row"><span>Joined</span><span>{formatJoinedDate(joinedDate)}</span></div>
                  </div>
                </div>

                <div className="box control-center-box">
                  <div className="box-title">
                    {isViewingOwnProfile ? "Control Center" : "Player Actions"}
                  </div>

                  <div className="box-body">
                    {isViewingOwnProfile ? (
                      <>
                        <a className="quick-link" href="/profile/edit">Edit Profile</a>
                        <a className="quick-link" href="/profile/teams">My Teams</a>
                        <a className="quick-link" href="/profile/friends">My Friends</a>
                        <a className="quick-link" href="/profile/awards">My Awards</a>
                        <a className="quick-link" href="/profile/friends/invite">Invite Friends</a>
                        <a className="quick-link" href="#">Account Settings</a>
                      </>
                    ) : (
                     <>
  <a
  className="quick-link"
  href="#"
  onClick={async (e) => {
    e.preventDefault();

    if (!currentUser?.id) return;
    if (!viewedUserId) return;
    if (currentUser.id === viewedUserId) return;

    const { data: existing } = await supabase
      .from("friend_requests")
      .select("id")
      .eq("requester_id", currentUser.id)
      .eq("recipient_id", viewedUserId)
      .maybeSingle();

    if (existing) {
      alert("Friend request already sent.");
      return;
    }

    const { data: friendRequest, error } = await supabase
      .from("friend_requests")
      .insert({
        requester_id: currentUser.id,
        recipient_id: viewedUserId,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !friendRequest?.id) {
      alert("Unable to send friend request.");
      return;
    }

    const requesterName = currentProfileName || "A player";

    await supabase.rpc("send_system_message", {
      target_user_id: viewedUserId,
      message_subject: "Friend Request",
      message_body: `${requesterName} would like to add you as a friend.\n\nUse the Accept or Decline buttons in this message to respond to the request.`,
      message_type_value: "system",
      related_type_value: "friend_request",
      related_id_value: friendRequest.id,
    });

    alert("Friend request sent.");
  }}
>
  Add Friend
</a>

  <a className="quick-link" href="#">
    Message Player
  </a>

  <a className="quick-link" href={`/profile/awards?userId=${viewedUserId}`}>
    View Player Awards
  </a>

  <a className="quick-link" href={`/profile/friends?userId=${viewedUserId}`}>
    View Player Friends
  </a>

  <a className="quick-link" href={`/profile/teams?userId=${viewedUserId}`}>
    View Player Teams
  </a>

  <a className="quick-link" href="/home">
    Back To Home
  </a>
</>
                    )}
                  </div>
                </div>
              </aside>

              <main className="main-column">
                <div className="gb-rank-box">
                  <div className="gb-rank">
                    <div className="gb-rank-title">GB Rank</div>
                    <div className="gb-rank-name">
                      {rankParts ? (
                        <span className="rank-ordinal">
                          <span>{rankParts.number}</span>
                          <sup className="rank-suffix">{rankParts.suffix}</sup>
                        </span>
                      ) : (
                        gbRankDisplay
                      )}
                    </div>
                    <div className="gb-rank-points">GB Rank Points: {gbRankPoints}</div>
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
                            <a className="system-link system-xbox" href="/profile/edit">
                              Xbox
                            </a>
                          </td>
                          <td>{xboxGT || "Not Linked"}</td>
                        </tr>

                        <tr>
                          <td>Current Status</td>
                          <td className={statusClass}>{statusText}</td>
                          <td>
                            <a className="system-link system-playstation" href="/profile/edit">
                              PlayStation
                            </a>
                          </td>
                          <td>{psnGT || "Not Linked"}</td>
                        </tr>

                        <tr>
                          <td>Favorite Game</td>
                          <td>{favoriteGame || "Not Set"}</td>
                          <td>
                            <a className="system-link system-nintendo" href="/profile/edit">
                              Nintendo
                            </a>
                          </td>
                          <td>{nintendoGT || "Not Linked"}</td>
                        </tr>

                        <tr>
                          <td>Favorite System</td>
                          <td>{favoriteSystem}</td>
                          <td>
                            <a className="system-link system-pc" href="/profile/edit">
                              PC
                            </a>
                          </td>
                          <td>{pcGT || "Not Linked"}</td>
                        </tr>

                        <tr>
                          <td>Location</td>
                          <td>{playerLocation}</td>
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
                          <div className="award-card empty-award" key={award.id}>
                            <div className="award-icon locked-award"></div>
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
                          {playerBio ||
                            "This player has not written an intro yet. Later, this section will let players write a short profile blog about their gaming style, favorite games, teams, competitive history, and what kind of matches they are looking for."}
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
                          <a className="team-logo-link" href={`/teams/${team.id}`}>
                            <div className="team-logo-area">
                              {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} />
                              ) : (
                                <div className="team-logo-placeholder">
                                  {getTeamInitials(team.name)}
                                </div>
                              )}
                            </div>
                          </a>

                          <div className="team-record">
                            <span className="team-role">{team.role}</span>
                            <span className="team-score">{team.record}</span>
                          </div>
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
                      {topFriends.map((friend) => (
                        <a
                          className="friend-card"
                          href={`/profile?userId=${friend.id}`}
                          key={friend.id}
                        >
                          {friend.username}
                        </a>
                      ))}

                      {Array.from({ length: Math.max(0, 4 - topFriends.length) }).map(
                        (_, index) => (
                          <div className="display-card" key={`empty-friend-${index}`}>
                            Empty Slot
                          </div>
                        )
                      )}
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="profile-loading">Loading profile.</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
