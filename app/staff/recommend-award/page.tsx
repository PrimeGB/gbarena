"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import StaffToolShell from "../StaffToolShell";

type Award = { name: string; award_group: string };

function RecommendationForm() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [award, setAward] = useState("");
  const [target, setTarget] = useState("");
  const [targetType, setTargetType] = useState("player");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase.rpc("staff_public_award_catalog");
      if (!active) return;
      if (error) setMessage(`Awards could not be loaded: ${error.message}`);
      else setAwards((data || []) as Award[]);
    })();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const { error } = await supabase.rpc("staff_recommend_award", {
      p_award_name: award, p_target_name: target, p_target_type: targetType,
      p_reason: reason, p_evidence: evidence,
    });
    setSaving(false);
    if (error) setMessage(`Recommendation could not be submitted: ${error.message}`);
    else {
      setMessage("Recommendation submitted for Administrator or Founder review.");
      setTarget(""); setReason(""); setEvidence("");
    }
  }

  return (
    <>
      <p>Recommend an award for another player or team. An Administrator or Founder must review it.</p>
      {message && <p role="status">{message}</p>}
      <form className="staff-mobile-form" onSubmit={submit} style={{ display: "grid", maxWidth: 600 }}>
        <label>Award <select required value={award} onChange={(e) => setAward(e.target.value)}><option value="">Choose an award</option>{awards.map((a) => <option key={a.name} value={a.name}>{a.name} - {a.award_group}</option>)}</select></label>
        <label>Recipient type <select value={targetType} onChange={(e) => setTargetType(e.target.value)}><option value="player">Player</option><option value="team">Team</option></select></label>
        <label>Exact {targetType === "player" ? "username" : "team name"} <input required value={target} onChange={(e) => setTarget(e.target.value)} /></label>
        <label>Reason <textarea required minLength={10} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <label>Evidence or links (optional) <textarea maxLength={5000} value={evidence} onChange={(e) => setEvidence(e.target.value)} /></label>
        <button disabled={saving} type="submit">{saving ? "Submitting..." : "Submit recommendation"}</button>
      </form>
    </>
  );
}

export default function RecommendAwardPage() {
  return <StaffToolShell title="Recommend an award" permission="award_recommendation"><RecommendationForm /></StaffToolShell>;
}
