"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function TeamDisbandDialog({ teamId, teamName, onClose, onDone }: {
  teamId: string;
  teamName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const deletingRef = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
    actionRef.current?.focus();
  }, []);

  useEffect(() => {
    if (success) actionRef.current?.focus();
  }, [success]);

  async function disbandTeam() {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError("");
    try {
      const { error: deleteError } = await supabase.rpc("gb_disband_team", { p_team_id: teamId });
      if (deleteError) throw new Error(deleteError.message);
      setSuccess(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The team could not be disbanded. Please try again.");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        className="team-disband-dialog"
        aria-labelledby="team-disband-title"
        aria-describedby="team-disband-message"
        onCancel={(event) => { if (deleting || success) event.preventDefault(); }}
        onClose={onClose}
      >
        <div className="team-disband-header">
          <span>GameBattles Notification</span>
          {!deleting && !success && <button type="button" className="team-disband-close" aria-label="Close notification" onClick={() => dialogRef.current?.close()}>×</button>}
        </div>
        <div className="team-disband-content">
          <div className={`team-disband-icon${success ? " success" : ""}`} aria-hidden="true">{success ? "✓" : "!"}</div>
          <h2 id="team-disband-title">{success ? "Team Disbanded" : "Disband Team?"}</h2>
          <p id="team-disband-message">
            {success
              ? "This team has been successfully disbanded."
              : <>Are you sure you want to disband <strong>{teamName}</strong>? The team and its roster will be permanently deleted. This cannot be undone.</>}
          </p>
          {error && <p className="team-disband-error" role="alert">Could not disband team: {error}</p>}
          <div className="team-disband-actions">
            {success ? (
              <button ref={actionRef} type="button" className="team-disband-ok" onClick={onDone}>OK</button>
            ) : (
              <>
                <button ref={actionRef} type="button" className="team-disband-cancel" disabled={deleting} onClick={() => dialogRef.current?.close()}>Cancel</button>
                <button type="button" className="team-disband-confirm" disabled={deleting} onClick={disbandTeam}>{deleting ? "Disbanding..." : "Yes, Disband Team"}</button>
              </>
            )}
          </div>
        </div>
      </dialog>
      <style>{`
        .team-disband-dialog{box-sizing:border-box;width:min(440px,calc(100% - 32px));max-height:calc(100% - 32px);margin:auto;padding:0;overflow:auto;border:1px solid #406f91;border-radius:6px;background:#081521;color:#d7e6f2;font-family:Tahoma,Verdana,Arial,sans-serif;box-shadow:0 20px 60px #000c}
        .team-disband-dialog::backdrop{background:rgba(0,0,0,.8)}
        .team-disband-header{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 14px;background:linear-gradient(#1b4664,#0d2639);border-bottom:1px solid #315b79;color:#e5c573;font-size:11px;font-weight:900;letter-spacing:.7px;text-transform:uppercase}
        .team-disband-close{width:30px;height:30px;border:0;background:transparent;color:#c5d9e7;font-size:24px;line-height:1;cursor:pointer}
        .team-disband-content{padding:24px;text-align:center}
        .team-disband-icon{display:grid;place-items:center;width:44px;height:44px;margin:0 auto 15px;border:1px solid #ad5554;border-radius:50%;background:#391b21;color:#ffa6a1;font-size:23px;font-weight:bold}
        .team-disband-icon.success{border-color:#4b9b76;background:#12372b;color:#8ce5b4}
        .team-disband-content h2{margin:0 0 10px;color:#fff;font-size:20px}
        .team-disband-content p{margin:0;color:#bcd0df;font-size:13px;line-height:1.6;overflow-wrap:anywhere}
        .team-disband-content p strong{color:#fff}
        .team-disband-content p.team-disband-error{margin-top:14px;padding:10px;border:1px solid #8e4141;background:#30181b;color:#ffc1bc;text-align:left}
        .team-disband-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:22px}
        .team-disband-actions button{min-height:42px;padding:0 18px;border:1px solid #416b88;color:#fff;font:bold 12px Tahoma,Verdana,Arial,sans-serif;cursor:pointer}
        .team-disband-cancel{background:#173449}
        .team-disband-confirm{border-color:#b95454!important;background:linear-gradient(#a63232,#641d25)}
        .team-disband-ok{border-color:#e3c36f!important;background:linear-gradient(#f2c14e,#b98722);color:#101820!important}
        .team-disband-actions button:disabled{opacity:.6;cursor:wait}
        .team-disband-dialog button:focus-visible{outline:2px solid #f2c14e;outline-offset:2px}
        @media(max-width:480px){.team-disband-content{padding:20px 16px}.team-disband-actions button{flex:1 1 130px}}
      `}</style>
    </>
  );
}
