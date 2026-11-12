import Link from "next/link";
import { newsMenuCategories } from "./categoryData";

export default function NewsCategoriesNav({ currentSlug }: { currentSlug: string }) {
  return (
    <aside className="news-categories">
      <style>{`
        .news-categories{min-width:0;background:#0a1622;border:1px solid #3b7fc2}
        .news-categories-title{padding:9px 10px;background:#0f2a40;border-bottom:1px solid #3b7fc2;color:#f2c14e;font-size:11px;font-weight:bold;text-transform:uppercase}
        .news-categories-link{display:block;padding:10px;color:#d7eaff;border-bottom:1px solid #16324a;font-size:12px;text-decoration:none}
        .news-categories-link:hover,.news-categories-link:focus-visible,.news-categories-link[aria-current="page"]{background:#12324b;color:#f2c14e}
      `}</style>
      <div className="news-categories-title">News Categories</div>
      {newsMenuCategories.map((item) => (
        <Link
          className="news-categories-link"
          href={`/latest-news/${item.slug}`}
          aria-current={item.slug === currentSlug ? "page" : undefined}
          key={item.slug}
        >
          {item.title}
        </Link>
      ))}
    </aside>
  );
}
