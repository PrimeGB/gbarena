import { rapidRoyalRules } from "../../lib/rapidRoyal";

export default function RapidRoyalRules() {
  return (
    <div className="redsec-rules">
      <h2>Rapid Royal — Kill Race Rules</h2>
      <h3>Teams</h3>
      <p>{rapidRoyalRules.teams}</p>
      <h3>2v2</h3>
      <p>{rapidRoyalRules.duos}</p>
      <h3>3v3 — Streaming</h3>
      <p>{rapidRoyalRules.trios}</p>
      <h3>Winning</h3>
      <p>{rapidRoyalRules.winning}</p>
      <h3>Proof</h3>
      <p>{rapidRoyalRules.proof}</p>
    </div>
  );
}
