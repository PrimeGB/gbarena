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
  tag: string | null;
  platform: string | null;
  category: string | null;
  game: string | null;
  ladder: string | null;
  owner_id: string | null;
};

export default function TeamToolsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = String(params?.teamId || "");
  const { user, loading: userLoading } = useUser();

  const [team, setTeam] = useState<TeamRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;

    (async () => {
      const { data } = await supabase
        .from("teams")
        .select("id,name,tag,platform,category,game,ladder,owner_id")
        .eq("id", teamId)
        .maybeSingle();

      setTeam((data as TeamRow | null) || null);
      setLoading(false);
    })();
  }, [teamId, userLoading]);

  const isLeader = !!user?.id && team?.owner_id === user.id;
  const matchQuery = team
    ? `teamId=${team.id}&platform=${team.platform || "xbox"}&category=${team.category || "call-of-duty"}&game=${team.game || "modern-warfare-4"}&ladder=${team.ladder || "team"}`
    : "";

  return (
    <main className="tools-page">
      <div className="tools-wrap">
        <SiteNav ladderHref={`/ladders/${team?.platform || "xbox"}`} />
        <div className="tools-pad">
          <TeamTabs teamId={teamId} active="tools" canEditProfile={isLeader} canEditRoster={isLeader} />

          <div className="tools-bar">Team Tools</div>

          {loading || userLoading ? (
            <p className="tools-note">Loading…</p>
          ) : !team ? (
            <p className="tools-note">Team not found.</p>
          ) : !isLeader ? (
            <p className="tools-note">Only the team leader can use team tools.</p>
          ) : (
            <div className="tools-list">
              <a href={`/matches/create?${matchQuery}`}>
                <strong>Create a Match</strong>
                <span>Post a match challenge for {team.name || "your team"}.</span>
              </a>
              <a href={`/matches/finder?${matchQuery}`}>
                <strong>Match Finder</strong>
                <span>Browse open matches and accept one.</span>
              </a>
              <a href={`/teams/${teamId}/roster`}>
                <strong>Edit Roster</strong>
                <span>Invite players, change roles and remove members.</span>
              </a>
              <a href={`/teams/${teamId}/edit`}>
                <strong>Edit Profile</strong>
                <span>Update the clan tag, bio, logo and avatar.</span>
              </a>
              <a href={`/teams/${teamId}/log`}>
                <strong>Team Log</strong>
                <span>See roster changes and match activity.</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .tools-page{min-height:100vh;background:#02060a;padding:24px 12px;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        .tools-wrap{max-width:1000px;margin:0 auto;background:#07111b;border:1px solid #315f88;}
        .tools-pad{padding:0 18px 22px;}
        .tools-bar{background:#000;color:#fff;font-weight:800;font-size:14px;padding:10px 12px;margin-bottom:12px;}
        .tools-note{padding:20px;color:#8ea4b6;font-size:13px;}
        .tools-list{display:grid;gap:8px;}
        .tools-list a{display:grid;gap:3px;padding:12px 14px;border:1px solid #244b70;background:#0a1724;text-decoration:none;color:#9bd8ff;}
        .tools-list a:hover{border-color:#4a7db0;background:#0d1d2e;}
        .tools-list strong{font-size:13px;}
        .tools-list span{color:#8ea4b6;font-size:12px;}
      `}</style>
    </main>
  );
}
