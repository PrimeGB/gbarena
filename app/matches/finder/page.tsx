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

export default function MatchFinderPage() {
  return (
    <Suspense fallback={<div style={{ color: "white", padding: 40 }}>Loading Match Finder...</div>}>
      <MatchFinderContent />
    </Suspense>
  );
}

function MatchFinderContent() {
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
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmMatch, setConfirmMatch] = useState<MatchPost | null>(null);
  const [cancelMatch, setCancelMatch] = useState<MatchPost | null>(null);

  function canManage(role: TeamRole) {
    return role === "leader" || role === "co-leader" || role === "captain";
  }

  async function loadMatches() {
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
      setNotice(error.message);
      return;
    }

    setMatches(data || []);
    setHasLoaded(true);
  }

  useEffect(() => {
    loadMatches();
  }, [platform, category, game, ladder]);

  // -----------------------------
  // ✅ ACCEPT MATCH (FIXED + ATOMIC)
  // -----------------------------
  async function acceptConfirmedMatch() {
    if (!confirmMatch) return;

    setNotice("");

    if (!user?.id) {
      setNotice("You must be signed in.");
      return;
    }

    if (!viewerTeamId) {
      setNotice("Missing team ID.");
      return;
    }

    setAcceptingId(confirmMatch.id);

    const { data, error } = await supabase.rpc("accept_match_post", {
      post_id: confirmMatch.id,
      accepting_team: viewerTeamId,
    });

    setAcceptingId(null);
    setConfirmMatch(null);

    if (error) {
      console.log("ACCEPT ERROR:", error);
      setNotice(error.message);
      await loadMatches();
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;
    const matchId = result?.match_id;

    if (!matchId) {
      setNotice("Match already taken or expired.");
      await loadMatches();
      return;
    }

    await loadMatches();
    router.push(`/matches/${matchId}`);
  }

  // -----------------------------
  // ✅ CANCEL MATCH (FIXED)
  // -----------------------------
  async function cancelConfirmedPost() {
    if (!cancelMatch) return;

    setCancellingId(cancelMatch.id);

    const { error } = await supabase
      .from("match_posts")
      .update({ status: "cancelled" })
      .eq("id", cancelMatch.id)
      .eq("team_id", viewerTeamId)
      .eq("status", "open");

    setCancellingId(null);
    setCancelMatch(null);

    if (error) {
      console.log("CANCEL ERROR:", error);
      setNotice(error.message);
      return;
    }

    await loadMatches();
  }

  return (
    <>
      <div style={{ padding: 20, color: "white" }}>
        <h1>Match Finder</h1>

        {notice && <div style={{ color: "yellow" }}>{notice}</div>}

        {!hasLoaded && <div>Loading...</div>}

        {matches.map((m) => (
          <div key={m.id} style={{ margin: 10, padding: 10, border: "1px solid gray" }}>
            <div>{m.players}</div>
            <div>{m.game_mode}</div>

            <button onClick={() => setConfirmMatch(m)}>Accept</button>
            <button onClick={() => setCancelMatch(m)}>Cancel</button>
          </div>
        ))}
      </div>

      {confirmMatch && (
        <div style={{ position: "fixed", top: 100, left: 100, background: "black", padding: 20 }}>
          <p>Confirm accept?</p>
          <button onClick={acceptConfirmedMatch}>
            {acceptingId ? "Accepting..." : "Yes Accept"}
          </button>
          <button onClick={() => setConfirmMatch(null)}>No</button>
        </div>
      )}

      {cancelMatch && (
        <div style={{ position: "fixed", top: 100, left: 100, background: "black", padding: 20 }}>
          <p>Cancel post?</p>
          <button onClick={cancelConfirmedPost}>
            {cancellingId ? "Cancelling..." : "Yes Cancel"}
          </button>
          <button onClick={() => setCancelMatch(null)}>No</button>
        </div>
      )}
    </>
  );
}