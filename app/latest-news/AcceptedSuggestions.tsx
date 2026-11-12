import Link from "next/link";
import CompactTopBar from "../components/CompactTopBar";
import { acceptedSuggestions } from "./categoryData";
import NewsCategoriesNav from "./NewsCategoriesNav";

export default function AcceptedSuggestions() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .accepted-page{max-width:1240px;margin:0 auto;background:#07111b;border:1px solid #315f88;min-height:100vh}
        .accepted-header{padding:22px 24px;background:linear-gradient(110deg,#173956,#07111b);border-bottom:2px solid #315f88}
        .accepted-brand{color:#fff;font-size:30px;font-weight:900;text-transform:uppercase}
        .accepted-brand-sub{margin-top:5px;color:#f2c14e;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase}
        .accepted-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:10px;margin:8px 10px 0}
        .accepted-content{min-width:0;padding:26px 24px 40px;background:#0a1622;border:1px solid #3b7fc2}
        .accepted-back{color:#9bc9ec;font-size:12px;font-weight:bold;text-decoration:none}
        .accepted-back:hover,.accepted-back:focus-visible,.accepted-link:hover,.accepted-link:focus-visible{color:#f2c14e}
        .accepted-heading{display:flex;justify-content:space-between;align-items:end;gap:18px;margin:24px 0 22px;padding-bottom:18px;border-bottom:1px solid #244b70}
        .accepted-eyebrow{color:#8abde1;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase}
        .accepted-heading h1{margin:7px 0;color:#f2c14e;font-size:30px;text-transform:uppercase}
        .accepted-heading p{margin:0;color:#b9cddd;font-size:13px;line-height:1.6}
        .accepted-submit{flex-shrink:0;padding:10px 14px;border:1px solid #d6a943;background:linear-gradient(to bottom,#d6a943,#8a6218);color:#07111b;font-size:12px;font-weight:bold;text-decoration:none;text-transform:uppercase}
        .accepted-submit:hover,.accepted-submit:focus-visible{filter:brightness(1.15)}
        .accepted-list{display:grid;gap:14px}
        .accepted-card{background:#050e17;border:1px solid #315f88}
        .accepted-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;background:linear-gradient(to bottom,#173956,#0c2133);border-bottom:1px solid #315f88}
        .accepted-card-head h2{margin:0;color:#fff;font-size:17px}
        .accepted-status{flex-shrink:0;padding:5px 8px;border:1px solid #387854;background:#102e21;color:#b8ebc8;font-size:10px;font-weight:bold;text-transform:uppercase}
        .accepted-details{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:0;padding:18px}
        .accepted-details div{min-width:0}
        .accepted-details dt{margin-bottom:7px;color:#f2c14e;font-size:10px;font-weight:bold;letter-spacing:.7px;text-transform:uppercase}
        .accepted-details dd{margin:0;color:#d7e2ee;font-size:13px;line-height:1.6;overflow-wrap:anywhere}
        .accepted-details .accepted-author{grid-column:1 / -1;border-top:1px solid #1b364d;padding-top:14px}
        .accepted-link{display:inline-block;margin:0 18px 18px;color:#8dcaff;font-size:12px;font-weight:bold;text-decoration:none}
        .accepted-empty{padding:20px;border:1px solid #315f88;color:#b9cddd;font-size:13px;line-height:1.6}
        @media(max-width:768px){.accepted-layout{grid-template-columns:minmax(0,1fr)}}
        @media(max-width:700px){.accepted-header{padding:18px}.accepted-content{padding:22px 16px 32px}.accepted-heading{align-items:flex-start;flex-direction:column}.accepted-heading h1{font-size:24px}.accepted-details{grid-template-columns:1fr;gap:16px}.accepted-details .accepted-author{grid-column:auto}.accepted-card-head{align-items:flex-start;flex-direction:column}}
      `}</style>
      <div className="accepted-page">
        <CompactTopBar />
        <header className="accepted-header">
          <div className="accepted-brand">GameBattles</div>
          <div className="accepted-brand-sub">Latest News &amp; Community Updates</div>
        </header>
        <div className="accepted-layout">
        <NewsCategoriesNav currentSlug="accepted-suggestions" />
        <main className="accepted-content">
          <Link className="accepted-back" href="/latest-news">← Back to Latest News</Link>
          <div className="accepted-heading">
            <div>
              <div className="accepted-eyebrow">Community ideas</div>
              <h1>Accepted Suggestions</h1>
              <p>See the ideas accepted for GameBattles and how they are being brought to life.</p>
            </div>
            <Link className="accepted-submit" href="/suggestions">Submit a suggestion</Link>
          </div>
          {acceptedSuggestions.length === 0 ? (
            <p className="accepted-empty">No accepted suggestions have been published yet.</p>
          ) : (
            <div className="accepted-list">
              {acceptedSuggestions.map((item) => (
                <article className="accepted-card" key={item.title}>
                  <header className="accepted-card-head">
                    <h2>{item.title}</h2>
                    <span className="accepted-status">{item.status}</span>
                  </header>
                  <dl className="accepted-details">
                    <div><dt>The suggestion</dt><dd>{item.suggestion}</dd></div>
                    <div><dt>How it&apos;s being implemented</dt><dd>{item.implementation}</dd></div>
                    <div className="accepted-author"><dt>Suggested by</dt><dd>{item.suggestedBy}</dd></div>
                  </dl>
                  <Link className="accepted-link" href={item.link}>{item.linkLabel} →</Link>
                </article>
              ))}
            </div>
          )}
        </main>
        </div>
      </div>
    </>
  );
}
