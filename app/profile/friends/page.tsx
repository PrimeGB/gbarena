"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";

type Player = { id: string; username: string | null; avatar_url: string | null };
type FriendRequest = { id: string; requester_id: string };
type FriendList = { username: string | null; private: boolean; friends?: Player[] };
type Loaded = { userId: string; list: FriendList; pending: FriendRequest[]; requesters: Player[] };

function Avatar({ player }: { player: Player }) {
  const name = player.username || "Unknown Player";
  return (
    <div className="friends-avatar">
      {player.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.avatar_url} alt="" />
      ) : name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function FriendsContent() {
  const { user, loading } = useUser();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("userId") || "";
  const viewedId = requestedId || user?.id || "";
  const isOwn = !!user && user.id === viewedId;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<{ userId: string; message: string } | null>(null);
  const [busy, setBusy] = useState("");

  const loadFriends = useCallback(async (isActive: () => boolean = () => true) => {
    if (!viewedId) return;
    const { data, error: listError } = await supabase.rpc("gb_profile_friends", { p_user: viewedId });
    if (!isActive()) return;
    if (listError || !data) {
      setError({ userId: viewedId, message: listError ? `Friends could not be loaded: ${listError.message}` : "Player profile not found." });
      return;
    }

    let pending: FriendRequest[] = [];
    let requesters: Player[] = [];
    if (isOwn) {
      const { data: requests, error: requestError } = await supabase
        .from("friend_requests")
        .select("id,requester_id")
        .eq("recipient_id", viewedId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (!isActive()) return;
      if (requestError) {
        setError({ userId: viewedId, message: `Friend requests could not be loaded: ${requestError.message}` });
        return;
      }
      pending = requests || [];
      const ids = Array.from(new Set(pending.map((request) => request.requester_id)));
      if (ids.length) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles").select("id,username,avatar_url").in("id", ids);
        if (!isActive()) return;
        if (profilesError) {
          setError({ userId: viewedId, message: `Friend request profiles could not be loaded: ${profilesError.message}` });
          return;
        }
        requesters = profiles || [];
      }
    }
    setError(null);
    setLoaded({ userId: viewedId, list: data as FriendList, pending, requesters });
  }, [viewedId, isOwn]);

  useEffect(() => {
    if (loading || !viewedId) return;
    let active = true;
    // The state updates in loadFriends happen after the network requests finish.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFriends(() => active);
    return () => { active = false; };
  }, [loading, viewedId, loadFriends]);

  async function respond(requestId: string, status: "accepted" | "declined") {
    if (!user || busy) return;
    setBusy(requestId);
    setError(null);
    const { data: updated, error: updateError } = await supabase.from("friend_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", requestId).eq("recipient_id", user.id).eq("status", "pending")
      .select("id").maybeSingle();
    if (updateError) setError({ userId: viewedId, message: `Friend request could not be updated: ${updateError.message}` });
    else if (!updated) setError({ userId: viewedId, message: "This friend request is no longer pending. Refresh the page to see the latest requests." });
    else await loadFriends();
    setBusy("");
  }

  const current = loaded?.userId === viewedId ? loaded : null;
  const currentError = error?.userId === viewedId ? error.message : "";
  const friends = current?.list.friends || [];
  const backHref = requestedId ? `/profile?userId=${encodeURIComponent(requestedId)}` : "/profile";

  return (
    <main className="friends-page">
      <style>{`
        .friends-page{min-height:100vh;padding:28px 16px 60px;background:radial-gradient(circle at top,#123654,#02060a 55%);color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .friends-shell{max-width:1000px;margin:auto}.friends-back{color:#8ac6f5;text-decoration:none;font-size:13px}
        .friends-heading{display:flex;justify-content:space-between;align-items:end;gap:12px;flex-wrap:wrap;margin:20px 0}
        .friends-heading h1{margin:0;color:#fff;font-size:28px}.friends-heading p{margin:7px 0 0;color:#a9c3db;font-size:13px;line-height:1.5}
        .friends-count{padding:7px 11px;background:#102b41;border:1px solid #315f88;border-radius:20px;color:#d7eaff;font-size:12px;font-weight:bold}
        .friends-section{margin:14px 0;border:1px solid #315f88;background:#07111b}.friends-section h2{margin:0;padding:11px 15px;background:linear-gradient(to bottom,#1f4c73,#0b2438);color:#f2c14e;font-size:13px;text-transform:uppercase}
        .friends-body{padding:16px}.friends-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:12px}
        .friends-card{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid #244b70;border-radius:9px;background:linear-gradient(145deg,#10263a,#050b12);min-width:0}
        .friends-avatar{display:flex;align-items:center;justify-content:center;flex:none;width:52px;height:52px;overflow:hidden;border:1px solid #4d93c7;border-radius:10px;background:#173b59;color:#f2c14e;font-size:17px;font-weight:bold}
        .friends-avatar img{width:100%;height:100%;object-fit:cover}.friends-info{min-width:0;flex:1}.friends-name{color:#fff;font-size:15px;font-weight:bold;overflow-wrap:anywhere}
        .friends-link{display:inline-block;margin-top:8px;color:#8ac6f5;font-size:12px;text-decoration:none}.friends-link:hover,.friends-back:hover{text-decoration:underline}
        .friends-empty{margin:0;color:#a9c3db;font-size:13px;line-height:1.6}.friends-error{padding:12px;border:1px solid #a83e3e;color:#ffd5d5}
        .friends-requests{display:grid;gap:10px}.friends-request-actions{display:flex;gap:6px;flex-wrap:wrap}.friends-button{padding:8px 10px;border:1px solid #4d93c7;background:#173b59;color:#fff;font-weight:bold;cursor:pointer}.friends-button:disabled{opacity:.55;cursor:not-allowed}.friends-decline{border-color:#a44c4c;background:#512020}
        @media(max-width:500px){.friends-page{padding:20px 12px 50px}.friends-card{flex-wrap:wrap}.friends-heading h1{font-size:24px}}
      `}</style>
      <div className="friends-shell">
        <Link className="friends-back" href={backHref}>Back to profile</Link>
        <div className="friends-heading">
          <div>
            <h1>{isOwn ? "My Friends" : current?.list.username ? `${current.list.username}'s Friends` : "Friends"}</h1>
            <p>{isOwn ? "Your friends and incoming requests, all in one place." : "Friends connected to this player."}</p>
          </div>
          {current && !current.list.private && <span className="friends-count">{friends.length} {friends.length === 1 ? "friend" : "friends"}</span>}
        </div>
        {currentError && <p className="friends-error" role="alert">{currentError}</p>}
        {loading || (viewedId && !current && !currentError) ? <p className="friends-empty" role="status">Loading friends...</p>
          : !viewedId ? <p className="friends-empty">Sign in to view your friends. <Link className="friends-back" href="/login">Sign in</Link></p>
          : current?.list.private ? <section className="friends-section"><h2>Friends</h2><div className="friends-body"><p className="friends-empty">This friends list is private.</p></div></section>
          : current && <>
            <section className="friends-section">
              <h2>Friends</h2>
              <div className="friends-body">
                {friends.length === 0 ? <p className="friends-empty">No friends added yet.</p> :
                  <div className="friends-grid">{friends.map((friend) => <article className="friends-card" key={friend.id}>
                    <Avatar player={friend} /><div className="friends-info"><div className="friends-name">{friend.username || "Unknown Player"}</div><Link className="friends-link" href={`/profile?userId=${encodeURIComponent(friend.id)}`}>View profile</Link></div>
                  </article>)}</div>}
              </div>
            </section>
            {isOwn && <section className="friends-section"><h2>Friend Requests ({current.pending.length})</h2><div className="friends-body">
              {current.pending.length === 0 ? <p className="friends-empty">No pending friend requests.</p> :
                <div className="friends-requests">{current.pending.map((request) => {
                  const player = current.requesters.find((item) => item.id === request.requester_id) || { id: request.requester_id, username: null, avatar_url: null };
                  return <article className="friends-card" key={request.id}><Avatar player={player} /><div className="friends-info"><div className="friends-name">{player.username || "Unknown Player"}</div><Link className="friends-link" href={`/profile?userId=${encodeURIComponent(player.id)}`}>View profile</Link></div><div className="friends-request-actions">
                    <button className="friends-button" disabled={!!busy} onClick={() => void respond(request.id, "accepted")}>Accept</button>
                    <button className="friends-button friends-decline" disabled={!!busy} onClick={() => void respond(request.id, "declined")}>Decline</button>
                  </div></article>;
                })}</div>}
            </div></section>}
          </>}
      </div>
    </main>
  );
}

export default function FriendsPage() {
  return <Suspense fallback={<div>Loading friends...</div>}><FriendsContent /></Suspense>;
}
