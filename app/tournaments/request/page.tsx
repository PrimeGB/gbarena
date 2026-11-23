"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";

export default function TournamentRequestPage() {
  const { user, loading } = useUser();
  const [game, setGame] = useState("");
  const [platform, setPlatform] = useState("");
  const [players, setPlayers] = useState("");
  const [format, setFormat] = useState("");
  const [schedule, setSchedule] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    if (!user) {
      setError("Sign in to send a tournament request.");
      return;
    }
    const gameName = game.trim();
    const playerCount = Number(players);
    if (!gameName || !Number.isInteger(playerCount) || playerCount < 2) {
      setError("Enter a game and a player count of at least 2.");
      return;
    }
    const text = [
      "Friendly tournament request",
      `Game: ${gameName}`,
      `Platform: ${platform || "No preference"}`,
      `Players: ${playerCount}`,
      `Format: ${format || "No preference"}`,
      `Preferred date/time: ${schedule.trim() || "Flexible"}`,
      `Additional details: ${details.trim() || "None provided"}`,
    ].join("\n");
    if (text.length > 4000) {
      setError("Shorten your additional details so the full request is under 4,000 characters.");
      return;
    }
    setSending(true);
    setError("");
    setSent(false);
    try {
      const { error: requestError } = await supabase.rpc("gb_request_friendly_tournament", { p_details: text });
      if (requestError) {
        setError(`Your request could not be sent: ${requestError.message}`);
        return;
      }
      setGame("");
      setPlatform("");
      setPlayers("");
      setFormat("");
      setSchedule("");
      setDetails("");
      setSent(true);
    } catch (requestError) {
      setError(`Delivery could not be confirmed: ${requestError instanceof Error ? requestError.message : "Check your connection."} Check your sent messages before trying again.`);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="event-request">
      <style>{`
        .event-request{min-height:100vh;padding:48px 20px 70px;background:radial-gradient(ellipse at 75% 0,#45201c,transparent 45%),linear-gradient(145deg,#071321,#040910);color:#e5edf5;font-family:Tahoma,Verdana,Arial,sans-serif}
        .event-request *{box-sizing:border-box}
        .event-request-wrap{max-width:1000px;margin:auto}
        .event-request-back{color:#a5c9e6;font-size:12px;font-weight:bold;text-decoration:none}
        .event-request-hero{margin:28px 0 32px;max-width:720px}
        .event-request-kicker{color:#f2c46a;font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase}
        .event-request h1{margin:12px 0;color:#fff;font-size:clamp(32px,5vw,54px);line-height:1.04;letter-spacing:-.03em}
        .event-request h1 em{color:#f2c46a;font-style:normal}
        .event-request-hero p{color:#b9cbda;font-size:15px;line-height:1.7}
        .event-request-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(240px,.8fr);gap:24px;align-items:start}
        .event-request-form,.event-request-guide{padding:24px;background:#0a1826;border:1px solid #28465c}
        .event-request h2{margin:0 0 10px;color:#fff;font-size:19px}
        .event-request-form p,.event-request-guide p,.event-request-guide li{color:#bdd0df;font-size:13px;line-height:1.7}
        .event-request label{display:block;margin:22px 0 8px;color:#f2c46a;font-size:13px;font-weight:bold}
        .event-request-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}
        .event-request input,.event-request select{box-sizing:border-box;width:100%;padding:11px;border:1px solid #42637c;background:#030a11;color:#fff;font:inherit;font-size:14px}
        .event-request input:focus,.event-request select:focus{outline:2px solid #8bcfff;outline-offset:2px}
        .event-request .event-request-details{grid-column:1/-1}
        .event-request textarea{width:100%;min-height:210px;padding:13px;border:1px solid #42637c;background:#030a11;color:#fff;font:inherit;font-size:14px;line-height:1.55;resize:vertical}
        .event-request textarea:focus{outline:2px solid #8bcfff;outline-offset:2px}
        .event-request button{margin-top:16px;padding:13px 20px;border:1px solid #ffdb8d;background:#e6b353;color:#211706;font-weight:900;text-transform:uppercase;cursor:pointer}
        .event-request button:disabled{opacity:.55;cursor:not-allowed}
        .event-request a{color:#a5d8ff}
        .event-request .event-request-message{margin:15px 0;padding:12px;background:#421b1b;border:1px solid #a34a4a;color:#ffe1df}
        .event-request .event-request-success{background:#123423;border-color:#52886b;color:#c6f4d6}
        .event-request-example{padding:14px;border-left:3px solid #d5aa51;background:#101e2a;color:#d4e4ee;font-size:13px;line-height:1.6}
        @media(max-width:700px){.event-request{padding:30px 16px 55px}.event-request-grid{grid-template-columns:1fr}.event-request-form,.event-request-guide{padding:18px}}
      `}</style>
      <div className="event-request-wrap">
        <Link className="event-request-back" href="/tournaments">← Back to tournaments</Link>
        <header className="event-request-hero">
          <div className="event-request-kicker">Your friends. Your idea.</div>
          <h1>Let&apos;s make game night <em>an event.</em></h1>
          <p>Have an idea for a friendly tournament? Tell us what you have in mind and the Founder can discuss hosting it with you.</p>
        </header>
        <div className="event-request-grid">
          <section className="event-request-form">
            <h2>Tell us about your tournament</h2>
            <p>Share the basics and we&apos;ll review your idea. The Founder will decide whether we can host it and reply in your inbox.</p>
            {!loading && !user && <p className="event-request-message"><Link href="/login?next=%2Ftournaments%2Frequest">Sign in</Link> to send your request.</p>}
            {error && <p role="alert" className="event-request-message">{error}</p>}
            {sent && <p role="status" className="event-request-message event-request-success">Request sent to the Founder. Watch your <Link href="/profile/inbox">inbox</Link> for a reply. Hosting is subject to discussion and availability.</p>}
            <form onSubmit={submitRequest}>
              <div className="event-request-fields">
                <div><label htmlFor="event-game">Game</label><input id="event-game" value={game} onChange={(event) => setGame(event.target.value)} maxLength={100} required placeholder="e.g. Battlefield 6" /></div>
                <div><label htmlFor="event-platform">Platform</label><select id="event-platform" value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="">No preference</option><option>Xbox</option><option>PlayStation</option><option>PC</option><option>Nintendo</option><option>Other</option></select></div>
                <div><label htmlFor="event-players">Number of players</label><input id="event-players" type="number" value={players} onChange={(event) => setPlayers(event.target.value)} min={2} step={1} required placeholder="e.g. 16" /></div>
                <div><label htmlFor="event-format">Format</label><select id="event-format" value={format} onChange={(event) => setFormat(event.target.value)}><option value="">No preference</option><option>Single elimination</option><option>Double elimination</option><option>Round robin</option><option>Other / not sure</option></select></div>
                <div className="event-request-details"><label htmlFor="event-schedule">Preferred date or time</label><input id="event-schedule" value={schedule} onChange={(event) => setSchedule(event.target.value)} maxLength={120} placeholder="e.g. Saturday evening, or flexible" /></div>
                <div className="event-request-details"><label htmlFor="event-details">Anything else we should know?</label><textarea id="event-details" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={2500} placeholder="Rules, team size, or other details (optional)" /></div>
              </div>
              <button type="submit" disabled={loading || !user || sending}>{sending ? "Sending..." : "Send request to staff"}</button>
            </form>
          </section>
          <aside className="event-request-guide">
            <h2>How it works</h2>
            <ol>
              <li>Tell us your idea and who will be playing.</li>
              <li>The Founder reviews your request and replies in your inbox.</li>
              <li>Discuss the details and availability before anything is arranged.</li>
            </ol>
            <h2>What happens next?</h2>
              <div className="event-request-example">Your request goes to the Founder&apos;s inbox. They&apos;ll review the details and let you know whether GameBattles can host it.</div>
          </aside>
        </div>
      </div>
    </main>
  );
}
