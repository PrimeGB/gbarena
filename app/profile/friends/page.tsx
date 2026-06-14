"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";

type AppUser = {
  id: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
};

type FriendRequest = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
};

export default function FriendsPage() {
  const { user, loading } = useUser();
  const currentUser = user as AppUser | null;

  const [friends, setFriends] = useState<ProfileRow[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFriends() {
    if (!currentUser?.id) {
      setPageLoading(false);
      return;
    }

    setError("");

    const { data: requests, error: requestError } = await supabase
      .from("friend_requests")
      .select("*")
      .or(`requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: false });

    if (requestError) {
      setError(requestError.message);
      setPageLoading(false);
      return;
    }

    const allRequests = (requests || []) as FriendRequest[];

    const accepted = allRequests.filter((request) => request.status === "accepted");
    const pendingReceived = allRequests.filter(
      (request) =>
        request.status === "pending" && request.recipient_id === currentUser.id
    );

    const profileIds = Array.from(
      new Set(
        allRequests.flatMap((request) => [
          request.requester_id,
          request.recipient_id,
        ])
      )
    ).filter((id) => id !== currentUser.id);

    let profileMap: Record<string, ProfileRow> = {};

    if (profileIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", profileIds);

      profileMap = ((profileData || []) as ProfileRow[]).reduce(
        (map, profile) => {
          map[profile.id] = profile;
          return map;
        },
        {} as Record<string, ProfileRow>
      );
    }

    const friendRows = accepted
      .map((request) => {
        const friendId =
          request.requester_id === currentUser.id
            ? request.recipient_id
            : request.requester_id;

        return profileMap[friendId];
      })
      .filter(Boolean) as ProfileRow[];

    setProfiles(profileMap);
    setFriends(friendRows);
    setPending(pendingReceived);
    setPageLoading(false);
  }

  useEffect(() => {
    if (!loading) loadFriends();
  }, [loading, currentUser?.id]);

  async function respond(requestId: string, status: "accepted" | "declined") {
    if (!currentUser?.id) return;

    await supabase
      .from("friend_requests")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("recipient_id", currentUser.id);

    await loadFriends();
  }

  if (loading || pageLoading) {
    return <div className="loading">Loading friends...</div>;
  }

  if (!currentUser) {
    return <div className="loading">You must be logged in.</div>;
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        a{text-decoration:none;}
        button{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .loading{
          min-height:100vh;
          background:#000;
          color:#fff;
          padding:30px;
        }

        .page{
          min-height:100vh;
          background:linear-gradient(to bottom,#02060a,#000);
          padding:30px 20px;
        }

        .wrap{
          width:1040px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #315f88;
          box-shadow:0 0 18px rgba(0,80,140,.25), inset 0 0 18px rgba(0,0,0,.65);
        }

        .top-strip{
          height:30px;
          background:linear-gradient(to bottom,#8b0000,#3b0000);
          border-bottom:1px solid #b32222;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          gap:18px;
          padding:0 14px;
        }

        .top-strip a{
          color:#fff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .header{
          min-height:92px;
          background:linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 22px;
        }

        .header h1{
          color:#f2c14e;
          font-size:34px;
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
        }

        .header p{
          color:#cfe2f2;
          font-size:13px;
          margin-top:6px;
          font-weight:900;
          text-transform:uppercase;
        }

        .nav{
          height:34px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          padding:0 12px;
          gap:4px;
        }

        .nav a{
          height:26px;
          padding:6px 10px 0;
          background:#0b1d2c;
          border:1px solid #244b70;
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .nav a.active{
          background:#15324b;
          color:#f2c14e;
          border-color:#2f6f9f;
        }

        .content{
          padding:14px;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:14px;
        }

        .panel{
          border:1px solid #244b70;
          background:#050b12;
          min-height:360px;
        }

        .panel-title{
          height:34px;
          background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:1px;
        }

        .list{
          padding:10px;
        }

        .row{
          border:1px solid rgba(255,255,255,.08);
          background:linear-gradient(to bottom,#071827,#030910);
          margin-bottom:8px;
          padding:10px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        }

        .name{
          color:#7fc7ff;
          font-size:14px;
          font-weight:900;
          text-transform:uppercase;
        }

        .sub{
          color:#cfe2f2;
          font-size:11px;
          margin-top:4px;
          text-transform:uppercase;
        }

        .btns{
          display:flex;
          gap:8px;
        }

        .btn{
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
          padding:8px 12px;
          cursor:pointer;
        }

        .accept{
          border-color:#27b45f;
          background:linear-gradient(to bottom,#248c4d,#0d351e);
        }

        .decline{
          border-color:#d34a4a;
          background:linear-gradient(to bottom,#9c2626,#3b0909);
        }

        .empty,.error{
          padding:34px 12px;
          color:#cfe2f2;
          text-align:center;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          line-height:20px;
        }

        .error{color:#ff9c9c;}

        .footer{
          height:36px;
          background:#07111b;
          border-top:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:11px;
        }
      `}</style>

      <main className="page">
        <div className="wrap">
          <div className="top-strip">
            <a href="/home">Home</a>
            <a href="/profile">My Profile</a>
            <a href="/profile/inbox">Inbox</a>
          </div>

          <header className="header">
            <div>
              <h1>Friends</h1>
              <p>View friends and respond to friend requests</p>
            </div>
          </header>

          <nav className="nav">
            <a href="/profile">Profile</a>
            <a className="active" href="/profile/friends">Friends</a>
            <a href="/profile/teams">Teams</a>
            <a href="/profile/awards">Awards</a>
            <a href="/profile/inbox">Inbox</a>
          </nav>

          {error ? (
            <div className="error">{error}</div>
          ) : (
            <section className="content">
              <div className="panel">
                <div className="panel-title">My Friends</div>

                <div className="list">
                  {friends.length === 0 ? (
                    <div className="empty">No friends added yet.</div>
                  ) : (
                    friends.map((friend) => (
                      <div className="row" key={friend.id}>
                        <div>
                          <div className="name">{friend.username || "Unknown Player"}</div>
                          <div className="sub">GameBattles Friend</div>
                        </div>

                        <a className="btn" href={`/profile?userId=${friend.id}`}>
                          View
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Friend Requests</div>

                <div className="list">
                  {pending.length === 0 ? (
                    <div className="empty">No pending friend requests.</div>
                  ) : (
                    pending.map((request) => {
                      const requester = profiles[request.requester_id];

                      return (
                        <div className="row" key={request.id}>
                          <div>
                            <div className="name">
                              {requester?.username || "Unknown Player"}
                            </div>
                            <div className="sub">Wants to add you</div>
                          </div>

                          <div className="btns">
                            <button
                              className="btn accept"
                              type="button"
                              onClick={() => respond(request.id, "accepted")}
                            >
                              Accept
                            </button>

                            <button
                              className="btn decline"
                              type="button"
                              onClick={() => respond(request.id, "declined")}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          )}

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}