"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";

type MatchRow = {
  id: string;
  posting_team_id?: string | null;
  accepting_team_id?: string | null;
  platform?: string | null;
  game?: string | null;
  ladder?: string | null;
  match_time?: string | null;
  best_of?: string | null;
  status?: string | null;
  posting_team_score?: number | null;
  accepting_team_score?: number | null;
  posting_team_reported_score?: string | null;
  accepting_team_reported_score?: string | null;
};

type TeamRow = {
  id: string;
  name: string | null;
  tag: string | null;
};

function prettyText(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value === "mw2") return "Call of Duty: Modern Warfare 2";
  if (value === "modern-warfare-ii") return "Call of Duty: Modern Warfare II";
  if (value === "modern-warfare-4") return "Call of Duty: Modern Warfare 4";
  if (value === "black-ops-6") return "Call of Duty: Black Ops 6";
  if (value === "modern-warfare-iii") return "Call of Duty: Modern Warfare III";
  if (value === "black-ops-cold-war") return "Call of Duty: Black Ops Cold War";

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ladderName(value: string | null | undefined) {
  if (value === "singles") return "Solos Ladder";
  if (value === "duos") return "Duos Ladder";
  return "Team Ladder";
}

function shortMatchId(id: string) {
  if (!id) return "00000000";
  return id.replace(/-/g, "").slice(0, 8).toLowerCase();
}

function bestOfNumber(value: string | null | undefined) {
  const found = String(value || "").match(/\d+/);
  if (!found) return 3;
  return Number(found[0]) || 3;
}

function DisputeTicketPageContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") || "";
  const { user } = useUser() as any;

  const [match, setMatch] = useState<MatchRow | null>(null);
  const [postingTeam, setPostingTeam] = useState<TeamRow | null>(null);
  const [acceptingTeam, setAcceptingTeam] = useState<TeamRow | null>(null);
  const [viewerTeamId, setViewerTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bestOf = bestOfNumber(match?.best_of);

  const evidenceSlots = useMemo(() => {
    return Array.from({ length: bestOf }, (_, i) => i + 1);
  }, [bestOf]);

  const opponentTeamId =
    viewerTeamId && match?.posting_team_id === viewerTeamId
      ? match?.accepting_team_id || ""
      : viewerTeamId && match?.accepting_team_id === viewerTeamId
      ? match?.posting_team_id || ""
      : "";

  const viewerTeam =
    viewerTeamId && postingTeam?.id === viewerTeamId
      ? postingTeam
      : viewerTeamId && acceptingTeam?.id === viewerTeamId
      ? acceptingTeam
      : null;

  const opponentTeam =
    opponentTeamId && postingTeam?.id === opponentTeamId
      ? postingTeam
      : opponentTeamId && acceptingTeam?.id === opponentTeamId
      ? acceptingTeam
      : null;

  const postingReport =
    match?.posting_team_reported_score ||
    (match?.posting_team_score !== null &&
    match?.posting_team_score !== undefined &&
    match?.accepting_team_score !== null &&
    match?.accepting_team_score !== undefined
      ? `${postingTeam?.name || "Team A"} ${match.posting_team_score} - ${
          acceptingTeam?.name || "Team B"
        } ${match.accepting_team_score}`
      : "Pending");

  const acceptingReport = match?.accepting_team_reported_score || "Pending";

  useEffect(() => {
    async function loadTicketInfo() {
      setLoading(true);
      setPageError("");

      if (!matchId) {
        setPageError("Missing match ID. Open this page from a disputed match.");
        setLoading(false);
        return;
      }

      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (matchError || !matchData) {
        setPageError("Match could not be loaded.");
        setLoading(false);
        return;
      }

      const loadedMatch = matchData as MatchRow;
      setMatch(loadedMatch);

      const teamIds = [
        loadedMatch.posting_team_id,
        loadedMatch.accepting_team_id,
      ].filter(Boolean) as string[];

      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id,name,tag")
          .in("id", teamIds);

        const teams = (teamsData || []) as TeamRow[];

        setPostingTeam(
          teams.find((team) => team.id === loadedMatch.posting_team_id) || null
        );

        setAcceptingTeam(
          teams.find((team) => team.id === loadedMatch.accepting_team_id) || null
        );
      }

      if (user?.id && teamIds.length > 0) {
        const { data: memberRows } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .in("team_id", teamIds);

        const foundTeamId = (memberRows || [])[0]?.team_id || "";
        setViewerTeamId(foundTeamId);
      }

      setLoading(false);
    }

    loadTicketInfo();
  }, [matchId, user?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!match?.id) {
      setMessage("Match could not be verified.");
      return;
    }

    if (!viewerTeamId || !opponentTeamId) {
      setMessage("Your team could not be verified for this match.");
      return;
    }

    if (!reason) {
      setMessage("Please select a dispute reason.");
      return;
    }

    if (reason === "Other" && !otherReason.trim()) {
      setMessage("Please enter the dispute reason.");
      return;
    }

    if (!description.trim()) {
      setMessage("Please explain what happened.");
      return;
    }

    setSubmitting(true);

    const finalReason = reason === "Other" ? otherReason.trim() : reason;

    const { data, error } = await supabase
      .from("dispute_tickets")
      .insert({
        match_id: match.id,
        team_id: viewerTeamId,
        opponent_team_id: opponentTeamId,
        game: match.game || null,
        platform: match.platform || null,
        ladder: match.ladder || null,
        dispute_reason: finalReason,
        dispute_description: description.trim(),
        status: "open",
        created_by: user?.id || null,
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        setMessage("Your team has already submitted a dispute ticket for this match.");
        return;
      }

      setMessage("Ticket could not be submitted: " + error.message);
      return;
    }

    if (data?.id) {
      window.location.href = `/support/dispute-ticket/${data.id}`;
      return;
    }

    setMessage("Success. Your dispute case has been submitted.");
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#cfd6dc;}
        button,input,textarea{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .page{
          min-height:100vh;
          background:radial-gradient(circle at top,rgba(30,30,30,.22),transparent 40%),linear-gradient(to bottom,#020202,#000);
          padding:30px 18px;
        }

        .shell{
          max-width:1000px;
          margin:0 auto;
          border:1px solid #292929;
          background:#0b0b0b;
          box-shadow:0 0 30px rgba(0,0,0,.9), inset 0 0 18px rgba(255,255,255,.03);
        }

        .top-bar{
          height:42px;
          background:linear-gradient(to bottom,#1d1d1d,#0a0a0a);
          border-bottom:1px solid #272727;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 14px;
        }

        .top-title{
          color:#d66f16;
          font-size:13px;
          font-weight:900;
          letter-spacing:.8px;
          text-transform:uppercase;
        }

        .top-right{
          color:#777;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
        }

        .case-header{
          border-bottom:1px solid #242424;
          background:#101010;
          padding:16px;
        }

        .case-title{
          color:#ff7a1a;
          font-size:24px;
          font-weight:900;
          text-transform:uppercase;
          margin-bottom:8px;
        }

        .case-sub{
          color:#aaa;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          line-height:20px;
        }

        .compact-case{
          border-bottom:1px solid #242424;
          background:#0d0d0d;
          padding:16px;
        }

        .case-card{
          border:1px solid #242424;
          background:#090909;
          padding:12px;
        }

        .case-row-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
        }

        .card-title{
          color:#d66f16;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          margin-bottom:10px;
        }

        .case-line{
          min-height:24px;
          color:#bdbdbd;
          font-size:13px;
          line-height:24px;
          border-bottom:1px solid rgba(255,255,255,.045);
        }

        .case-line:last-child{border-bottom:0;}

        .label{
          display:inline-block;
          width:118px;
          color:#777;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
        }

        .value{
          color:#fff;
          font-weight:900;
        }

        .status-disputed{
          color:#ffd24c;
          font-weight:900;
          text-transform:uppercase;
        }

        .content{
          padding:16px;
        }

        .section{
          border:1px solid #242424;
          background:#101010;
          margin-bottom:16px;
        }

        .section-title{
          height:35px;
          background:linear-gradient(to bottom,#1c1c1c,#080808);
          border-bottom:1px solid #242424;
          display:flex;
          align-items:center;
          padding:0 14px;
          color:#d66f16;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:.5px;
        }

        .section-body{
          padding:14px;
        }

        .reason-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
        }

        .reason-option{
          min-height:36px;
          border:1px solid #2c2c2c;
          background:#080808;
          color:#cfcfcf;
          display:flex;
          align-items:center;
          gap:9px;
          padding:0 10px;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .reason-option.active{
          border-color:#d66f16;
          color:#ff7a1a;
          background:#17100b;
        }

        .reason-option input{
          accent-color:#d66f16;
        }

        .other-input{
          width:100%;
          height:36px;
          margin-top:10px;
          border:1px solid #333;
          background:#080808;
          color:#fff;
          padding:0 10px;
          outline:none;
        }

        .guide{
          color:#aaa;
          font-size:12px;
          line-height:22px;
          margin-bottom:10px;
          border:1px solid #242424;
          background:#090909;
          padding:10px 12px;
        }

        .guide strong{
          color:#d66f16;
          text-transform:uppercase;
        }

        .textarea{
          width:100%;
          min-height:320px;
          border:1px solid #333;
          background:#080808;
          color:#fff;
          padding:12px;
          resize:vertical;
          font-size:13px;
          line-height:20px;
          outline:none;
        }

        .evidence-grid{
          display:grid;
          grid-template-columns:1fr;
          gap:10px;
        }

        .evidence-card{
          border:1px solid #2c2c2c;
          background:#080808;
          padding:12px;
          display:grid;
          grid-template-columns:135px 1fr;
          align-items:center;
          gap:12px;
        }

        .evidence-title{
          color:#d66f16;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
        }

        .evidence-copy{
          color:#777;
          font-size:11px;
          margin-top:4px;
          line-height:16px;
        }

        .evidence-file{
          width:100%;
          color:#cfcfcf;
          font-size:12px;
        }

        .review-grid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:8px;
        }

        .review-step{
          border:1px solid #2c2c2c;
          background:#080808;
          padding:10px;
          color:#cfcfcf;
          font-size:11px;
          font-weight:900;
          text-align:center;
          text-transform:uppercase;
          line-height:18px;
        }

        .review-step span{
          display:block;
          color:#d66f16;
          font-size:15px;
          margin-bottom:4px;
        }

        .submit-btn{
          width:100%;
          height:42px;
          border:1px solid #d66f16;
          background:#171717;
          color:#ff7a1a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .submit-btn:hover{background:#241104;}
        .submit-btn:disabled{border-color:#444;color:#777;background:#111;cursor:not-allowed;}

        .message{
          margin-top:14px;
          border:1px solid #242424;
          background:#101010;
          padding:12px;
          color:#d2d2d2;
          font-size:13px;
          line-height:22px;
        }

        .message.good{
          border-color:#255f32;
          color:#69df85;
        }

        .loading,.error{
          padding:44px;
          text-align:center;
          color:#fff;
          font-size:15px;
          font-weight:900;
          text-transform:uppercase;
        }

        .error{color:#ff7777;}

        @media(max-width:760px){
          .case-row-grid,.reason-grid,.review-grid{grid-template-columns:1fr;}
          .evidence-card{grid-template-columns:1fr;}
          .top-bar{height:auto;gap:8px;padding:12px;align-items:flex-start;flex-direction:column;}
        }
      `}</style>

      <main className="page">
        <div className="shell">
          <div className="top-bar">
            <div className="top-title">GameBattles Dispute Center</div>
            <div className="top-right">Case File</div>
          </div>

          {loading && <div className="loading">Loading dispute case...</div>}
          {!loading && pageError && <div className="error">{pageError}</div>}

          {!loading && !pageError && (
            <>
              <div className="case-header">
                <div className="case-title">
                  {postingTeam?.name || "Team A"} vs {acceptingTeam?.name || "Team B"}
                </div>
                <div className="case-sub">
                  Match ID: {shortMatchId(match?.id || "")} / {prettyText(match?.game)} /{" "}
                  {ladderName(match?.ladder)} / {prettyText(match?.platform)}
                </div>
              </div>

              <div className="compact-case">
                <div className="case-card">
                  <div className="card-title">Dispute Summary</div>

                  <div className="case-row-grid">
                    <div>
                      <div className="case-line">
                        <span className="label">Status:</span>
                        <span className="status-disputed">Disputed</span>
                      </div>

                      <div className="case-line">
                        <span className="label">Best Of:</span>
                        <span className="value">{match?.best_of || "Best of 3"}</span>
                      </div>

                      <div className="case-line">
                        <span className="label">Time:</span>
                        <span className="value">{match?.match_time || "TBD"}</span>
                      </div>
                    </div>

                    <div>
                      <div className="case-line">
                        <span className="label">{postingTeam?.name || "Team A"}:</span>
                        <span className="value">{postingReport}</span>
                      </div>

                      <div className="case-line">
                        <span className="label">{acceptingTeam?.name || "Team B"}:</span>
                        <span className="value">{acceptingReport}</span>
                      </div>

                      <div className="case-line">
                        <span className="label">Filing Team:</span>
                        <span className="value">{viewerTeam?.name || "Not Verified"}</span>
                      </div>

                      <div className="case-line">
                        <span className="label">Opponent:</span>
                        <span className="value">{opponentTeam?.name || "Not Verified"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="content">
                <form onSubmit={handleSubmit}>
                  <div className="section">
                    <div className="section-title">Reason For Dispute</div>
                    <div className="section-body">
                      <div className="reason-grid">
                        {[
                          "Reported Wrong Score",
                          "Opponent Cheated",
                          "Opponent Hacked",
                          "Opponent Did Not Show Up",
                          "Opponent Had Wrong Settings",
                          "Other",
                        ].map((item) => (
                          <label className={reason === item ? "reason-option active" : "reason-option"} key={item}>
                            <input type="radio" name="reason" checked={reason === item} onChange={() => setReason(item)} />
                            {item}
                          </label>
                        ))}
                      </div>

                      {reason === "Other" && (
                        <input className="other-input" placeholder="Enter dispute reason..." value={otherReason} onChange={(e) => setOtherReason(e.target.value)} />
                      )}
                    </div>
                  </div>

                  <div className="section">
                    <div className="section-title">Evidence</div>
                    <div className="section-body">
                      <div className="evidence-grid">
                        {evidenceSlots.map((slot) => (
                          <div className="evidence-card" key={slot}>
                            <div>
                              <div className="evidence-title">Evidence Slot #{slot}</div>
                              <div className="evidence-copy">Screenshot or video proof.</div>
                            </div>
                            <input className="evidence-file" type="file" accept="image/*,video/*" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <div className="section-title">Explain What Happened</div>
                    <div className="section-body">
                      <div className="guide">
                        <strong>Include:</strong> what happened, why the reported score is wrong,
                        any rule violations, and what each piece of evidence shows.
                      </div>

                      <textarea
                        className="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explain the dispute clearly..."
                      />
                    </div>
                  </div>

                  <div className="section">
                    <div className="section-title">Staff Review Process</div>
                    <div className="section-body">
                      <div className="review-grid">
                        <div className="review-step"><span>1</span>Ticket Submitted</div>
                        <div className="review-step"><span>2</span>Staff Reviews Evidence</div>
                        <div className="review-step"><span>3</span>Staff Decision</div>
                        <div className="review-step"><span>4</span>Match Updated</div>
                      </div>
                    </div>
                  </div>

                  <button className="submit-btn" type="submit" disabled={submitting}>
                    {submitting ? "Submitting Case..." : "Submit Dispute Case"}
                  </button>

                  {message && (
                    <div className={message.startsWith("Success") ? "message good" : "message"}>
                      {message}
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function DisputeTicketPage() {
  return (
    <Suspense fallback={<div className="loading">Loading dispute case...</div>}>
      <DisputeTicketPageContent />
    </Suspense>
  );
}