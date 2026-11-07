"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";

type ActivityItem = {
  id: string;
  kind: string;
  text: string;
  href?: string;
  at: string;
  team_id: string | null;
  user_id: string | null;
  user_ids?: string[];
  favorited?: boolean;
};

type Reaction = {
  count: number;
  reacted: boolean;
};

type ReactionSummary = Record<string, Record<string, Reaction>>;
type FeedMode = "feed" | "favorites";

const REACTIONS = [
  { key: "gg", label: "GG", icon: "👏" },
  { key: "fire", label: "Fire", icon: "🔥" },
  { key: "heart", label: "Love", icon: "💙" },
] as const;

function activityLabel(kind: string) {
  if (kind === "match") return "MATCH RESULT";
  if (kind === "award") return "PLAYER AWARD";
  if (kind === "team") return "TEAM UPDATE";
  return "COMMUNITY UPDATE";
}

export default function ActivityPage() {
  const { user, loading: authLoading } = useUser();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [reactions, setReactions] = useState<ReactionSummary>({});
  const [feedMode, setFeedMode] = useState<FeedMode>("feed");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    const { data, error: feedError } = feedMode === "favorites"
      ? await supabase.rpc("gb_user_activity_favorites")
      : await supabase.rpc("gb_recent_activity", {
          p_limit: 50,
          p_following_only: false,
        });

    if (feedError) {
      setError(feedError.message);
      setItems([]);
      setLoaded(true);
      return;
    }

    const nextItems = (data || []) as ActivityItem[];
    setItems(nextItems);

    if (nextItems.length) {
      const { data: summary, error: summaryError } = await supabase.rpc(
        "gb_activity_reaction_summary",
        { p_activity_ids: nextItems.map((item) => item.id) }
      );
      if (summaryError) {
        setError(summaryError.message);
      } else {
        const next: ReactionSummary = {};
        for (const row of (summary || []) as {
          activity_id: string;
          reaction: string;
          count: number;
          reacted: boolean;
        }[]) {
          next[row.activity_id] ||= {};
          next[row.activity_id][row.reaction] = {
            count: Number(row.count),
            reacted: row.reacted,
          };
        }
        setReactions(next);
      }
    } else {
      setReactions({});
    }
    setLoaded(true);
  }, [feedMode]);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [authLoading, load, user]);

  async function toggleReaction(item: ActivityItem, reaction: string) {
    if (!user) {
      setError("Sign in to react to community activity.");
      return;
    }
    const key = `${item.id}:${reaction}`;
    setBusy(key);
    setError("");
    const { error: actionError } = await supabase.rpc(
      "gb_toggle_activity_reaction",
      { p_activity_id: item.id, p_reaction: reaction }
    );
    setBusy(null);
    if (actionError) {
      setError(actionError.message);
      return;
    }
    await load();
  }

  async function toggleFavorite(item: ActivityItem) {
    if (!user) {
      setError("Sign in to save community activity to Favorites.");
      return;
    }
    const key = `favorite:${item.id}`;
    setBusy(key);
    setError("");
    const { data, error: actionError } = await supabase.rpc(
      "gb_toggle_activity_favorite",
      { p_activity_id: item.id }
    );
    setBusy(null);
    if (actionError) {
      setError(actionError.message);
      return;
    }
    setNotice(data ? "Saved to Favorites. It will stay available after 48 hours." : "Removed from Favorites.");
    await load();
  }

  async function share(item: ActivityItem) {
    const url = new URL(item.href || "/activity", window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: "GameBattles community moment", text: item.text, url });
        return;
      }
      await navigator.clipboard.writeText(`${item.text} ${url}`);
      setNotice("Share link copied.");
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setError("Could not share this moment. Copy the page link from your browser instead.");
    }
  }

  return (
    <main className="community-page">
      <style>{`
        .community-page{min-height:100vh;background:#05090e;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;padding:28px 16px 60px}
        .community-wrap{max-width:720px;margin:0 auto}
        .community-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
        .community-nav a{color:#a9c8df;font-size:12px;font-weight:800;text-decoration:none}
        .community-nav a:hover{color:#fff}
        .community-new-here{padding:8px 11px;border:1px solid #28465e;border-radius:6px;background:#0b1722}
        .community-feed,.community-gate{border:1px solid #223c51;background:#0a141e;border-radius:10px;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,.24)}
        .community-feed-head{padding:18px 20px 0;border-bottom:1px solid #1b3041}
        .community-heading-row{display:flex;align-items:center;justify-content:space-between;gap:14px}
        .community-feed-head h1{margin:0;color:#f4f8fc;font-size:22px;letter-spacing:-.02em}
        .community-feed-caption{margin:6px 0 15px;color:#91a9bc;font-size:12px;line-height:1.5}
        .community-tabs{display:flex;gap:22px}
        .community-tabs button{position:relative;padding:0 2px 12px;border:0;background:transparent;color:#9eb2c2;font:700 13px Tahoma;cursor:pointer}
        .community-tabs button[aria-pressed="true"]{color:#fff}
        .community-tabs button[aria-pressed="true"]:after{position:absolute;right:0;bottom:-1px;left:0;height:3px;border-radius:3px 3px 0 0;background:#e6b944;content:""}
        .community-tabs button:focus-visible,.community-control:focus-visible{outline:2px solid #f2c14e;outline-offset:3px}
        .community-item{display:grid;grid-template-columns:38px minmax(0,1fr);gap:12px;padding:17px 20px;border-bottom:1px solid #1b2c3b}
        .community-item:last-child{border-bottom:0}
        .community-kind-icon{display:grid;width:36px;height:36px;place-items:center;border:1px solid #31516a;border-radius:50%;background:#102131;color:#a9dfff;font-size:14px;font-weight:900}
        .community-item-content{min-width:0}
        .community-item-meta{display:flex;align-items:center;gap:8px;margin:1px 0 7px;color:#90a8bb;font-size:10px}
        .community-item-meta strong{color:#c3d5e3;font-size:10px;letter-spacing:.045em}
        .community-item-meta time{margin-left:auto;white-space:nowrap;color:#7f96a8}
        .community-item-link{display:block;color:#eaf2f8;font-size:14px;font-weight:500;line-height:1.55;text-decoration:none;overflow-wrap:anywhere}
        .community-item-link:hover{color:#f5d477}
        .community-controls{display:flex;align-items:center;gap:9px;margin-top:12px}
        .community-control{min-height:30px;padding:5px 9px;border:1px solid transparent;border-radius:5px;background:transparent;color:#91a8ba;font:700 11px Tahoma;cursor:pointer}
        .community-control:hover{border-color:#2b465c;background:#10202e;color:#e4eff7}
        .community-control[aria-pressed="true"]{color:#f2ce68}
        .community-control:disabled{opacity:.55;cursor:wait}
        .community-empty,.community-message{padding:28px 20px;color:#a8bfd1;font-size:13px;line-height:1.6}
        .community-message.error{color:#ffb3b3}
        .community-message.notice{padding:10px 20px;border-bottom:1px solid #1b3041;color:#9ce2b0}
        .community-gate{margin-top:42px;padding:28px}
        .community-gate h1{margin:0 0 8px;color:#fff;font-size:22px}
        .community-gate p{margin:0 0 18px;color:#a8bfd1;font-size:13px;line-height:1.6}
        .community-sign-in{display:inline-flex;padding:10px 15px;border-radius:6px;background:#e2b63e;color:#111;font-size:12px;font-weight:900;text-decoration:none}
        @media(max-width:520px){.community-page{padding:18px 10px 40px}.community-feed-head{padding:15px 14px 0}.community-feed-head h1{font-size:19px}.community-tabs{gap:17px}.community-item{grid-template-columns:32px minmax(0,1fr);gap:9px;padding:14px}.community-kind-icon{width:30px;height:30px;font-size:12px}.community-item-link{font-size:13px}.community-gate{padding:22px}}
      `}</style>

      <div className="community-wrap">
        {!user && !authLoading ? (
          <>
            <nav className="community-nav" aria-label="Community navigation">
              <Link href="/home">Home</Link>
              <Link className="community-new-here" href="/getting-started">New here? Get started</Link>
            </nav>
            <section className="community-gate">
              <h1>Your GameBattles feed</h1>
              <p>Sign in to see recent community updates and your saved favorites.</p>
              <Link className="community-sign-in" href="/login">Sign in</Link>
            </section>
          </>
        ) : authLoading ? (
          <div className="community-gate" role="status">Loading your feed...</div>
        ) : (
          <>
            <nav className="community-nav" aria-label="Community navigation">
              <Link href="/home">Home</Link>
              <Link className="community-new-here" href="/getting-started">New here? Get started</Link>
            </nav>
            <section className="community-feed" aria-labelledby="community-feed-title">
              <div className="community-feed-head">
                <div className="community-heading-row">
                  <h1 id="community-feed-title">GameBattles Feed</h1>
                </div>
                <p className="community-feed-caption">Recent matches, team updates, and community achievements from the last 48 hours.</p>
                <div className="community-tabs" role="group" aria-label="Your activity feed">
                  <button type="button" aria-pressed={feedMode === "feed"} onClick={() => setFeedMode("feed")}>Your Feed</button>
                  <button type="button" aria-pressed={feedMode === "favorites"} onClick={() => setFeedMode("favorites")}>Favorites</button>
                </div>
              </div>
              {error && <div className="community-message error" role="alert">{error}</div>}
              {notice && <div className="community-message notice" role="status">{notice}</div>}
              {!loaded && <div className="community-empty">Loading your feed...</div>}
              {loaded && items.length === 0 && (
                <div className="community-empty">
                  {feedMode === "favorites"
                    ? "No favorites saved yet. Save an update to keep it here after it leaves the feed."
                    : "No updates from the last 48 hours yet. Check back soon for new community activity."}
                </div>
              )}
              {items.map((item) => (
                <article className="community-item" key={item.id}>
                  <div className="community-kind-icon" aria-hidden="true">
                    {item.kind === "match" ? "VS" : item.kind === "award" ? "★" : item.kind === "team" ? "T" : "•"}
                  </div>
                  <div className="community-item-content">
                    <div className="community-item-meta">
                      <strong>{activityLabel(item.kind)}</strong>
                      <span aria-hidden="true">·</span>
                      <time dateTime={item.at}>{new Date(item.at).toLocaleString()}</time>
                    </div>
                    {item.href ? (
                      <Link className="community-item-link" href={item.href}>{item.text}</Link>
                    ) : (
                      <span className="community-item-link">{item.text}</span>
                    )}
                    <div className="community-controls">
                      <button
                        className="community-control"
                        type="button"
                        aria-pressed={item.favorited || false}
                        disabled={busy === `favorite:${item.id}`}
                        onClick={() => toggleFavorite(item)}
                      >
                        {item.favorited ? "★ Saved" : "☆ Save"}
                      </button>
                      {REACTIONS.map((reaction) => {
                        const summary = reactions[item.id]?.[reaction.key];
                        const key = `${item.id}:${reaction.key}`;
                        return (
                          <button
                            className="community-control"
                            type="button"
                            key={reaction.key}
                            aria-label={`${reaction.label}, ${summary?.count || 0} reactions`}
                            aria-pressed={summary?.reacted || false}
                            disabled={busy === key}
                            onClick={() => toggleReaction(item, reaction.key)}
                          >
                            {reaction.icon} {summary?.count || 0}
                          </button>
                        );
                      })}
                      <button className="community-control" type="button" onClick={() => share(item)}>↗ Share</button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
