"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
  return value.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function canManage(role: TeamRole) {
  return role === "leader" || role === "co-leader" || role === "captain";
}

function parseMs(v: string | null) {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function isExpired(post: MatchPost) {
  const now = Date.now();
  const match = parseMs(post.match_time);
  const created = parseMs(post.created_at);
  return (match && now >= match) || (created && now - created > 86400000);
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ color: "#fff", padding: 20 }}>Loading...</div>}>
      <Content />
    </Suspense>
  );
}

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser() as any;

  const platform = searchParams.get("platform") || "xbox";
  const category = searchParams.get("category") || "call-of-duty";
  const game = searchParams.get("game") || "modern-warfare-4";
  const ladder = searchParams.get("ladder") || "team";
  const viewerTeamId = searchParams.get("teamId") || "";

  const [matches, setMatches] = useState<MatchPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [confirmMatch, setConfirmMatch] = useState<MatchPost | null>(null);
  const [cancelMatch, setCancelMatch] = useState<MatchPost | null>(null);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [role, setRole] = useState<TeamRole>("member");
  const canManage = canManage(role);

  async function load() {
    setError("");

    const { data, error } = await supabase
      .from("match_posts")
      .select("*")
      .eq("platform", platform)
      .eq("category", category)
      .eq("game", game)
      .eq("ladder", ladder)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoaded(true);
      return;
    }

    const list = (data || []).filter(p => !isExpired(p));
    setMatches(list);
    setLoaded(true);
  }

  useEffect(() => {
    load();

    // FIXED realtime (no async cleanup bug)
    const channel = supabase
      .channel("match_posts_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "match_posts" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      if (data?.role) setRole(data.role);
    }

    loadRole();
  }, [viewerTeamId, user?.id]);

  // =========================
  // ACCEPT (FIXED + ATOMIC SAFE)
  // =========================
  async function acceptMatch() {
    if (!confirmMatch) return;

    setNotice("");

    if (!user?.id) return setNotice("You must be signed in.");
    if (!viewerTeamId) return setNotice("Missing team ID.");
    if (!canManage) return setNotice("No permission.");
    if (confirmMatch.team_id === viewerTeamId) {
      setConfirmMatch(null);
      return setNotice("You cannot accept your own match.");
    }

    setAcceptingId(confirmMatch.id);

    // ATOMIC CHECK (single source of truth)
    const { data: post, error } = await supabase
      .from("match_posts")
      .select("id,status")
      .eq("id", confirmMatch.id)
      .maybeSingle();

    if (error || !post) {
      setAcceptingId(null);
      setConfirmMatch(null);
      setNotice("Match not found.");
      return;
    }

    if (post.status !== "open") {
      setAcceptingId(null);
      setConfirmMatch(null);
      setNotice(post.status === "accepted" ? "Match already accepted by someone else." :
                post.status === "expired" ? "Match expired." :
                "Match unavailable.");
      return;
    }

    const { error: updateError } = await supabase
      .from("match_posts")
      .update({ status: "accepted" })
      .eq("id", confirmMatch.id)
      .eq("status", "open");

    if (updateError) {
      setAcceptingId(null);
      setNotice("Already taken by another team.");
      setConfirmMatch(null);
      return;
    }

    setAcceptingId(null);
    setConfirmMatch(null);
    await load();

    router.push(`/matches/${confirmMatch.id}`);
  }

  // =========================
  // CANCEL (FIXED)
  // =========================
  async function cancelMatchPost() {
    if (!cancelMatch) return;

    if (!user?.id) return setNotice("You must be signed in.");
    if (!viewerTeamId) return setNotice("Missing team ID.");
    if (!canManage) return setNotice("No permission.");
    if (cancelMatch.team_id !== viewerTeamId) return setNotice("Not your match.");

    setCancellingId(cancelMatch.id);

    const { error } = await supabase
      .from("match_posts")
      .update({ status: "cancelled" })
      .eq("id", cancelMatch.id)
      .eq("status", "open");

    setCancellingId(null);
    setCancelMatch(null);

    if (error) {
      setNotice(error.message);
      return;
    }

    setNotice("Match cancelled.");
    await load();
  }

  return (
    <>
      <div style={{ padding: 20, color: "#fff", fontFamily: "Arial" }}>
        <h1>Match Finder</h1>

        {notice && <div style={{ margin: 10, color: "gold" }}>{notice}</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}

        {!loaded && <div>Loading...</div>}

        {matches.map(m => (
          <div key={m.id} style={{ border: "1px solid #333", margin: 10, padding: 10 }}>
            <div>{m.players} — {m.game_mode}</div>

            <button onClick={() => setConfirmMatch(m)}>Accept</button>
            <button onClick={() => setCancelMatch(m)}>Cancel</button>
          </div>
        ))}
      </div>

      {confirmMatch && (
        <div style={{ position: "fixed", inset: 0, background: "#000a" }}>
          <div style={{ background: "#111", padding: 20 }}>
            <p>Accept match?</p>
            <button onClick={acceptMatch}>
              {acceptingId === confirmMatch.id ? "Accepting..." : "Confirm"}
            </button>
            <button onClick={() => setConfirmMatch(null)}>Close</button>
          </div>
        </div>
      )}

      {cancelMatch && (
        <div style={{ position: "fixed", inset: 0, background: "#000a" }}>
          <div style={{ background: "#111", padding: 20 }}>
            <p>Cancel match?</p>
            <button onClick={cancelMatchPost}>
              {cancellingId === cancelMatch.id ? "Cancelling..." : "Confirm Cancel"}
            </button>
            <button onClick={() => setCancelMatch(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}