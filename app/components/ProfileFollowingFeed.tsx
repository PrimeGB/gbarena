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
  const [activeIndex, setActiveIndex] = useState(0);
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
        setActiveIndex(0);
        setError("");
      }
      setLoaded(true);
    };

    queueMicrotask(() => {
      if (!active) return;
      void load();
    });
    const refreshTimer = window.setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [loading, user?.id]);

  useEffect(() => {
    if (items.length < 2) return;
    const rotateTimer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
    }, 7_000);
    return () => window.clearInterval(rotateTimer);
  }, [items.length]);

  const item = items[activeIndex];

  return (
    <section className="box pf-follow-feed" aria-labelledby="pf-follow-feed-title">
      <div className="box-title pf-follow-feed-title" id="pf-follow-feed-title">
        <span>Following Activity</span>
        {items.length > 1 && (
          <span className="pf-follow-feed-position" aria-label={`Update ${activeIndex + 1} of ${items.length}`}>
            {activeIndex + 1}/{items.length}
          </span>
        )}
      </div>
      <div className="box-body pf-follow-feed-body" aria-live="polite">
        {!loaded && <p className="pf-follow-feed-message">Loading recent activity...</p>}
        {error && <p className="pf-follow-feed-error" role="alert">Could not load activity: {error}</p>}
        {loaded && !error && !user && (
          <p className="pf-follow-feed-message">Sign in to see updates from players and teams you follow.</p>
        )}
        {loaded && !error && user && !item && (
          <p className="pf-follow-feed-message">
            No recent updates from your follows. Follow players and teams to catch their match results and awards.
          </p>
        )}
        {item && (
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
        )}
        <Link className="pf-follow-feed-more" href="/activity">View community feed</Link>
      </div>
      <style>{`
        .pf-follow-feed{flex:none}
        .pf-follow-feed-title{justify-content:space-between;padding-right:9px}
        .pf-follow-feed-position{color:#8fa9c2;font-size:10px;font-weight:normal}
        .pf-follow-feed-body{display:flex;flex-direction:column;min-height:96px}
        .pf-follow-feed-message{margin:0;color:#a8bfd1;font-size:11px;line-height:1.5}
        .pf-follow-feed-error{margin:0;color:#ffb3b3;font-size:11px;line-height:1.5}
        .pf-follow-feed-item{min-height:58px}
        .pf-follow-feed-meta{display:flex;justify-content:space-between;gap:8px;margin-bottom:5px;color:#8fa9c2;font-size:9px;font-weight:bold;letter-spacing:.04em}
        .pf-follow-feed-meta time{flex:none;color:#849caf;font-weight:normal;letter-spacing:0}
        .pf-follow-feed-text{display:block;margin:0;color:#eaf5ff;font-size:11px;line-height:1.45;text-decoration:none;overflow-wrap:anywhere}
        a.pf-follow-feed-text:hover{color:#f2c14e}
        .pf-follow-feed-more{display:block;margin-top:8px;padding-top:7px;border-top:1px solid #172d40;color:#b9dfff;font-size:10px;font-weight:bold;text-align:center;text-decoration:none}
        .pf-follow-feed-more:hover{color:#f2c14e}
      `}</style>
    </section>
  );
}
