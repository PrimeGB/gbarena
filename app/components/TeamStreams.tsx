"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Stream = {
  user_id: string;
  username: string;
  url: string;
  is_live: boolean;
};

export default function TeamStreams({ teamId, userId, isMember }: {
  teamId: string;
  userId: string | undefined;
  isMember: boolean;
}) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [url, setUrl] = useState("");
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (initialize: boolean) => {
    const { data, error: loadError } = await supabase.rpc("gb_team_streams", { p_team_id: teamId });
    if (loadError) {
      setError(`Could not load streams: ${loadError.message}`);
      setLoaded(true);
      return false;
    } else {
      const rows = (data || []) as Stream[];
      setStreams(rows);
      setError("");
      if (initialize) {
        const own = rows.find((row) => row.user_id === userId);
        setUrl(own?.url || "");
        setLive(own?.is_live || false);
      }
    }
    setLoaded(true);
    return true;
  }, [teamId, userId]);

  useEffect(() => {
    queueMicrotask(() => void load(true));
    const timer = window.setInterval(() => void load(false), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function save() {
    setError("");
    setNotice("");
    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      setError("Enter a valid HTTPS stream link.");
      return;
    }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      setError("Enter a valid HTTPS stream link without credentials.");
      return;
    }
    setSaving(true);
    const { error: saveError } = await supabase.rpc("gb_set_team_stream", {
      p_team_id: teamId,
      p_url: parsed.toString(),
      p_is_live: live,
    });
    setSaving(false);
    if (saveError) {
      setError(`Could not save your stream: ${saveError.message}`);
      return;
    }
    if (await load(true)) setNotice("Stream settings saved.");
  }

  const liveStreams = streams.filter((stream) => stream.is_live);
  return (
    <div className="side-box team-streams">
      <div className="side-box-title">Team Streams</div>
      <div className="side-box-body team-streams-body">
        <p>Watch team members during matches, tournaments, or anytime they go live.</p>
        {!loaded && <p>Loading streams...</p>}
        {loaded && liveStreams.length === 0 && <p>No team streams are marked live right now.</p>}
        {liveStreams.map((stream) => (
          <a className="team-stream-link" href={stream.url} target="_blank" rel="noopener noreferrer" key={stream.user_id}>
            <span className="team-stream-live">LIVE</span> {stream.username} <span aria-hidden="true">↗</span>
          </a>
        ))}
        {isMember && (
          <div className="team-stream-form">
            <label htmlFor="team-stream-url">Your stream link</label>
            <input id="team-stream-url" type="url" maxLength={2048} placeholder="https://..." value={url} onChange={(event) => setUrl(event.target.value)} />
            <label className="team-stream-toggle"><input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} /> I am live</label>
            <button type="button" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save stream"}</button>
            <p>Live status is set by you. Switch it off when your stream ends.</p>
          </div>
        )}
        {error && <p className="team-stream-error" role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
      </div>
      <style>{`
        .side-box.team-streams{min-height:0}
        .team-streams .team-streams-body{padding:12px;line-height:1.5}
        .team-streams-body p{margin:0 0 9px;color:#a9bdcc;font-size:11px}
        .team-streams-body a.team-stream-link{display:block;margin:6px 0;padding:7px 8px;background:#10293b;border:1px solid #28516b;color:#bde2ff;font-weight:bold;overflow-wrap:anywhere}
        .team-stream-live{color:#fff;background:#b32935;border-radius:3px;padding:2px 4px;font-size:9px}
        .team-stream-form{border-top:1px solid #244b70;margin-top:12px;padding-top:10px}
        .team-stream-form label{display:block;font-weight:bold;font-size:11px;color:#d4e4ef}
        .team-stream-form input[type=url]{width:100%;margin:5px 0 8px;padding:7px;color:#fff;background:#07131f;border:1px solid #31536a}
        .team-stream-form label.team-stream-toggle{display:flex;align-items:center;gap:6px;margin-bottom:8px;font-weight:normal}
        .team-streams-body .team-stream-form button{padding:6px 10px;background:#214c69;color:#fff;font-weight:bold}
        .team-stream-form button:disabled{opacity:.6;cursor:wait}
        .team-stream-form p{margin:8px 0 0}
        .team-streams-body p.team-stream-error{color:#ffabab}
      `}</style>
    </div>
  );
}
