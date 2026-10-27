"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteNav from "../components/SiteNav";
import { useUser } from "../../lib/useUser";
import { RankEmblem, getRankTier } from "./RankEmblem";
import AwardArt, { AWARD_CSS } from "../awards/AwardArt";
import { supabase } from "../../lib/supabase";
import {
  GamingAccount,
} from "../../lib/gamingAccounts";

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
  role?: string | null;
  player_bio?: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
  profile_glow?: string | null;
  display_awards?: string[] | null;
  created_at?: string | null;
  profile_views?: number | null;
}

type AppUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
};

type Award = {
  id: number;
  name: string;
  group: string;
  type: "trophy" | "medal" | "ribbon" | "shield" | "plaque";
  label: string;
  description: string;
};

type AwardHistoryEntry = {
  id: number;
  name: string;
  award_group: string;
  reason: string;
  granted_at: string;
  granted_by: string | null;
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
  const [gamingAccounts, setGamingAccounts] = useState<GamingAccount[]>([]);
  const [topTeams, setTopTeams] = useState<TopTeam[]>([]);
  const [topFriends, setTopFriends] = useState<TopFriend[]>([]);
  const [earnedAwards, setEarnedAwards] = useState<AwardHistoryEntry[]>([]);
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
      setGamingAccounts([]);
      setTopTeams([]);
      setTopFriends([]);
      setEarnedAwards([]);
      setGbRankDisplay("Unranked");
      return;
    }

    supabase
      .from("profiles")
      .select("id, username, email, xbox_gt, psn_gt, nintendo_gt, pc_gt, gt_xbox, gt_playstation, gt_nintendo, gt_pc, gb_wins, gb_losses, gb_rank_points, favorite_system, favorite_game, location, role, player_bio, avatar_url, logo_url, profile_glow, display_awards, created_at, profile_views")
      .eq("id", viewedUserId)
      .single()
      .then(async ({ data }) => {
        const loadedProfile = data || null;
        setProfile(loadedProfile);

        if (loadedProfile && !isViewingOwnProfile) {
          const { data: totalViews } = await supabase.rpc("record_profile_view", {
            target_profile_id: viewedUserId,
          });
          if (typeof totalViews === "number") {
            setProfile({ ...loadedProfile, profile_views: totalViews });
          }
        }

        if (loadedProfile?.username) {
          const { data: awardRows, error: awardsError } = await supabase.rpc(
            "staff_player_award_history",
            { target_username: loadedProfile.username }
          );
          if (awardsError) {
            console.error("Player award history could not be loaded:", awardsError);
            setEarnedAwards([]);
          } else {
            setEarnedAwards((awardRows || []) as AwardHistoryEntry[]);
          }
        } else {
          setEarnedAwards([]);
        }

        const { data: accountRows, error: accountsError } = await supabase
          .from("gaming_accounts")
          .select("id,user_id,platform,category,game,account_id")
          .eq("user_id", viewedUserId)
          .order("platform")
          .order("game");

        if (accountsError) {
          setError("Gaming accounts could not be loaded: " + accountsError.message);
        } else {
          setGamingAccounts((accountRows || []) as GamingAccount[]);
        }

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
  const playerLocation = profile?.location || "Not Set";
  const playerRole = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "Member";
  const playerBio = profile?.player_bio || "";
  const avatarUrl = profile?.avatar_url || "";
  const logoUrl = profile?.logo_url || "";
  const xboxGT = profile?.gt_xbox || profile?.xbox_gt || "";
  const psnGT = profile?.gt_playstation || profile?.psn_gt || "";
  const nintendoGT = profile?.gt_nintendo || profile?.nintendo_gt || "";
  const pcGT = profile?.gt_pc || profile?.pc_gt || "";
  const eaGT =
    gamingAccounts.find((account) => account.platform === "ea")?.account_id || "";
  const displayAwards = Array.isArray(profile?.display_awards) ? profile?.display_awards || [] : [];
  const topAwards: Award[] = Array.from({ length: 6 }).map((_, index) => {
    const earnedAward = earnedAwards[index];
    return {
      id: earnedAward?.id || index + 1,
      name: earnedAward?.name || displayAwards[index] || "Award Slot",
      group: earnedAward?.award_group || "",
      type: "shield",
      label: earnedAward ? "★" : "?",
      description: earnedAward
        ? `${earnedAward.award_group} Â· ${earnedAward.reason}`
        : displayAwards[index]
          ? "Displayed award."
          : "Waiting to earn.",
    };
  });
  const statusText = isViewingOwnProfile ? "Online" : "Offline";
  const statusClass = isViewingOwnProfile ? "status-online" : "status-offline";
  const rankNumber = Number(gbRankDisplay);
  const rankParts = Number.isFinite(rankNumber) && rankNumber > 0 ? ordinalRank(rankNumber) : null;
  const emptyTeamSlots = Math.max(0, 4 - topTeams.length);
  const joinedDate = profile?.created_at || (isViewingOwnProfile ? currentUser?.created_at : null) || null;

  function formatMemberSince(value: string | null | undefined) {
    if (!value) return "Not Set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not Set";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  const rankTier = getRankTier(gbRankPoints);
  const totalGames = gbWins + gbLosses;
  const winPct = totalGames > 0 ? Math.round((gbWins / totalGames) * 100) : 0;
  const linkedPlatforms = [
    { name: "Xbox", cls: "system-xbox", id: xboxGT },
    { name: "PlayStation", cls: "system-playstation", id: psnGT },
    { name: "Nintendo", cls: "system-nintendo", id: nintendoGT },
    { name: "PC", cls: "system-pc", id: pcGT },
    { name: "EA", cls: "system-ea", id: eaGT },
  ];

  return (
    <>
      <style>{AWARD_CSS}</style>
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

        .discord-banner{
          display:block;
          text-decoration:none;
        }

        .discord-banner-art{
          width:100%;
          height:100%;
          display:block;
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

        .system-ea{
          color:#ff7a1a !important;
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

        .pf-banner{
          margin-top:6px;
          background:linear-gradient(180deg,#1c2a3a,#101b28);
          border:1px solid #244b70;
        }
        .pf-banner-top{
          display:flex;
          align-items:flex-start;
          gap:18px;
          padding:16px;
        }
        .pf-avatar{
          width:150px;
          height:150px;
          flex:none;
          position:relative;
          background:radial-gradient(circle at 30% 25%,#1d4a74,#0a1521 75%);
          border:2px solid #3b86c4;
          border-radius:18px;
          box-shadow:0 0 0 3px rgba(11,29,44,.9),0 6px 18px rgba(0,0,0,.5),0 0 16px rgba(77,178,255,.25);
          display:flex;
          align-items:center;
          justify-content:center;
          color:#f2c14e;
          font-size:46px;
          font-weight:bold;
          overflow:hidden;
        }
        .pf-avatar .pf-avatar-bg{ position:absolute; inset:-12px; width:calc(100% + 24px); height:calc(100% + 24px); object-fit:cover; filter:blur(14px) brightness(.55) saturate(1.4); }
        .pf-avatar img.pf-avatar-img{ position:relative; width:100%; height:100%; object-fit:contain; padding:6px; filter:drop-shadow(0 2px 6px rgba(0,0,0,.6)); }
        .pf-identity{ flex:1; min-width:0; align-self:stretch; display:flex; flex-direction:column; justify-content:space-between; }
        .pf-name{
          font-size:34px;
          font-weight:bold;
          color:#f2c14e;
          text-transform:uppercase;
          letter-spacing:.5px;
          overflow-wrap:anywhere;
        }
        .pf-facts{ display:flex; gap:28px; flex-wrap:wrap; }
        .pf-facts span{ display:block; font-size:11px; color:#8fa9c2; font-weight:bold; margin-bottom:2px; }
        .pf-facts strong{ font-size:15px; color:#fff; }
        .pf-banner-actions{ display:flex; flex-direction:column; gap:8px; width:170px; flex:none; }
        .pf-btn{
          display:block;
          text-align:center;
          background:#1d7be0;
          color:#fff;
          font-size:12px;
          font-weight:bold;
          padding:8px 10px;
          border-radius:2px;
        }
        .pf-btn:hover{ background:#3b91f0; }
        .pf-banner-strip{
          display:flex;
          justify-content:flex-end;
          gap:26px;
          padding:8px 16px;
          background:#0a1521;
          border-top:1px solid #244b70;
        }
        .pf-count{ display:flex; align-items:center; gap:8px; font-size:16px; font-weight:bold; color:#fff; }
        .pf-count-icon{
          width:24px; height:24px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:12px; color:#2b1a00;
        }
        .pf-count-icon.gold{ background:linear-gradient(#ffe38a,#d99a1c); }
        .pf-count-icon.silver{ background:linear-gradient(#f4f7fa,#9aa7b4); }
        .pf-count-icon.bronze{ background:linear-gradient(#e8b27c,#9a5a24); }

        .tabs{
          height:auto;
          background:#07111b;
          border:1px solid #244b70;
          border-top:none;
          padding:0;
          display:flex;
          align-items:stretch;
        }
        .tab{
          flex:1;
          height:auto;
          padding:12px 8px;
          background:transparent;
          border:none;
          border-bottom:2px solid transparent;
          margin:0;
          text-align:center;
          color:#b9cde0;
          font-weight:normal;
          font-size:13px;
        }
        .tab:hover{ color:#fff; }
        .tab.active{ background:transparent; color:#4aa3ff; border-bottom-color:#4aa3ff; }
        .inbox-tab{ padding-right:8px; }
        .mail-dot{ right:calc(50% - 30px); }

        .profile-grid{ grid-template-columns:260px 1fr; gap:14px; margin-top:14px; }
        .left-column,.main-column{ min-height:0; }
        .main-column{ gap:14px; }

        .pf-rank-box{ text-align:center; padding:18px 12px 10px; }
        .pf-star{ width:170px; margin:0 auto 6px; filter:drop-shadow(0 4px 10px rgba(242,193,78,.35)); }
        .pf-star svg{ width:100%; display:block; }
        .pf-rank-label{ font-size:12px; font-weight:bold; color:#8fa9c2; letter-spacing:1px; }
        .pf-rank-value{ font-size:34px; font-weight:bold; color:#fff; line-height:1.1; }
        .pf-rank-value sup{ font-size:16px; }
        .pf-rank-points{ font-size:11px; color:#8fa9c2; margin-bottom:12px; }

        .pf-section{ min-width:0; }
        .pf-section-title{
          display:flex; align-items:center; gap:12px;
          color:#b9cde0; font-size:15px; margin-bottom:10px;
        }
        .pf-section-title::after{ content:""; flex:1; height:1px; background:#244b70; }
        .pf-award-row{ display:grid; grid-template-columns:repeat(6,1fr); gap:6px; }
        .pf-award{ text-align:center; position:relative; padding:2px 0 0; }
        .pf-award-art{ height:104px; display:flex; align-items:flex-end; justify-content:center; position:relative; transition:transform .25s; }
        .pf-award-art .award-art,.pf-award-art .award-sprite{ width:auto; max-width:100%; height:104px!important; overflow:visible; animation:pfFloat 4s ease-in-out infinite; filter:saturate(.82) contrast(1.12) brightness(.92) drop-shadow(0 4px 6px rgba(0,0,0,.7)); }
        .pf-award:nth-child(2n) .award-art,.pf-award:nth-child(2n) .award-sprite{ animation-delay:-1.3s; }
        .pf-award:nth-child(3n) .award-art,.pf-award:nth-child(3n) .award-sprite{ animation-delay:-2.4s; }
        .pf-award.earned .pf-award-art:after{ content:""; position:absolute; left:14%; right:14%; bottom:-3px; height:7px; border-radius:50%; background:radial-gradient(ellipse,rgba(110,190,255,.55),transparent 70%); }
        .pf-award.earned:hover .pf-award-art{ transform:translateY(-3px) scale(1.12); z-index:2; }
        .pf-award-ghost{ opacity:.35; width:60px; height:80px; }
        .pf-award.locked .pf-award-art{ align-items:center; }
        .pf-award-name{ font-size:11px; color:#b9cde0; overflow-wrap:anywhere; margin-top:4px; line-height:1.2; }
        .pf-award.locked .pf-award-name{ color:#5f7e9c; }
        @keyframes pfFloat{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-3px) } }
        @media (prefers-reduced-motion:reduce){ .pf-award-art .award-art,.pf-award-art .award-sprite{ animation:none } }
        .pf-friend-row{ display:flex; flex-wrap:wrap; gap:14px; }
        .pf-friend{ width:72px; text-align:center; font-size:11px; color:#d7eaff; }
        .pf-friend-avatar{
          width:54px; height:54px; margin:0 auto 4px; border-radius:50%;
          background:radial-gradient(circle at 30% 25%,#245f94,#0a1521 80%); border:2px solid #3b86c4;
          box-shadow:0 2px 8px rgba(0,0,0,.45);
          display:flex; align-items:center; justify-content:center;
          font-weight:bold; font-size:16px; color:#f2c14e;
        }
        .pf-friend span{ display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pf-showall{
          display:block; margin-top:10px; text-align:center; padding:6px;
          background:#0b1d2c; border:1px solid #244b70; color:#d7eaff; font-size:12px; font-weight:bold;
        }
        .pf-empty{ color:#8fa9c2; font-size:12px; padding:6px 0; }
        .pf-two-col{ display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        .pf-team{
          display:grid; grid-template-columns:54px 1fr auto; gap:10px; align-items:center;
          padding:8px 0; border-bottom:1px solid #16273a; color:#fff;
        }
        .pf-team-logo{
          width:54px; height:54px; background:radial-gradient(circle at 30% 25%,#1d4a74,#0a1521 80%); border:2px solid #3b86c4; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          color:#f2c14e; font-weight:bold; font-size:18px; overflow:hidden;
        }
        .pf-team-logo img{ width:100%; height:100%; object-fit:contain; padding:3px; }
        .pf-team-name{ font-weight:bold; font-size:13px; overflow-wrap:anywhere; }
        .pf-team-meta{ text-align:right; font-size:12px; color:#b9cde0; }
        .pf-team-meta strong{ display:block; color:#fff; }
        .pf-record-head,.pf-record-row{
          display:grid; grid-template-columns:1fr 70px 40px; gap:8px;
          padding:6px 4px; font-size:12px; align-items:center;
        }
        .pf-record-head{ color:#8fa9c2; font-weight:bold; border-bottom:1px solid #244b70; }
        .pf-record-row{ border-bottom:1px solid #16273a; color:#fff; }
        .pf-record-row .pf-linked{ grid-column:2 / span 2; color:#b9cde0; }
        .pf-gap{ margin-top:12px; }
        .pf-bio{ font-size:13px; line-height:1.5; color:#d7eaff; }

        .profile-page{ background:linear-gradient(180deg,#071522,#050e18 60%,#040a12); }
        .wrapper{ background:#07121f; padding-bottom:8px; }
        .site-nav-bar{ margin-top:0; }
        .pf-banner{ margin-top:0; background:linear-gradient(180deg,#0f2236,#09141f); }
        .pf-banner-top{ padding:12px 14px; gap:14px; }
        .pf-avatar{ width:120px; height:120px; font-size:38px; }
        .pf-name{ font-size:30px; }
        .tab{ padding:9px 6px; }
        .profile-grid{ margin-top:10px; gap:10px; padding:0 8px; }
        .main-column{ gap:10px; }
        .pf-section{ background:#09182a; border:1px solid #1d3d5c; padding:10px 12px; }
        .pf-section-title{ margin-bottom:8px; font-size:14px; }
        .box{ background:#09182a; margin-bottom:8px; }
        .box-title{ background:linear-gradient(to bottom,#15324d,#0b1f33); }
        .pf-rank-box{ padding:12px 10px 8px; background:radial-gradient(circle at 50% 30%,#10304f,#09182a 70%); }
        .pf-emblem{ width:180px; height:180px; display:block; margin:0 auto; }
        .pf-tier-name{ font-size:18px; font-weight:bold; text-transform:uppercase; letter-spacing:2px; margin:2px 0 6px; }
        .pf-rank-value{ font-size:28px; }
        .pf-friend-avatar{ background:radial-gradient(circle at 30% 25%,#245f94,#0a1521 80%); }
        .pf-team-logo{ background:radial-gradient(circle at 30% 25%,#1d4a74,#0a1521 80%); }
        .pf-showall{ background:#0f2a43; margin-top:8px; }
        .pf-two-col{ gap:10px; }
        .pf-two-col .pf-section{ min-width:0; }
        .pf-bio{ margin:0; }
        .pf-facts{ gap:16px; flex-wrap:nowrap; }
        .pf-facts > div{ white-space:nowrap; }
        .pf-banner-actions{ width:150px; }
        .pf-tags{ display:flex; flex-direction:column; gap:5px; width:230px; flex:none; align-self:stretch; justify-content:center; }
        .pf-tag{
          display:grid; grid-template-columns:92px 1fr; align-items:center;
          background:#0a1c2e; border:1px solid #244b70; border-left-width:4px;
          font-size:12px; min-height:26px;
        }
        .pf-tag-platform{ padding:0 8px; font-weight:bold; font-size:11px; text-transform:uppercase; letter-spacing:.3px; }
        .pf-tag-id{ padding:0 8px; color:#fff; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; background:rgba(255,255,255,.05); line-height:26px; }
        .system-xbox-tag{ border-left-color:#2bd96b; } .system-xbox-tag .pf-tag-platform{ color:#2bd96b; }
        .system-playstation-tag{ border-left-color:#2f7bff; } .system-playstation-tag .pf-tag-platform{ color:#4d94ff; }
        .system-nintendo-tag{ border-left-color:#ff4b4b; } .system-nintendo-tag .pf-tag-platform{ color:#ff6b6b; }
        .system-pc-tag{ border-left-color:#a56bff; } .system-pc-tag .pf-tag-platform{ color:#b98cff; }
        .system-ea-tag{ border-left-color:#ff8a2a; } .system-ea-tag .pf-tag-platform{ color:#ff9a45; }
        .pf-tag-empty{ color:#8fa9c2; font-size:12px; text-align:center; }
        .profile-grid{ align-items:start; }
        .left-column{ min-height:0; }

        @media (max-width:900px){
          .pf-banner-top{ flex-wrap:wrap; }
          .pf-banner-actions{ width:100%; flex-direction:row; }
          .pf-tags{ width:100%; }
          .profile-grid{ grid-template-columns:1fr; }
          .pf-two-col{ grid-template-columns:1fr; }
          .pf-award-row{ grid-template-columns:repeat(3,1fr); }
          .tabs{ flex-wrap:wrap; }
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
              className="header-ad discord-banner"
              href="https://discord.gg/nKZdS2BDS6"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className="discord-banner-art"
                viewBox="0 0 360 64"
                preserveAspectRatio="none"
                role="img"
                aria-labelledby="discord-banner-title"
              >
                <title id="discord-banner-title">Join the GameBattles Discord</title>
                <defs>
                  <linearGradient id="discord-banner-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#142f47" />
                    <stop offset="1" stopColor="#07111b" />
                  </linearGradient>
                </defs>
                <rect width="360" height="64" fill="url(#discord-banner-bg)" />
                <path d="M0 52H360" stroke="#244b70" strokeWidth="1" />
                <path d="M0 4H360" stroke="#2f6f9f" strokeOpacity=".35" />
                <g transform="translate(11 8) scale(.72)" fill="#8ea0ff">
                  <path d="M50.6 14.7a48 48 0 0 0-11.8-3.6l-1.5 3.1a44 44 0 0 0-10.6 0l-1.5-3.1a48 48 0 0 0-11.8 3.6C6 25.8 4 36.6 5 47.2a48 48 0 0 0 14.5 7.3l3.1-5.1a31 31 0 0 1-4.9-2.4l1.2-.9c9.4 4.4 19.7 4.4 29 0l1.2.9a31 31 0 0 1-4.9 2.4l3.1 5.1A48 48 0 0 0 57 47.2c1.2-12.3-2-23-6.4-32.5ZM23.8 39.4c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Zm16.4 0c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Z" />
                </g>
                <text x="82" y="29" fill="#f2c14e" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" letterSpacing=".6">
                  JOIN THE GAMEBATTLES DISCORD
                </text>
                <text x="82" y="43" fill="#d7eaff" fontFamily="Arial, sans-serif" fontSize="9" letterSpacing=".5">
                  FIND PLAYERS • SET UP YOUR NEXT MATCH
                </text>
              </svg>
            </a>
          </header>

          <SiteNav />

          {profile ? (
            <div className="pf-banner">
              <div className="pf-banner-top">
                <div className="pf-avatar">
                  {logoUrl || avatarUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="pf-avatar-bg" src={logoUrl || avatarUrl} alt="" aria-hidden="true" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="pf-avatar-img" src={logoUrl || avatarUrl} alt={playerName} />
                    </>
                  ) : (
                    <span>{playerName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <div className="pf-identity">
                  <div className="pf-name">{playerName}</div>
                  <div className="pf-facts">
                    <div>
                      <span>Member Since</span>
                      <strong>{formatMemberSince(joinedDate)}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong className={statusClass}>{statusText}</strong>
                    </div>
                    <div>
                      <span>Profile Views</span>
                      <strong>{(profile.profile_views || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span>Location</span>
                      <strong>{playerLocation}</strong>
                    </div>
                    <div>
                      <span>Role</span>
                      <strong>{playerRole}</strong>
                    </div>
                  </div>
                </div>

                <div className="pf-tags">
                  {linkedPlatforms.filter((p) => p.id).map((p) => (
                    <div className={`pf-tag ${p.cls}-tag`} key={p.name}>
                      <span className="pf-tag-platform">{p.name}</span>
                      <span className="pf-tag-id">{p.id}</span>
                    </div>
                  ))}
                  {linkedPlatforms.every((p) => !p.id) && (
                    <div className="pf-tag-empty">No gaming accounts linked</div>
                  )}
                </div>

                <div className="pf-banner-actions">
                  {isViewingOwnProfile ? (
                    <>
                      <a className="pf-btn" href="/profile/edit">Edit Profile</a>
                      <a className="pf-btn" href="/profile/edit?focus=gaming-account">Gaming Accounts</a>
                    </>
                  ) : (
                    <a className="pf-btn" href={`/profile/friends?userId=${viewedUserId}`}>View Friends</a>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="profile-title-bar">
              <div className="profile-title-left">
                <div className="title-avatar">AVATAR</div>
                <div className="profile-title-name">Complete Your Profile</div>
              </div>
            </div>
          )}

          <div className="tabs">
            <a className="tab active" href="/profile">Profile</a>
            <a className="tab" href="/profile/teams">Teams</a>
            <a className="tab" href="/profile/friends">Friends</a>
            <a className="tab" href="/profile/awards">Awards</a>
            <a className="tab" href="/players">Find Players</a>
            {isViewingOwnProfile && (
              <a className="tab" href="/profile/edit?focus=gaming-account">
                Gaming Accounts
              </a>
            )}
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
                <div className="box pf-rank-box">
                  <RankEmblem tierIndex={rankTier.index} />
                  <div className="pf-tier-name" style={{ color: rankTier.light }}>{rankTier.name}</div>
                  <div className="pf-rank-label">GB RANK</div>
                  {rankParts && (
                    <div className="pf-rank-value">
                      {rankParts.number}
                      <sup>{rankParts.suffix}</sup>
                    </div>
                  )}
                  <div className="pf-rank-points">{gbRankPoints} points</div>
                  <div className="stat-row"><span>Reputation</span><span>100%</span></div>
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
                <div className="pf-section">
                  <div className="pf-section-title"><span>Top Awards</span></div>
                  <div className="pf-award-row">
                    {topAwards.map((award) => (
                      <div
                        className={`pf-award ${award.label === "★" ? "earned" : "locked"}`}
                        key={award.id}
                        title={`${award.name} — ${award.description}`}
                      >
                        <div className="pf-award-art">
                          {award.label === "★" ? (
                            <AwardArt name={award.name} group={award.group} height={92} />
                          ) : (
                            <svg className="pf-award-ghost" viewBox="0 0 60 80" aria-hidden="true">
                              <path d="M30 4 L54 14 V40 C54 58 42 70 30 76 C18 70 6 58 6 40 V14 Z" fill="none" stroke="#4a7aa8" strokeWidth="2" strokeDasharray="4 4" />
                              <path d="M30 28 V46 M30 54 V56" stroke="#4a7aa8" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>
                        <div className="pf-award-name">{award.label === "★" ? award.name : "Locked"}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pf-section">
                  <div className="pf-section-title"><span>Top Friends</span></div>
                  <div className="pf-friend-row">
                    {topFriends.map((friend) => (
                      <a className="pf-friend" href={`/profile?userId=${friend.id}`} key={friend.id}>
                        <div className="pf-friend-avatar">{friend.username.slice(0, 2).toUpperCase()}</div>
                        <span>{friend.username}</span>
                      </a>
                    ))}
                    {topFriends.length === 0 && <div className="pf-empty">No friends to show yet.</div>}
                  </div>
                  <a className="pf-showall" href={`/profile/friends${isViewingOwnProfile ? "" : `?userId=${viewedUserId}`}`}>show all</a>
                </div>

                <div className="pf-two-col">
                  <div className="pf-section">
                    <div className="pf-section-title"><span>Featured Teams</span></div>
                    {topTeams.map((team) => (
                      <a className="pf-team" href={`/teams/${team.id}`} key={team.id}>
                        <div className="pf-team-logo">
                          {team.logo_url ? <img src={team.logo_url} alt={team.name} /> : getTeamInitials(team.name)}
                        </div>
                        <div className="pf-team-name">{team.name}</div>
                        <div className="pf-team-meta">
                          <strong>{team.role}</strong>
                          <span>{team.record}</span>
                        </div>
                      </a>
                    ))}
                    {topTeams.length === 0 && <div className="pf-empty">Not on any teams yet.</div>}
                    <a className="pf-showall" href={`/profile/teams${isViewingOwnProfile ? "" : `?userId=${viewedUserId}`}`}>show all</a>
                  </div>

                  <div className="pf-section">
                    <div className="pf-section-title"><span>Records</span></div>
                    <div className="pf-record-head">
                      <span>Overall</span>
                      <span>W</span>
                      <span>L</span>
                    </div>
                    <div className="pf-record-row">
                      <span>Win rate {winPct}%</span>
                      <span>{gbWins}</span>
                      <span>{gbLosses}</span>
                    </div>
                    <div className="pf-record-head pf-gap">
                      <span>Linked Accounts</span>
                      <span></span>
                      <span></span>
                    </div>
                    {linkedPlatforms.map((platform) => (
                      <div className="pf-record-row" key={platform.name}>
                        <span className={`system-link ${platform.cls}`}>{platform.name}</span>
                        <span className="pf-linked">{platform.id || "Not Linked"}</span>
                        <span></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pf-section">
                  <div className="pf-section-title"><span>About {playerName}</span></div>
                  <p className="pf-bio">
                    {playerBio || "This player has not written an intro yet."}
                  </p>
                </div>
              </main>
            </div>
          )}

          <footer className="footer">Â© 2026 Competitive Gaming Network</footer>
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
