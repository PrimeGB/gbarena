"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type TeamRow = {
  id: string;
  name: string | null;
  tag: string | null;
  platform: string | null;
  category: string | null;
  game: string | null;
  ladder: string | null;
  created_at: string | null;
};

function prettyText(value: string | null) {
  if (!value) return "Unknown";
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ProfileTeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const { data: ownedTeams } = await supabase
      .from("teams")
      .select("id, name, tag, platform, category, game, ladder, created_at")
      .eq("owner_id", user.id);

    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name, tag, platform, category, game, ladder, created_at)")
      .eq("user_id", user.id);

    const memberTeams =
      memberRows?.map((row: any) => row.teams).filter(Boolean) || [];

    const combinedTeams = [...(ownedTeams || []), ...memberTeams];

    const uniqueTeams = Array.from(
      new Map(combinedTeams.map((team: TeamRow) => [team.id, team])).values()
    );

    setTeams(uniqueTeams);
    setLoading(false);
  }

  return (
    <>
      <style>{`
        body{margin:0;background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}
        .wrapper{width:1040px;margin:0 auto;}
        .top-strip{height:22px;background:linear-gradient(to bottom,#c40000,#6a0000);border-bottom:1px solid #140000;display:flex;justify-content:flex-end;align-items:center;padding:0 12px;}
        .top-strip a{color:#fff;font-size:10px;font-weight:bold;margin-left:12px;}
        .header{height:86px;background:#0a1622;border-left:1px solid #3b7fc2;border-right:1px solid #3b7fc2;border-bottom:2px solid #4f93d6;display:flex;align-items:center;padding:0 14px;}
        .logo-main{font-size:28px;font-weight:bold;color:#eaf5ff;}
        .logo-sub{color:#f2c14e;font-size:10px;text-transform:uppercase;margin-top:4px;}
        .title-bar{margin-top:8px;height:34px;background:linear-gradient(to bottom,#1f4c73,#0b2438);border:1px solid #3b7fc2;display:flex;align-items:center;padding-left:10px;color:#f2c14e;font-size:15px;font-weight:bold;text-transform:uppercase;}
        .tabs{height:28px;background:#07111b;border-left:1px solid #3b7fc2;border-right:1px solid #3b7fc2;border-bottom:1px solid #3b7fc2;display:flex;align-items:flex-end;padding-left:8px;}
        .tab{height:22px;padding:5px 12px 0;background:#0f2a40;border:1px solid #3b7fc2;border-bottom:none;color:#d7eaff;font-size:10px;margin-right:4px;}
        .tab.active{background:#173b59;color:#fff;font-weight:bold;}
        .box{background:#07111b;border:1px solid #3b7fc2;margin-top:8px;}
        .box-title{height:23px;background:linear-gradient(to bottom,#1f4c73,#0b2438);border-bottom:1px solid #3b7fc2;color:#f2c14e;font-weight:bold;font-size:10px;text-transform:uppercase;display:flex;align-items:center;padding-left:8px;}
        .box-body{padding:18px;}
        .loading,.empty-message{text-align:center;padding:30px;color:#d7eaff;font-size:13px;}
        .empty-message strong{display:block;color:#f2c14e;font-size:16px;margin-bottom:8px;}
        .team-list{display:flex;flex-direction:column;gap:10px;}
        .team-card{border:1px solid #244b70;background:#050c14;display:grid;grid-template-columns:1fr 150px;gap:12px;align-items:center;padding:14px;}
        .team-name{color:#fff;font-size:18px;font-weight:bold;text-transform:uppercase;margin-bottom:6px;}
        .team-meta{color:#a9c3db;font-size:11px;line-height:18px;}
        .team-tag{color:#f2c14e;font-weight:bold;}
        .view-btn{height:34px;background:linear-gradient(to bottom,#1d5d90,#0a1f33);border:1px solid #4daeff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;text-transform:uppercase;}
      `}</style>

      <div className="top-strip">
        <a href="/home">Home</a>
        <a href="/profile">My Profile</a>
      </div>

      <div className="wrapper">
        <header className="header">
          <a href="/home">
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Where Gaming Finds Its Edge</div>
          </a>
        </header>

        <div className="title-bar">My Teams</div>

        <div className="tabs">
          <a className="tab" href="/profile">Profile</a>
          <a className="tab active" href="/profile/teams">Teams</a>
          <a className="tab" href="/profile/matches">Matches</a>
          <a className="tab" href="/profile/photos">Photos</a>
          <a className="tab" href="/profile/friends">Friends</a>
        </div>

        <div className="box">
          <div className="box-title">Teams</div>

          <div className="box-body">
            {loading ? (
              <div className="loading">Loading teams...</div>
            ) : teams.length === 0 ? (
              <div className="empty-message">
                <strong>Looks lonely in here.</strong>
                Create or join a team to get started.
              </div>
            ) : (
              <div className="team-list">
                {teams.map((team) => (
                  <div className="team-card" key={team.id}>
                    <div>
                      <div className="team-name">{team.name || "Unnamed Team"}</div>
                      <div className="team-meta">
                        Tag: <span className="team-tag">{team.tag || "TAG"}</span>
                        <br />
                        Platform: {prettyText(team.platform)}
                        <br />
                        Game: {prettyText(team.game)}
                        <br />
                        Ladder: {prettyText(team.ladder)}
                      </div>
                    </div>

                    <a className="view-btn" href={`/teams/${team.id}`}>
                      View Team
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}