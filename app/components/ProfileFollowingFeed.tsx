"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";

type ActivityItem = {
  id: string;
  kind: string;
  text: string;
  href?: string;
  at: string;
};

function activityLabel(kind: string) {
  if (kind === "match") return "MATCH RESULT";
  if (kind === "award") return "PLAYER AWARD";
  if (kind === "team") return "TEAM UPDATE";
  return "COMMUNITY UPDATE";
}

function timeAgo(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function ProfileFollowingFeed() {
  const { user, loading } = useUser();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    let active = true;

    const load = async () => {
      if (!user?.id) {
        setItems([]);
        setError("");
        setLoaded(true);
        return;
      }

      const { data, error: feedError } = await supabase.rpc(
        "gb_recent_activity",
        { p_limit: 8, p_following_only: true }
      );

      if (!active) return;
      if (feedError) {
        setError(feedError.message);
      } else {
        setItems((data || []) as ActivityItem[]);
        setError("");
      }
      setLoaded(true);
    };

    queueMicrotask(() => {
      if (active) void load();
    });
    const refreshTimer = window.setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [loading, user?.id]);

  return (
    <section className="box pf-follow-feed" aria-labelledby="pf-follow-feed-title">
      <div className="box-title pf-follow-feed-title" id="pf-follow-feed-title">
        <span>Following</span>
        <span className="pf-follow-feed-caption">Latest from your follows</span>
      </div>
      <div className="box-body pf-follow-feed-body">
        {!loaded && <p className="pf-follow-feed-message">Loading recent activity...</p>}
        {error && <p className="pf-follow-feed-error" role="alert">Could not load activity: {error}</p>}
        {loaded && !error && !user && (
          <p className="pf-follow-feed-message">Sign in to see updates from players and teams you follow.</p>
        )}
        {loaded && !error && user && items.length === 0 && (
          <p className="pf-follow-feed-message">
            No recent updates from your follows. Follow players and teams to catch their match results and awards.
          </p>
        )}
        {items.length > 0 && (
          <div className="pf-follow-feed-list" aria-label="Recent activity from people and teams you follow">
            {items.map((item) => (
              <article className="pf-follow-feed-item" key={item.id}>
                <div className="pf-follow-feed-meta">
                  <span>{activityLabel(item.kind)}</span>
                  <time dateTime={item.at}>{timeAgo(item.at)}</time>
                </div>
                {item.href ? (
                  <Link className="pf-follow-feed-text" href={item.href}>{item.text}</Link>
                ) : (
                  <p className="pf-follow-feed-text">{item.text}</p>
                )}
              </article>
            ))}
          </div>
        )}
        <Link className="pf-follow-feed-more" href="/activity">View Feed</Link>
      </div>
      <style>{`
        .pf-follow-feed{flex:none;overflow:hidden;border:1px solid #244764;background:linear-gradient(145deg,#0d2132,#07111b);border-radius:8px}
        .pf-follow-feed-title{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;color:#fff;font-size:12px;letter-spacing:.04em}
        .pf-follow-feed-caption{color:#8fa9c2;font-size:9px;font-weight:normal;letter-spacing:0;text-align:right}
        .pf-follow-feed-body{display:flex;flex-direction:column;gap:9px;padding:10px 12px}
        .pf-follow-feed-list{max-height:228px;overflow-y:auto;overscroll-behavior:contain;scrollbar-color:#355774 #08131d;scrollbar-width:thin}
        .pf-follow-feed-item{padding:9px 2px;border-bottom:1px solid #1b3448}
        .pf-follow-feed-item:first-child{padding-top:2px}
        .pf-follow-feed-item:last-child{border-bottom:0}
        .pf-follow-feed-meta{display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;color:#86c9f5;font-size:9px;font-weight:bold;letter-spacing:.05em}
        .pf-follow-feed-meta time{flex:none;color:#849caf;font-weight:normal;letter-spacing:0}
        .pf-follow-feed-text{display:block;margin:0;color:#eaf5ff;font-size:11px;line-height:1.45;text-decoration:none;overflow-wrap:anywhere}
        a.pf-follow-feed-text:hover{color:#f2c14e}
        .pf-follow-feed-message,.pf-follow-feed-error{margin:0;color:#a8bfd1;font-size:11px;line-height:1.5}
        .pf-follow-feed-error{color:#ffb3b3}
        .pf-follow-feed-more{display:block;padding:9px 10px;border:1px solid #315b7d;border-radius:5px;background:#0a1a28;color:#c5e5fb;font-size:10px;font-weight:bold;text-align:center;text-decoration:none;transition:background .15s,border-color .15s}
        .pf-follow-feed-more:hover{border-color:#82c9f6;background:#10273a;color:#fff}
        .pf-follow-feed-more:focus-visible{outline:2px solid #f2c14e;outline-offset:2px}
      `}</style>
    </section>
  );
}
