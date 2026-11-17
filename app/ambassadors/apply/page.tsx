"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type MyApplication = { status: "pending" | "approved" | "declined"; created_at: string; review_note: string };

export default function AmbassadorApplyPage() {
  const { user, loading: userLoading } = useUser();
  const [existing, setExisting] = useState<MyApplication | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [channel, setChannel] = useState("");
  const [games, setGames] = useState("");
  const [audience, setAudience] = useState("");
  const [pitch, setPitch] = useState("");
  const [twitch, setTwitch] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [kick, setKick] = useState("");
  const [instagram, setInstagram] = useState("");
  const [discord, setDiscord] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    let active = true;
    void supabase.rpc("gb_my_ambassador_application").then(({ data }) => {
      if (!active) return;
      const row = Array.isArray(data) ? data[0] : data;
      setExisting((row as MyApplication) || null);
      setLoaded(true);
    });
    return () => { active = false; };
  }, [user]);

  async function submit() {
    setError("");
    if (channel.trim().length < 4) { setError("Add a link to your main channel or page."); return; }
    if (games.trim().length < 2) { setError("Tell us which games and platforms you play."); return; }
    if (pitch.trim().length < 10) { setError("Tell us a little about why you want to be an Ambassador."); return; }
    setSending(true);
    const { error: rpcError } = await supabase.rpc("gb_ambassador_apply", {
      p_channel: channel.trim(),
      p_games: games.trim(),
      p_pitch: pitch.trim(),
      p_audience: audience.trim(),
      p_twitch: twitch.trim(),
      p_youtube: youtube.trim(),
      p_tiktok: tiktok.trim(),
      p_kick: kick.trim(),
      p_instagram: instagram.trim(),
      p_discord: discord.trim(),
    });
    setSending(false);
    if (rpcError) { setError(rpcError.message); return; }
    setSent(true);
  }

  const pending = existing?.status === "pending";

  return (
    <main className="apl">
      <div className="wrap">
        <Link href="/ambassadors" className="back">← GB Ambassadors</Link>
        <header className="hero">
          <span className="kicker">Creator Program</span>
          <h1>Apply to become an <em>Ambassador</em></h1>
          <p>
            Tell us about you and your content. The Founder personally reviews every application -
            you&apos;ll get the answer in your site inbox.
          </p>
        </header>

        {!userLoading && !user ? (
          <div className="panel center">
            <p className="muted">You need a GameBattles account to apply.</p>
            <div className="row center-row">
              <Link className="gold" href="/login?next=%2Fambassadors%2Fapply">Sign in</Link>
              <Link className="ghost" href="/join">Create an account</Link>
            </div>
          </div>
        ) : sent || pending ? (
          <div className="panel center">
            <div className="bigstar">★</div>
            <h2>{sent ? "Application sent!" : "Your application is in review"}</h2>
            <p className="muted">
              The Founder reviews every application personally. Keep an eye on your site inbox -
              that&apos;s where your answer will arrive.
            </p>
            <div className="row center-row">
              <Link className="gold" href="/ambassadors">Back to Ambassadors</Link>
              <Link className="ghost" href="/profile/inbox">Open my inbox</Link>
            </div>
          </div>
        ) : !loaded ? (
          <p className="muted">Loading...</p>
        ) : (
          <div className="panel">
            {existing?.status === "declined" && (
              <p className="note">Your last application wasn&apos;t accepted, but you&apos;re welcome to apply again.</p>
            )}
            <h2>About your content</h2>
            <div className="grid">
              <label className="full">Main channel or page link *
                <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="https://twitch.tv/yourname" maxLength={300} />
              </label>
              <label>Games &amp; platforms you play *
                <input value={games} onChange={(e) => setGames(e.target.value)} placeholder="Battlefield 6 on PC, CoD on PlayStation" maxLength={200} />
              </label>
              <label>Audience size (optional)
                <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Average viewers, followers or subs" maxLength={120} />
              </label>
              <label className="full">Why do you want to represent GameBattles? *
                <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={4} maxLength={1000} placeholder="What you stream or create, how often, and how you'd bring players to GameBattles" />
              </label>
            </div>
            <h2>Where people can find you <span className="opt">(all optional)</span></h2>
            <div className="grid">
              <label>Twitch<input value={twitch} onChange={(e) => setTwitch(e.target.value)} placeholder="https://twitch.tv/..." maxLength={200} /></label>
              <label>YouTube<input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/@..." maxLength={200} /></label>
              <label>TikTok<input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@..." maxLength={200} /></label>
              <label>Kick<input value={kick} onChange={(e) => setKick(e.target.value)} placeholder="https://kick.com/..." maxLength={200} /></label>
              <label>Instagram<input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." maxLength={200} /></label>
              <label>Discord<input value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="https://discord.gg/..." maxLength={200} /></label>
            </div>
            {error && <p className="err" role="alert">{error}</p>}
            <div className="row">
              <p className="fine">What happens next: the Founder reviews your application and you get a reply in your site inbox. If you&apos;re accepted, your gold profile, recruit link and award go live right away.</p>
              <button className="gold" onClick={() => void submit()} disabled={sending}>{sending ? "Sending..." : "Send application"}</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .apl{min-height:100vh;background:radial-gradient(ellipse at 50% -10%,#3a2b06 0%,#0a1420 48%,#05090f 100%);padding:28px 16px 60px;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .wrap{max-width:760px;margin:0 auto}
        .back{color:#f2c14e;font-size:12px;text-decoration:none}
        .hero{text-align:center;margin:18px 0 22px}
        .kicker{display:inline-flex;align-items:center;gap:10px;color:#f2c14e;font-size:10px;font-weight:900;letter-spacing:.28em;text-transform:uppercase}
        .kicker::before,.kicker::after{content:"";width:28px;height:2px;background:linear-gradient(90deg,transparent,#f2c14e)}
        .kicker::after{transform:scaleX(-1)}
        .hero h1{margin:10px 0 8px;color:#fff;font-size:30px;text-transform:uppercase}
        .hero h1 em{font-style:normal;background:linear-gradient(180deg,#ffe9ab,#f2c14e 55%,#9a6510);-webkit-background-clip:text;background-clip:text;color:transparent}
        .hero p{max-width:520px;margin:0 auto;color:#9fb4c8;font-size:13px;line-height:1.7}
        .panel{padding:24px;border-radius:12px;border:1px solid #6e5213;background:linear-gradient(170deg,#14100399,#0a1522)}
        .panel h2{margin:0 0 14px;color:#e5c573;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
        .panel h2 + .grid{margin-bottom:20px}
        .opt{color:#8fa9c2;font-weight:normal;letter-spacing:.04em;text-transform:none}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .grid label{display:flex;flex-direction:column;gap:5px;color:#8fa9c2;font-size:10.5px;font-weight:bold;letter-spacing:.05em;text-transform:uppercase}
        .grid label.full{grid-column:1/-1}
        .grid input,.grid textarea{padding:10px 12px;border-radius:7px;border:1px solid #2b4a68;background:#050c13;color:#e8f1fa;font-size:13px;font-family:inherit}
        .grid input:focus,.grid textarea:focus{outline:none;border-color:#f2c14e}
        .row{display:flex;align-items:center;gap:18px;margin-top:18px}
        .center-row{justify-content:center}
        .fine{flex:1;margin:0;color:#7f9ab3;font-size:11px;line-height:1.6}
        .gold{padding:13px 24px;border:none;border-radius:6px;background:linear-gradient(180deg,#ffdf8e,#e0a020);color:#231600;font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;text-decoration:none;white-space:nowrap}
        .gold:disabled{opacity:.6;cursor:default}
        .ghost{padding:12px 20px;border-radius:6px;border:1px solid #37536e;color:#cfe0f0;font-size:11px;font-weight:bold;text-decoration:none}
        .err{margin:14px 0 0;padding:10px 14px;border-radius:8px;background:#2a0b0f;border:1px solid #7a2733;color:#ff9aa4;font-size:12.5px}
        .note{margin:0 0 14px;padding:10px 14px;border-radius:8px;background:#0b2a18;border:1px solid #277a45;color:#7df0b6;font-size:12px}
        .muted{color:#8fa9c2;font-size:13px;line-height:1.7}
        .center{text-align:center;padding:38px 24px}
        .bigstar{width:64px;height:64px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;font-size:28px;color:#231600;background:conic-gradient(#ffe9ab,#f2c14e,#8a5a00,#ffe9ab);box-shadow:0 0 30px #f2c14e66}
        .center h2{color:#fff;font-size:20px;margin:0 0 8px;text-transform:none;letter-spacing:0}
        @media(max-width:620px){.grid{grid-template-columns:1fr}.row{flex-direction:column;align-items:stretch;text-align:center}}
      `}</style>
    </main>
  );
}
