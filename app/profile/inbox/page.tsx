"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";

type AppUser = {
  id: string;
  email?: string | null;
};

type MessageRow = {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  sender_type: string;
  subject: string;
  body: string;
  message_type: string;
  related_type?: string | null;
  related_id?: string | null;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
};

function senderName(message: MessageRow) {
  if (message.sender_type === "system") return "GameBattles";
  if (message.sender_type === "staff") return "Staff";
  return "User";
}

function senderClass(message: MessageRow) {
  if (message.sender_type === "system") return "sender-system";
  if (message.sender_type === "staff") return "sender-staff";
  return "sender-user";
}

function canReply(message: MessageRow | null) {
  if (!message) return false;
  if (message.sender_type === "system") return false;
  if (!message.sender_id) return false;
  return true;
}

export default function InboxPage() {
  const { user, loading } = useUser();
  const currentUser = user as AppUser | null;
  const loadedOnce = useRef(false);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selected, setSelected] = useState<MessageRow | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadInbox() {
      if (loadedOnce.current) return;
      loadedOnce.current = true;

      if (!currentUser?.id) {
        setPageLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", currentUser.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setMessages([]);
      } else {
        setMessages((data || []) as MessageRow[]);
      }

      setPageLoading(false);
    }

    if (!loading) loadInbox();
  }, [loading, currentUser?.id]);

  async function openMessage(message: MessageRow) {
    setSelected(message);
    setReplyOpen(false);
    setReplyBody("");
    setNotice("");

    if (!message.is_read && currentUser?.id) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", message.id)
        .eq("recipient_id", currentUser.id);

      setMessages((old) =>
        old.map((item) =>
          item.id === message.id ? { ...item, is_read: true } : item
        )
      );
    }
  }

  async function sendReply() {
    if (!currentUser?.id || !selected?.sender_id || !replyBody.trim()) return;

    setSendingReply(true);
    setNotice("");

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      recipient_id: selected.sender_id,
      sender_type: "player",
      subject: `RE: ${selected.subject}`,
      body: replyBody.trim(),
      message_type: "player",
      is_read: false,
      is_archived: false,
    });

    setSendingReply(false);

    if (error) {
      setNotice("Reply could not be sent.");
      return;
    }

    setReplyBody("");
    setReplyOpen(false);
    setNotice("Reply sent.");
  }

  async function respondToFriendRequest(status: "accepted" | "declined") {
    if (!currentUser?.id || !selected?.related_id) return;

    setNotice("");

    const { error } = await supabase
      .from("friend_requests")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", selected.related_id)
      .eq("recipient_id", currentUser.id);

    if (error) {
      setNotice("Friend request could not be updated.");
      return;
    }

    await supabase
      .from("messages")
      .update({ is_archived: true })
      .eq("id", selected.id)
      .eq("recipient_id", currentUser.id);

    setMessages((old) => old.filter((message) => message.id !== selected.id));
    setSelected(null);
    setNotice(status === "accepted" ? "Friend request accepted." : "Friend request declined.");
  }

  if (loading || pageLoading) {
    return <div className="inbox-loading">Loading inbox...</div>;
  }

  if (!currentUser) {
    return <div className="inbox-loading">You must be logged in to view inbox.</div>;
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        html,body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}
        button,textarea{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .inbox-loading{
          min-height:100vh;
          background:#000;
          color:#fff;
          padding:30px;
        }

        .page{
          min-height:100vh;
          background:
            radial-gradient(circle at top,rgba(45,100,150,.14),transparent 42%),
            linear-gradient(to bottom,#02060a,#000);
          padding:30px 20px;
        }

        .wrap{
          max-width:1040px;
          margin:0 auto;
          border:1px solid #315f88;
          background:#07111b;
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

        .title h1{
          color:#f2c14e;
          font-size:34px;
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
        }

        .title p{
          color:#cfe2f2;
          font-size:13px;
          margin-top:6px;
          font-weight:900;
          text-transform:uppercase;
        }

        .badge{
          border:1px solid #6ba8d6;
          background:linear-gradient(to bottom,#214765,#0b1c2d);
          color:#f5f8ff;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          padding:12px 18px;
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
          grid-template-columns:380px 1fr;
          gap:14px;
        }

        .panel{
          border:1px solid #244b70;
          background:#050b12;
          min-height:430px;
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

        .message-list{
          padding:10px;
        }

        .message-row{
          border:1px solid rgba(255,255,255,.08);
          background:linear-gradient(to bottom,#071827,#030910);
          margin-bottom:8px;
          padding:9px;
          cursor:pointer;
        }

        .message-row:hover{
          border-color:#d7ad4a;
          background:linear-gradient(to bottom,#0c253b,#06101a);
        }

        .message-row.unread{
          border-color:#4b95d8;
          box-shadow:inset 3px 0 0 #d7ad4a;
        }

        .message-subject{
          color:#7fc7ff;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
        }

        .message-meta{
          font-size:11px;
          margin-top:5px;
          font-weight:900;
          text-transform:uppercase;
        }

        .sender-system{color:#f2c14e;}
        .sender-user{color:#5fa8ff;}
        .sender-staff{color:#ff8b3d;}

        .message-preview{
          color:#cfe2f2;
          font-size:12px;
          line-height:17px;
          margin-top:5px;
          max-height:34px;
          overflow:hidden;
        }

        .reader{
          padding:14px;
        }

        .reader-subject{
          color:#7fc7ff;
          font-size:18px;
          font-weight:900;
          text-transform:uppercase;
          border-bottom:1px solid #244b70;
          padding-bottom:10px;
          margin-bottom:10px;
        }

        .reader-meta{
          font-size:12px;
          line-height:20px;
          border-bottom:1px solid #172d40;
          padding-bottom:10px;
          margin-bottom:12px;
          font-weight:900;
          text-transform:uppercase;
        }

        .reader-body{
          color:#d7e2ee;
          font-size:13px;
          line-height:21px;
          white-space:pre-wrap;
          min-height:180px;
        }

        .reader-actions{
          margin-top:14px;
          display:flex;
          gap:8px;
          align-items:center;
        }

        .reply-btn{
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          padding:9px 16px;
          cursor:pointer;
        }

        .accept-btn{
          border-color:#27b45f;
          background:linear-gradient(to bottom,#248c4d,#0d351e);
        }

        .decline-btn{
          border-color:#d34a4a;
          background:linear-gradient(to bottom,#9c2626,#3b0909);
        }

        .reply-box{
          margin-top:12px;
          border-top:1px solid #172d40;
          padding-top:12px;
        }

        .reply-box textarea{
          width:100%;
          min-height:120px;
          background:#02070c;
          border:1px solid #315b7d;
          color:#fff;
          padding:10px;
          resize:vertical;
          font-size:13px;
          line-height:19px;
        }

        .notice{
          color:#8cff9d;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          margin-top:10px;
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
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
          </div>

          <header className="header">
            <div className="title">
              <h1>Inbox</h1>
              <p>Messages, friend requests, staff notices, and site alerts</p>
            </div>

            <div className="badge">
              {messages.filter((message) => !message.is_read).length} Unread
            </div>
          </header>

          <nav className="nav">
            <a href="/profile">Profile</a>
            <a href="/profile/teams">Teams</a>
            <a href="/profile/friends">Friends</a>
            <a href="/profile/matches">Matches</a>
            <a href="/profile/awards">Awards</a>
            <a href="/profile/photos">Photos</a>
            <a className="active" href="/profile/inbox">Inbox</a>
          </nav>

          {error ? (
            <div className="error">{error}</div>
          ) : (
            <section className="content">
              <div className="panel">
                <div className="panel-title">Received Messages</div>

                <div className="message-list">
                  {messages.length === 0 ? (
                    <div className="empty">No messages in your inbox.</div>
                  ) : (
                    messages.map((message) => (
                      <div
                        className={message.is_read ? "message-row" : "message-row unread"}
                        key={message.id}
                        onClick={() => openMessage(message)}
                      >
                        <div className="message-subject">{message.subject}</div>

                        <div className={`message-meta ${senderClass(message)}`}>
                          From: {senderName(message)}
                        </div>

                        <div className="message-preview">{message.body}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Message Details</div>

                {!selected ? (
                  <div className="empty">Select a message to read it.</div>
                ) : (
                  <div className="reader">
                    <div className="reader-subject">{selected.subject}</div>

                    <div className={`reader-meta ${senderClass(selected)}`}>
                      Sent By: {senderName(selected)}
                    </div>

                    <div className="reader-body">{selected.body}</div>

                    {selected.related_type === "friend_request" && selected.related_id && (
                      <div className="reader-actions">
                        <button
                          className="reply-btn accept-btn"
                          type="button"
                          onClick={() => respondToFriendRequest("accepted")}
                        >
                          Accept
                        </button>

                        <button
                          className="reply-btn decline-btn"
                          type="button"
                          onClick={() => respondToFriendRequest("declined")}
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {canReply(selected) && (
                      <div className="reader-actions">
                        <button
                          className="reply-btn"
                          type="button"
                          onClick={() => setReplyOpen(!replyOpen)}
                        >
                          Reply
                        </button>
                      </div>
                    )}

                    {replyOpen && canReply(selected) && (
                      <div className="reply-box">
                        <textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder="Type your reply..."
                        />

                        <div className="reader-actions">
                          <button
                            className="reply-btn"
                            type="button"
                            disabled={sendingReply}
                            onClick={sendReply}
                          >
                            {sendingReply ? "Sending..." : "Send Reply"}
                          </button>
                        </div>
                      </div>
                    )}

                    {notice && <div className="notice">{notice}</div>}
                  </div>
                )}
              </div>
            </section>
          )}

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}