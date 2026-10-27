"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "../../../../lib/useUser";
import { supabase } from "../../../../lib/supabase";
import SiteNav from "../../../components/SiteNav";
import TeamTabs from "../../../components/TeamTabs";

type TeamRow = {
  id: string;
  name: string | null;
  platform: string | null;
  owner_id: string | null;
};

type LogEntry = {
  id: string;
  at: string;
  text: string;
};

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TeamLogPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = String(params?.teamId || "");
  const { user, loading: userLoading } = useUser();

  const [team, setTeam] = useState<TeamRow | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;

    (async () => {
      const { data: teamData } = await supabase
        .from("teams")
        .select("id,name,platform,owner_id")
        .eq("id", teamId)
        .maybeSingle();

      const loadedTeam = (teamData as TeamRow | null) || null;
      setTeam(loadedTeam);

      if (!loadedTeam || !user?.id || loadedTeam.owner_id !== user.id) {
        setLoading(false);
        return;
      }

      const log: LogEntry[] = [];

      const { data: members } = await supabase
        .from("team_members")
        .select("user_id,role,created_at")
        .eq("team_id", teamId);

      const userIds = (members || []).map((member: any) => member.user_id).filter(Boolean);
      const names: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,username")
          .in("id", userIds);

        (profiles || []).forEach((profile: any) => {
          names[profile.id] = profile.username || "Player";
        });
      }

      (members || []).forEach((member: any) => {
        if (!member.created_at) return;
        log.push({
          id: `member-${member.user_id}`,
          at: member.created_at,
          text: `${names[member.user_id] || "A player"} joined the roster as ${String(member.role || "member")}.`,
        });
      });

      const { data: matches } = await supabase
        .from("matches")
        .select("id,posting_team_id,accepting_team_id,status,created_at")
        .or(`posting_team_id.eq.${teamId},accepting_team_id.eq.${teamId}`)
        .order("created_at", { ascending: false })
        .limit(30);

      (matches || []).forEach((match: any) => {
        if (!match.created_at) return;
        const posted = String(match.posting_team_id) === teamId;
        log.push({
          id: `match-${match.id}`,
          at: match.created_at,
          text: `${posted ? "Posted" : "Accepted"} a match (${String(match.status || "upcoming")}).`,
        });
      });

      log.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setEntries(log);
      setLoading(false);
    })();
  }, [teamId, user?.id, userLoading]);

  const isLeader = !!user?.id && team?.owner_id === user.id;

  return (
    <main className="log-page">
      <div className="log-wrap">
        <SiteNav ladderHref={`/ladders/${team?.platform || "xbox"}`} />
        <div className="log-pad">
          <TeamTabs teamId={teamId} active="log" canEditProfile={isLeader} canEditRoster={isLeader} />

          <div className="log-bar">Team Log</div>

          {loading || userLoading ? (
            <p className="log-note">Loading…</p>
          ) : !team ? (
            <p className="log-note">Team not found.</p>
          ) : !isLeader ? (
            <p className="log-note">Only the team leader can view the team log.</p>
          ) : entries.length === 0 ? (
            <p className="log-note">No activity recorded yet.</p>
          ) : (
            <table className="log-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatWhen(entry.at)}</td>
                    <td>{entry.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        .log-page{min-height:100vh;background:#02060a;padding:24px 12px;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        .log-wrap{max-width:1000px;margin:0 auto;background:#07111b;border:1px solid #315f88;}
        .log-pad{padding:0 18px 22px;}
        .log-bar{background:#000;color:#fff;font-weight:800;font-size:14px;padding:10px 12px;}
        .log-note{padding:20px;color:#8ea4b6;font-size:13px;}
        .log-table{width:100%;border-collapse:collapse;font-size:12px;}
        .log-table th{background:#0a1724;color:#fff;text-align:left;padding:8px 10px;border-bottom:1px solid #244b70;}
        .log-table td{padding:8px 10px;border-bottom:1px solid #12283d;}
        .log-table td:first-child{white-space:nowrap;color:#8ea4b6;width:210px;}
      `}</style>
    </main>
  );
}
