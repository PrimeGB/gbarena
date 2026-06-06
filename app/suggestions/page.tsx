"use client";

import { useMemo, useState } from "react";

type PostType = "Suggestion" | "Bug Report";

type CommunityPost = {
  id: number;
  type: PostType;
  title: string;
  author: string;
  status: string;
  likes: number;
  comments: number;
};

export default function SuggestionsPage() {
  const [selectedType, setSelectedType] = useState<PostType>("Suggestion");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: 1,
      type: "Suggestion",
      title: "Add a Hall of Fame page for retired champions",
      author: "Prime",
      status: "Under Review",
      likes: 18,
      comments: 4,
    },
    {
      id: 2,
      type: "Bug Report",
      title: "Profile photos sometimes do not refresh after upload",
      author: "RetroSniper",
      status: "Open",
      likes: 7,
      comments: 2,
    },
    {
      id: 3,
      type: "Suggestion",
      title: "Add founder badge preview on profiles",
      author: "GBLegend",
      status: "Planned",
      likes: 25,
      comments: 8,
    },
  ]);

  const filteredPosts = useMemo(() => posts, [posts]);

  function submitPost() {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    const newPost: CommunityPost = {
      id: Date.now(),
      type: selectedType,
      title: cleanTitle,
      author: "You",
      status: "Open",
      likes: 0,
      comments: 0,
    };

    setPosts([newPost, ...posts]);
    setTitle("");
    setDetails("");
  }

  function likePost(id: number) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id ? { ...post, likes: post.likes + 1 } : post
      )
    );
  }

  function commentPost(id: number) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id ? { ...post, comments: post.comments + 1 } : post
      )
    );
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{text-decoration:none;}

        button,input,textarea{
          font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        .page{
          min-height:100vh;
          background:
            radial-gradient(circle at top,rgba(45,100,150,.28),transparent 42%),
            linear-gradient(to bottom,#02060a,#000);
          padding:32px 22px;
        }

        .wrap{
          max-width:1080px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #315f88;
          box-shadow:0 0 28px rgba(0,80,140,.38), inset 0 0 22px rgba(0,0,0,.72);
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
          min-height:104px;
          background:
            linear-gradient(to right,rgba(0,0,0,.55),rgba(0,0,0,.08)),
            linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 24px;
        }

        .brand-main{
          color:#fff;
          font-size:32px;
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
        }

        .brand-sub{
          color:#f2c14e;
          font-size:13px;
          font-weight:900;
          letter-spacing:2px;
          text-transform:uppercase;
          margin-top:6px;
        }

        .header-badge{
          border:1px solid #6ba8d6;
          background:linear-gradient(to bottom,#214765,#0b1c2d);
          color:#f5f8ff;
          font-size:15px;
          font-weight:900;
          text-transform:uppercase;
          padding:14px 22px;
          text-shadow:0 2px 4px #000;
        }

        .nav{
          height:36px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-bottom:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:28px;
        }

        .nav a{
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .nav a:hover{color:#d7ad4a;}

        .title-bar{
          background:linear-gradient(to bottom,#1d496e,#0a1724);
          border-bottom:1px solid #315f88;
          padding:18px 24px;
          text-align:center;
        }

        .title-bar h1{
          color:#d7ad4a;
          font-size:30px;
          text-transform:uppercase;
          text-shadow:0 1px 2px #000;
        }

        .title-bar p{
          margin-top:8px;
          color:#cfe2f2;
          font-size:13px;
          line-height:20px;
        }

        .content{
          padding:18px;
          display:grid;
          grid-template-columns:330px 1fr;
          gap:14px;
        }

        .panel{
          background:#050b12;
          border:1px solid #244b70;
          box-shadow:inset 0 0 18px rgba(0,0,0,.75);
        }

        .panel-header{
          min-height:36px;
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

        .panel-body{
          padding:14px;
        }

        .warning-box{
          border:1px solid #7c1e1e;
          background:linear-gradient(to bottom,#2a0808,#100303);
          color:#ffd1d1;
          font-size:12px;
          line-height:19px;
          padding:12px;
          margin-bottom:14px;
        }

        .warning-box strong{
          color:#ff7777;
          text-transform:uppercase;
        }

        .type-row{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
          margin-bottom:14px;
        }

        .type-btn{
          height:42px;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .type-btn.active{
          border-color:#e8c46a;
          background:linear-gradient(to bottom,#d6a943,#7b560e);
          color:#07111b;
        }

        .label{
          color:#d7ad4a;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          margin-bottom:7px;
        }

        .input,
        .textarea{
          width:100%;
          border:1px solid #315b7d;
          background:#02070c;
          color:#fff;
          font-size:13px;
          padding:10px;
          outline:none;
          margin-bottom:12px;
        }

        .input{
          height:40px;
        }

        .textarea{
          height:118px;
          resize:none;
          line-height:18px;
        }

        .input:focus,
        .textarea:focus{
          border-color:#6ba8d6;
          box-shadow:0 0 8px rgba(103,189,255,.28);
        }

        .submit-btn{
          width:100%;
          height:42px;
          border:1px solid #e8c46a;
          background:linear-gradient(to bottom,#d6a943,#7b560e);
          color:#07111b;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .submit-btn:hover{
          filter:brightness(1.12);
        }

        .post-list{
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .post-card{
          border:1px solid #244b70;
          background:linear-gradient(to bottom,#07111b,#040b12);
        }

        .post-top{
          min-height:34px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-bottom:1px solid #244b70;
          padding:0 12px;
        }

        .post-type{
          color:#d7ad4a;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
        }

        .post-status{
          color:#7fc7ff;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
        }

        .post-body{
          padding:12px;
        }

        .post-title{
          color:#fff;
          font-size:15px;
          font-weight:900;
          margin-bottom:6px;
        }

        .post-meta{
          color:#8aa7c0;
          font-size:11px;
          margin-bottom:10px;
        }

        .post-actions{
          display:flex;
          gap:8px;
        }

        .mini-btn{
          min-width:88px;
          height:28px;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#1c4b72,#0a1724);
          color:#fff;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .mini-btn:hover{
          border-color:#d7ad4a;
          color:#d7ad4a;
        }

        .footer{
          height:36px;
          background:#07111b;
          border-top:1px solid #244b70;
          display:flex;
          justify-content:center;
          align-items:center;
          color:#a9c3db;
          font-size:11px;
        }

        @media(max-width:850px){
          .content{
            grid-template-columns:1fr;
          }

          .header{
            flex-direction:column;
            justify-content:center;
            gap:12px;
            padding:18px;
            text-align:center;
          }

          .nav{
            height:auto;
            padding:10px;
            flex-wrap:wrap;
            gap:14px;
          }
        }
      `}</style>

      <main className="page">
        <div className="wrap">
          <div className="top-strip">
            <a href="/home">Home</a>
            <a href="/profile">My Profile</a>
            <a href="/forums">Forums</a>
          </div>

          <header className="header">
            <div>
              <div className="brand-main">GameBattles</div>
              <div className="brand-sub">Community Feedback</div>
            </div>

            <div className="header-badge">Suggestions Box</div>
          </header>

          <nav className="nav">
            <a href="/home">Home</a>
            <a href="/profile/teams">My Teams</a>
            <a href="/members">Members</a>
            <a href="/forums">Forums</a>
            <a href="/teams/top">Top Teams</a>
          </nav>

          <section className="title-bar">
            <h1>Suggestions Box</h1>
            <p>
              Submit ideas for the site, request improvements, or report bugs.
              This page is not for match disputes, score problems, or urgent match help.
            </p>
          </section>

          <section className="content">
            <section className="panel">
              <div className="panel-header">Submit Feedback</div>

              <div className="panel-body">
                <div className="warning-box">
                  <strong>Important:</strong> Do not use this page for disputes,
                  match help, score issues, or staff reports. Misusing this page
                  can lead to warnings or account consequences.
                </div>

                <div className="type-row">
                  <button
                    className={
                      selectedType === "Suggestion"
                        ? "type-btn active"
                        : "type-btn"
                    }
                    type="button"
                    onClick={() => setSelectedType("Suggestion")}
                  >
                    Suggestion
                  </button>

                  <button
                    className={
                      selectedType === "Bug Report"
                        ? "type-btn active"
                        : "type-btn"
                    }
                    type="button"
                    onClick={() => setSelectedType("Bug Report")}
                  >
                    Report a Bug
                  </button>
                </div>

                <div className="label">Title</div>
                <input
                  className="input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Short title..."
                />

                <div className="label">Details</div>
                <textarea
                  className="textarea"
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Explain your idea or bug clearly..."
                />

                <button className="submit-btn" type="button" onClick={submitPost}>
                  Submit {selectedType}
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">Community Posts</div>

              <div className="panel-body">
                <div className="post-list">
                  {filteredPosts.map((post) => (
                    <article className="post-card" key={post.id}>
                      <div className="post-top">
                        <div className="post-type">{post.type}</div>
                        <div className="post-status">{post.status}</div>
                      </div>

                      <div className="post-body">
                        <div className="post-title">{post.title}</div>
                        <div className="post-meta">
                          Posted by {post.author} · {post.likes} likes ·{" "}
                          {post.comments} comments
                        </div>

                        <div className="post-actions">
                          <button
                            className="mini-btn"
                            type="button"
                            onClick={() => likePost(post.id)}
                          >
                            Like
                          </button>

                          <button
                            className="mini-btn"
                            type="button"
                            onClick={() => commentPost(post.id)}
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </section>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </main>
    </>
  );
}