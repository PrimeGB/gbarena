"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteNav from "../components/SiteNav";
import FollowButton from "../components/FollowButton";
import ProfileFollowingFeed from "../components/ProfileFollowingFeed";
import AwardDetailsDialog, { AwardHoverDetails, useAwardCatalog, type EarnedAwardDetails } from "../components/AwardDetailsDialog";
import { useUser } from "../../lib/useUser";
import { getRankTier } from "./RankEmblem";
import { RankBadgeArt } from "../components/RankBadge";
import { rankFromXp } from "../../lib/playerRank";
import { RankEmblemBold as RankEmblem } from "./RankEmblemBold";
import { EliteEmblem, ELITE_LIMIT, getEliteBand } from "./EliteEmblem";
import AwardArt, { AWARD_CSS } from "../awards/AwardArt";
import { supabase } from "../../lib/supabase";
import { ladderPlatformLabel } from "../../lib/ladderCatalog";
import { NEW_PROMOS, NEW_PROMO_KINDS } from "../../lib/heroSlides";
import { isCreatorTheme, type CreatorStyle } from "../../lib/creatorProfileStyles";
import { favoriteSystemClass, friendProfileFrameClass, hasFounderRgbGlow } from "../../lib/profileGlow";
import CreatorFrameArt from "./creator-style/CreatorFrameArt";
import "./creator-styles.css";
import "./founder-glow.css";
import {
  GamingAccount,
} from "../../lib/gamingAccounts";

type Profile = {
  id?: string;
  username: string | null;
  email?: string | null;
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
  credits?: number | null;
  role?: string | null;
  player_bio?: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
  profile_glow?: string | null;
  profile_status_private?: boolean;
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
  label: string;
};

type AwardHistoryEntry = {
  id: number;
  name: string;
  award_group: string;
  reason: string;
  granted_at: string;
  granted_by: string | null;
  revoked_at: string | null;
};

type TopTeam = {
  id: string;
  name: string;
  record: string;
  role: string;
  platform: string | null;
  logo_url?: string | null;
};

type TopFriend = {
  id: string;
  username: string;
  avatar_url: string | null;
  frameClass: string;
};

type TeamProfileRow = {
  id: string;
  name: string | null;
  logo_url: string | null;
  wins: number | null;
  losses: number | null;
  platform: string | null;
};

type TeamMemberRow = {
  role: string | null;
  teams: TeamProfileRow | TeamProfileRow[] | null;
};

type FriendProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type FriendAppearance = FriendProfileRow & {
  logo_url: string | null;
  favorite_system: string | null;
  profile_glow: string | null;
  role: string | null;
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
  const [linkedIds, setLinkedIds] = useState<{ userId: string; entries: { id: string; service: string; account_id: string }[]; error: string } | null>(null);
  const [topTeams, setTopTeams] = useState<TopTeam[]>([]);
  const [friendsResult, setFriendsResult] = useState<{ userId: string; friends: TopFriend[]; private: boolean; error: string } | null>(null);
  const currentFriends = friendsResult?.userId === viewedUserId ? friendsResult : null;
  const [earnedAwards, setEarnedAwards] = useState<AwardHistoryEntry[]>([]);
  const [selectedAward, setSelectedAward] = useState<{ playerId: string; award: EarnedAwardDetails } | null>(null);
  const [loadAwardCatalog, setLoadAwardCatalog] = useState(false);
  const [dismissedAwardTooltip, setDismissedAwardTooltip] = useState<number | null>(null);
  const awardCatalog = useAwardCatalog(loadAwardCatalog);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [currentProfileName, setCurrentProfileName] = useState("");
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [gbRankDisplay, setGbRankDisplay] = useState("Unranked");
  const [statsPublic, setStatsPublic] = useState(true);
  const [playerXp, setPlayerXp] = useState<{ userId: string; xp: number } | null>(null);
  const [ambassador, setAmbassador] = useState<{ userId: string; tier: string; slug: string; twitch: string; youtube: string; tiktok: string; kick: string; recruits: number | null; qualified: number; live: boolean } | null>(null);
  const [creatorStyle, setCreatorStyle] = useState<{ userId: string; style: CreatorStyle | null; error: string } | null>(null);
  const [ambLinkCopied, setAmbLinkCopied] = useState(false);
  const [ambLiveBusy, setAmbLiveBusy] = useState(false);
  const [ambLiveMsg, setAmbLiveMsg] = useState("");

  useEffect(() => {
    if (!viewedUserId) return;
    let active = true;
    void supabase.from("profile_linked_ids").select("id,service,account_id")
      .eq("user_id", viewedUserId).order("created_at").then(({ data, error }) => {
        if (active) setLinkedIds({ userId: viewedUserId, entries: data || [], error: error ? `Additional IDs could not be loaded: ${error.message}` : "" });
      });
    return () => { active = false; };
  }, [viewedUserId]);

  useEffect(() => {
    if (!viewedUserId) return;
    let active = true;
    void supabase.rpc("gb_ambassador_directory").then(({ data }) => {
      if (!active) return;
      const row = (Array.isArray(data) ? data : []).find((entry) => entry.user_id === viewedUserId);
      setAmbassador(row ? {
        userId: viewedUserId,
        tier: row.tier,
        slug: row.slug,
        twitch: row.twitch,
        youtube: row.youtube,
        tiktok: row.tiktok,
        kick: row.kick,
        recruits: typeof row.recruits === "number" ? row.recruits : null,
        qualified: typeof row.qualified === "number" ? row.qualified : 0,
        live: row.live === true,
      } : null);
    });
    return () => {
      active = false;
    };
  }, [viewedUserId]);
  useEffect(() => {
    if (!viewedUserId) return;
    let active = true;
    void supabase.rpc("gb_creator_profile_style", { p_user: viewedUserId }).then(({ data, error: styleError }) => {
      if (!active) return;
      const row = Array.isArray(data) ? data[0] : null;
      const style = row && (row.tier === "affiliate" || row.tier === "ambassador") && isCreatorTheme(row.theme)
        ? { tier: row.tier, theme: row.theme, show_name: row.show_name === true, show_logo: row.show_logo === true } : null;
      setCreatorStyle({ userId: viewedUserId, style, error: styleError?.message || "" });
    });
    return () => { active = false; };
  }, [viewedUserId]);
  const [promoIndex, setPromoIndex] = useState(0);
  const [bannerHovered, setBannerHovered] = useState(false);
  const [bannerFocused, setBannerFocused] = useState(false);
  const [followCounts, setFollowCounts] = useState<{
    following_count: number;
    followers_count: number;
  } | null>(null);
  const [followCountsError, setFollowCountsError] = useState("");

  useEffect(() => {
    if (bannerHovered || bannerFocused) return;
    const timer = window.setInterval(() => setPromoIndex((current) => (current + 1) % (6 + NEW_PROMO_KINDS.length)), 15000);
    return () => window.clearInterval(timer);
  }, [bannerHovered, bannerFocused]);

  const loadFollowCounts = useCallback(async (
    targetId: string,
    isCurrent: () => boolean = () => true
  ) => {
    const { data, error: countsError } = await supabase.rpc(
      "gb_community_follow_counts",
      { p_target_type: "player", p_target_id: targetId }
    );
    if (!isCurrent()) return;
    if (countsError) {
      setFollowCounts(null);
      setFollowCountsError(countsError.message);
      return;
    }

    const counts = Array.isArray(data) ? data[0] : data;
    setFollowCounts(
      counts
        ? {
            following_count: Number(counts.following_count),
            followers_count: Number(counts.followers_count),
          }
        : null
    );
    setFollowCountsError("");
  }, []);

  useEffect(() => {
    if (!viewedUserId) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setFollowCounts(null);
      setFollowCountsError("");
      void loadFollowCounts(viewedUserId, () => active);
    });
    return () => {
      active = false;
    };
  }, [loadFollowCounts, viewedUserId]);

  useEffect(() => {
    if (!viewedUserId) return;
    let active = true;
    supabase.rpc("gb_player_xp", { p_users: [viewedUserId] }).then(({ data }) => {
      if (!active) return;
      const row = Array.isArray(data) ? data[0] : data;
      setPlayerXp({ userId: viewedUserId, xp: Number(row?.xp) || 0 });
    });
    return () => {
      active = false;
    };
  }, [viewedUserId]);

  useEffect(() => {
    if (!viewedUserId) return;
    supabase.from("profiles").select("stats_public").eq("id", viewedUserId).maybeSingle().then(({ data }) => {
      setStatsPublic(data?.stats_public !== false);
    });
  }, [viewedUserId]);
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

  useEffect(() => {
    if (!currentUser?.id) return;

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
    if (!viewedUserId) return;

    supabase
      .from("profiles")
      .select("id, username, xbox_gt, psn_gt, nintendo_gt, pc_gt, gt_xbox, gt_playstation, gt_nintendo, gt_pc, gb_wins, gb_losses, gb_rank_points, favorite_system, favorite_game, credits, role, player_bio, avatar_url, logo_url, profile_glow, profile_status_private, display_awards, created_at, profile_views")
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
            setEarnedAwards(((awardRows || []) as AwardHistoryEntry[]).filter((award) => !award.revoked_at));
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
      .select("team_id, role, teams(id, name, logo_url, wins, losses, platform, created_at)")
      .eq("user_id", viewedUserId)
      .limit(4)
      .then(({ data }) => {
        const loadedTeams =
          data
            ?.map((row: TeamMemberRow): TopTeam | null => {
              const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;

              if (!team) return null;

              return {
                id: team.id,
                name: team.name || "Unnamed Team",
                record: `${team.wins || 0} - ${team.losses || 0}`,
                role: prettyRole(row.role),
                platform: team.platform,
                logo_url: team.logo_url || null,
              };
            })
            .filter((team): team is TopTeam => team !== null) || [];

        setTopTeams(loadedTeams);
      });

    let active = true;
    supabase.rpc("gb_profile_friends", { p_user: viewedUserId }).then(async ({ data, error: friendsLoadError }) => {
      if (!active) return;
      if (friendsLoadError || !data) {
        setFriendsResult({ userId: viewedUserId, friends: [], private: false, error: friendsLoadError ? `Friends could not be loaded: ${friendsLoadError.message}` : "Friends could not be loaded." });
        return;
      }
      const result = data as { private: boolean; friends?: FriendProfileRow[]; top_ids?: string[] | null };
      const allFriends = result.friends || [];
      const orderedFriends = Array.isArray(result.top_ids)
        ? result.top_ids.map((id) => allFriends.find((friend) => friend.id === id)).filter((friend): friend is FriendProfileRow => !!friend)
        : allFriends;
      const topFriends = orderedFriends.slice(0, 4);
      if (topFriends.length === 0) {
        setFriendsResult({ userId: viewedUserId, friends: [], private: result.private, error: "" });
        return;
      }
      const [appearancesResult, ...creatorResults] = await Promise.all([
        supabase.from("profiles").select("id, username, avatar_url, logo_url, favorite_system, profile_glow, role").in("id", topFriends.map((friend) => friend.id)),
        ...topFriends.map((friend) => supabase.rpc("gb_creator_profile_style", { p_user: friend.id })),
      ]);
      if (!active) return;
      const appearanceError = appearancesResult.error || creatorResults.find((entry) => entry.error)?.error;
      if (appearanceError) {
        setFriendsResult({ userId: viewedUserId, friends: [], private: result.private, error: `Friend appearances could not be loaded: ${appearanceError.message}` });
        return;
      }
      const appearances: FriendAppearance[] = appearancesResult.data || [];
      const friends: TopFriend[] = [];
      for (const [index, friend] of topFriends.entries()) {
        const appearance = appearances.find((entry) => entry.id === friend.id);
        if (!appearance) {
          setFriendsResult({ userId: viewedUserId, friends: [], private: result.private, error: "A friend's profile could not be loaded. Please refresh and try again." });
          return;
        }
        const creatorRow = Array.isArray(creatorResults[index].data) ? creatorResults[index].data[0] : null;
        const creator = creatorRow && (creatorRow.tier === "affiliate" || creatorRow.tier === "ambassador") && isCreatorTheme(creatorRow.theme)
          ? { tier: creatorRow.tier, theme: creatorRow.theme } : null;
        friends.push({
          id: friend.id,
          username: appearance.username || "Unknown Player",
          avatar_url: appearance.logo_url || appearance.avatar_url || null,
          frameClass: friendProfileFrameClass(appearance, creator),
        });
      }
      setFriendsResult({ userId: viewedUserId, friends, private: result.private, error: "" });
    });
    return () => { active = false; };
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
      credits: 0,
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
  const rawRole = (profile?.role || "").toLowerCase();
  const isAmbassador = ambassador?.userId === viewedUserId;
  const currentCreatorStyle = creatorStyle?.userId === viewedUserId ? creatorStyle.style : null;
  const playerRole = rawRole === "owner"
    ? ((profile?.username || "").toLowerCase() === "prime" ? "Founder" : "Staff")
    : isAmbassador
      ? (ambassador.tier === "affiliate" ? "Affiliate" : "Ambassador")
      : rawRole ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1) : "Member";
  const avatarUrl = profile?.avatar_url || "";
  const logoUrl = profile?.logo_url || "";
  const xboxGT = profile?.gt_xbox || profile?.xbox_gt || "";
  const psnGT = profile?.gt_playstation || profile?.psn_gt || "";
  const nintendoGT = profile?.gt_nintendo || profile?.nintendo_gt || "";
  const pcGT = profile?.gt_pc || profile?.pc_gt || "";
  const eaGT =
    gamingAccounts.find((account) => account.platform === "ea")?.account_id || "";
  const displayAwards = Array.isArray(profile?.display_awards) ? profile.display_awards : null;
  const chosenAwards: (AwardHistoryEntry | undefined)[] =
    displayAwards !== null
      ? displayAwards.slice(0, 6).map((entry) =>
          earnedAwards.find((award) => String(award.id) === entry) ||
          earnedAwards.find((award) => award.name === entry),
        )
      : earnedAwards.slice(0, 6);
  const topAwards: Award[] = Array.from({ length: 6 }).map((_, index) => {
    const earnedAward = chosenAwards[index];
    return {
      id: earnedAward?.id || index + 1,
      name: earnedAward?.name || "Award Slot",
      group: earnedAward?.award_group || "",
      label: earnedAward ? "★" : "?",
    };
  });
  const statusText = profile?.profile_status_private ? "Private" : isViewingOwnProfile ? "Online" : "Offline";
  const statusClass = profile?.profile_status_private ? "" : isViewingOwnProfile ? "status-online" : "status-offline";
  const rankNumber = Number(gbRankDisplay);
  const rankParts = Number.isFinite(rankNumber) && rankNumber > 0 ? ordinalRank(rankNumber) : null;
  const joinedDate = profile?.created_at || (isViewingOwnProfile ? currentUser?.created_at : null) || null;

  function formatMemberSince(value: string | null | undefined) {
    if (!value) return "Not Set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not Set";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  const rankTier = getRankTier(gbRankPoints);
  const playerLevel = rankFromXp(playerXp?.userId === viewedUserId ? playerXp.xp : 0);

  async function handleAddFriend(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!currentUser?.id || !viewedUserId || currentUser.id === viewedUserId) return;

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

    const { data: friendRequest, error: requestError } = await supabase
      .from("friend_requests")
      .insert({ requester_id: currentUser.id, recipient_id: viewedUserId, status: "pending" })
      .select("id")
      .single();
    if (requestError || !friendRequest?.id) {
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
  }

  const controlCenterLinks = isViewingOwnProfile ? (
    <>
      <Link className="quick-link" href="/profile/teams">My Teams</Link>
      <Link className="quick-link" href="/profile/friends">My Friends</Link>
      <Link className="quick-link" href="/profile/edit?tab=awards">My Awards</Link>
      <Link className="quick-link" href="/profile/stats">My Stats</Link>
    </>
  ) : (
    <>
      <a className="quick-link" href="#" onClick={(e) => void handleAddFriend(e)}>Add Friend</a>
      <Link className="quick-link" href={`/profile/inbox?recipient=${encodeURIComponent(viewedUserId)}`}>Message Player</Link>
      <a className="quick-link" href={`/profile/awards?userId=${viewedUserId}`}>View Player Awards</a>
      <a className="quick-link" href={`/profile/friends?userId=${viewedUserId}`}>View Player Friends</a>
      <a className="quick-link" href={`/profile/teams?userId=${viewedUserId}`}>View Player Teams</a>
      {statsPublic && (
        <Link className="quick-link" href={`/profile/stats?userId=${viewedUserId}`}>View Player Stats</Link>
      )}
    </>
  );

  const ambTierLabel = ambassador?.tier === "ambassador" ? "Ambassador (Gold)" : "Affiliate";
  const ambNext = ambassador?.tier === "ambassador"
    ? { label: "Status", value: "Top tier" }
    : { label: "Next: Ambassador at", value: "65 qualified" };

  async function copyAmbLink() {
    if (!ambassador) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/amb/${ambassador.slug}`);
      setAmbLinkCopied(true);
      window.setTimeout(() => setAmbLinkCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function toggleAmbLive() {
    if (!ambassador || ambLiveBusy) return;
    setAmbLiveBusy(true);
    setAmbLiveMsg("");
    const next = !ambassador.live;
    const { data, error: liveError } = await supabase.rpc("gb_ambassador_go_live", { p_live: next });
    setAmbLiveBusy(false);
    if (liveError) {
      setAmbLiveMsg(liveError.message);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setAmbassador({ ...ambassador, live: row?.is_live === true });
    if (row?.is_live && typeof row.alerted === "number" && row.alerted > 0) {
      setAmbLiveMsg(`You're live! ${row.alerted} follower${row.alerted === 1 ? "" : "s"} emailed.`);
    } else if (row?.is_live) {
      setAmbLiveMsg("You're live!");
    } else {
      setAmbLiveMsg("Stream ended.");
    }
    window.setTimeout(() => setAmbLiveMsg(""), 4000);
  }
  const elitePosition =
    rankTier.index === 9 && Number.isFinite(rankNumber) && rankNumber >= 1 && rankNumber <= ELITE_LIMIT
      ? rankNumber
      : null;
  const eliteBand = elitePosition ? getEliteBand(elitePosition) : null;
  const totalGames = gbWins + gbLosses;
  const winPct = totalGames > 0 ? Math.round((gbWins / totalGames) * 100) : 0;
  const linkedPlatforms = [
    { key: "xbox", name: "Xbox", cls: "system-xbox", id: xboxGT },
    { key: "playstation", name: "PlayStation", cls: "system-playstation", id: psnGT },
    { key: "nintendo", name: "Nintendo", cls: "system-nintendo", id: nintendoGT },
    { key: "pc", name: "PC", cls: "system-pc", id: pcGT },
    { key: "ea", name: "EA", cls: "system-ea", id: eaGT },
    ...(linkedIds?.userId === viewedUserId ? linkedIds.entries : []).map((entry) => ({
      key: entry.id, name: entry.service, cls: "system-other", id: entry.account_id,
    })),
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

        /* Ambassadors: the page frame glows gold no matter their favorite system. */
        .profile-page.amb-gold-frame .wrapper{
          border-left:1px solid rgba(242,193,78,.6);
          border-right:1px solid rgba(242,193,78,.6);
          box-shadow:-20px 0 44px rgba(242,193,78,.6), 20px 0 44px rgba(242,193,78,.6);
          animation:pfFrameGold 4.5s ease-in-out infinite;
        }
        @keyframes pfFrameGold{
          50%{ box-shadow:-20px 0 56px rgba(255,217,107,.78), 20px 0 56px rgba(255,217,107,.78); }
        }
        @media (prefers-reduced-motion: reduce){
          .profile-page.amb-gold-frame .wrapper{ animation:none; }
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

        .wrapper{ width:min(1040px,calc(100% - 24px)); margin:0 auto; }

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
          border:1px solid #6f86bb;
          border-radius:7px;
          display:flex;
          overflow:hidden;
          box-shadow:0 2px 12px rgba(0,0,0,.45),0 0 14px rgba(105,128,255,.25);
          position:relative;
        }

        .header-ad:hover,.header-ad:focus-within{
          border-color:#fff;
          box-shadow:0 2px 16px rgba(0,0,0,.55),0 0 18px rgba(126,161,255,.5);
        }

        .promo-banner{
          display:flex;
          align-items:center;
          gap:9px;
          width:100%;
          min-width:0;
          padding:6px 9px;
          color:#fff;
          text-decoration:none;
          transition:filter .2s ease;
        }
        .promo-banner:hover,.promo-banner:focus-visible{filter:brightness(1.12)}
        .promo-banner:focus-visible{outline:2px solid #fff;outline-offset:-3px}
        .promo-discord{
          background:linear-gradient(115deg,#273582 0%,#4c52b8 55%,#24275a 100%);
        }
        .promo-invite{
          background:linear-gradient(115deg,#54340d 0%,#8a5717 50%,#352816 100%);
        }
        .promo-challenges{
          background:linear-gradient(115deg,#0b4027 0%,#15845a 55%,#0a3322 100%);
        }
        .promo-tournaments{
          background:linear-gradient(115deg,#5a0d16 0%,#b02433 52%,#3c0a12 100%);
        }
        .promo-ambassadors{
          background:linear-gradient(115deg,#4e3407 0%,#a3741a 52%,#2c2206 100%);
        }
        .promo-building{
          background:linear-gradient(115deg,#0b3246 0%,#1879a8 55%,#0a2838 100%);
        }
        .promo-rivalry{background:linear-gradient(110deg,#3b0d17,#a12c32)}
        .promo-event{background:linear-gradient(110deg,#321514,#90502b)}
        .promo-construction{background:repeating-linear-gradient(135deg,#313333 0 16px,#3c3b2b 16px 32px)}
        .promo-games{background:linear-gradient(110deg,#10283a,#246184)}
        .promo-affiliate{background:linear-gradient(110deg,#261c09,#806018)}
        .promo-icon{
          display:flex;
          align-items:center;
          justify-content:center;
          flex:none;
          width:44px;
          height:44px;
          border:1px solid rgba(255,255,255,.4);
          border-radius:12px;
          background:rgba(255,255,255,.14);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.15);
        }
        .promo-icon svg{width:34px;height:34px;fill:#fff}
        .promo-icon img{
          width:40px;
          height:40px;
          object-fit:contain;
        }
        .promo-copy{flex:1;min-width:0;line-height:1.2}
        .promo-eyebrow{display:block;font-size:9px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#d9e0ff}
        .promo-invite .promo-eyebrow{color:#ffe0a2}
        .promo-challenges .promo-eyebrow{color:#b2ffd9}
        .promo-tournaments .promo-eyebrow{color:#ffc9cf}
        .promo-ambassadors .promo-eyebrow{color:#ffe9ab}
        .promo-building .promo-eyebrow{color:#b4e6ff}
        .promo-title{display:block;margin-top:3px;font-size:14px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .promo-sub{display:block;margin-top:3px;font-size:10px;color:#f1f3ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .promo-action{flex:none;padding:6px 8px;border-radius:4px;background:#fff;color:#303d91;font-size:10px;font-weight:900;white-space:nowrap}
        .promo-invite .promo-action{background:#ffdb7b;color:#382100}
        .promo-challenges .promo-action{background:#8ff5c4;color:#043019}
        .promo-tournaments .promo-action{background:#ffd0d5;color:#4b0810}
        .promo-ambassadors .promo-action{background:#ffdf8e;color:#2c2206}
        .promo-building .promo-action{background:#b4e6ff;color:#05283a}
        @media (max-width:380px){.promo-banner{gap:7px;padding:6px 7px}.promo-title{font-size:12px}.promo-sub{font-size:9px}.promo-action{padding:6px}}

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
        .pf-avatar img.pf-avatar-bg{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:blur(12px) brightness(.6); transform:scale(1.2); }
        .pf-avatar img.pf-avatar-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; object-position:center; }
        .pf-identity{ flex:1; min-width:0; align-self:stretch; display:flex; flex-direction:column; justify-content:space-between; }
        .pf-name-row{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .pf-name{
          font-size:34px;
          font-weight:bold;
          color:#f2c14e;
          text-transform:uppercase;
          letter-spacing:.5px;
          overflow-wrap:anywhere;
        }
        .pf-level{ display:flex; align-items:center; gap:10px; margin:0 0 10px; padding:9px 4px 10px; border-top:1px solid #1d3a55; border-bottom:1px solid #1d3a55; text-align:left; text-decoration:none; }
        .pf-level:hover .pf-level-text strong{ text-decoration:underline; }
        .pf-level-text{ flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
        .pf-level-text strong{ font-size:12px; line-height:14px; color:var(--lv); text-transform:uppercase; letter-spacing:.04em; }
        .pf-level-text small{ font-size:10px; line-height:12px; color:#8fa9c2; }
        .pf-level-bar{ display:block; width:100%; height:4px; border-radius:3px; background:#1a2c3d; overflow:hidden; }
        .pf-level-bar i{ display:block; height:100%; border-radius:3px; background:var(--lv); }
        .pf-banner-top .pf-avatar.pf-avatar-amb{
          box-shadow:0 0 0 3px #05090f, 0 0 0 6px #f2c14e, 0 0 13px 3px rgba(255,211,77,.6), 0 0 30px 6px rgba(242,193,78,.3);
          animation:pfAmbGlow 3.6s ease-in-out infinite;
        }
        @keyframes pfAmbGlow{
          50%{ box-shadow:0 0 0 3px #05090f, 0 0 0 6px #ffdf8e, 0 0 18px 5px rgba(255,217,107,.75), 0 0 40px 9px rgba(242,193,78,.4); }
        }
        @media (prefers-reduced-motion: reduce){ .pf-banner-top .pf-avatar.pf-avatar-amb{ animation:none; } }
        .pf-role-amb{ color:#f2c14e !important; }
        .nav-actions{ position:relative; }
        .nav-actions summary{ list-style:none; cursor:pointer; padding:8px 4px; color:#ffdf8e; font-size:10.5px; font-weight:800; letter-spacing:.4px; text-transform:uppercase; white-space:nowrap; }
        .nav-actions summary::-webkit-details-marker{ display:none; }
        .nav-actions summary:hover{ color:#fff; }
        .nav-actions-menu{ position:absolute; right:0; top:100%; z-index:60; min-width:210px; padding:6px; background:#0a1522; border:1px solid #6e5213; border-radius:0 0 8px 8px; box-shadow:0 16px 32px rgba(0,0,0,.75); display:flex; flex-direction:column; }
        .nav-actions-menu .quick-link{ padding:9px 12px; border-bottom:1px solid #16293c; }
        .nav-actions-menu .quick-link:last-child{ border-bottom:none; }
        .amb-box{ border-color:#6e5213 !important; }
        .amb-box .box-title{ background:linear-gradient(to bottom,#2c2206,#171103); color:#f2c14e; }
        .amb-body{ padding:8px 10px 12px; }
        .amb-row{ display:flex; justify-content:space-between; gap:10px; padding:7px 2px; color:#b9cde0; font-size:12px; border-bottom:1px solid #241d08; }
        .amb-row b{ color:#f2c14e; text-align:right; }
        .amb-link{ display:block; width:100%; margin-top:11px; padding:8px; border-radius:6px; border:1px dashed #6e5213; background:#050c13; color:#8fa9c2; font-size:10.5px; text-align:center; cursor:pointer; font-family:inherit; }
        .amb-link b{ color:#ffdf8e; }
        .amb-link:hover{ border-color:#f2c14e; }
        .amb-live-btn{ display:block; width:100%; margin:4px 0 10px; padding:11px; border:none; border-radius:6px; background:linear-gradient(180deg,#ff5a5a,#c81414); color:#fff; font-size:12px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; font-family:inherit; box-shadow:0 6px 16px rgba(200,20,20,.35); }
        .amb-live-btn:hover{ filter:brightness(1.12); }
        .amb-live-btn:disabled{ opacity:.6; cursor:default; }
        .amb-live-btn.is-live{ background:#161d26; border:1px solid #e91916; color:#ff9aa4; box-shadow:0 0 14px rgba(233,25,22,.35); }
        .amb-live-msg{ margin:-4px 0 10px; color:#7df0b6; font-size:11px; text-align:center; }
        .pf-amb-live{ background:#e91916 !important; box-shadow:0 0 16px rgba(233,25,22,.6); }
        .pf-live-dot{ display:inline-block; width:7px; height:7px; border-radius:50%; background:#fff; margin-right:2px; animation:pfLiveDot 1.3s infinite; }
        @keyframes pfLiveDot{ 50%{ opacity:.25; } }
        .pf-role-shimmer{
          background:linear-gradient(100deg,#d4a637 0%,#f2c14e 38%,#fff6d8 50%,#f2c14e 62%,#d4a637 100%);
          background-size:240% 100%;
          -webkit-background-clip:text;
          background-clip:text;
          color:transparent !important;
          text-shadow:none;
          filter:drop-shadow(0 0 5px rgba(255,217,107,.55));
          animation:pfRoleShine 2.6s linear infinite, pfRoleGlow 2.6s ease-in-out infinite;
        }
        @keyframes pfRoleShine{ to{ background-position:-240% 0; } }
        @keyframes pfRoleGlow{ 50%{ filter:drop-shadow(0 0 7px rgba(255,217,107,.8)); } }
        .profile-page .pf-banner.pf-banner-amb{
          border:1px solid rgba(242,193,78,.55);
          box-shadow:0 0 14px rgba(242,193,78,.25), 0 0 36px rgba(242,193,78,.12), inset 0 0 22px rgba(242,193,78,.04);
        }
        @media (prefers-reduced-motion: reduce){
          .pf-role-shimmer{ animation:none; color:#f2c14e !important; -webkit-background-clip:border-box; background:none; }
        }
        .pf-amb-chip{ display:inline-flex; align-items:center; gap:5px; padding:5px 13px; border-radius:999px; background:linear-gradient(180deg,#ffe9ab,#e0a020); color:#231600; font-size:10px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; text-decoration:none; box-shadow:0 0 14px #f2c14e55; }
        .pf-amb-chip:hover{ filter:brightness(1.1); }
        .pf-amb-stream{ display:inline-flex; align-items:center; gap:6px; padding:6px 13px; border-radius:4px; background:#e91916; color:#fff; font-size:10px; font-weight:900; letter-spacing:.08em; text-decoration:none; }
        .pf-amb-stream:hover{ filter:brightness(1.15); }
        .pf-facts{ display:flex; gap:28px; flex-wrap:wrap; }
        .pf-facts > div{ text-align:center; }
        .pf-facts span{ display:block; font-size:11px; line-height:14px; color:#8fa9c2; font-weight:bold; margin-bottom:8px; }
        .pf-facts strong{ display:flex; align-items:flex-end; justify-content:center; font-size:15px; line-height:18px; height:20px; color:#fff; }
        .pf-facts .pf-since{ font-size:11px; font-weight:normal; color:#cfdbe8; line-height:16px; }
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
        .pf-inbox-btn{ position:relative; }
        .pf-inbox-btn .mail-dot{ right:8px; top:50%; transform:translateY(-50%); }
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
        .pf-award-trigger{ position:absolute; inset:0; z-index:3; width:100%; border:0; background:transparent; cursor:pointer; }
        .pf-award-trigger:focus-visible{ outline:2px solid #80c8ff; outline-offset:2px; }
        .pf-award-art{ height:104px; display:flex; align-items:flex-end; justify-content:center; position:relative; transition:transform .25s; }
        .pf-award-art .award-art,.pf-award-art .award-sprite,.pf-award-art .award-emblem{ width:auto; max-width:100%; height:104px!important; overflow:visible; animation:pfFloat 3.6s ease-in-out infinite; filter:saturate(.82) contrast(1.12) brightness(.92) drop-shadow(0 4px 6px rgba(0,0,0,.7)); }
        .pf-award:nth-child(2n) .award-art,.pf-award:nth-child(2n) .award-sprite,.pf-award:nth-child(2n) .award-emblem{ animation-delay:-1.3s; }
        .pf-award:nth-child(3n) .award-art,.pf-award:nth-child(3n) .award-sprite,.pf-award:nth-child(3n) .award-emblem{ animation-delay:-2.4s; }
        .pf-award.earned .pf-award-art:after{ content:""; position:absolute; left:14%; right:14%; bottom:-3px; height:7px; border-radius:50%; background:radial-gradient(ellipse,rgba(110,190,255,.55),transparent 70%); }
        .pf-award.earned:hover,.pf-award.earned:focus-within{ z-index:5; }
        .pf-award.earned:hover .pf-award-art,.pf-award.earned:focus-within .pf-award-art{ transform:translateY(-6px) scale(1.12); z-index:2; }
        .pf-award-tooltip{ display:none; position:absolute; z-index:4; top:100%; left:50%; transform:translateX(-50%); width:240px; max-width:min(240px,calc(100vw - 32px)); box-sizing:border-box; padding:11px 13px; border:1px solid #416d90; border-radius:5px; background:#081521; box-shadow:0 10px 24px #000b; color:#d7e6f2; text-align:left; font-size:12px; line-height:1.45; overflow-wrap:anywhere; }
        .pf-award:not(.tooltip-dismissed):hover .pf-award-tooltip,.pf-award:not(.tooltip-dismissed):focus-within .pf-award-tooltip{ display:grid; gap:5px; }
        .pf-award-tooltip strong{ color:#fff; font-size:13px; }
        .pf-award-tooltip .award-purpose-list{ margin:0; padding-left:16px; list-style:disc; }
        .pf-award-tooltip .award-purpose-list li + li{ margin-top:4px; }
        .pf-award-tooltip .award-purpose-list li::marker{ color:#e0bb68; }
        .pf-award-tooltip-meta{ margin-top:4px; padding-top:7px; border-top:1px solid #26435a; color:#a9c3d8; font-size:11px; }
        .pf-award:nth-child(1) .pf-award-tooltip{ left:0; transform:none; }
        .pf-award:nth-child(6) .pf-award-tooltip{ left:auto; right:0; transform:none; }
        .pf-award-ghost{ opacity:.35; width:60px; height:80px; }
        .pf-award.locked .pf-award-art{ align-items:center; }
        .pf-award-name{ font-size:11px; color:#b9cde0; overflow-wrap:anywhere; margin-top:4px; line-height:1.2; }
        @keyframes pfFloat{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-10px) } }
        .pf-spark{ position:absolute; width:9px; height:9px; background:#fff; opacity:0; pointer-events:none; clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%); animation:pfTwinkle 3.4s ease-in-out infinite; }
        .pf-spark.s1{ left:18%; top:14%; }
        .pf-spark.s2{ right:16%; top:30%; animation-duration:4.1s; animation-delay:1.3s; width:7px; height:7px; }
        .pf-spark.s3{ left:28%; bottom:22%; animation-duration:3.7s; animation-delay:2.2s; width:6px; height:6px; }
        .pf-spark.s4{ right:26%; bottom:36%; animation-duration:4.6s; animation-delay:.6s; width:5px; height:5px; }
        .pf-spark.s5{ left:14%; top:48%; animation-duration:3.9s; animation-delay:3s; width:5px; height:5px; }
        .pf-award-art .award-art ~ .pf-spark{ display:none; }
        @keyframes pfTwinkle{ 0%,100%{ opacity:0; transform:scale(.3) rotate(0deg) } 15%{ opacity:0; transform:scale(.3) rotate(0deg) } 40%{ opacity:.95; transform:scale(1) rotate(20deg) } 50%{ opacity:.6; transform:scale(.8) rotate(30deg) } 58%{ opacity:.9; transform:scale(.95) rotate(40deg) } 80%{ opacity:0; transform:scale(.4) rotate(60deg) } }
        @media (hover:hover) and (pointer:fine){
          .pf-award-art .award-art,.pf-award-art .award-sprite,.pf-award-art                     .award-emblem{ animation-duration:5s; }
                    .pf-award:nth-child(2n) .award-art,.pf-award:nth-child(2n) .award-sprite,.pf-award:nth-child(2n) .award-emblem{ animation-delay:-1.7s; }
                    .pf-award:nth-child(3n) .award-art,.pf-award:nth-child(3n) .award-sprite,.pf-award:nth-child(3n) .award-emblem{ animation-delay:-3.3s; }
        }
        .pf-friend-row{ display:flex; flex-wrap:wrap; gap:14px; }
        .pf-friend{ width:90px; text-align:center; font-size:13px; font-weight:bold; color:#eef7ff; }
        .pf-friend-avatar{
          width:74px; height:74px; margin:0 auto 6px; padding:2px; border-radius:50%;
          background:#3b86c4;
          box-shadow:0 2px 8px rgba(0,0,0,.45);
        }
        .pf-friend-image{
          width:100%; height:100%; border-radius:50%; overflow:hidden;
          background:radial-gradient(circle at 30% 25%,#245f94,#0a1521 80%);
          display:flex; align-items:center; justify-content:center;
          font-weight:bold; font-size:23px; color:#f2c14e;
        }
        .pf-friend-image.has-image{ background:#000; }
        .pf-friend-image img{ width:70%; height:70%; object-fit:contain; filter:brightness(1.12) contrast(1.1); }
        .pf-friend-image img.landscape{ width:78%; height:60%; }
        .pf-friend-image img.portrait{ width:60%; height:78%; }
        .pf-friend > span{ display:block; overflow-wrap:anywhere; }
        .pf-friend-avatar.favorite-xbox{ background:#2bd96b; box-shadow:0 0 12px rgba(0,255,100,.5); }
        .pf-friend-avatar.favorite-playstation{ background:#2f91ff; box-shadow:0 0 12px rgba(0,120,255,.5); }
        .pf-friend-avatar.favorite-nintendo{ background:#ff4b4b; box-shadow:0 0 12px rgba(255,45,45,.5); }
        .pf-friend-avatar.favorite-pc{ background:#a56bff; box-shadow:0 0 12px rgba(170,95,255,.5); }
        .pf-friend-avatar.friend-gold{ background:#f2c14e; box-shadow:0 0 12px rgba(242,193,78,.6); }
        .pf-friend-avatar[class*="creator-style-"]{ background:var(--creator-accent); box-shadow:0 0 12px color-mix(in srgb,var(--creator-glow) 65%,transparent); }
        .pf-friend-avatar.friend-rgb{
          position:relative;
          isolation:isolate;
          background:transparent;
          animation:friend-rgb-glow 12s ease-in-out infinite;
        }
        .pf-friend-avatar.friend-rgb::before{
          content:"";
          position:absolute;
          inset:0;
          z-index:-1;
          border-radius:50%;
          background:var(--founder-rgb-spectrum);
          background-size:100% 200%;
          filter:saturate(.75) brightness(.85);
          animation:founder-rgb-flow 8s linear infinite, friend-rgb-hue 12s linear infinite;
        }
        @keyframes friend-rgb-hue{
          from{ filter:saturate(.75) brightness(.85) hue-rotate(0deg); }
          to{ filter:saturate(.75) brightness(.85) hue-rotate(360deg); }
        }
        @keyframes friend-rgb-glow{
          0%,100%{ box-shadow:0 0 8px #39f8ff99,0 0 14px #368aff55; }
          20%{ box-shadow:0 0 8px #4a86ff99,0 0 14px #9a37e855; }
          40%{ box-shadow:0 0 8px #c55bff99,0 0 14px #ff5ba555; }
          60%{ box-shadow:0 0 8px #ff454599,0 0 14px #ffad3d55; }
          80%{ box-shadow:0 0 8px #62ff6299,0 0 14px #39f8ff55; }
        }
        @media (prefers-reduced-motion:reduce){
          .pf-friend-avatar.friend-rgb{ animation:none; box-shadow:0 0 8px #39f8ff99; }
          .pf-friend-avatar.friend-rgb::before{ animation:none; }
        }
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
          position:relative; display:flex; align-items:center; justify-content:center;
          color:#f2c14e; font-weight:bold; font-size:18px; overflow:hidden;
        }
        .pf-team-logo img{ width:100%; height:100%; object-fit:cover; object-position:center; }
        .pf-team-name{ font-weight:bold; font-size:13px; overflow-wrap:anywhere; }
        .pf-team-platform{ display:block; margin-top:3px; color:#8fa9c2; font-size:10px; font-weight:normal; }
        .pf-team-meta{ text-align:right; font-size:12px; color:#b9cde0; }
        .pf-team-meta strong{ display:block; color:#fff; }
        .pf-record-head,.pf-record-row{
          display:grid; grid-template-columns:1fr 70px 40px; gap:8px;
          padding:6px 4px; font-size:12px; align-items:center;
        }
        .pf-record-head{ color:#8fa9c2; font-weight:bold; border-bottom:1px solid #244b70; }
        .pf-record-row{ border-bottom:1px solid #16273a; color:#fff; }
        .pf-record-row .pf-linked{ grid-column:2 / span 2; min-width:0; overflow-wrap:anywhere; color:#b9cde0; }
        .pf-record-row .system-link{ min-width:0; overflow-wrap:anywhere; }
        .pf-gap{ margin-top:12px; }
        .pf-bio{ font-size:13px; line-height:1.5; color:#d7eaff; }

        .profile-page{ background:linear-gradient(180deg,#071522,#050e18 60%,#040a12); }
        .wrapper{ background:#07121f; padding-bottom:8px; }
        .site-nav-bar{ margin-top:0; }
        .pf-banner{ margin-top:0; background:linear-gradient(180deg,#0f2236,#09141f); }
        .pf-banner-top{ padding:12px 14px; gap:14px; }
        .pf-avatar{ width:120px; height:120px; font-size:38px; }
        .pf-name{ font-size:30px; }
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
        .pf-team-logo{ background:radial-gradient(circle at 30% 25%,#1d4a74,#0a1521 80%); }
        .pf-showall{ background:#0f2a43; margin-top:8px; }
        .pf-two-col{ gap:10px; }
        .pf-two-col .pf-section{ min-width:0; }
        .pf-bio{ margin:0; }
        .pf-facts{ gap:16px; flex-wrap:nowrap; margin-bottom:-8px; }
        .pf-facts > div{ white-space:nowrap; }
        .pf-banner-actions{ width:150px; }
        .pf-tags{ display:flex; flex-direction:column; gap:5px; width:230px; flex:none; align-self:stretch; justify-content:center; }
        .pf-tag{
          display:grid; grid-template-columns:92px minmax(0,1fr); align-items:center;
          background:#0a1c2e; border:1px solid #244b70; border-left-width:4px;
          font-size:12px; min-height:26px;
        }
        .pf-tag-platform{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0 8px; font-weight:bold; font-size:11px; text-transform:uppercase; letter-spacing:.3px; }
        .pf-tag-id{ padding:0 8px; color:#fff; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; background:rgba(255,255,255,.05); line-height:26px; }
        .system-xbox-tag{ border-left-color:#2bd96b; } .system-xbox-tag .pf-tag-platform{ color:#2bd96b; }
        .system-playstation-tag{ border-left-color:#2f7bff; } .system-playstation-tag .pf-tag-platform{ color:#4d94ff; }
        .system-nintendo-tag{ border-left-color:#ff4b4b; } .system-nintendo-tag .pf-tag-platform{ color:#ff6b6b; }
        .system-pc-tag{ border-left-color:#a56bff; } .system-pc-tag .pf-tag-platform{ color:#b98cff; }
        .system-ea-tag{ border-left-color:#ff8a2a; } .system-ea-tag .pf-tag-platform{ color:#ff9a45; }
        .system-other-tag{ border-left-color:#65b5d5; } .system-other-tag .pf-tag-platform{ color:#9bd8f0; }
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
          .pf-award:nth-child(3n+1) .pf-award-tooltip{ left:0; right:auto; transform:none; }
          .pf-award:nth-child(3n) .pf-award-tooltip{ left:auto; right:0; transform:none; }
        }
        @media (max-width:600px){
          .header{height:auto;flex-direction:column;align-items:flex-start;gap:8px;padding:8px 14px}
          .logo-box{width:100%;height:auto;min-height:50px}
          .header-ad{width:min(360px,100%);flex:none;align-self:center}
          .pf-facts{flex-wrap:wrap;gap:8px 14px;margin-bottom:0}
        }
      `}</style>

      <div className={`profile-page ${favoriteSystemClass(favoriteSystem)}${isAmbassador ? " amb-gold-frame" : ""}${currentCreatorStyle && currentCreatorStyle.theme !== "classic" ? ` creator-style-${currentCreatorStyle.theme}${currentCreatorStyle.tier === "ambassador" ? " creator-full" : ""}` : ""}${hasFounderRgbGlow(profile?.role, profile?.username, profile?.profile_glow) ? " founder-rgb" : ""}`}>
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

            <div className="header-ad" onMouseEnter={() => setBannerHovered(true)} onMouseLeave={() => setBannerHovered(false)} onFocus={() => setBannerFocused(true)} onBlur={() => setBannerFocused(false)}>
              {promoIndex >= 6 ? (() => {
                const promo = NEW_PROMOS[NEW_PROMO_KINDS[promoIndex - 6]];
                return (
                  <Link className={`promo-banner promo-${promo.category}`} href={promo.href}>
                    <span className="promo-icon"><Image src="/logo-emblem.png" alt="" width={40} height={40} /></span>
                    <span className="promo-copy">
                      <span className="promo-eyebrow">{promo.tag}</span>
                      <span className="promo-title">{promo.bannerTitle}</span>
                      <span className="promo-sub">{promo.bannerText}</span>
                    </span>
                    <span className="promo-action">GO &#8594;</span>
                  </Link>
                );
              })() : promoIndex === 1 ? (
                <Link className="promo-banner promo-invite" href="/profile/awards#invite-rewards">
                  <span className="promo-icon"><Image src="/logo-emblem.png" alt="" width={40} height={40} /></span>
                  <span className="promo-copy">
                    <span className="promo-eyebrow">GameBattles rewards</span>
                    <span className="promo-title">INVITE FRIENDS</span>
                    <span className="promo-sub">Bring friends. Unlock awards.</span>
                  </span>
                  <span className="promo-action">GET LINK &#8594;</span>
                </Link>
              ) : promoIndex === 2 ? (
                <Link className="promo-banner promo-challenges" href="/challenges">
                  <span className="promo-icon">
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <path d="M32 6 38.6 19.4 53.4 21.5 42.7 31.9 45.2 46.6 32 39.7 18.8 46.6 21.3 31.9 10.6 21.5 25.4 19.4Z" />
                      <path d="M18 52h28v4H18z" opacity=".75" />
                    </svg>
                  </span>
                  <span className="promo-copy">
                    <span className="promo-eyebrow">Fresh every week</span>
                    <span className="promo-title">WEEKLY CHALLENGES</span>
                    <span className="promo-sub">Complete them. Earn trophies.</span>
                  </span>
                  <span className="promo-action">VIEW &#8594;</span>
                </Link>
              ) : promoIndex === 3 ? (
                <Link className="promo-banner promo-tournaments" href="/tournaments">
                  <span className="promo-icon">
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <path d="M20 10h24v6c0 12-5 19-12 21-7-2-12-9-12-21Z" />
                      <path d="M20 13h-8c0 9 4 14 10 16-1.4-2.6-2.4-5.8-2.9-9.4A47 47 0 0 1 20 13Zm24 0h8c0 9-4 14-10 16 1.4-2.6 2.4-5.8 2.9-9.4A47 47 0 0 0 44 13Z" opacity=".8" />
                      <rect x="29" y="37" width="6" height="7" />
                      <path d="M23 48h18v6H23z" />
                    </svg>
                  </span>
                  <span className="promo-copy">
                    <span className="promo-eyebrow">Prove yourself</span>
                    <span className="promo-title">JOIN A TOURNAMENT</span>
                    <span className="promo-sub">Win the bracket. Become a champion.</span>
                  </span>
                  <span className="promo-action">PLAY &#8594;</span>
                </Link>
              ) : promoIndex === 4 ? (
                <Link className="promo-banner promo-ambassadors" href="/ambassadors">
                  <span className="promo-icon">
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <path d="M10 24 21 32 32 17 43 32 54 24 50 46H14Z" />
                      <rect x="14" y="49" width="36" height="5" rx="2" opacity=".85" />
                      <circle cx="10" cy="20" r="3.4" /><circle cx="32" cy="13" r="3.8" /><circle cx="54" cy="20" r="3.4" />
                    </svg>
                  </span>
                  <span className="promo-copy">
                    <span className="promo-eyebrow">Creator program</span>
                    <span className="promo-title">GB AMBASSADORS</span>
                    <span className="promo-sub">Gold status. Events in your name.</span>
                  </span>
                  <span className="promo-action">LEARN &#8594;</span>
                </Link>
              ) : promoIndex === 5 ? (
                <Link className="promo-banner promo-building" href="/ranks">
                  <span className="promo-icon">
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="5" opacity=".55" />
                      <path d="M22 33 29 40 43 25" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="promo-copy">
                    <span className="promo-eyebrow">Always improving</span>
                    <span className="promo-title">BUILT IN THE OPEN</span>
                    <span className="promo-sub">Your rank &amp; XP never reset.</span>
                  </span>
                  <span className="promo-action">RANKS &#8594;</span>
                </Link>
              ) : (
                <a className="promo-banner promo-discord" href="https://discord.gg/nKZdS2BDS6" target="_blank" rel="noopener noreferrer">
                  <span className="promo-icon">
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <path d="M50.6 14.7a48 48 0 0 0-11.8-3.6l-1.5 3.1a44 44 0 0 0-10.6 0l-1.5-3.1a48 48 0 0 0-11.8 3.6C6 25.8 4 36.6 5 47.2a48 48 0 0 0 14.5 7.3l3.1-5.1a31 31 0 0 1-4.9-2.4l1.2-.9c9.4 4.4 19.7 4.4 29 0l1.2.9a31 31 0 0 1-4.9 2.4l3.1 5.1A48 48 0 0 0 57 47.2c1.2-12.3-2-23-6.4-32.5ZM23.8 39.4c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Zm16.4 0c-2.8 0-5.1-2.5-5.1-5.5s2.3-5.5 5.1-5.5 5.1 2.5 5.1 5.5-2.3 5.5-5.1 5.5Z" />
                    </svg>
                  </span>
                  <span className="promo-copy">
                    <span className="promo-eyebrow">GameBattles community</span>
                    <span className="promo-title">JOIN OUR DISCORD</span>
                    <span className="promo-sub">Find players. Get in the game.</span>
                  </span>
                  <span className="promo-action">JOIN &#8594;</span>
                </a>
              )}
            </div>
          </header>

          <SiteNav
            showLadders={false}
            profileNavigation
            extra={isAmbassador ? (
              <details className="nav-actions">
                <summary>{isViewingOwnProfile ? "Control Center" : "Player Actions"} ▾</summary>
                <div className="nav-actions-menu">
                  {controlCenterLinks}
                </div>
              </details>
            ) : undefined}
          />

          {profile ? (
            <div className={`pf-banner${ambassador?.userId === viewedUserId ? " pf-banner-amb" : ""}`}>
              {currentCreatorStyle && <CreatorFrameArt theme={currentCreatorStyle.theme} />}
              {currentCreatorStyle && currentCreatorStyle.theme !== "classic" && <div className="creator-watermark" aria-hidden="true">
                {currentCreatorStyle.show_name && <span>{playerName}</span>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {currentCreatorStyle.show_logo && (logoUrl || avatarUrl) && <img src={logoUrl || avatarUrl} alt="" />}
              </div>}
              <div className="pf-banner-top">
                <div className={`pf-avatar${ambassador?.userId === viewedUserId ? " pf-avatar-amb" : ""}`}>
                  {logoUrl || avatarUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async" className="pf-avatar-bg" src={logoUrl || avatarUrl} alt="" aria-hidden="true" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async" className="pf-avatar-img" src={logoUrl || avatarUrl} alt={playerName} />
                    </>
                  ) : (
                    <span>{playerName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <div className="pf-identity">
                  <div className="pf-name-row">
                    <div className="pf-name">{playerName}</div>
                    {ambassador?.userId === viewedUserId && (
                      <>
                        <Link className="pf-amb-chip" href="/ambassadors" title="GameBattles Ambassador Program">
                          ★ {ambassador.tier === "ambassador" ? "Ambassador" : "Affiliate"}
                        </Link>
                        {(ambassador.twitch || ambassador.youtube || ambassador.kick) && (
                          <a
                            className={`pf-amb-stream${ambassador.live ? " pf-amb-live" : ""}`}
                            href={ambassador.twitch || ambassador.youtube || ambassador.kick}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {ambassador.live ? <><i className="pf-live-dot" /> LIVE — WATCH NOW</> : <>▶ WATCH STREAM</>}
                          </a>
                        )}
                      </>
                    )}
                    {!isViewingOwnProfile && viewedUserId && (
                      <FollowButton
                        targetType="player"
                        targetId={viewedUserId}
                        onChange={() => void loadFollowCounts(viewedUserId)}
                      />
                    )}
                  </div>
                  <div className="pf-facts">
                    <div>
                      <span>Member Since</span>
                      <strong className="pf-since">{formatMemberSince(joinedDate)}</strong>
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
                      <span>Role</span>
                      <strong className={isAmbassador ? "pf-role-amb pf-role-shimmer" : undefined}>{playerRole}</strong>
                    </div>
                    <div>
                      <span>Credits</span>
                      <strong>{(profile.credits || 0).toLocaleString()}</strong>
                    </div>
                    {isAmbassador && ambassador.recruits !== null && (
                      <div>
                        <span>Recruits</span>
                        <strong className="pf-role-amb">{ambassador.recruits.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pf-tags">
                  {linkedPlatforms.filter((p) => p.id).map((p) => (
                    <div className={`pf-tag ${p.cls}-tag`} key={p.key}>
                      <span className="pf-tag-platform" title={p.name}>{p.name}</span>
                      <span className="pf-tag-id" title={p.id}>{p.id}</span>
                    </div>
                  ))}
                  {linkedPlatforms.every((p) => !p.id) && (
                    <div className="pf-tag-empty">No gaming accounts linked</div>
                  )}
                  {linkedIds?.userId === viewedUserId && linkedIds.error && <div className="pf-tag-empty" role="alert">{linkedIds.error}</div>}
                </div>

                {currentUser?.id && isViewingOwnProfile && (
                <div className="pf-banner-actions">
                  <Link className="pf-btn" href="/profile/edit">Account / Profile</Link>
                  <Link className="pf-btn" href="/profile/gaming-accounts">Gaming Accounts</Link>
                  <Link className="pf-btn pf-inbox-btn" href="/profile/inbox">
                    Inbox
                    {unreadInboxCount > 0 && <span className="mail-dot"></span>}
                  </Link>
                </div>
                )}
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
                  {elitePosition && eliteBand ? (
                    <>
                      <EliteEmblem position={elitePosition} />
                      <div className="pf-tier-name" style={{ color: eliteBand.light }}>
                        Top {ELITE_LIMIT} - {eliteBand.name}
                      </div>
                    </>
                  ) : (
                    <>
                      <RankEmblem tierIndex={rankTier.index} />
                      <div className="pf-tier-name" style={{ color: rankTier.light }}>{rankTier.name}</div>
                    </>
                  )}
                  <div className="pf-rank-label">GB RANK</div>
                  {rankParts && (
                    <div className="pf-rank-value">
                      {rankParts.number}
                      <sup>{rankParts.suffix}</sup>
                    </div>
                  )}
                  <div className="pf-rank-points">{gbRankPoints} points</div>
                  <Link
                    href="/ranks"
                    className="pf-level"
                    title={playerLevel.nextXp !== null ? `${(playerLevel.nextXp - playerLevel.xp).toLocaleString()} XP to next level` : "Max level"}
                    style={{ ["--lv" as string]: playerLevel.tier.light }}
                  >
                    <RankBadgeArt rank={playerLevel} size={46} />
                    <span className="pf-level-text">
                      <strong>{playerLevel.title}</strong>
                      <small>Level {playerLevel.level} · {playerLevel.xp.toLocaleString()} XP</small>
                      <span className="pf-level-bar"><i style={{ width: `${Math.round(playerLevel.progress * 100)}%` }} /></span>
                    </span>
                  </Link>
                  <div className="stat-row"><span>Reputation</span><span>100%</span></div>
                  <div className="stat-row">
                    <span>Following</span>
                    <span>{followCounts ? followCounts.following_count.toLocaleString() : "..."}</span>
                  </div>
                  <div className="stat-row">
                    <span>Followers</span>
                    <span>{followCounts ? followCounts.followers_count.toLocaleString() : "..."}</span>
                  </div>
                  {followCountsError && (
                    <div className="error" role="alert">{followCountsError}</div>
                  )}
                </div>

                {isAmbassador && ambassador ? (
                  <div className="box amb-box">
                    <div className="box-title">★ {ambassador.tier === "ambassador" ? "Ambassador" : "Affiliate"}</div>
                    <div className="amb-body">
                      {isViewingOwnProfile && (
                        <>
                          <Link className="amb-link" href="/profile/creator-style">Customize profile style</Link>
                          <button
                            className={`amb-live-btn${ambassador.live ? " is-live" : ""}`}
                            type="button"
                            onClick={() => void toggleAmbLive()}
                            disabled={ambLiveBusy}
                          >
                            {ambLiveBusy ? "..." : ambassador.live ? "● LIVE — End stream" : "▶ Go Live"}
                          </button>
                          {ambLiveMsg && <div className="amb-live-msg" role="status">{ambLiveMsg}</div>}
                        </>
                      )}
                      <div className="amb-row"><span>Tier</span><b>{ambTierLabel}</b></div>
                      {creatorStyle?.userId === viewedUserId && creatorStyle.error && <div className="error" role="alert">Creator style could not be loaded: {creatorStyle.error}</div>}
                      <div className="amb-row"><span>Players recruited</span><b>{(ambassador.recruits ?? 0).toLocaleString()}</b></div>
                      <div className="amb-row"><span>Qualified recruits</span><b>{ambassador.qualified.toLocaleString()}</b></div>
                      <div className="amb-row"><span>{ambNext.label}</span><b>{ambNext.value}</b></div>
                      <button className="amb-link" type="button" onClick={() => void copyAmbLink()} title="Copy recruit link">
                        {ambLinkCopied ? "Link copied!" : <>gamebattles.app/amb/<b>{ambassador.slug}</b></>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="box control-center-box">
                    <div className="box-title">
                      {isViewingOwnProfile ? "Control Center" : "Player Actions"}
                    </div>
                    <div className="box-body">
                      {controlCenterLinks}
                    </div>
                  </div>
                )}
                {isViewingOwnProfile && <ProfileFollowingFeed />}
              </aside>

              <main className="main-column">
                <div className="pf-section">
                  <div className="pf-section-title"><span>Top Awards</span></div>
                  <div className="pf-award-row">
                    {topAwards.map((award, awardIndex) => (
                      <div
                        className={`pf-award ${award.label === "★" ? "earned" : "locked"}${dismissedAwardTooltip === awardIndex ? " tooltip-dismissed" : ""}`}
                        key={`${award.id}-${awardIndex}`}
                        title={award.label === "★" ? undefined : "Waiting to earn."}
                      >
                        <div className="pf-award-art">
                          {award.label === "★" ? (
                            <>
                              <AwardArt name={award.name} group={award.group} height={92} />
                              <span className="pf-spark s1" aria-hidden="true" />
                              <span className="pf-spark s2" aria-hidden="true" />
                              <span className="pf-spark s3" aria-hidden="true" />
                              <span className="pf-spark s4" aria-hidden="true" />
                              <span className="pf-spark s5" aria-hidden="true" />
                            </>
                          ) : (
                            <svg className="pf-award-ghost" viewBox="0 0 60 80" aria-hidden="true">
                              <path d="M30 4 L54 14 V40 C54 58 42 70 30 76 C18 70 6 58 6 40 V14 Z" fill="none" stroke="#4a7aa8" strokeWidth="2" strokeDasharray="4 4" />
                              <path d="M30 28 V46 M30 54 V56" stroke="#4a7aa8" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>
                        {award.label === "★" && <div className="pf-award-name">{award.name}</div>}
                        {chosenAwards[awardIndex] && (
                          <button
                            className="pf-award-trigger"
                            type="button"
                            aria-label={`View ${award.name} details`}
                            aria-haspopup="dialog"
                            aria-describedby={`profile-award-details-${awardIndex}`}
                            onMouseEnter={() => { setDismissedAwardTooltip(null); setLoadAwardCatalog(true); }}
                            onFocus={() => { setDismissedAwardTooltip(null); setLoadAwardCatalog(true); }}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") setDismissedAwardTooltip(awardIndex);
                            }}
                            onClick={() => {
                              const earned = chosenAwards[awardIndex];
                              if (earned) {
                                setLoadAwardCatalog(true);
                                setSelectedAward({ playerId: viewedUserId, award: earned });
                              }
                            }}
                          />
                        )}
                        {chosenAwards[awardIndex] && (
                          <AwardHoverDetails
                            id={`profile-award-details-${awardIndex}`}
                            award={chosenAwards[awardIndex]}
                            playerName={playerName}
                            catalogState={awardCatalog}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <AwardDetailsDialog
                    award={selectedAward?.playerId === viewedUserId ? selectedAward.award : null}
                    playerName={playerName}
                    catalogState={awardCatalog}
                    onClose={() => setSelectedAward(null)}
                  />
                </div>

                <div className="pf-section">
                  <div className="pf-section-title"><span>Top Friends</span></div>
                  <div className="pf-friend-row">
                    {currentFriends?.friends.map((friend) => (
                      <a className="pf-friend" href={`/profile?userId=${friend.id}`} key={friend.id}>
                        <div className={`pf-friend-avatar ${friend.frameClass}`}>
                          <div className={`pf-friend-image${friend.avatar_url ? " has-image" : ""}`}>
                          {friend.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img loading="lazy" decoding="async" src={friend.avatar_url} alt="" onLoad={(event) => {
                              const image = event.currentTarget;
                              image.classList.toggle("landscape", image.naturalWidth > image.naturalHeight * 1.15);
                              image.classList.toggle("portrait", image.naturalHeight > image.naturalWidth * 1.15);
                            }} />
                          ) : (
                            friend.username.slice(0, 2).toUpperCase()
                          )}
                          </div>
                        </div>
                        <span>{friend.username}</span>
                      </a>
                    ))}
                    {!currentFriends ? <div className="pf-empty">Loading friends...</div> : currentFriends.error ? <div className="pf-empty" role="alert">{currentFriends.error}</div> : currentFriends.private ? <div className="pf-empty">This friends list is private.</div> : currentFriends.friends.length === 0 && <div className="pf-empty">No friends to show yet.</div>}
                  </div>
                  <a className="pf-showall" href={`/profile/friends${isViewingOwnProfile ? "" : `?userId=${viewedUserId}`}`}>show all</a>
                </div>

                <div className="pf-two-col">
                  <div className="pf-section">
                    <div className="pf-section-title"><span>Featured Teams</span></div>
                    {topTeams.map((team) => (
                      <a className="pf-team" href={`/teams/${team.id}`} key={team.id}>
                        <div className="pf-team-logo">
                          {team.logo_url ? (
                            <Image
                              src={team.logo_url}
                              alt={team.name}
                              fill
                              unoptimized
                              sizes="54px"
                            />
                          ) : getTeamInitials(team.name)}
                        </div>
                        <div className="pf-team-name">
                          {team.name}
                          {team.platform && (
                            <span className="pf-team-platform">{ladderPlatformLabel(team.platform) || team.platform}</span>
                          )}
                        </div>
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
                      <div className="pf-record-row" key={platform.key}>
                        <span className={`system-link ${platform.cls}`}>{platform.name}</span>
                        <span className="pf-linked">{platform.id || "Not Linked"}</span>
                        <span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </main>
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
