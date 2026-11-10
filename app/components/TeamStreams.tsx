"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [saveError, setSaveError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

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
    setSaveError("");
    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      setSaveError("Enter a valid HTTPS stream link.");
      return;
    }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      setSaveError("Enter a valid HTTPS stream link without credentials.");
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
      setSaveError(`Could not save your stream: ${saveError.message}`);
      return;
    }
    await load(true);
    dialogRef.current?.close();
  }

  const liveStreams = streams.filter((stream) => stream.is_live);
  return (
    <div className="side-box team-streams">
      <div className="side-box-title team-streams-title">
        <span>Team Streams</span>
        {isMember && <button type="button" aria-label="Manage your stream" title="Manage your stream" onClick={() => {
          const own = streams.find((stream) => stream.user_id === userId);
          setUrl(own?.url || "");
          setLive(own?.is_live || false);
          setSaveError("");
          dialogRef.current?.showModal();
        }}><span aria-hidden="true">+</span></button>}
      </div>
      <div className="side-box-body team-streams-body">
        {!loaded && <p>Loading streams...</p>}
        {loaded && !error && liveStreams.length === 0 && <p>No streams live right now.</p>}
        {liveStreams.length > 0 && (
          <div className="team-stream-list" aria-label="Live team streams">
            {liveStreams.map((stream) => (
              <div className="team-stream-row" key={stream.user_id}>
                <span className="team-stream-name">{stream.username}</span>
                <div><a className="team-stream-link" href={stream.url} target="_blank" rel="noopener noreferrer">Watch Here</a><span className="team-stream-live"> - LIVE</span></div>
              </div>
            ))}
          </div>
        )}
        {error && <p className="team-stream-error" role="alert">{error}</p>}
        {isMember && (
          <dialog className="team-stream-dialog" ref={dialogRef} aria-labelledby="team-stream-dialog-title">
            <h2 id="team-stream-dialog-title">Manage Your Stream</h2>
            <div className="team-stream-form">
              <label htmlFor="team-stream-url">Your stream link</label>
              <input id="team-stream-url" type="url" maxLength={2048} placeholder="https://..." value={url} onChange={(event) => setUrl(event.target.value)} />
              <label className="team-stream-toggle"><input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} /> I am live</label>
              <p>Switch live off when your stream ends.</p>
              {saveError && <p className="team-stream-error" role="alert">{saveError}</p>}
              <div className="team-stream-actions">
                <button type="button" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
                <button type="button" disabled={saving} onClick={() => dialogRef.current?.close()}>Cancel</button>
              </div>
            </div>
          </dialog>
        )}
      </div>
      <style>{`
        .side-box.team-streams{min-height:0}
        .team-streams-title{position:relative;padding:0 40px}
        .team-streams-title button{position:absolute;right:4px;top:0;width:30px;height:29px;display:grid;place-items:center;border:0;background:none;color:#7fc7ff;font:bold 19px/1 Tahoma;cursor:pointer}
        .team-streams-title button:hover{color:#fff}
        .team-streams-title button:focus-visible{outline:2px solid #7fc7ff;outline-offset:-3px}
        .team-streams .team-streams-body{padding:0;line-height:1.4}
        .team-streams-body > p{margin:0;padding:9px 10px;color:#a9bdcc;font-size:11px}
        .team-stream-list{max-height:144px;overflow-y:auto;overscroll-behavior:contain;scrollbar-color:#355774 #08131d;scrollbar-width:thin}
        .team-stream-row{padding:7px 10px;border-top:1px solid #1c2b37;background:#0a1119;font-size:11px;overflow-wrap:anywhere}
        .team-stream-row:nth-child(even){background:#0d1620}
        .team-stream-name{display:block;color:#7fc0ff;font-weight:bold;margin-bottom:3px}
        .team-streams-body a.team-stream-link{color:#b9c9d6;font-size:11px;text-decoration:none}
        .team-streams-body a.team-stream-link:hover{color:#fff;text-decoration:underline}
        .team-stream-live{color:#f18a8a;font-size:10px;font-weight:bold}
        .team-stream-dialog{margin:auto;width:min(360px,calc(100% - 32px));padding:16px;border:1px solid #315f88;background:#07131f;color:#d4e4ef}
        .team-stream-dialog::backdrop{background:rgba(0,0,0,.75)}
        .team-stream-dialog h2{margin:0 0 12px;color:#d7ad4a;font-size:13px;text-transform:uppercase}
        .team-stream-form label{display:block;font-weight:bold;font-size:11px}
        .team-stream-form input[type=url]{width:100%;margin:5px 0 10px;padding:8px;color:#fff;background:#020b13;border:1px solid #31536a}
        .team-stream-form label.team-stream-toggle{display:flex;align-items:center;gap:6px;font-weight:normal}
        .team-stream-form p{margin:8px 0;color:#a9bdcc;font-size:11px;line-height:1.4}
        .team-stream-actions{display:flex;gap:8px;margin-top:12px}
        .team-stream-actions button{padding:7px 12px;border:1px solid #315f88;background:#173a54;color:#fff;font:bold 11px Tahoma;cursor:pointer}
        .team-stream-actions button:disabled{opacity:.6;cursor:wait}
        .team-streams-body p.team-stream-error{color:#ffabab}
      `}</style>
    </div>
  );
}
