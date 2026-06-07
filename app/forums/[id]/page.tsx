"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ForumThreadPage() {
  const params = useParams();
  const id = params?.id;
  const [post, setPost] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        // try DB
        const { data: posts } = await supabase.from("forum_posts").select("*").eq("id", id).limit(1);
        if (posts && posts[0] && mounted) {
          const p = posts[0];
          setPost({
            id: p.id,
            subject: p.subject,
            message: p.message,
            system: p.system,
            game: p.game,
            ladder: p.ladder,
            type: p.type,
            category: p.category,
            author: p.author,
            replies: p.replies || 0,
            views: p.views || 0,
            createdAt: new Date(p.created_at).getTime(),
          });
        } else {
          // fallback to localStorage
          const raw = localStorage.getItem("gb_forum_posts");
          if (raw) {
            const postsLocal = JSON.parse(raw);
            const found = postsLocal.find((p: any) => String(p.id) === String(id));
            if (found && mounted) setPost(found);
          }
        }

        // load replies
        const { data: rdata } = await supabase.from("forum_replies").select("*").eq("post_id", id).order("created_at", { ascending: true });
        if (rdata && mounted) setReplies(rdata || []);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const { data: inserted } = await supabase.from("forum_replies").insert([
        { post_id: id, author: "You", message: replyText.trim(), created_at: new Date().toISOString() },
      ]);
      if (inserted && inserted[0]) {
        setReplies((s) => [...s, inserted[0]]);
        setReplyText("");
        // increment replies counter on post
        await supabase.from("forum_posts").update({ replies: (post?.replies || 0) + 1 }).eq("id", id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!post) {
    return (
      <div style={{ padding: 20, color: "#d7e2ee", background: "#000", minHeight: "60vh" }}>
        <h2>Thread not found</h2>
        <p>The requested forum thread could not be located.</p>
        <a href="/forums" style={{ color: "#7fc0ff" }}>
          Back to forums
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, color: "#d7e2ee", background: "#000", minHeight: "60vh" }}>
      <h2 style={{ color: "#7fc0ff" }}>{post.subject}</h2>
      <div style={{ marginBottom: 8, color: "#a9c3db" }}>
        By {post.author} — {post.category} — {post.system} / {post.game}
      </div>
      <div style={{ background: "#07111b", padding: 14, border: "1px solid #3b7fc2" }}>
        <p style={{ whiteSpace: "pre-wrap" }}>{post.message || "(no message)"}</p>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3 style={{ color: "#f2c14e" }}>Replies</h3>
        {replies.length === 0 && <div style={{ color: "#a9c3db" }}>No replies yet.</div>}
        {replies.map((r: any) => (
          <div key={r.id} style={{ borderTop: "1px solid #13293d", padding: 10 }}>
            <div style={{ color: "#7fc0ff", fontWeight: 700 }}>{r.author}</div>
            <div style={{ color: "#a9c3db", whiteSpace: "pre-wrap" }}>{r.message}</div>
          </div>
        ))}

        <form onSubmit={submitReply} style={{ marginTop: 12 }}>
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} style={{ width: "100%", minHeight: 80, padding: 8 }} />
          <button style={{ marginTop: 8, background: "#c40000", color: "#fff", padding: "8px 12px", border: "none" }} type="submit">Reply</button>
        </form>
      </div>

      <div style={{ marginTop: 12 }}>
        <a href="/forums" style={{ color: "#cfeefe" }}>
          Back to forums
        </a>
      </div>
    </div>
  );
}
