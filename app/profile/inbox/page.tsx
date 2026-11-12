"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";
import "./inbox.css";

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
  is_saved: boolean;
  created_at: string;
};

type MessageFolder = "inbox" | "saved" | "sent";

function senderName(message: MessageRow, profileNames: Record<string, string>) {
  if (message.sender_type === "system") return "GameBattles";
  if (message.sender_type === "staff") return message.sender_id && profileNames[message.sender_id] ? `${profileNames[message.sender_id]} (Staff)` : "Staff";
  return (message.sender_id && profileNames[message.sender_id]) || "Player";
}

function recipientName(message: MessageRow, profileNames: Record<string, string>) {
  return profileNames[message.recipient_id] || "Player";
}

function messageDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function canReply(message: MessageRow | null) {
  if (!message) return false;
  if (message.sender_type === "system") return false;
  if (!message.sender_id) return false;
  return true;
}

const subscribePreview = () => () => {};
const getPreview = () => process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "1";
const getServerPreview = () => false;
const getComposeRecipient = () => new URLSearchParams(window.location.search).get("recipient") || "";
const getServerComposeRecipient = () => "";
const previewUser: AppUser = { id: "preview-user" };
const previewNames = { "preview-player": "Alex", "preview-staff": "Jordan" };
const previewInbox: MessageRow[] = [
  { id: "preview-1", sender_id: "preview-player", recipient_id: "preview-user", sender_type: "player", subject: "Great games last night", body: "Hey! Those matches were a lot of fun. Let me know if your team is up for another series this weekend.", message_type: "player", is_read: false, is_archived: false, is_saved: false, created_at: "2026-11-12T18:20:00Z" },
  { id: "preview-2", sender_id: "preview-staff", recipient_id: "preview-user", sender_type: "staff", subject: "Your match ticket", body: "Thanks for sending in the details. We've reviewed the evidence and recorded a decision on your ticket.", message_type: "staff", is_read: true, is_archived: false, is_saved: true, created_at: "2026-11-11T15:00:00Z" },
  { id: "preview-3", sender_id: null, recipient_id: "preview-user", sender_type: "system", subject: "You earned an award", body: "Congratulations! A new award was added to your profile.", message_type: "system", is_read: true, is_archived: false, is_saved: false, created_at: "2026-11-10T12:00:00Z" },
];
const previewSent: MessageRow[] = [
  { id: "preview-4", sender_id: "preview-user", recipient_id: "preview-player", sender_type: "player", subject: "Ready for the next match?", body: "Let's find a time that works for both teams.", message_type: "player", is_read: true, is_archived: false, is_saved: false, created_at: "2026-11-09T12:00:00Z" },
];

export default function InboxPage() {
  const { user, loading } = useUser();
  const preview = useSyncExternalStore(subscribePreview, getPreview, getServerPreview);
  const composeRecipient = useSyncExternalStore(subscribePreview, getComposeRecipient, getServerComposeRecipient);
  const currentUser = preview ? previewUser : user as AppUser | null;

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [sentMessages, setSentMessages] = useState<MessageRow[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [folder, setFolder] = useState<MessageFolder>("inbox");
  const [selected, setSelected] = useState<MessageRow | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [sentError, setSentError] = useState("");
  const [nameError, setNameError] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientUsername, setRecipientUsername] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [managingMessage, setManagingMessage] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!composeRecipient || !currentUser?.id || preview) return;
    let active = true;
    async function prepareMessage() {
      const { data: recipient, error: recipientError } = await supabase
        .from("profiles").select("id,username").eq("id", composeRecipient).maybeSingle();
      if (!active) return;
      setComposeOpen(true);
      setSelected(null);
      if (recipientError || !recipient?.username) {
        setRecipientUsername("");
        setNotice(recipientError ? `Recipient could not be loaded: ${recipientError.message}` : "Recipient could not be found. Enter a username to send a message.");
        return;
      }
      setRecipientUsername(recipient.username);
      setNotice("");
    }
    void prepareMessage();
    return () => { active = false; };
  }, [composeRecipient, currentUser?.id, preview]);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      if (preview) {
        setMessages(previewInbox);
        setSentMessages(previewSent);
        setProfileNames(previewNames);
        setError("");
        setSentError("");
        setNameError("");
        setPageLoading(false);
        return;
      }
      if (!currentUser?.id) {
        setMessages([]);
        setSentMessages([]);
        setProfileNames({});
        setSentError("");
        setNameError("");
        setSelected(null);
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      setError("");
      setSentError("");
      setNameError("");

      const [inboxResult, sentResult] = await Promise.all([
        supabase
          .from("messages")
          .select("*")
          .eq("recipient_id", currentUser.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("messages")
          .select("*")
          .eq("sender_id", currentUser.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      const inboxMessages = (inboxResult.data || []) as MessageRow[];
      const outgoingMessages = (sentResult.data || []) as MessageRow[];
      setError(inboxResult.error?.message || "");
      setSentError(sentResult.error?.message || "");
      setMessages(inboxMessages);
      setSentMessages(outgoingMessages);

      const profileIds = [...new Set([
        ...inboxMessages.map((message) => message.sender_id),
        ...outgoingMessages.map((message) => message.recipient_id),
      ].filter((id): id is string => Boolean(id)))];

      if (profileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id,username")
          .in("id", profileIds);

        if (!active) return;
        if (profilesError) {
          setNameError(profilesError.message);
          setPageLoading(false);
          return;
        }

        const names: Record<string, string> = {};
        (profiles || []).forEach((profile) => {
          if (profile.username) names[profile.id] = profile.username;
        });
        setProfileNames(names);
      } else {
        setProfileNames({});
      }

      setPageLoading(false);
    }

    if (preview || !loading) void loadMessages();
    return () => {
      active = false;
    };
  }, [loading, currentUser?.id, preview]);

  async function openMessage(message: MessageRow) {
    setSelected(message);
    setComposeOpen(false);
    setReplyOpen(false);
    setReplyBody("");
    setNotice("");

    if (folder !== "sent" && !message.is_read && currentUser?.id) {
      if (preview) {
        const updatedMessage = { ...message, is_read: true };
        setMessages((old) => old.map((item) => item.id === message.id ? updatedMessage : item));
        setSelected(updatedMessage);
        return;
      }
      const { error: readError } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", message.id)
        .eq("recipient_id", currentUser.id);

      if (readError) {
        setNotice(`Message could not be marked as read: ${readError.message}`);
        return;
      }

      setMessages((old) => old.map((item) => item.id === message.id ? { ...item, is_read: true } : item));
      setSelected((current) => current?.id === message.id ? { ...current, is_read: true } : current);
    }
  }

  async function saveMessage(message: MessageRow) {
    if (managingMessage) return;
    const saved = !message.is_saved;
    const expired = Date.now() - new Date(message.created_at).getTime() >= 60 * 24 * 60 * 60 * 1000;
    if (!saved && expired
      && !window.confirm("This message is over 60 days old and will be removed if you unsave it. Continue?")) return;
    setManagingMessage(true);
    setNotice("");
    let removed = !saved && expired;
    if (!preview) {
      const { data, error: saveError } = await supabase.rpc("gb_save_inbox_message", { p_message_id: message.id, p_saved: saved });
      if (saveError || !data || typeof data.removed !== "boolean") {
        setNotice(`Message could not be updated: ${saveError?.message || "Unexpected server response."}`);
        setManagingMessage(false);
        return;
      }
      removed = data.removed;
    }
    setMessages((old) => removed ? old.filter((item) => item.id !== message.id) : old.map((item) => item.id === message.id ? { ...item, is_saved: saved } : item));
    setSelected((current) => current?.id === message.id ? (removed || (!saved && folder === "saved") ? null : { ...current, is_saved: saved }) : current);
    setNotice(preview ? "Preview only: no message was changed." : removed ? "Message removed from your inbox." : saved ? "Message saved." : "Message removed from Saved.");
    setManagingMessage(false);
  }

  async function deleteMessage(message: MessageRow) {
    if (managingMessage || !message.is_read || !window.confirm("Delete this message from your inbox?")) return;
    setManagingMessage(true);
    setNotice("");
    if (!preview) {
      const { error: deleteError } = await supabase.rpc("gb_delete_inbox_message", { p_message_id: message.id });
      if (deleteError) {
        setNotice(`Message could not be deleted: ${deleteError.message}`);
        setManagingMessage(false);
        return;
      }
    }
    setMessages((old) => old.filter((item) => item.id !== message.id));
    setSelected((current) => current?.id === message.id ? null : current);
    setNotice(preview ? "Preview only: no message was deleted." : "Message deleted from your inbox.");
    setManagingMessage(false);
  }

  async function sendNewMessage() {
    if (!currentUser?.id || sendingMessage) return;
    if (preview) { setNotice("Preview only: no message was sent."); return; }

    const trimmedUsername = recipientUsername.trim();
    const trimmedSubject = composeSubject.trim();
    const trimmedBody = composeBody.trim();
    if (!trimmedUsername || !trimmedSubject || !trimmedBody) {
      setNotice("Enter a recipient, subject, and message.");
      return;
    }
    if (trimmedSubject.length > 120 || trimmedBody.length > 5000) {
      setNotice("Subject must be 120 characters or fewer and messages 5,000 characters or fewer.");
      return;
    }

    setSendingMessage(true);
    setNotice("");

    const { data: recipient, error: recipientError } = await supabase
      .from("profiles")
      .select("id,username")
      .ilike("username", trimmedUsername)
      .maybeSingle();

    if (recipientError || !recipient) {
      setNotice(recipientError?.message || "No account was found with that username.");
      setSendingMessage(false);
      return;
    }
    if (recipient.id === currentUser.id) {
      setNotice("You can't send a message to yourself.");
      setSendingMessage(false);
      return;
    }

    const { error: sendError } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      recipient_id: recipient.id,
      sender_type: "player",
      subject: trimmedSubject,
      body: trimmedBody,
      message_type: "player",
      is_read: false,
      is_archived: false,
    });

    setSendingMessage(false);
    if (sendError) {
      setNotice(`Message could not be sent: ${sendError.message}`);
      return;
    }

    setProfileNames((old) => ({ ...old, [recipient.id]: recipient.username || trimmedUsername }));
    setRecipientUsername("");
    setComposeSubject("");
    setComposeBody("");
    setComposeOpen(false);
    setFolder("sent");
    setSelected(null);
    setNotice("Message sent.");

    const { data: sent, error: refreshError } = await supabase
      .from("messages")
      .select("*")
      .eq("sender_id", currentUser.id)
      .order("created_at", { ascending: false });
    if (refreshError) {
      setNotice(`Message sent, but the sent folder could not be refreshed: ${refreshError.message}`);
      return;
    }
    setSentMessages((sent || []) as MessageRow[]);
  }

  async function sendReply() {
    if (!currentUser?.id || !selected?.sender_id || !replyBody.trim() || sendingReply) return;
    if (preview) { setNotice("Preview only: no reply was sent."); return; }

    setSendingReply(true);
    setNotice("");

    const recipientId = selected.sender_id;
    const subject = /^re:\s/i.test(selected.subject) ? selected.subject : `Re: ${selected.subject}`;
    const { data: sentReply, error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      recipient_id: recipientId,
      sender_type: "player",
      subject,
      body: replyBody.trim(),
      message_type: "player",
      is_read: false,
      is_archived: false,
    }).select("*").single();

    setSendingReply(false);

    if (error) {
      setNotice(`Reply could not be sent: ${error.message}`);
      return;
    }

    setSentMessages((old) => [sentReply as MessageRow, ...old]);
    setReplyBody("");
    setReplyOpen(false);
    setNotice("Reply sent.");
  }

  async function respondToFriendRequest(status: "accepted" | "declined") {
    if (!currentUser?.id || !selected?.related_id) return;
    if (preview) { setNotice("Preview only: no request was changed."); return; }

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

    const { error: archiveError } = await supabase.rpc("gb_delete_inbox_message", { p_message_id: selected.id });

    if (archiveError) {
      setNotice(`Friend request ${status}, but the message could not be archived: ${archiveError.message}`);
      return;
    }
    setMessages((old) => old.filter((message) => message.id !== selected.id));
    setSelected(null);
    setNotice(status === "accepted" ? "Friend request accepted." : "Friend request declined.");
  }

  if ((!preview && loading) || pageLoading) {
    return <div className="inbox-loading">Loading inbox...</div>;
  }

  if (!currentUser) {
    const next = composeRecipient ? `/profile/inbox?recipient=${encodeURIComponent(composeRecipient)}` : "/profile/inbox";
    return <div className="inbox-loading">You must be logged in to view inbox. <a href={`/login?next=${encodeURIComponent(next)}`}>Sign in</a></div>;
  }

  const visibleMessages = folder === "sent" ? sentMessages : folder === "saved" ? messages.filter((message) => message.is_saved) : messages;

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

        .folder-tabs{
          display:flex;
          gap:6px;
          padding:10px 10px 0;
        }

        .folder-tab,.compose-button{
          border:1px solid #315f88;
          background:#0b1d2c;
          color:#d7eaff;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
          padding:8px 10px;
          cursor:pointer;
        }

        .folder-tab.active{
          background:#15324b;
          border-color:#2f6f9f;
          color:#f2c14e;
        }

        .compose-button{
          margin-left:auto;
          border-color:#b32222;
          background:linear-gradient(#9d0000,#4b0000);
          color:#fff;
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

        .compose-form{
          display:grid;
          gap:10px;
          padding:14px;
        }

        .compose-form label{
          display:grid;
          gap:5px;
          color:#cfe2f2;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
        }

        .compose-form input,.compose-form textarea{
          width:100%;
          background:#02070c;
          border:1px solid #315b7d;
          color:#fff;
          padding:10px;
          font-size:13px;
        }

        .compose-form textarea{
          min-height:180px;
          resize:vertical;
          line-height:19px;
        }

        .compose-actions{
          display:flex;
          gap:8px;
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

      <main className="page inbox-page">
        <div className="wrap">

          <header className="header">
            <div className="title">
              <span className="inbox-eyebrow">YOUR GAMEBATTLES MESSAGES</span>
              <h1>Inbox</h1>
              <p>Your conversations, requests and updates, all in one place.</p>
              {preview && <p className="inbox-preview-label">Preview only — no messages or requests are changed.</p>}
            </div>

            <div className="badge">
              <strong>{messages.filter((message) => !message.is_read).length}</strong><span>Unread</span>
            </div>
          </header>

          <p className="inbox-retention">Received messages are deleted from your inbox after 60 days unless saved. Sent messages are not affected.</p>

          {nameError && <div className="inbox-status" role="alert">Player names could not be loaded: {nameError}</div>}
          {notice && <div className="inbox-status" role="status">{notice}</div>}
            <section className="content">
              <div className="panel">
                <div className="panel-title">
                  <span>MESSAGES</span><span>{visibleMessages.length} {visibleMessages.length === 1 ? "message" : "messages"}</span>
                </div>

                <div className="folder-tabs" role="group" aria-label="Message folders">
                  <button
                    className={`folder-tab ${folder === "inbox" ? "active" : ""}`}
                    type="button"
                    aria-pressed={folder === "inbox"}
                    onClick={() => {
                      setFolder("inbox");
                      setSelected(null);
                      setComposeOpen(false);
                      setNotice("");
                    }}
                  >
                    Inbox <span>{messages.filter((message) => !message.is_read).length}</span>
                  </button>
                  <button
                    className={`folder-tab ${folder === "saved" ? "active" : ""}`}
                    type="button"
                    aria-pressed={folder === "saved"}
                    onClick={() => {
                      setFolder("saved");
                      setSelected(null);
                      setComposeOpen(false);
                      setNotice("");
                    }}
                  >
                    Saved <span>{messages.filter((message) => message.is_saved).length}</span>
                  </button>
                  <button
                    className={`folder-tab ${folder === "sent" ? "active" : ""}`}
                    type="button"
                    aria-pressed={folder === "sent"}
                    onClick={() => {
                      setFolder("sent");
                      setSelected(null);
                      setComposeOpen(false);
                      setNotice("");
                    }}
                  >
                    Sent
                  </button>
                  <button
                    className="compose-button"
                    type="button"
                    onClick={() => {
                      setComposeOpen(true);
                      setSelected(null);
                      setNotice("");
                    }}
                  >
                    + New message
                  </button>
                </div>
                <div className="message-list">
                  {(folder !== "sent" && error) || (folder === "sent" && sentError) ? (
                    <div className="error" role="alert">Messages could not be loaded: {folder === "sent" ? sentError : error}</div>
                  ) : visibleMessages.length === 0 ? (
                    <div className="empty">
                      {folder === "inbox" ? "No messages in your inbox." : folder === "saved" ? "No saved messages yet." : "No sent messages yet."}
                    </div>
                  ) : (
                    visibleMessages.map((message) => (
                      <button
                        type="button"
                        aria-pressed={selected?.id === message.id}
                        className={`message-row ${!message.is_read && folder !== "sent" ? "unread" : ""} ${selected?.id === message.id ? "selected" : ""}`}
                        key={message.id}
                        onClick={() => openMessage(message)}
                      >
                        <span className="message-row-top">
                          <span className="message-person">{folder === "sent" ? `To: ${recipientName(message, profileNames)}` : `From: ${senderName(message, profileNames)}`}</span>
                          {folder !== "sent" && (message.is_saved || !message.is_read) && <span className="message-unread">{message.is_saved ? "SAVED" : "NEW"}</span>}
                        </span>
                        <span className="message-subject">{message.subject}</span>
                        <span className="message-preview">{message.body}</span>
                        <time className="message-date" dateTime={message.created_at}>{messageDate(message.created_at)}</time>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="panel-title"><span>{composeOpen ? "NEW MESSAGE" : "MESSAGE DETAILS"}</span></div>

                {composeOpen ? (
                  <form
                    className="compose-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void sendNewMessage();
                    }}
                  >
                    <label>
                      To (username)
                      <input
                        autoComplete="off"
                        maxLength={100}
                        required
                        value={recipientUsername}
                        onChange={(event) => setRecipientUsername(event.target.value)}
                        placeholder="Enter the recipient's username"
                      />
                    </label>
                    <label>
                      Subject
                      <input
                        maxLength={120}
                        required
                        value={composeSubject}
                        onChange={(event) => setComposeSubject(event.target.value)}
                        placeholder="Message subject"
                      />
                    </label>
                    <label>
                      Message
                      <textarea
                        maxLength={5000}
                        required
                        value={composeBody}
                        onChange={(event) => setComposeBody(event.target.value)}
                        placeholder="Write your message..."
                      />
                    </label>
                    <div className="compose-actions">
                      <button className="reply-btn" disabled={sendingMessage} type="submit">
                        {sendingMessage ? "Sending..." : "Send Message"}
                      </button>
                      <button
                        className="reply-btn"
                        type="button"
                        onClick={() => {
                          setComposeOpen(false);
                          setNotice("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : !selected ? (
                  <div className="inbox-reader-empty"><span aria-hidden="true">✉</span><strong>Choose a message</strong><p>Select a message to see its details, or start a new conversation.</p></div>
                ) : (
                  <div className="reader">
                    <div className="reader-heading">
                      <span className="inbox-eyebrow">{folder === "sent" ? "SENT MESSAGE" : "RECEIVED MESSAGE"}</span>
                      <h2 className="reader-subject">{selected.subject}</h2>
                      <div className="reader-meta">
                        <span><b>{folder === "sent" ? "To" : "From"}</b> {folder === "sent" ? recipientName(selected, profileNames) : senderName(selected, profileNames)}</span>
                        <span><b>Date</b> <time dateTime={selected.created_at}>{messageDate(selected.created_at)}</time></span>
                      </div>
                    </div>

                    <div className="reader-body">{selected.body}</div>

                    {folder !== "sent" && selected.related_type === "friend_request" && selected.related_id && (
                      <div className="reader-actions">
                        <button
                          className="reply-btn accept-btn"
                          type="button"
                          disabled={!selected.is_read}
                          onClick={() => respondToFriendRequest("accepted")}
                        >
                          Accept
                        </button>

                        <button
                          className="reply-btn decline-btn"
                          type="button"
                          disabled={!selected.is_read}
                          onClick={() => respondToFriendRequest("declined")}
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {folder !== "sent" && (
                      <div className="reader-actions">
                        <button className="reply-btn" type="button" disabled={managingMessage} onClick={() => void saveMessage(selected)}>
                          {selected.is_saved ? "Unsave message" : "Save message"}
                        </button>
                        <button className="reply-btn inbox-delete" type="button" disabled={managingMessage || !selected.is_read} onClick={() => void deleteMessage(selected)}>
                          Delete message
                        </button>
                        {canReply(selected) && <button className="reply-btn" type="button" onClick={() => setReplyOpen(!replyOpen)}>Reply</button>}
                      </div>
                    )}

                    {replyOpen && folder !== "sent" && canReply(selected) && (
                      <div className="reply-box">
                        <textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          aria-label="Reply message"
                          maxLength={5000}
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

                  </div>
                )}
              </div>
            </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}