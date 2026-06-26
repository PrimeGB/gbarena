"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";

type TeamRole = "leader" | "co-leader" | "captain" | "member";

type MatchPost = {
  id: string;
  team_id: string;
  platform: string;
  category: string;
  game: string;
  ladder: string;
  game_mode: string;
  players: string;
  match_time: string;
  best_of: string;
  preset: string | null;
  perks: string | null;
  launchers: string | null;
  killstreaks: string | null;
  field_upgrades: string | null;
  hardcore: string | null;
  friendly_fire: string | null;
  radar: string | null;
  spectating: string | null;
  third_person: string | null;
  round_length: string | null;
  score_limit: string | null;
  health: string | null;
  respawn_delay: string | null;
  bomb_timer: string | null;
  plant_time: string | null;
  defuse_time: string | null;
  attachments: string | null;
  status: string;
  created_at: string;
};

function prettyText(value: string | null) {
  if (!value) return "";

  if (value === "mw2") return "Call of Duty: Modern Warfare 2";
  if (value === "modern-warfare-ii") return "Call of Duty: Modern Warfare II";
  if (value === "modern-warfare-4") return "Call of Duty: Modern Warfare 4";
  if (value === "modern-warfare-iii") return "Call of Duty: Modern Warfare III";
  if (value === "black-ops-6") return "Call of Duty: Black Ops 6";
  if (value === "black-ops-cold-war") return "Call of Duty: Black Ops Cold War";
  if (value === "vanguard") return "Call of Duty: Vanguard";

  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getGameImage(game: string | null) {
  if (game === "mw2") return "https://cdn.cloudflare.steamstatic.com/steam/apps/10180/header.jpg";
  if (game === "modern-warfare-ii") return "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1938090/header.jpg";
  if (game === "black-ops-6") return "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg";
  if (game === "modern-warfare-iii") return "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2519060/header.jpg";
  if (game === "vanguard") return "https://cdn.cloudflare.steamstatic.com/steam/apps/1985820/header.jpg";
  if (game === "black-ops-cold-war") return "https://cdn.cloudflare.steamstatic.com/steam/apps/1985810/header.jpg";

  return "/mw4.jpeg";
}

function getLadderName(ladder: string | null) {
  if (ladder === "singles") return "Solos Ladder";
  if (ladder === "duos") return "Duos Ladder";
  return "Team Ladder";
}

function getRosterText(ladder: string) {
  if (ladder === "singles") return "1 Player";
  if (ladder === "duos") return "2 Players";
  return "8 Players";
}

function normalizeRole(value: string | null | undefined): TeamRole {
  const clean = String(value || "").toLowerCase();
  if (clean === "leader") return "leader";
  if (clean === "co-leader") return "co-leader";
  if (clean === "captain") return "captain";
  return "member";
}

function canManageMatches(role: TeamRole) {
  return role === "leader" || role === "co-leader" || role === "captain";
}

function parseDateMs(value: string | null | undefined) {
  if (!value) return 0;
  const d = new Date(value).getTime();
  return Number.isNaN(d) ? 0 : d;
}

function shouldHidePost(post: MatchPost) {
  const now = Date.now();
  const matchTime = parseDateMs(post.match_time);
  const createdTime = parseDateMs(post.created_at);
  const oneDay = 1000 * 60 * 60 * 24;

  if (matchTime && now >= matchTime) return true;
  if (createdTime && now - createdTime >= oneDay) return true;
  return false;
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ color: "#fff", padding: 40 }}>Loading...</div>}>
      <MatchFinder />
    </Suspense>
  );
}

function MatchFinder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser() as any;

  const platform = searchParams.get("platform") || "xbox";
  const category = searchParams.get("category") || "call-of-duty";
  const game = searchParams.get("game") || "modern-warfare-4";
  const ladder = searchParams.get("ladder") || "team";
  const viewerTeamId = searchParams.get("teamId") || "";

  const [matches, setMatches] = useState<MatchPost[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmMatch, setConfirmMatch] = useState<MatchPost | null>(null);
  const [cancelMatch, setCancelMatch] = useState<MatchPost | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<TeamRole>("member");

  const viewerCanManage = canManageMatches(viewerRole);

  async function loadMatches() {
    const { data } = await supabase
      .from("match_posts")
      .select("*")
      .eq("platform", platform)
      .eq("category", category)
      .eq("game", game)
      .eq("ladder", ladder)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    const posts = (data || []) as MatchPost[];
    setMatches(posts.filter((p) => !shouldHidePost(p)));
    setHasLoaded(true);
  }

  useEffect(() => {
    loadMatches();
  }, [platform, category, game, ladder]);

  useEffect(() => {
    async function loadRole() {
      if (!viewerTeamId || !user?.id) return;

      const { data } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", viewerTeamId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.role) setViewerRole(normalizeRole(data.role));
    }

    loadRole();
  }, [viewerTeamId, user?.id]);

  // ✅ FIXED ACCEPT FUNCTION
  async function acceptConfirmedMatch() {
    if (!confirmMatch) return;

    if (!user?.id) return setNotice("You must be signed in.");
    if (!viewerTeamId) return setNotice("Missing team ID.");
    if (!viewerCanManage) return setNotice("No permission.");

    setAcceptingId(confirmMatch.id);

    const { data, error } = await supabase.rpc("accept_match_post", {
      post_id: confirmMatch.id,
      accepting_team: viewerTeamId,
    });

    setAcceptingId(null);
    setConfirmMatch(null);

    if (error) {
      setNotice(error.message);
      return;
    }

    const matchId = data?.match_id || data?.[0]?.match_id;
    if (!matchId) return setNotice("Failed to create match.");

    router.push(`/matches/${matchId}`);
  }

  // ✅ FIXED CANCEL FUNCTION
  async function cancelConfirmedPost() {
    if (!cancelMatch) return;

    if (!user?.id) return setNotice("Must be signed in.");
    if (!viewerTeamId) return setNotice("Missing team ID.");
    if (!viewerCanManage) return setNotice("No permission.");

    setCancellingId(cancelMatch.id);

    const { error } = await supabase
      .from("match_posts")
      .update({ status: "cancelled" })
      .eq("id", cancelMatch.id)
      .eq("team_id", viewerTeamId);

    setCancellingId(null);
    setCancelMatch(null);

    if (error) return setNotice(error.message);

    setNotice("Match cancelled.");
    loadMatches();
  }

  return (
    <div style={{ color: "#fff", padding: 20 }}>
      <h1>Match Finder (Fixed Build Version)</h1>

      {notice && <p>{notice}</p>}

      {matches.map((m) => (
        <div key={m.id} style={{ marginBottom: 10 }}>
          <b>{m.players}</b> — {m.game_mode}

          <button onClick={() => setConfirmMatch(m)}>Accept</button>
          <button onClick={() => setCancelMatch(m)}>Cancel</button>
        </div>
      ))}

      {confirmMatch && (
        <div>
          <p>Confirm accept?</p>
          <button onClick={acceptConfirmedMatch}>
            Confirm Accept
          </button>
          <button onClick={() => setConfirmMatch(null)}>Close</button>
        </div>
      )}

      {cancelMatch && (
        <div>
          <p>Confirm cancel?</p>
          <button onClick={cancelConfirmedPost}>
            Confirm Cancel
          </button>
          <button onClick={() => setCancelMatch(null)}>Close</button>
        </div>
      )}
    </div>
  );
}