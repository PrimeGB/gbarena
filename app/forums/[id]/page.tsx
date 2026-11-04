"use client";

import Link from "next/link";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ForumThreadPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [post, setPost] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id ?? null;
    setUserId(uid);

    if (uid) {
      const { data: allowed } = await supabase.rpc("has_staff_permission", { permission_key: "basic_moderation" });
      setIsStaff(allowed === true);
    }

    const { data: p } = await supabase.from("forum_posts").select("*").eq("id", id).maybeSingle();
    setPost(p || null);

    const { data: r } = await supabase
      .from("forum_replies")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    setReplies(r || []);
    setLoaded(true);
  }, [id]);

  useEffect(() => {
    load();
    if (id) supabase.rpc("gb_forum_view", { p_post: Number(id) }).then(() => undefined);
  }, [id, load]);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!replyText.trim() || !id) return;
    const { error } = await supabase.from("forum_replies").insert([{ post_id: Number(id), message: replyText.trim() }]);
    if (error) {
      setMessage(error.message);
      return;
    }
    setReplyText("");
    load();
  }

  async function report(targetType: "post" | "reply", targetId: number) {
    const reason = window.prompt("Why are you reporting this? (spam, harassment, rule break...)");
    if (!reason || !reason.trim()) return;
    const { error } = await supabase
      .from("forum_reports")
      .insert([{ target_type: targetType, target_id: targetId, reason: reason.trim().slice(0, 500) }]);
    setMessage(error ? "Could not send the report." : "Thanks. Staff will review your report.");
  }

  async function updatePost(fields: { pinned?: boolean; locked?: boolean; hidden?: boolean }) {
    if (!id) return;
    const { error } = await supabase.from("forum_posts").update(fields).eq("id", id);
    if (error) setMessage(error.message);
    else load();
  }

  async function hideReply(replyId: number, hidden: boolean) {
    const { error } = await supabase.from("forum_replies").update({ hidden }).eq("id", replyId);
    if (error) setMessage(error.message);
    else load();
  }

  async function deleteReply(replyId: number) {
    if (!window.confirm("Delete this reply?")) return;
    const { error } = await supabase.from("forum_replies").delete().eq("id", replyId);
    if (error) setMessage(error.message);
    else load();
  }

  const linkBtn = { background: "none", border: "none", color: "#8193a1", cursor: "pointer", fontSize: 11, marginLeft: 10, padding: 0 } as const;

  if (!post) {
    return (
      <div style={{ padding: 20, color: "#d7e2ee", background: "#000", minHeight: "60vh" }}>
        <h2>{loaded ? "Thread not found" : "Loading..."}</h2>
        {loaded && <p>The requested forum thread could not be located.</p>}
        <Link href="/forums" style={{ color: "#7fc0ff" }}>
          Back to forums
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, color: "#d7e2ee", background: "#000", minHeight: "60vh" }}>
      <h2 style={{ color: "#7fc0ff" }}>
        {post.pinned ? "📌 " : ""}
        {post.locked ? "🔒 " : ""}
        {post.subject}
        {post.hidden ? " (hidden)" : ""}
      </h2>
      <div style={{ marginBottom: 8, color: "#a9c3db" }}>
        By {post.author} — {post.category} — {post.system} / {post.game}
      </div>
      <div style={{ background: "#07111b", padding: 14, border: "1px solid #3b7fc2" }}>
        <p style={{ whiteSpace: "pre-wrap" }}>{post.message || "(no message)"}</p>
      </div>

      <div style={{ marginTop: 8 }}>
        {userId && post.user_id !== userId && (
          <button type="button" style={{ ...linkBtn, marginLeft: 0 }} onClick={() => report("post", post.id)}>
            Report
          </button>
        )}
        {isStaff && (
          <>
            <button type="button" style={linkBtn} onClick={() => updatePost({ pinned: !post.pinned })}>
              {post.pinned ? "Unpin" : "Pin"}
            </button>
            <button type="button" style={linkBtn} onClick={() => updatePost({ locked: !post.locked })}>
              {post.locked ? "Unlock" : "Lock"}
            </button>
            <button type="button" style={linkBtn} onClick={() => updatePost({ hidden: !post.hidden })}>
              {post.hidden ? "Unhide" : "Hide"}
            </button>
          </>
        )}
      </div>

      {message && <div style={{ marginTop: 10, color: "#f2c14e", fontSize: 13 }}>{message}</div>}

      <div style={{ marginTop: 18 }}>
        <h3 style={{ color: "#f2c14e" }}>Replies</h3>
        {replies.length === 0 && <div style={{ color: "#a9c3db" }}>No replies yet.</div>}
        {replies.map((r: any) => (
          <div key={r.id} style={{ borderTop: "1px solid #13293d", padding: 10, opacity: r.hidden ? 0.5 : 1 }}>
            <div style={{ color: "#7fc0ff", fontWeight: 700 }}>
              {r.author}
              {userId && r.user_id !== userId && (
                <button type="button" style={linkBtn} onClick={() => report("reply", r.id)}>
                  Report
                </button>
              )}
              {(isStaff || r.user_id === userId) && (
                <button type="button" style={linkBtn} onClick={() => deleteReply(r.id)}>
                  Delete
                </button>
              )}
              {isStaff && (
                <button type="button" style={linkBtn} onClick={() => hideReply(r.id, !r.hidden)}>
                  {r.hidden ? "Unhide" : "Hide"}
                </button>
              )}
            </div>
            <div style={{ color: "#a9c3db", whiteSpace: "pre-wrap" }}>{r.message}</div>
          </div>
        ))}

        {!userId ? (
          <div style={{ marginTop: 12, color: "#a9c3db" }}>
            <Link href="/login" style={{ color: "#7fc0ff" }}>Log in</Link> to reply.
          </div>
        ) : post.locked ? (
          <div style={{ marginTop: 12, color: "#a9c3db" }}>This thread is locked.</div>
        ) : (
          <form onSubmit={submitReply} style={{ marginTop: 12 }}>
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} style={{ width: "100%", minHeight: 80, padding: 8 }} />
            <button style={{ marginTop: 8, background: "#c40000", color: "#fff", padding: "8px 12px", border: "none" }} type="submit">Reply</button>
          </form>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <Link href="/forums" style={{ color: "#cfeefe" }}>
          Back to forums
        </Link>
      </div>
    </div>
  );
}
