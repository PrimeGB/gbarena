import Link from "next/link";
import CompactTopBar from "../components/CompactTopBar";
import NewsCategoriesNav from "./NewsCategoriesNav";
import type { NewsCategory } from "./categoryData";

export default function UpcomingUpdates({ category }: { category: NewsCategory }) {
  return (
    <>
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .updates-page{max-width:1240px;margin:0 auto}
        .updates-header{min-height:92px;display:flex;align-items:center;padding:0 14px;background:#0a1622;border-left:1px solid #3b7fc2;border-right:1px solid #3b7fc2;border-bottom:2px solid #4f93d6}
        .updates-brand{color:#eaf5ff;font-size:30px;font-weight:bold}
        .updates-brand-sub{margin-top:5px;color:#f2c14e;font-size:10px;text-transform:uppercase}
        .updates-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:10px;margin-top:8px}
        .updates-panel{min-width:0;background:#0a1622;border:1px solid #3b7fc2}
        .updates-panel-title{padding:9px 10px;background:#0f2a40;border-bottom:1px solid #3b7fc2;color:#f2c14e;font-size:11px;font-weight:bold;text-transform:uppercase}
        .updates-content{padding:20px}
        .updates-back{color:#9bc9ec;font-size:12px;font-weight:bold;text-decoration:none}
        .updates-back:hover,.updates-back:focus-visible,.updates-link:hover,.updates-link:focus-visible{color:#f2c14e}
        .updates-heading{margin:20px 0;padding-bottom:18px;border-bottom:1px solid #244b70}
        .updates-heading h1{margin:0;color:#f2c14e;font-size:26px}
        .updates-heading p{margin:8px 0 0;color:#c8d8e8;font-size:13px;line-height:1.6}
        .updates-list{display:grid;gap:12px}
        .updates-entry{background:#07111b;border:1px solid #244b70}
        .updates-entry-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;background:#0f2a40;border-bottom:1px solid #244b70}
        .updates-label{padding:4px 7px;background:#6a0000;border:1px solid #c40000;color:#fff;font-size:10px;font-weight:bold;text-transform:uppercase}
        .updates-entry h2{margin:0;color:#f2c14e;font-size:14px}
        .updates-entry-body{padding:14px;color:#d7e2ee;font-size:13px;line-height:1.6}
        .updates-entry-body p{margin:0}
        .updates-link{display:inline-block;margin-top:10px;color:#8dcaff;font-weight:bold;text-decoration:none}
        @media(max-width:768px){.updates-layout{grid-template-columns:minmax(0,1fr)}.updates-content{padding:16px}.updates-heading h1{font-size:23px}}
      `}</style>
      <div className="updates-page">
        <CompactTopBar />
        <header className="updates-header">
          <div>
            <div className="updates-brand">GameBattles</div>
            <div className="updates-brand-sub">Latest News &amp; Community Updates</div>
          </div>
        </header>
        <div className="updates-layout">
          <NewsCategoriesNav currentSlug={category.slug} />
          <main className="updates-panel">
            <div className="updates-panel-title">Latest News</div>
            <div className="updates-content">
              <Link className="updates-back" href="/latest-news">← Back to Latest News</Link>
              <div className="updates-heading">
                <h1>{category.title}</h1>
                <p>{category.intro}</p>
              </div>
              <div className="updates-list">
                {category.items.map((item) => (
                  <article className="updates-entry" key={item.title}>
                    <header className="updates-entry-head">
                      <span className="updates-label">{item.label}</span>
                      <h2>{item.title}</h2>
                    </header>
                    <div className="updates-entry-body">
                      <p>{item.description}</p>
                      {item.link && item.linkLabel && (
                        <Link className="updates-link" href={item.link}>{item.linkLabel} →</Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
