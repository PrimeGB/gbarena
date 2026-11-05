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
};

type Reaction = {
  count: number;
  reacted: boolean;
};

type ReactionSummary = Record<string, Record<string, Reaction>>;
type FollowTarget = { target_type: "player" | "team"; target_id: string };

const REACTIONS = [
  { key: "gg", label: "GG", icon: "👏" },
  { key: "fire", label: "Fire", icon: "🔥" },
  { key: "heart", label: "Love", icon: "💙" },
] as const;

export default function ActivityPage() {
  const { user, loading: authLoading } = useUser();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [reactions, setReactions] = useState<ReactionSummary>({});
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [followingOnly, setFollowingOnly] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    const [{ data, error: feedError }, { data: followData, error: followsError }] =
      await Promise.all([
        supabase.rpc("gb_recent_activity", {
          p_limit: 50,
          p_following_only: followingOnly,
        }),
        user
          ? supabase
              .from("community_follows")
              .select("target_type,target_id")
              .eq("follower_id", user.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (feedError) {
      setError(feedError.message);
      setItems([]);
      setLoaded(true);
      return;
    }
    if (followsError) {
      setError(followsError.message);
      setItems([]);
      setLoaded(true);
      return;
    }

    const nextItems = (data || []) as ActivityItem[];
    setItems(nextItems);
    setFollows(
      new Set(
        ((followData || []) as FollowTarget[]).map(
          (follow) => `${follow.target_type}:${follow.target_id}`
        )
      )
    );

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
  }, [followingOnly, user]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [authLoading, load]);

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

  async function toggleFollow(type: "player" | "team", id: string) {
    if (!user) {
      setError("Sign in to follow players and teams.");
      return;
    }
    const key = `${type}:${id}`;
    setBusy(key);
    setError("");
    const { data, error: actionError } = await supabase.rpc(
      "gb_toggle_community_follow",
      { p_target_type: type, p_target_id: id }
    );
    setBusy(null);
    if (actionError) {
      setError(actionError.message);
      return;
    }
    setFollows((current) => {
      const next = new Set(current);
      if (data) next.add(key);
      else next.delete(key);
      return next;
    });
    if (followingOnly) await load();
    setNotice(data ? `Following ${type}.` : `Unfollowed ${type}.`);
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
        .community-page{min-height:100vh;background:#03070b;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;padding:24px 14px 60px}
        .community-wrap{max-width:920px;margin:0 auto}
        .community-nav{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
        .community-nav a{color:#b9dfff;font-size:12px;font-weight:800;text-decoration:none}
        .community-hero,.community-feed{border:1px solid #244764;background:linear-gradient(145deg,#0d2132,#07111b);border-radius:12px;overflow:hidden}
        .community-hero{padding:22px;margin-bottom:14px}
        .community-kicker{color:#8ed1ff;font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
        .community-hero h1{margin:8px 0;color:#fff;font-size:clamp(25px,6vw,36px)}
        .community-hero p{margin:0;color:#a8bfd1;font-size:14px;line-height:1.55}
        .community-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
        .community-actions a{padding:11px 15px;border-radius:7px;background:#d5a92f;color:#101010;font-size:12px;font-weight:900;text-decoration:none}
        .community-actions a.secondary{border:1px solid #3c7198;background:#0b1c2a;color:#d7eaff}
        .community-feed-head{padding:16px 18px;border-bottom:1px solid #23415a;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .community-feed-head h2{margin:0;color:#f2c14e;font-size:15px;text-transform:uppercase}
        .community-tabs{display:flex;gap:6px}
        .community-tabs button,.community-follow,.community-share,.community-reaction{min-height:36px;border:1px solid #355774;border-radius:7px;background:#0a1a28;color:#d7eaff;font:700 12px Tahoma;cursor:pointer}
        .community-tabs button{padding:7px 12px}
        .community-tabs button[aria-pressed="true"],.community-reaction[aria-pressed="true"]{border-color:#f2c14e;background:#2b2412;color:#ffe9a8}
        .community-item{padding:16px 18px;border-bottom:1px solid #172e41}
        .community-item:last-child{border-bottom:0}
        .community-item-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
        .community-item-link{color:#eaf5ff;font-size:14px;font-weight:700;line-height:1.5;text-decoration:none}
        .community-time{flex:none;color:#849caf;font-size:11px}
        .community-controls{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:12px}
        .community-follow,.community-share,.community-reaction{padding:7px 10px}
        .community-follow{border-color:#336a91;color:#a9d8ff}
        .community-share{color:#d7e2ee}
        .community-empty,.community-message{padding:20px;color:#a8bfd1;font-size:13px;line-height:1.6}
        .community-message.error{color:#ffb3b3}
        .community-message.notice{color:#8ff0b2}
        @media(max-width:520px){.community-page{padding:14px 10px 40px}.community-hero{padding:17px}.community-item{padding:14px}.community-item-top{display:block}.community-time{display:block;margin-top:7px}.community-feed-head{align-items:flex-start}.community-feed-head h2{width:100%}.community-actions a{flex:1;text-align:center}}
      `}</style>

      <div className="community-wrap">
        <nav className="community-nav" aria-label="Community navigation">
          <Link href="/home">Home</Link>
          <Link href="/tournaments">Tournaments</Link>
          <Link href="/forums">Forums</Link>
          <Link href="/teams/top">Leaderboards</Link>
        </nav>
        <section className="community-hero">
          <div className="community-kicker">The GameBattles community</div>
          <h1>Every win has a story.</h1>
          <p>Follow the teams and players you care about, celebrate big moments, and share the rivalry.</p>
          <div className="community-actions">
            <Link href="/tournaments">Find your next cup</Link>
            <Link className="secondary" href="/getting-started">New here? Get started</Link>
          </div>
        </section>

        <section className="community-feed" aria-labelledby="community-feed-title">
          <div className="community-feed-head">
            <h2 id="community-feed-title">Live community feed</h2>
            <div className="community-tabs" role="group" aria-label="Activity feed">
              <button type="button" aria-pressed={!followingOnly} onClick={() => setFollowingOnly(false)}>Everyone</button>
              <button
                type="button"
                aria-pressed={followingOnly}
                onClick={() => {
                  if (!user) {
                    setError("Sign in to see activity from people and teams you follow.");
                    return;
                  }
                  setFollowingOnly(true);
                }}
              >
                Following
              </button>
            </div>
          </div>
          {error && <div className="community-message error" role="alert">{error}</div>}
          {notice && <div className="community-message notice" role="status">{notice}</div>}
          {!loaded && <div className="community-empty">Loading community activity...</div>}
          {loaded && items.length === 0 && (
            <div className="community-empty">
              {followingOnly
                ? "No activity from your follows yet. Follow a team or player from the public feed."
                : "No new moments yet. Join a cup, play a match, and be the first to light up the feed."}
            </div>
          )}
          {items.map((item) => (
            <article className="community-item" key={item.id}>
              <div className="community-item-top">
                {item.href
                  ? <Link className="community-item-link" href={item.href}>{item.text}</Link>
                  : <span className="community-item-link">{item.text}</span>}
                <time className="community-time" dateTime={item.at}>{new Date(item.at).toLocaleString()}</time>
              </div>
              <div className="community-controls">
                {item.team_id && (
                  <button
                    className="community-follow"
                    type="button"
                    disabled={busy === `team:${item.team_id}`}
                    onClick={() => toggleFollow("team", item.team_id!)}
                  >
                    {follows.has(`team:${item.team_id}`) ? "Following team" : "＋ Follow team"}
                  </button>
                )}
                {Array.from(new Set(item.user_ids || (item.user_id ? [item.user_id] : [])))
                  .filter((playerId) => playerId !== user?.id)
                  .map((playerId) => (
                    <button
                      className="community-follow"
                      type="button"
                      key={playerId}
                      disabled={busy === `player:${playerId}`}
                      onClick={() => toggleFollow("player", playerId)}
                    >
                      {follows.has(`player:${playerId}`) ? "Following player" : "＋ Follow player"}
                    </button>
                  ))}
                {REACTIONS.map((reaction) => {
                  const summary = reactions[item.id]?.[reaction.key];
                  const key = `${item.id}:${reaction.key}`;
                  return (
                    <button
                      className="community-reaction"
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
                <button className="community-share" type="button" onClick={() => share(item)}>↗ Share</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
