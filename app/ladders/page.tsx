import Link from "next/link";
import {
  categoriesForPlatform,
  gamesForCategory,
  ladderPlatforms,
} from "../../lib/ladderCatalog";

export default function AllLaddersPage() {
  return (
    <main className="page">
      <section className="catalog">
        <Link className="back" href="/home">← Home</Link>
        <p className="eyebrow">GameBattles competition</p>
        <h1>Browse all ladders</h1>
        <p className="intro">
          Choose a platform and game to see its dedicated ladders, rankings,
          teams, and rules.
        </p>

        <div className="platform-list">
          {ladderPlatforms.map((platform) => {
            return (
              <section className="platform" key={platform.value}>
                <header className="platform-head">
                  <h2>{platform.label}</h2>
                  <Link href={`/ladders/${platform.value}`}>Browse platform</Link>
                </header>
                <div className="game-grid">
                  {categoriesForPlatform(platform.value).map((category) => {
                    const games = gamesForCategory(category.value);
                    return (
                      <article className="game-card" key={category.value}>
                        <h3>{category.label}</h3>
                        <div className="game-links">
                          {games.map((game) => (
                            <Link
                              key={game.value}
                              href={`/ladders/${platform.value}/${category.value}/${game.value}`}
                            >
                              {game.label}
                            </Link>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}
        .page{min-height:100vh;padding:44px 20px;background:radial-gradient(ellipse at 50% 0%,rgba(35,104,161,.24),transparent 50%),#050a11;color:#eaf1f8;font-family:var(--font-geist-sans),Arial,sans-serif}
        .catalog{max-width:1120px;margin:0 auto}
        .back{color:#9eb9d2;font-size:13px;text-decoration:none}
        .back:hover,.platform-head a:hover,.game-links a:hover{color:#fff}
        .eyebrow{margin:30px 0 7px;color:#82b8e4;font-size:11px;font-weight:650;letter-spacing:.1em;text-transform:uppercase}
        h1{margin:0;color:#f3f6fa;font-size:clamp(30px,5vw,42px);letter-spacing:-.04em}
        .intro{margin:10px 0 30px;color:#aab9c9;font-size:14px;line-height:1.6}
        .platform-list{display:grid;gap:18px}
        .platform{padding:20px;border:1px solid rgba(130,168,205,.2);border-radius:14px;background:rgba(9,17,28,.92)}
        .platform-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
        .platform-head h2{margin:0;color:#f3f6fa;font-size:20px}
        .platform-head a{color:#91c5ed;font-size:12px;font-weight:600;text-decoration:none}
        .game-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
        .game-card{padding:14px;border:1px solid #263a4d;border-radius:9px;background:#0b1521}
        .game-card h3{margin:0 0 10px;color:#c9d8e6;font-size:13px}
        .game-links{display:flex;flex-wrap:wrap;gap:7px}
        .game-links a{padding:6px 9px;border:1px solid #2a4964;border-radius:6px;color:#a9c9e8;font-size:11px;text-decoration:none}
        .game-links a:hover{border-color:#438dca}
        @media(max-width:600px){.page{padding:28px 12px}.platform{padding:16px}.platform-head h2{font-size:18px}}
      `}</style>
    </main>
  );
}
