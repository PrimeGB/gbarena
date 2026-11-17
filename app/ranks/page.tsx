import Link from "next/link";
import { RankBadgeArt } from "../components/RankBadge";
import { DIVISIONS, RANK_TIERS, XP_PER_LOSS, XP_PER_WIN, rankFromXp, xpForLevel } from "@/lib/playerRank";

export const metadata = { title: "Player Ranks - GameBattles" };

export default function RanksPage() {
  const sample = rankFromXp(xpForLevel(18) + 60);
  return (
    <main className="rk-page">
      <div className="rk-shell">
        <Link href="/home" className="rk-back">← Back to Home</Link>
        <header className="rk-hero">
          <div>
            <span className="rk-kicker">Player progression</span>
            <h1>Player Ranks</h1>
            <p>
              Every ladder match earns XP toward your GameBattles rank. Climb 50 levels across 10 ranks, from Rookie
              to Legend. Your rank badge shows on your profile for everyone to see.
            </p>
          </div>
          <div className="rk-sample">
            <RankBadgeArt rank={sample} size={120} />
            <div>
              <strong style={{ color: sample.tier.light }}>{sample.title}</strong>
              <span>Level {sample.level} · {sample.xp.toLocaleString()} XP</span>
              <div className="rk-bar"><i style={{ width: `${Math.round(sample.progress * 100)}%`, background: sample.tier.light }} /></div>
              <small>{((sample.nextXp ?? sample.xp) - sample.xp).toLocaleString()} XP to {rankFromXp(sample.nextXp ?? 0).title}</small>
            </div>
          </div>
        </header>

        <section className="rk-how">
          <div><b>+{XP_PER_WIN} XP</b><span>for every ladder win</span></div>
          <div><b>+{XP_PER_LOSS} XP</b><span>for every ladder loss</span></div>
          <div><b>5 divisions</b><span>per rank, I to V</span></div>
          <div><b>50 levels</b><span>from Rookie to Legend</span></div>
        </section>

        <h2>All ranks</h2>
        <div className="rk-grid">
          {RANK_TIERS.map((tier, index) => {
            const first = index * 5 + 1;
            const top = rankFromXp(xpForLevel(first + 4));
            return (
              <article key={tier.key} className="rk-card" style={{ ["--rk" as string]: tier.light, ["--rkg" as string]: tier.glow }}>
                <div className="rk-art"><RankBadgeArt rank={top} size={130} /></div>
                <h3>{tier.name}</h3>
                <p>Levels {first}–{first + 4}</p>
                <p className="rk-xp">{xpForLevel(first).toLocaleString()} XP</p>
                <div className="rk-divs">
                  {DIVISIONS.map((d, i) => (
                    <span key={d} title={`${tier.name} ${d}: ${xpForLevel(first + i).toLocaleString()} XP`}>{d}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
        <p className="rk-note">
          XP comes from completed ladder matches. If staff overturn a result, XP updates automatically.
          See your progress on your <Link href="/profile">profile</Link>.
        </p>
      </div>
      <style>{`
        .rk-page{min-height:100vh;padding:26px 16px 60px;background:radial-gradient(circle at 50% -10%,#16314a 0,#07111c 50%,#03070b 100%);color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .rk-shell{max-width:1000px;margin:0 auto}
        .rk-back{color:#f2c14e;font-size:12px;text-decoration:none}
        .rk-hero{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;margin:14px 0 18px;padding:24px;border:1px solid #1d3e5a;border-radius:14px;background:linear-gradient(135deg,#0f2235,#081420)}
        .rk-hero>div:first-child{flex:1 1 380px}
        .rk-kicker{color:#f2c14e;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
        .rk-hero h1{margin:6px 0 8px;color:#fff;font-size:32px}
        .rk-hero p{margin:0;color:#a8bdcd;font-size:13px;line-height:1.6}
        .rk-sample{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;background:#050c13;border:1px solid #1d3e5a}
        .rk-sample strong{display:block;font-size:17px}
        .rk-sample span{display:block;color:#8fa9c0;font-size:11px;margin:2px 0 7px}
        .rk-sample small{color:#7f9ab3;font-size:10px}
        .rk-bar{width:170px;height:7px;border-radius:4px;background:#1a2c3d;overflow:hidden;margin-bottom:5px}
        .rk-bar i{display:block;height:100%;border-radius:4px}
        .rk-how{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .rk-how div{padding:12px 14px;border-radius:10px;background:#0b1825;border:1px solid #1d3e5a}
        .rk-how b{display:block;color:#7affc8;font-size:16px}
        .rk-how span{color:#8fa9c0;font-size:11px}
        .rk-shell h2{margin:26px 0 12px;color:#e5c573;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
        .rk-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
        .rk-card{padding:16px 10px 14px;text-align:center;border-radius:12px;border:1px solid #1d3e5a;background:linear-gradient(180deg,#0e1f30,#070f18);transition:transform .2s,border-color .2s,box-shadow .2s}
        .rk-card:hover{transform:translateY(-3px);border-color:var(--rk);box-shadow:0 8px 24px var(--rkg)}
        .rk-art{display:grid;place-items:center;height:118px}
        .rk-card h3{margin:8px 0 2px;color:var(--rk);font-size:15px;text-transform:uppercase;letter-spacing:.04em}
        .rk-card p{margin:0;color:#8fa9c0;font-size:11px}
        .rk-card .rk-xp{color:#fff;font-weight:bold;margin-top:3px}
        .rk-divs{display:flex;justify-content:center;gap:3px;margin-top:9px}
        .rk-divs span{min-width:20px;padding:2px 0;border-radius:4px;background:#13263a;color:#9fb9cf;font-size:9px;font-weight:bold}
        .rk-note{margin-top:18px;color:#7f9ab3;font-size:12px}
        .rk-note a{color:#67bdff}
        @media(max-width:820px){.rk-grid{grid-template-columns:repeat(2,1fr)}.rk-how{grid-template-columns:repeat(2,1fr)}}
      `}</style>
    </main>
  );
}
