"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Recruit = {
  id: string;
  user_id: string;
  author: string;
  kind: "lft" | "lfp";
  team_id: string | null;
  game: string | null;
  platform: string | null;
  ladder: string | null;
  message: string;
  created_at: string;
};

export default function RecruitPage() {
  const [posts, setPosts] = useState<Recruit[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "lft" | "lfp">("all");
  const [kind, setKind] = useState<"lft" | "lfp">("lft");
  const [teamId, setTeamId] = useState("");
  const [game, setGame] = useState("Fortnite");
  const [platform, setPlatform] = useState("PlayStation");
  const [ladder, setLadder] = useState("Team");
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id ?? null;
    setUserId(uid);

    const { data } = await supabase
      .from("recruit_posts")
      .select("*")
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(100);
    const rows = (data || []) as Recruit[];
    setPosts(rows);

    const ids = Array.from(new Set(rows.map((r) => r.team_id).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: t } = await supabase.from("teams").select("id,name").in("id", ids);
      setTeamNames(Object.fromEntries((t || []).map((x: any) => [x.id, x.name])));
    }

    if (uid) {
      const { data: owned } = await supabase.from("teams").select("id,name").eq("owner_id", uid);
      setTeams(owned || []);
      if (owned?.[0]) setTeamId((cur) => cur || owned[0].id);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (text.trim().length < 5) {
      setMessage("Write at least a short sentence.");
      return;
    }
    if (kind === "lfp" && !teamId) {
      setMessage("You need a team to recruit for.");
      return;
    }
    const { error } = await supabase.from("recruit_posts").insert([
      { kind, team_id: kind === "lfp" ? teamId : null, game, platform, ladder, message: text.trim() },
    ]);
    if (error) {
      setMessage(error.message);
      return;
    }
    setText("");
    load();
  }

  async function remove(id: string) {
    await supabase.from("recruit_posts").delete().eq("id", id);
    load();
  }

  const shown = posts.filter((p) => filter === "all" || p.kind === filter);
  const field = { background: "#07111b", border: "1px solid #263b4d", color: "#e6eefc", padding: "7px 9px", fontSize: 13 } as const;

  return (
    <div style={{ background: "#000", color: "#d7e2ee", minHeight: "100vh", fontFamily: "Tahoma,Verdana,Arial,sans-serif" }}>
      <div style={{ width: "min(1000px,100%)", margin: "0 auto", padding: "24px 18px" }}>
        <div style={{ background: "#0a1119", border: "1px solid #263b4d" }}>
          <div style={{ padding: "18px 20px", background: "#101c28", borderBottom: "1px solid #263b4d" }}>
            <h1 style={{ color: "#f2c14e", fontSize: 20, textTransform: "uppercase" }}>Recruitment Board</h1>
            <p style={{ color: "#9aabba", fontSize: 12, marginTop: 5 }}>
              Looking for a team, or looking for players? Post here.
            </p>
          </div>

          <div style={{ padding: 16, borderBottom: "1px solid #263b4d", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["all", "lft", "lfp"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{ ...field, cursor: "pointer", background: filter === f ? "#1b3a57" : "#07111b" }}
              >
                {f === "all" ? "All" : f === "lft" ? "Looking for Team" : "Looking for Players"}
              </button>
            ))}
          </div>

          {userId ? (
            <form onSubmit={submit} style={{ padding: 16, borderBottom: "1px solid #263b4d", display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select style={field} value={kind} onChange={(e) => setKind(e.target.value as "lft" | "lfp")}>
                  <option value="lft">I&apos;m looking for a team</option>
                  <option value="lfp">My team needs players</option>
                </select>
                {kind === "lfp" && (
                  <select style={field} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                    {teams.length === 0 && <option value="">No teams owned</option>}
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
                <select style={field} value={game} onChange={(e) => setGame(e.target.value)}>
                  <option>Fortnite</option>
                  <option>Battlefield 6</option>
                  <option>Call of Duty</option>
                </select>
                <select style={field} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  <option>PlayStation</option>
                  <option>Xbox</option>
                  <option>Nintendo</option>
                  <option>PC</option>
                </select>
                <select style={field} value={ladder} onChange={(e) => setLadder(e.target.value)}>
                  <option>Singles</option>
                  <option>Duos</option>
                  <option>Team</option>
                </select>
              </div>
              <textarea
                style={{ ...field, minHeight: 70 }}
                maxLength={600}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell people about your playstyle, availability, and what you want."
              />
              <div>
                <button type="submit" style={{ border: "1px solid #ff4d4d", background: "linear-gradient(to bottom,#c40000,#6a0000)", color: "#fff", fontWeight: "bold", padding: "9px 16px", cursor: "pointer", textTransform: "uppercase", fontSize: 11 }}>
                  Post
                </button>
                {message && <span style={{ marginLeft: 12, color: "#f2c14e", fontSize: 13 }}>{message}</span>}
              </div>
            </form>
          ) : (
            <div style={{ padding: 16, borderBottom: "1px solid #263b4d", fontSize: 13 }}>
              <Link href="/login" style={{ color: "#7fc0ff" }}>Log in</Link> to post.
            </div>
          )}

          {shown.length === 0 && <div style={{ padding: 20, color: "#9aabba" }}>No posts yet.</div>}
          {shown.map((p) => (
            <div key={p.id} style={{ padding: "12px 16px", borderTop: "1px solid #13293d" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <span style={{ color: p.kind === "lft" ? "#7fc0ff" : "#f2c14e", fontWeight: 700, fontSize: 12 }}>
                    {p.kind === "lft" ? "LOOKING FOR TEAM" : "LOOKING FOR PLAYERS"}
                  </span>{" "}
                  <Link href={`/profile?userId=${p.user_id}`} style={{ color: "#cfeefe", fontWeight: 700 }}>{p.author}</Link>
                  {p.team_id && teamNames[p.team_id] && (
                    <> · <Link href={`/teams/${p.team_id}`} style={{ color: "#7fc0ff" }}>{teamNames[p.team_id]}</Link></>
                  )}
                </div>
                <div style={{ color: "#8193a1", fontSize: 11 }}>{new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ color: "#8193a1", fontSize: 11, margin: "3px 0" }}>{[p.game, p.platform, p.ladder].filter(Boolean).join(" · ")}</div>
              <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{p.message}</div>
              {p.user_id === userId && (
                <button type="button" onClick={() => remove(p.id)} style={{ background: "none", border: "none", color: "#8193a1", cursor: "pointer", fontSize: 11, padding: 0, marginTop: 4 }}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
