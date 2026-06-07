"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ForumThreadPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [post, setPost] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gb_forum_posts");
      if (!raw) return;
      const posts = JSON.parse(raw);
      const found = posts.find((p: any) => Number(p.id) === id);
      if (found) {
        // increment views locally
        found.views = (found.views || 0) + 1;
        const updated = posts.map((p: any) => (Number(p.id) === id ? found : p));
        localStorage.setItem("gb_forum_posts", JSON.stringify(updated));
        setPost(found);
      }
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  if (!post) {
    return (
      <div style={{padding:20,color:'#d7e2ee',background:'#000',minHeight:'60vh'}}>
        <h2>Thread not found</h2>
        <p>The requested forum thread could not be located.</p>
        <a href="/forums" style={{color:'#7fc0ff'}}>Back to forums</a>
      </div>
    );
  }

  return (
    <div style={{padding:20,color:'#d7e2ee',background:'#000',minHeight:'60vh'}}>
      <h2 style={{color:'#7fc0ff'}}>{post.subject}</h2>
      <div style={{marginBottom:8,color:'#a9c3db'}}>By {post.author} — {post.category} — {post.system} / {post.game}</div>
      <div style={{background:'#07111b',padding:14,border:'1px solid #3b7fc2'}}>
        <p style={{whiteSpace:'pre-wrap'}}>{post.message || "(no message)"}</p>
      </div>
      <div style={{marginTop:12}}>
        <a href="/forums" style={{color:'#cfeefe'}}>Back to forums</a>
      </div>
    </div>
  );
}
