import Link from "next/link";
import { notFound } from "next/navigation";
import AcceptedSuggestions from "../AcceptedSuggestions";
import NewsCategoryContent from "../NewsCategoryContent";
import { newsCategories, newsMenuCategories } from "../categoryData";

export function generateStaticParams() {
  return newsCategories.map(({ slug }) => ({ category: slug }));
}

export default async function NewsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = newsCategories.find((item) => item.slug === slug);
  if (!category) notFound();
  if (slug === "accepted-suggestions") return <AcceptedSuggestions />;
  if (slug === "upcoming-updates" || slug === "rule-changes") {
    return <NewsCategoryContent category={category} />;
  }

  return (
    <main className="news-category-page">
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        a{text-decoration:none}
        .news-category-page{max-width:1180px;margin:0 auto;padding:24px 16px}
        .nc-brand{padding:18px;background:#0a1622;border:1px solid #3b7fc2;border-bottom:2px solid #4f93d6}
        .nc-brand strong{display:block;color:#eaf5ff;font-size:26px}
        .nc-brand span{display:block;margin-top:5px;color:#f2c14e;font-size:11px;text-transform:uppercase}
        .nc-nav{display:flex;flex-wrap:wrap;gap:18px;padding:12px;background:#0a1622;border:1px solid #3b7fc2;border-top:0}
        .nc-nav a{color:#e3f1ff;font-size:11px;font-weight:bold;text-transform:uppercase}
        .nc-layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:12px;margin-top:12px}
        .nc-panel{background:#0a1622;border:1px solid #3b7fc2}
        .nc-panel-title{padding:10px;background:#0f2a40;border-bottom:1px solid #3b7fc2;color:#f2c14e;font-size:11px;font-weight:bold;text-transform:uppercase}
        .nc-category-link{display:block;padding:10px;border-bottom:1px solid #16324a;color:#d7eaff;font-size:12px}
        .nc-category-link:hover,.nc-category-link[aria-current="page"]{background:#12324b;color:#f2c14e}
        .nc-content{padding:16px}
        .nc-eyebrow{margin:0 0 8px;color:#7fc0ff;font-size:11px;font-weight:bold;text-transform:uppercase}
        h1{margin:0;color:#f2c14e;font-size:26px}
        .nc-intro{margin:10px 0 18px;color:#c8d8e8;font-size:14px;line-height:1.6}
        .nc-entry{margin-top:10px;background:#07111b;border:1px solid #16324a}
        .nc-entry-head{display:flex;justify-content:space-between;gap:12px;padding:10px;background:#0f2a40;border-bottom:1px solid #16324a}
        .nc-label{color:#f2c14e;font-size:10px;font-weight:bold;text-transform:uppercase}
        .nc-entry h2{margin:0;color:#fff;font-size:14px}
        .nc-entry-body{padding:12px;color:#d7e2ee;font-size:12px;line-height:1.6}
        .nc-entry-link{display:inline-block;margin-top:8px;color:#7fc0ff;font-weight:bold}
        .nc-back{display:inline-block;margin-top:14px;color:#c8d8e8;font-size:12px}
        @media(max-width:700px){.nc-layout{grid-template-columns:1fr}.nc-category-list{display:grid;grid-template-columns:1fr 1fr}.nc-entry-head{flex-direction:column}}
      `}</style>

      <header className="nc-brand">
        <strong>GameBattles</strong>
        <span>News & Community Updates</span>
      </header>
      <nav className="nc-nav" aria-label="Main">
        <Link href="/home">Home</Link>
        <Link href="/latest-news">Latest News</Link>
        <Link href="/forums">Forums</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/support">Support</Link>
      </nav>

      <div className="nc-layout">
        <aside className="nc-panel">
          <div className="nc-panel-title">News Categories</div>
          <div className="nc-category-list">
            {newsMenuCategories.map((item) => (
              <Link
                className="nc-category-link"
                href={`/latest-news/${item.slug}`}
                aria-current={item.slug === slug ? "page" : undefined}
                key={item.slug}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </aside>

        <section className="nc-panel">
          <div className="nc-panel-title">GameBattles News Center</div>
          <div className="nc-content">
            <p className="nc-eyebrow">Category</p>
            <h1>{category.title}</h1>
            <p className="nc-intro">{category.intro}</p>
            {category.items.map((item) => (
              <article className="nc-entry" key={item.title}>
                <header className="nc-entry-head">
                  <span className="nc-label">{item.label}</span>
                  <h2>{item.title}</h2>
                </header>
                <div className="nc-entry-body">
                  <p>{item.description}</p>
                  {item.link && item.linkLabel && (
                    <Link className="nc-entry-link" href={item.link}>
                      {item.linkLabel} →
                    </Link>
                  )}
                </div>
              </article>
            ))}
            <Link className="nc-back" href="/latest-news">← Back to Latest News</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
