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
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
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
        {user && <Link className="pf-follow-feed-more" href="/activity">View feed <span aria-hidden="true">→</span></Link>}
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
                {item.href ? (
                  <Link className="pf-follow-feed-text" href={item.href}>{item.text}</Link>
                ) : (
                  <p className="pf-follow-feed-text">{item.text}</p>
                )}
                <div className="pf-follow-feed-meta">
                  <span>{activityLabel(item.kind)}</span>
                  <time dateTime={item.at}>{timeAgo(item.at)}</time>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .pf-follow-feed{flex:none;overflow:hidden;border:1px solid #263b4d;background:#0a1119}
        .pf-follow-feed-title{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;color:#dca541;font-size:12px;letter-spacing:.04em}
        .pf-follow-feed-body{padding:0}
        .pf-follow-feed-list{max-height:228px;overflow-y:auto;overscroll-behavior:contain;scrollbar-color:#355774 #08131d;scrollbar-width:thin}
        .pf-follow-feed-item{padding:9px 10px;border-top:1px solid #1c2b37;background:#0a1119}
        .pf-follow-feed-item:nth-child(even){background:#0d1620}
        .pf-follow-feed-meta{display:flex;justify-content:space-between;gap:8px;margin-top:5px;color:#8193a1;font-size:10px;line-height:1.3}
        .pf-follow-feed-meta time{flex:none}
        .pf-follow-feed-text{display:block;margin:0;color:#d7eaff;font-size:11px;font-weight:bold;line-height:1.4;text-decoration:none;overflow-wrap:anywhere}
        a.pf-follow-feed-text{color:#7fc0ff}
        a.pf-follow-feed-text:hover{color:#fff;text-decoration:underline}
        .pf-follow-feed-message,.pf-follow-feed-error{margin:0;padding:10px;color:#9aabba;font-size:11px;line-height:1.5}
        .pf-follow-feed-error{color:#ffb3b3}
        .pf-follow-feed-more{color:#7fc0ff;font-size:10px;font-weight:bold;letter-spacing:0;text-decoration:none;text-transform:none;white-space:nowrap}
        .pf-follow-feed-more:hover{color:#fff;text-decoration:underline}
        .pf-follow-feed-more:focus-visible,.pf-follow-feed-text:focus-visible{outline:2px solid #f2c14e;outline-offset:2px}
      `}</style>
    </section>
  );
}
