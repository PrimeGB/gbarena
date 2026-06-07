"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabase";

type AppUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    username?: string;
    display_name?: string;
  };
};

type TeamRow = {
  id: string;
  name: string;
  created_at?: string;
  platform?: string | null;
  category?: string | null;
  game?: string | null;
  ladder?: string | null;
};

type PlayerSearchResult = {
  id: string;
  username: string | null;
  email: string | null;
  canInvite: boolean;
};

type TeamRole = "Leader" | "Co-Leader" | "Captain" | "Recruit" | "Member";

type RosterSlot = {
  slot: number;
  playerId: string | null;
  username: string;
  role: TeamRole;
};

type NameStatus = "idle" | "checking" | "available" | "taken";

function prettyText(value: string | null) {
  if (!value) return "";
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getLadderName(ladder: string | null) {
  if (ladder === "singles") return "Solos Ladder";
  if (ladder === "duos") return "Duos Ladder";
  if (ladder === "team") return "Team Ladder";
  return "Team Ladder";
}

function getRosterLimit(ladder: string | null) {
  if (ladder === "singles") return 1;
  if (ladder === "duos") return 2;
  return 8;
}

function getExtraRosterSlots(ladder: string | null) {
  if (ladder === "singles") return 0;
  if (ladder === "duos") return 1;
  return 7;
}

function buildRosterSlots(count: number): RosterSlot[] {
  return Array.from({ length: count }, (_, index) => ({
    slot: index + 1,
    playerId: null,
    username: "",
    role: "Member",
  }));
}

export default function TeamHubPage() {
  return (
    <Suspense fallback={<div className="team-hub-loading">Loading Team Hub...</div>}>
      <TeamHubContent />
    </Suspense>
  );
}

function TeamHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const currentUser = user as AppUser | null;

  const platform = searchParams.get("platform") || "xbox";
  const category = searchParams.get("category") || "call-of-duty";
  const game = searchParams.get("game") || "modern-warfare-4";
  const ladder = searchParams.get("ladder") || "team";

  const platformName = prettyText(platform);
  const gameName = prettyText(game);
  const categoryName = prettyText(category);
  const ladderName = getLadderName(ladder);
  const rosterLimit = getRosterLimit(ladder);
  const extraRosterSlots = getExtraRosterSlots(ladder);

  const rankingsUrl = `/ladders/${platform}/${category}/${game}/${ladder}/rankings`;
  const rulesUrl = `/ladders/${platform}/${category}/${game}/${ladder}/rules`;

  const [loading, setLoading] = useState(true);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createError, setCreateError] = useState("");
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [teamName, setTeamName] = useState("");
  const [clanTag, setClanTag] = useState("");
  const [teamBio, setTeamBio] = useState("");
  const [teamLogo, setTeamLogo] = useState<File | null>(null);
  const [avatarLogo, setAvatarLogo] = useState<File | null>(null);
  const [nameStatus, setNameStatus] = useState<NameStatus>("idle");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [searchPlayer, setSearchPlayer] = useState("");
  const [searchingPlayers, setSearchingPlayers] = useState(false);
  const [playerResults, setPlayerResults] = useState<PlayerSearchResult[]>([]);

  const username =
    currentUser?.user_metadata?.username ||
    currentUser?.user_metadata?.display_name ||
    currentUser?.email?.split("@")[0] ||
    "Current User";

  const roleOptions: TeamRole[] =
    ladder === "duos"
      ? ["Member"]
      : ["Co-Leader", "Captain", "Recruit", "Member"];

  const [roster, setRoster] = useState<RosterSlot[]>(() =>
    buildRosterSlots(extraRosterSlots)
  );

  useEffect(() => {
    setRoster(buildRosterSlots(extraRosterSlots));
    setSelectedSlot(null);
    setSearchPlayer("");
    setPlayerResults([]);
  }, [extraRosterSlots]);

  useEffect(() => {
    async function loadTeams() {
      setLoading(true);

      if (!currentUser?.id) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("team_members")
        .select("team_id, teams(id, name, created_at, platform, category, game, ladder)")
        .eq("user_id", currentUser.id);

      if (error || !data) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const foundTeams = data
        .map((item: any) => item.teams)
        .filter(Boolean) as TeamRow[];

      const filteredTeams = foundTeams.filter((team) => {
        return (
          String(team.platform) === String(platform) &&
          String(team.category) === String(category) &&
          String(team.game) === String(game) &&
          String(team.ladder) === String(ladder)
        );
      });

      setTeams(filteredTeams);
      setLoading(false);
    }

    loadTeams();
  }, [currentUser?.id, platform, category, game, ladder]);

  useEffect(() => {
    async function checkTeamName() {
      const cleanName = teamName.trim();

      if (cleanName.length < 4) {
        setNameStatus("idle");
        return;
      }

      setNameStatus("checking");

      const { data } = await supabase
        .from("teams")
        .select("id, name")
        .ilike("name", cleanName)
        .limit(1);

      setNameStatus(data && data.length > 0 ? "taken" : "available");
    }

    const delay = setTimeout(checkTeamName, 500);
    return () => clearTimeout(delay);
  }, [teamName]);

  useEffect(() => {
    async function searchPlayers() {
      const cleanSearch = searchPlayer.trim();

      if (!selectedSlot || cleanSearch.length < 2) {
        setPlayerResults([]);
        return;
      }

      setSearchingPlayers(true);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, email")
        .or(`username.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`)
        .limit(6);

      if (!profiles || profiles.length === 0) {
        setPlayerResults([]);
        setSearchingPlayers(false);
        return;
      }

      const profileIds = profiles.map((profile: any) => profile.id);

      const { data: activeMembers } = await supabase
        .from("team_members")
        .select("user_id")
        .in("user_id", profileIds);

      const activeUserIds = activeMembers
        ? activeMembers.map((member: any) => member.user_id)
        : [];

      const results = profiles.map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        canInvite:
          profile.id !== currentUser?.id &&
          !activeUserIds.includes(profile.id) &&
          !roster.some((slot) => slot.playerId === profile.id),
      }));

      setPlayerResults(results);
      setSearchingPlayers(false);
    }

    const delay = setTimeout(searchPlayers, 350);
    return () => clearTimeout(delay);
  }, [searchPlayer, selectedSlot, currentUser?.id, roster]);

  function handleClanTag(value: string) {
    setClanTag(value.slice(0, 3).toUpperCase());
  }

  function openRosterSearch(slotNumber: number) {
    setSelectedSlot(slotNumber);
    setSearchPlayer("");
    setPlayerResults([]);
  }

  function closeRosterSearch() {
    setSelectedSlot(null);
    setSearchPlayer("");
    setPlayerResults([]);
  }

  function invitePlayerToSlot(player: PlayerSearchResult) {
    if (!selectedSlot || !player.canInvite) return;

    setRoster((currentRoster) =>
      currentRoster.map((slot) =>
        slot.slot === selectedSlot
          ? {
              ...slot,
              playerId: player.id,
              username: player.username || player.email || "Invited Player",
              role: "Member",
            }
          : slot
      )
    );

    closeRosterSearch();
  }

  function changeRole(slotNumber: number, role: TeamRole) {
    setRoster((currentRoster) =>
      currentRoster.map((slot) =>
        slot.slot === slotNumber
          ? {
              ...slot,
              role,
            }
          : slot
      )
    );
  }

  function beginCreateTeam() {
    setCreateError("");

    if (!currentUser?.id) {
      setCreateError("You must be signed in first.");
      return;
    }

    const cleanTeamName = teamName.trim();
    const cleanClanTag = clanTag.trim();

    if (cleanTeamName.length < 4) {
      setCreateError("Team name must be at least 4 characters.");
      return;
    }

    if (nameStatus === "taken") {
      setCreateError("That team name is already taken.");
      return;
    }

    if (nameStatus === "checking") {
      setCreateError("Please wait for the name check to finish.");
      return;
    }

    if (cleanClanTag.length < 1 || cleanClanTag.length > 3) {
      setCreateError("Clan tag must be 1 to 3 characters.");
      return;
    }

    if (teams.length > 0) {
      setCreateError("You already have an active team for this exact platform, game, and ladder.");
      return;
    }

    setRulesModalOpen(true);
  }

  async function createTeamAfterRulesConfirm() {
  setRulesModalOpen(false);
  setCreateError("");

  if (!currentUser?.id) {
    setCreateError("You must be signed in first.");
    return;
  }

  const cleanTeamName = teamName.trim();
  const cleanClanTag = clanTag.trim().toUpperCase();

  setCreatingTeam(true);

  try {
    let logoUrl: string | null = null;
    let avatarUrl: string | null = null;

    if (teamLogo) {
      const logoExt = teamLogo.name.split(".").pop() || "png";
      const logoPath = `${currentUser.id}/logos/${Date.now()}-${cleanTeamName}.${logoExt}`;

      const { error: logoUploadError } = await supabase.storage
        .from("team-assets")
        .upload(logoPath, teamLogo, {
          cacheControl: "3600",
          upsert: true,
        });

      if (logoUploadError) {
        setCreateError("Team logo upload failed: " + logoUploadError.message);
        setCreatingTeam(false);
        return;
      }

      const { data: logoPublicData } = supabase.storage
        .from("team-assets")
        .getPublicUrl(logoPath);

      logoUrl = logoPublicData.publicUrl;
    }

    if (avatarLogo) {
      const avatarExt = avatarLogo.name.split(".").pop() || "png";
      const avatarPath = `${currentUser.id}/avatars/${Date.now()}-${cleanTeamName}.${avatarExt}`;

      const { error: avatarUploadError } = await supabase.storage
        .from("team-assets")
        .upload(avatarPath, avatarLogo, {
          cacheControl: "3600",
          upsert: true,
        });

      if (avatarUploadError) {
        setCreateError("Team avatar upload failed: " + avatarUploadError.message);
        setCreatingTeam(false);
        return;
      }

      const { data: avatarPublicData } = supabase.storage
        .from("team-assets")
        .getPublicUrl(avatarPath);

      avatarUrl = avatarPublicData.publicUrl;
    }

    const { data: existingForLadder } = await supabase
      .from("teams")
      .select("id")
      .eq("owner_id", currentUser.id)
      .eq("platform", platform)
      .eq("category", category)
      .eq("game", game)
      .eq("ladder", ladder)
      .limit(1);

    if (existingForLadder && existingForLadder.length > 0) {
      setCreateError("You already have an active team for this exact platform, game, and ladder.");
      setCreatingTeam(false);
      return;
    }

    const { data: nameCheck } = await supabase
      .from("teams")
      .select("id")
      .ilike("name", cleanTeamName)
      .limit(1);

    if (nameCheck && nameCheck.length > 0) {
      setNameStatus("taken");
      setCreateError("That team name is already taken.");
      setCreatingTeam(false);
      return;
    }

    const { data: newTeam, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: cleanTeamName,
        tag: cleanClanTag,
        bio: teamBio.trim(),
        platform,
        category,
        game,
        ladder,
        owner_id: currentUser.id,
        logo_url: logoUrl,
        avatar_url: avatarUrl,
      })
      .select("id, name")
      .single();

    if (teamError || !newTeam) {
      setCreateError("Team could not be created. Check your teams table in Supabase.");
      setCreatingTeam(false);
      return;
    }

    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: newTeam.id,
      user_id: currentUser.id,
      role: "leader",
    });

    if (memberError) {
      setCreateError("Team was created, but leader could not be added.");
      setCreatingTeam(false);
      return;
    }

    router.push(`/teams/${newTeam.id}`);
  } catch (error: any) {
    setCreateError(error?.message || "Team could not be created.");
    setCreatingTeam(false);
  }
}
  return (
    <>
      <style>{`
        *{ margin:0; padding:0; box-sizing:border-box; }
        body{ background:#000; font-family:Tahoma,Verdana,Arial,sans-serif; color:#d7e2ee; }
        a{ text-decoration:none; }

        .team-hub-loading{
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
          background:radial-gradient(circle at top,rgba(45,100,150,.28),transparent 42%),linear-gradient(to bottom,#02060a,#000);
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

        .top-strip a,.nav a{
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

        .logo-link{
          display:block;
        }

        .logo-main{
          color:#f4f8ff;
          font-size:42px;
          font-weight:bold;
          font-style:italic;
          text-transform:uppercase;
          line-height:40px;
          text-shadow:0 2px 4px #000;
          cursor:pointer;
        }

        .logo-sub{
          color:#7fc7ff;
          font-size:12px;
          font-weight:bold;
          letter-spacing:3px;
          text-transform:uppercase;
          margin-top:7px;
        }

        .hub-badge{
          border:1px solid #6ba8d6;
          background:linear-gradient(to bottom,#214765,#0b1c2d);
          color:#f5f8ff;
          font-size:17px;
          font-weight:900;
          text-transform:uppercase;
          padding:14px 24px;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 0 12px rgba(80,170,255,.22);
          text-shadow:0 2px 4px #000;
          letter-spacing:1.4px;
        }

        .nav{
          min-height:36px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:28px;
        }

        .nav a{ color:#d7eaff; }
        .nav a:hover{ color:#d7ad4a; }

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
          margin-bottom:7px;
          text-shadow:0 1px 2px #000;
        }

        .title-bar p{
          color:#cfe2f2;
          font-size:14px;
          line-height:22px;
        }

        .content{ padding:22px; }

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

        .side-body{ padding:14px; }

        .steps-box,.rules-box{
          border:1px solid #1f3d5a;
          background:linear-gradient(to bottom,#091724,#06101a);
          padding:14px;
          margin-bottom:14px;
        }

        .steps-title,.rules-title{
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          margin-bottom:12px;
          border-bottom:1px solid rgba(255,255,255,.09);
          padding-bottom:8px;
        }

        .step-line,.rule-line{
          color:#cfe2f2;
          font-size:12px;
          line-height:22px;
          padding:3px 0;
          border-bottom:1px solid rgba(255,255,255,.04);
        }

        .step-line:last-child,.rule-line:last-child{ border-bottom:none; }

        .step-arrow,.rule-arrow{
          color:#d7ad4a;
          font-weight:bold;
          margin-right:6px;
        }

        .step-sub{
          color:#b8c7d4;
          font-size:11px;
          line-height:17px;
          padding:0 0 5px 20px;
          border-bottom:1px solid rgba(255,255,255,.04);
        }

        .step-mini-arrow{
          color:#d7ad4a;
          font-size:9px;
          margin-right:5px;
        }

        .rules-link{
          margin-top:10px;
          height:32px;
          border:1px solid #6ba8d6;
          background:linear-gradient(to bottom,#173956,#07111b);
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
        }

        .rules-link:hover{
          color:#d7ad4a;
          border-color:#d7ad4a;
        }

        .ladder-info{
          border:1px solid #244b70;
          background:#081522;
          padding:12px;
        }

        .ladder-info div{
          color:#cfe2f2;
          font-size:12px;
          line-height:23px;
          border-bottom:1px solid rgba(255,255,255,.055);
        }

        .ladder-info div:last-child{ border-bottom:none; }

        .main-body{ padding:18px; }

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

        .form-body{ padding:15px; }

        .row{
          display:grid;
          grid-template-columns:155px 1fr;
          gap:12px;
          align-items:center;
          margin-bottom:12px;
        }

        .row:last-child{ margin-bottom:0; }

        label{
          color:#cfe2f2;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        input,textarea,select{
          width:100%;
          border:1px solid #315b7d;
          background:#02070c;
          color:#fff;
          font-size:13px;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          padding:9px 10px;
          outline:none;
        }

        textarea{
          min-height:88px;
          resize:none;
          line-height:20px;
        }

        input:focus,textarea:focus,select:focus{
          border-color:#6ba8d6;
          box-shadow:0 0 8px rgba(103,189,255,.28);
        }

        .name-status{
          font-size:11px;
          font-weight:bold;
          text-transform:uppercase;
          margin-top:6px;
        }

        .name-status.available{ color:#56df7f; }
        .name-status.taken{ color:#ff5b5b; }
        .name-status.checking{ color:#d7ad4a; }

        .create-error{
          border:1px solid #923131;
          background:#210707;
          color:#ff9c9c;
          font-size:12px;
          font-weight:bold;
          padding:10px;
          margin-top:12px;
          text-transform:uppercase;
        }

        .upload-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
        }

        .upload-box{
          border:1px dashed #315b7d;
          background:#02070c;
          min-height:82px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          color:#8aa7c0;
          font-size:12px;
          text-align:center;
          padding:10px;
          cursor:pointer;
        }

        .upload-box:hover{
          border-color:#6ba8d6;
          background:#06111b;
        }

        .upload-box strong{
          color:#d7ad4a;
          font-size:12px;
          margin-bottom:6px;
          text-transform:uppercase;
        }

        .upload-box span{
          color:#8aa7c0;
          font-size:11px;
          line-height:16px;
        }

        .upload-box input{ display:none; }

        .leader-box{
          display:grid;
          grid-template-columns:1fr 130px;
          gap:10px;
          border:1px solid #244b70;
          background:#050c14;
          padding:10px;
          margin-bottom:10px;
          align-items:center;
        }

        .leader-name{
          color:#fff;
          font-size:14px;
          font-weight:900;
        }

        .leader-role{
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          text-align:right;
        }

        .role-list{
          border:1px solid #244b70;
          background:#050c14;
          margin-top:12px;
        }

        .role-row{
          display:grid;
          grid-template-columns:1fr 130px;
          gap:10px;
          padding:9px 10px;
          border-bottom:1px solid rgba(255,255,255,.055);
          color:#cfe2f2;
          font-size:12px;
          cursor:pointer;
          align-items:center;
        }

        .role-row:last-child{ border-bottom:none; }
        .role-row:hover{ background:#0a1928; }

        .role-name{
          color:#fff;
          font-weight:bold;
        }

        .role-empty{
          color:#8aa7c0;
          font-weight:bold;
        }

        .role-select{
          height:31px;
          padding:5px 8px;
          font-size:11px;
          font-weight:900;
          color:#d7ad4a;
          text-transform:uppercase;
          background:#02070c;
          border:1px solid #315b7d;
          cursor:pointer;
        }

        .slot-search-box{
          grid-column:1 / 3;
          width:60%;
          max-width:340px;
          border:1px solid #315b7d;
          background:#02070c;
          padding:8px;
          margin-top:5px;
          margin-left:18px;
          box-shadow:0 8px 16px rgba(0,0,0,.35);
        }

        .slot-search-top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:6px;
        }

        .slot-search-title{
          color:#d7ad4a;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
        }

        .close-search{
          border:1px solid #315b7d;
          background:#07111b;
          color:#cfe2f2;
          font-size:10px;
          font-weight:900;
          text-transform:uppercase;
          padding:3px 7px;
          cursor:pointer;
        }

        .slot-search-input{
          height:30px;
          padding:6px 8px;
          font-size:12px;
          margin-bottom:7px;
        }

        .player-results{
          border:1px solid #244b70;
          background:#07111b;
          max-height:120px;
          overflow-y:auto;
        }

        .player-result{
          display:grid;
          grid-template-columns:1fr 80px;
          gap:8px;
          padding:7px;
          border-bottom:1px solid rgba(255,255,255,.06);
          align-items:center;
        }

        .player-info{
          color:#fff;
          font-size:12px;
          font-weight:bold;
        }

        .player-email{
          color:#8aa7c0;
          font-size:10px;
          margin-top:2px;
        }

        .player-status.bad{
          color:#ff5b5b;
          font-size:10px;
          font-weight:900;
          text-transform:uppercase;
          text-align:right;
        }

        .invite-small{
          height:27px;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
          font-size:10px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
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

        .action-btn:hover{ filter:brightness(1.13); }

        .action-btn:disabled{
          opacity:.5;
          cursor:not-allowed;
          filter:none;
        }

        .message-title{
          color:#fff;
          font-size:26px;
          font-weight:900;
          text-transform:uppercase;
          margin-bottom:12px;
          text-shadow:0 2px 4px #000;
        }

        .message-text{
          color:#cfe2f2;
          font-size:14px;
          line-height:24px;
          margin-bottom:22px;
          max-width:680px;
        }

        .team-list{
          display:flex;
          flex-direction:column;
          gap:14px;
          margin-bottom:20px;
        }

        .team-card{
          border:1px solid #244b70;
          background:#07111b;
          padding:18px;
        }

        .team-name{
          color:#fff;
          font-size:24px;
          font-weight:900;
          text-transform:uppercase;
          margin-bottom:10px;
        }

        .team-meta{
          color:#8aa7c0;
          font-size:13px;
          line-height:22px;
        }

        .modal-backdrop{
          position:fixed;
          inset:0;
          background:rgba(0,0,0,.78);
          display:flex;
          align-items:center;
          justify-content:center;
          z-index:9999;
        }

        .rules-modal{
          width:560px;
          background:#07111b;
          border:1px solid #6ba8d6;
          box-shadow:0 0 35px rgba(0,100,180,.55);
        }

        .rules-modal-title{
          min-height:42px;
          background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;
          color:#d7ad4a;
          font-size:15px;
          font-weight:900;
          text-transform:uppercase;
          display:flex;
          align-items:center;
          padding:0 14px;
        }

        .rules-modal-body{
          padding:18px;
          color:#cfe2f2;
          font-size:13px;
          line-height:22px;
        }

        .rules-modal-body strong{ color:#fff; }

        .modal-rules-list{
          margin-top:12px;
          border:1px solid #244b70;
          background:#050c14;
          padding:12px;
        }

        .modal-rules-list div{
          border-bottom:1px solid rgba(255,255,255,.06);
          padding:5px 0;
        }

        .modal-rules-list div:last-child{ border-bottom:none; }

        .modal-actions{
          display:flex;
          gap:12px;
          padding:0 18px 18px;
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
          .old-grid{ grid-template-columns:1fr; }

          .row,.upload-grid,.role-row,.leader-box,.player-result{
            grid-template-columns:1fr;
            gap:6px;
          }

          .slot-search-box{
            grid-column:1;
            width:100%;
            max-width:none;
            margin-left:0;
          }

          .leader-role{ text-align:left; }

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

          .rules-modal{ width:92%; }
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
            <a className="logo-link" href="/home">
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">Where Gaming Finds Its Edge</div>
            </a>

            <div className="hub-badge">Create Team</div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
            <a href="/players/top">Top Players</a>
          </nav>

          <section className="title-bar">
            <h1>{ladderName}</h1>
            <p>
              {platformName} / {categoryName}: {gameName} / {ladderName}
            </p>
          </section>

          <section className="content">
            <div className="old-grid">
              <aside className="side-panel">
                <div className="panel-header">Team Setup</div>

                <div className="side-body">
                  <div className="steps-box">
                    <div className="steps-title">Create Team Steps</div>

                    <div className="step-line"><span className="step-arrow">►</span>Enter Team Name</div>
                    <div className="step-sub"><span className="step-mini-arrow">▸</span>Must be at least 4 characters long.</div>
                    <div className="step-line"><span className="step-arrow">►</span>Enter Clan Tag</div>
                    <div className="step-line"><span className="step-arrow">►</span>Upload Logo and Avatar</div>
                    <div className="step-line"><span className="step-arrow">►</span>Review Ladder Rules</div>
                    <div className="step-line"><span className="step-arrow">►</span>Confirm Ladder</div>

                    {ladder !== "singles" && (
                      <div className="step-line">
                        <span className="step-arrow">►</span>
                        {ladder === "duos" ? "Invite Partner" : "Invite Players"}
                      </div>
                    )}
                  </div>

                  <div className="rules-box">
                    <div className="rules-title">4 Main Rules</div>
                    <div className="rule-line"><span className="rule-arrow">►</span>No cheating, exploiting, or outside software.</div>
                    <div className="rule-line"><span className="rule-arrow">►</span>Report match results honestly.</div>
                    <div className="rule-line"><span className="rule-arrow">►</span>Save proof for disputes.</div>
                    <div className="rule-line"><span className="rule-arrow">►</span>Follow the correct roster limit.</div>

                    <a className="rules-link" href={rulesUrl}>View Full Rules</a>
                  </div>

                  <div className="ladder-info">
                    <div>Platform: {platformName}</div>
                    <div>Game: {gameName}</div>
                    <div>Ladder: {ladderName}</div>
                    <div>Status: Open</div>
                    <div>Roster Limit: {rosterLimit} Player{rosterLimit === 1 ? "" : "s"}</div>
                  </div>
                </div>
              </aside>

              <section className="main-panel">
                <div className="panel-header">Team Registration Form</div>

                <div className="main-body">
                  {!currentUser && (
                    <>
                      <div className="message-title">Sign In Required</div>
                      <div className="message-text">You need to sign in before joining this ladder.</div>

                      <div className="actions">
                        <a className="action-btn gold" href="/login">Sign In</a>
                        <a className="action-btn" href="/join">Create Account</a>
                        <a className="action-btn red" href={rankingsUrl}>Cancel</a>
                      </div>
                    </>
                  )}

                  {currentUser && loading && (
                    <>
                      <div className="message-title">Loading</div>
                      <div className="message-text">Checking your current ladder entries before opening registration.</div>
                    </>
                  )}

                  {currentUser && !loading && teams.length > 0 && (
                    <>
                      <div className="message-title">Active Entry Found</div>
                      <div className="message-text">You already have an active entry connected to this exact platform, game, and ladder.</div>

                      <div className="team-list">
                        {teams.map((team) => (
                          <div className="team-card" key={team.id}>
                            <div className="team-name">{team.name}</div>
                            <div className="team-meta">
                              Status: Active Ladder Member
                              <br />
                              Ladder: {gameName} {ladderName}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="actions">
                        <a className="action-btn gold" href="/profile/teams">View Entry</a>
                        <a className="action-btn red" href={rankingsUrl}>Back To Ladder</a>
                      </div>
                    </>
                  )}

                  {currentUser && !loading && teams.length === 0 && (
                    <>
                      <div className="form-section">
                        <div className="form-title">Team Details</div>

                        <div className="form-body">
                          <div className="row">
                            <label>Team Name</label>
                            <div>
                              <input
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder={
                                  ladder === "singles"
                                    ? "Example: Prime"
                                    : ladder === "duos"
                                    ? "Example: Prime Duo"
                                    : "Example: East Coast Elites"
                                }
                              />

                              {nameStatus === "checking" && <div className="name-status checking">Checking name...</div>}
                              {nameStatus === "available" && <div className="name-status available">Name available</div>}
                              {nameStatus === "taken" && <div className="name-status taken">Name already taken</div>}
                            </div>
                          </div>

                          <div className="row">
                            <label>Clan Tag</label>
                            <input value={clanTag} onChange={(e) => handleClanTag(e.target.value)} placeholder="Example: ECE" maxLength={3} />
                          </div>

                          <div className="row">
                            <label>Team Bio</label>
                            <textarea
                              value={teamBio}
                              onChange={(e) => setTeamBio(e.target.value)}
                              placeholder={
                                ladder === "singles"
                                  ? "Tell players about your solo competitive entry."
                                  : ladder === "duos"
                                  ? "Tell players what your duo is about."
                                  : "Tell players what your team is about."
                              }
                            />
                          </div>

                          <div className="row">
                            <label>Uploads</label>

                            <div className="upload-grid">
                              <label className="upload-box">
                                <input type="file" accept="image/*" onChange={(e) => setTeamLogo(e.target.files?.[0] || null)} />
                                <strong>Team Logo</strong>
                                <span>{teamLogo ? teamLogo.name : "Upload your team logo"}</span>
                              </label>

                              <label className="upload-box">
                                <input type="file" accept="image/*" onChange={(e) => setAvatarLogo(e.target.files?.[0] || null)} />
                                <strong>Team Avatar</strong>
                                <span>{avatarLogo ? avatarLogo.name : "Upload your team avatar"}</span>
                              </label>
                            </div>
                          </div>

                          {createError && <div className="create-error">{createError}</div>}
                        </div>
                      </div>

                      <div className="form-section">
                        <div className="form-title">Ladder Setup</div>

                        <div className="form-body">
                          <div className="row"><label>Platform</label><input value={platformName} readOnly /></div>
                          <div className="row"><label>Game</label><input value={gameName} readOnly /></div>
                          <div className="row"><label>Ladder</label><input value={ladderName} readOnly /></div>
                        </div>
                      </div>

                      <div className="form-section">
                        <div className="form-title">
                          {ladder === "singles" ? "Solo Roster" : ladder === "duos" ? "Duo Roster" : "Team Roster"}
                        </div>

                        <div className="form-body">
                          <div className="leader-box">
                            <div className="leader-name">{username}</div>
                            <div className="leader-role">{ladder === "singles" ? "Solo Player" : "Leader"}</div>
                          </div>

                          {ladder === "singles" && (
                            <div className="small-note">Solos Ladder only uses your own player profile. There are no roster slots to edit.</div>
                          )}

                          {ladder !== "singles" && (
                            <>
                              <div className="small-note">
                                {ladder === "duos"
                                  ? "Duos Ladder allows 1 partner slot besides yourself."
                                  : "Team Ladder allows up to 7 roster slots besides yourself."}
                              </div>

                              <div className="role-list">
                                {roster.map((slot) => (
                                  <div className="role-row" key={slot.slot} onClick={() => !slot.playerId && openRosterSearch(slot.slot)}>
                                    <div className={slot.playerId ? "role-name" : "role-empty"}>
                                      {slot.playerId ? slot.username : ladder === "duos" ? "Empty Partner Slot" : "Empty Roster Slot"}
                                    </div>

                                    <select
                                      className="role-select"
                                      value={slot.role}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => changeRole(slot.slot, e.target.value as TeamRole)}
                                    >
                                      {roleOptions.map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                      ))}
                                    </select>

                                    {selectedSlot === slot.slot && (
                                      <div className="slot-search-box" onClick={(e) => e.stopPropagation()}>
                                        <div className="slot-search-top">
                                          <div className="slot-search-title">{ladder === "duos" ? "Search Partner" : "Search Member"}</div>
                                          <button className="close-search" type="button" onClick={closeRosterSearch}>Close</button>
                                        </div>

                                        <input
                                          className="slot-search-input"
                                          value={searchPlayer}
                                          onChange={(e) => setSearchPlayer(e.target.value)}
                                          placeholder="Type username or email"
                                          autoFocus
                                        />

                                        {searchingPlayers && <div className="small-note">Searching players...</div>}

                                        {!searchingPlayers && searchPlayer.trim().length >= 2 && playerResults.length === 0 && (
                                          <div className="small-note">No matching players found.</div>
                                        )}

                                        {playerResults.length > 0 && (
                                          <div className="player-results">
                                            {playerResults.map((player) => (
                                              <div className="player-result" key={player.id}>
                                                <div>
                                                  <div className="player-info">{player.username || "No username"}</div>
                                                  <div className="player-email">{player.email}</div>
                                                </div>

                                                {player.canInvite ? (
                                                  <button className="invite-small" type="button" onClick={() => invitePlayerToSlot(player)}>Invite</button>
                                                ) : (
                                                  <div className="player-status bad">Unavailable</div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="actions">
                        <button
                          className="action-btn gold"
                          type="button"
                          disabled={creatingTeam || nameStatus === "taken" || nameStatus === "checking"}
                          onClick={beginCreateTeam}
                        >
                          {creatingTeam ? "Creating..." : "Create Team"}
                        </button>

                        <a className="action-btn red" href={rankingsUrl}>Cancel</a>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>

      {rulesModalOpen && (
        <div className="modal-backdrop">
          <div className="rules-modal">
            <div className="rules-modal-title">Confirm {ladderName} Rules</div>

            <div className="rules-modal-body">
              <strong>Before creating this team, you must confirm that you understand the current ladder rules.</strong>

              <div className="modal-rules-list">
                <div>• You understand this is the {gameName} {ladderName}.</div>
                <div>• You agree to follow all match, roster, reporting, and dispute rules.</div>
                <div>• You understand cheating, fake reports, or abuse can lead to removal.</div>
                <div>• You understand staff may review match proof during disputes.</div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="action-btn gold" type="button" onClick={createTeamAfterRulesConfirm}>Yes, Create</button>
              <button className="action-btn red" type="button" onClick={() => setRulesModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}