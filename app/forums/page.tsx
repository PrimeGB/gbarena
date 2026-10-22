"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

type ForumCategory =
  | "All"
  | "News & Updates"
  | "Teams"
  | "General Info"
  | "Questions"
  | "Site Suggestions"
  | "Top Clips";

type ForumPost = {
  id: number;
  subject: string;
  message?: string;
  system: string;
  game: string;
  ladder: string;
  type: string;
  category: ForumCategory;
  author: string;
  replies: number;
  views: number;
  createdAt: number;
};

type ForumPostRow = {
  id: number;
  subject: string;
  message?: string;
  system: string;
  game: string;
  ladder: string;
  type: string;
  category: ForumCategory;
  author: string;
  replies: number;
  views: number;
  created_at: string;
};

const forumSections: {
  title: string;
  description: string;
  categories: ForumCategory[];
}[] = [
  {
    title: "General Site Information",
    description: "Announcements, site news, help, and community discussion.",
    categories: ["News & Updates", "General Info", "Questions", "Site Suggestions"],
  },
  {
    title: "Teams & Recruiting",
    description: "Find teammates, recruit players, and organize your team.",
    categories: ["Teams"],
  },
  {
    title: "Community Highlights",
    description: "Share clips and standout moments with the community.",
    categories: ["Top Clips"],
  },
];

export default function ForumsPage() {
  const [subject, setSubject] = useState("");
  const [system, setSystem] = useState("PlayStation");
  const [game, setGame] = useState("Fortnite");
  const [ladder, setLadder] = useState("Team");
  const [type, setType] = useState("LF Team");
  const [category, setCategory] = useState<ForumCategory>("Teams");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<ForumCategory>("All");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [lastPostTime, setLastPostTime] = useState<number>(0);

  const [posts, setPosts] = useState<ForumPost[]>([
    {
      id: Date.now() - 1000 * 60 * 60,
      subject: "Site updates and ladder testing",
      system: "All",
      game: "All",
      ladder: "All",
      type: "News",
      category: "News & Updates",
      author: "Staff",
      replies: 12,
      views: 244,
      createdAt: Date.now() - 1000 * 60 * 10,
    },
    {
      id: Date.now() - 1000 * 60 * 50,
      subject: "LF Team for Fortnite Ladder",
      system: "PlayStation",
      game: "Fortnite",
      ladder: "Team",
      type: "LF Team",
      category: "Teams",
      author: "Prime",
      replies: 4,
      views: 88,
      createdAt: Date.now() - 1000 * 60 * 7,
    },
    {
      id: Date.now() - 1000 * 60 * 80,
      subject: "LF Duos Partner - Need Active Player",
      system: "Xbox",
      game: "Call of Duty",
      ladder: "Duos",
      type: "LF Duos Partner",
      category: "Teams",
      author: "OldSchool",
      replies: 2,
      views: 51,
      createdAt: Date.now() - 1000 * 60 * 22,
    },
    {
      id: Date.now() - 1000 * 60 * 90,
      subject: "Question about match proof",
      system: "PC",
      game: "Battlefield 6",
      ladder: "Singles",
      type: "Question",
      category: "Questions",
      author: "NewUser",
      replies: 7,
      views: 133,
      createdAt: Date.now() - 1000 * 60 * 40,
    },
    {
      id: Date.now() - 1000 * 60 * 100,
      subject: "How will team rank work?",
      system: "All",
      game: "All",
      ladder: "Team",
      type: "General Post",
      category: "General Info",
      author: "LadderVet",
      replies: 9,
      views: 199,
      createdAt: Date.now() - 1000 * 60 * 55,
    },
  ]);

  // load posts from Supabase on mount (fallback to localStorage)
  useEffect(() => {
    let mounted = true;
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from("forum_posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && mounted) {
          const mapped = data.map((p: any) => ({
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
          }));
          setPosts(mapped);
          return;
        }
      } catch (e) {
        // ignore
      }

      // fallback: localStorage
      try {
        const raw = localStorage.getItem("gb_forum_posts");
        if (raw && mounted) setPosts(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    }

    fetchPosts();
    return () => {
      mounted = false;
    };
  }, []);

  // persist posts to localStorage whenever they change (still useful as cache)
  useEffect(() => {
    try {
      localStorage.setItem("gb_forum_posts", JSON.stringify(posts));
    } catch (e) {
      // ignore
    }
  }, [posts]);

  const blockedTerms = [
    "cp",
    "child abuse",
    "child porn",
    "illegal porn",
    "rape",
    "terrorist",
    "beheading",
    "sell account",
    "buy account",
    "trade account",
    "dox",
    "doxx",
    "address leak",
  ];

  const visibleForumSections = useMemo(
    () =>
      forumSections
        .map((section) => ({
          ...section,
          boards: section.categories
            .filter((boardCategory) => activeCategory === "All" || boardCategory === activeCategory)
            .map((boardCategory) => {
              const boardPosts = posts
                .filter((post) => post.category === boardCategory)
                .sort((a, b) => b.createdAt - a.createdAt);
              const replyCount = boardPosts.reduce((total, post) => total + post.replies, 0);

              return {
                category: boardCategory,
                description: boardCategory === "Teams"
                  ? "Find teammates, recruit players, and organize your team."
                  : boardCategory === "Top Clips"
                    ? "Share clips and standout moments with the community."
                    : section.description,
                latestPost: boardPosts[0],
                threadCount: boardPosts.length,
                postCount: boardPosts.length + replyCount,
              };
            }),
        }))
        .filter((section) => section.boards.length > 0),
    [posts, activeCategory]
  );

  function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();

    const now = Date.now();
    const fiveMinutes = 1000 * 60 * 5;

    if (lastPostTime && now - lastPostTime < fiveMinutes) {
      const waitMinutes = Math.ceil((fiveMinutes - (now - lastPostTime)) / 60000);
      setError(`Slow down. You must wait about ${waitMinutes} more minute(s) before posting again.`);
      return;
    }

    const combinedText = `${subject} ${message}`.toLowerCase();
    const blocked = blockedTerms.some((term) => combinedText.includes(term));

    if (blocked) {
      setError(
        "Post blocked. Illegal content, account selling/trading, doxxing, threats, and unsafe content are not allowed."
      );
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setError("Please enter a subject and message before posting.");
      return;
    }

    const newPost: ForumPost = {
      id: now,
      subject: subject.trim(),
      message: message.trim(),
      system,
      game,
      ladder,
      type,
      category,
      author: "You",
      replies: 0,
      views: 1,
      createdAt: now,
    };

    // optimistic update
    setPosts([newPost, ...posts]);
    setLastPostTime(now);
    setSubject("");
    setMessage("");
    setError("");
    setActiveCategory(category);
    setShowCreatePost(false);

    // persist to Supabase (best-effort)
    (async () => {
      try {
        const { data: inserted, error } = (await supabase
          .from("forum_posts")
          .insert([
            {
              subject: newPost.subject,
              message: newPost.message,
              system: newPost.system,
              game: newPost.game,
              ladder: newPost.ladder,
              type: newPost.type,
              category: newPost.category,
              author: newPost.author,
              replies: 0,
              views: 1,
              created_at: new Date().toISOString(),
            },
          ])) as { data: ForumPostRow[] | null; error: any };

        if (!error && inserted && inserted[0]) {
          const insertedRow = inserted[0];

          // replace optimistic item with DB-backed record id
          setPosts((cur) => [
            {
              id: insertedRow.id,
              subject: insertedRow.subject,
              message: insertedRow.message,
              system: insertedRow.system,
              game: insertedRow.game,
              ladder: insertedRow.ladder,
              type: insertedRow.type,
              category: insertedRow.category,
              author: insertedRow.author,
              replies: insertedRow.replies || 0,
              views: insertedRow.views || 0,
              createdAt: new Date(insertedRow.created_at).getTime(),
            },
            ...cur.filter((p) => p.createdAt !== newPost.createdAt),
          ]);
        }
      } catch (e) {
        console.error("Failed to insert forum post to Supabase:", e);
      }
    })();
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        a{text-decoration:none;}

        .wrapper{width:min(1120px,100%);margin:0 auto;padding:24px 18px;}
        .forum-page{background:#0a1119;border:1px solid #263b4d;}
        .forum-heading{
          display:flex;align-items:center;justify-content:space-between;gap:16px;
          padding:18px 20px;background:#101c28;border-bottom:1px solid #263b4d;
        }
        .forum-heading h1{color:#f2c14e;font-size:20px;text-transform:uppercase;letter-spacing:.5px;}
        .forum-heading p{margin-top:5px;color:#9aabba;font-size:12px;}
        .new-post-button,.post-button{
          border:1px solid #ff4d4d;background:linear-gradient(to bottom,#c40000,#6a0000);
          color:#fff;font-size:11px;font-weight:bold;padding:9px 14px;cursor:pointer;text-transform:uppercase;
        }
        .forum-toolbar{
          display:flex;align-items:center;justify-content:space-between;gap:12px;
          padding:10px 16px;background:#0c151e;border-bottom:1px solid #263b4d;
        }
        .forum-breadcrumb{color:#95a8b8;font-size:11px;}
        .forum-breadcrumb button{
          border:0;background:none;color:#7fc0ff;font:inherit;cursor:pointer;
        }
        .forum-columns,.forum-row{
          display:grid;grid-template-columns:minmax(260px,1.5fr) minmax(220px,1fr) 90px 90px;
          align-items:center;gap:16px;
        }
        .forum-columns{
          padding:9px 16px;background:#17222d;color:#c3ced8;font-size:10px;
          font-weight:bold;text-transform:uppercase;
        }
        .forum-section{border-bottom:1px solid #263b4d;}
        .forum-section-title{
          padding:11px 16px;background:#111d28;color:#dca541;
          font-size:13px;font-weight:bold;
        }
        .forum-section-description{padding:0 16px 9px;background:#111d28;color:#8193a1;font-size:11px;}
        .forum-row{min-height:70px;padding:10px 16px;border-top:1px solid #1c2b37;background:#0a1119;}
        .forum-row:nth-child(even){background:#0d1620;}
        .forum-board-name{
          padding:0;border:0;background:none;color:#7fc0ff;font:inherit;font-size:13px;
          font-weight:bold;text-align:left;cursor:pointer;
        }
        .forum-board-name:hover,.latest-topic a:hover{color:#fff;text-decoration:underline;}
        .forum-board-description{margin-top:5px;color:#9aabba;font-size:11px;line-height:16px;}
        .latest-topic{min-width:0;font-size:11px;}
        .latest-topic a{
          display:block;overflow:hidden;color:#d7eaff;font-weight:bold;text-overflow:ellipsis;white-space:nowrap;
        }
        .latest-topic span{display:block;margin-top:4px;color:#8193a1;}
        .board-count{text-align:center;color:#d7eaff;font-size:12px;font-weight:bold;}
        .board-count span{display:none;}
        .empty-forums{padding:22px 16px;color:#9aabba;font-size:12px;}

        .create-form label{
          display:block;
          color:#f2c14e;
          font-size:10px;
          font-weight:bold;
          margin-top:12px;
          margin-bottom:6px;
          text-transform:uppercase;
        }

        .create-form input,
        .create-form select,
        .create-form textarea{
          width:100%;
          background:#000;
          border:1px solid #3b7fc2;
          color:#fff;
          min-height:38px;padding:8px 10px;font-size:12px;
        }

        .create-form textarea{
          min-height:120px;
          resize:vertical;
        }

        .form-grid{
          display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;
        }

        .post-modal-backdrop{
          position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;
          padding:20px;background:rgba(0,0,0,.82);
        }
        .post-modal{
          width:min(760px,100%);max-height:90vh;overflow:auto;
          background:#0a1622;border:1px solid #3b7fc2;box-shadow:0 16px 50px #000;
        }
        .post-modal-header{
          display:flex;align-items:center;justify-content:space-between;
          padding:14px 16px;background:#0f2a40;border-bottom:1px solid #3b7fc2;
          color:#f2c14e;font-size:13px;font-weight:bold;text-transform:uppercase;
        }
        .post-modal-close{
          border:0;background:none;color:#d7e2ee;font-size:20px;cursor:pointer;
        }
        .post-modal-body{padding:16px;}
        .post-button{margin-top:12px;}
        .form-error{
          margin-top:10px;padding:9px;border:1px solid #ff4d4d;background:#2a0000;
          color:#ffb3b3;font-size:12px;line-height:18px;
        }

        .footer{
          margin-top:10px;padding:10px;text-align:center;color:#8193a1;font-size:11px;
        }
        @media(max-width:760px){
          .wrapper{padding:14px 10px;}
          .forum-heading{align-items:flex-start;padding:14px;}
          .forum-heading h1{font-size:17px;}
          .forum-columns{display:none;}
          .forum-row{grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;padding:12px;}
          .board-count{text-align:right;font-size:11px;}
          .board-count span{display:inline;color:#8193a1;font-size:10px;font-weight:normal;}
          .latest-topic{grid-column:1/-1;grid-row:2;}
          .forum-section-title{padding:10px 12px;}
          .forum-section-description{padding:0 12px 9px;}
          .form-grid{grid-template-columns:1fr 1fr;}
          .forum-toolbar{padding:9px 12px;}
        }
        @media(max-width:430px){
          .forum-heading{flex-direction:column;}
          .new-post-button{width:100%;}
          .form-grid{grid-template-columns:1fr;}
        }
      `}</style>
      <div className="wrapper">
        <div className="forum-page">
          <div className="forum-heading">
            <div>
              <h1>GameBattles Forums</h1>
              <p>Browse discussions, find teammates, and catch up on the latest posts.</p>
            </div>
            <button
              className="new-post-button"
              type="button"
              onClick={() => {
                setCategory(activeCategory === "All" ? "Teams" : activeCategory);
                setError("");
                setShowCreatePost(true);
              }}
            >
              New Post
            </button>
          </div>

          <div className="forum-toolbar">
            <div className="forum-breadcrumb">
              {activeCategory === "All" ? (
                "All Forums"
              ) : (
                <>
                  <button type="button" onClick={() => setActiveCategory("All")}>All Forums</button>
                  {" / "}{activeCategory}
                </>
              )}
            </div>
            <a className="forum-breadcrumb" href="/rules">Forum Rules</a>
          </div>

          <div className="forum-columns" aria-hidden="true">
            <span>Forum</span>
            <span>Latest Post</span>
            <span>Threads</span>
            <span>Posts</span>
          </div>

          {visibleForumSections.length ? visibleForumSections.map((section) => (
            <section className="forum-section" key={section.title}>
              <div className="forum-section-title">{section.title}</div>
              <div className="forum-section-description">{section.description}</div>
              {section.boards.map((board) => (
                <div className="forum-row" key={board.category}>
                  <div>
                    <button
                      className="forum-board-name"
                      type="button"
                      onClick={() => setActiveCategory(board.category)}
                    >
                      {board.category}
                    </button>
                    <div className="forum-board-description">{board.description}</div>
                  </div>
                  <div className="latest-topic">
                    {board.latestPost ? (
                      <>
                        <a href={`/forums/${board.latestPost.id}`} title={board.latestPost.subject}>
                          {board.latestPost.subject}
                        </a>
                        <span>by {board.latestPost.author} · {new Date(board.latestPost.createdAt).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <span>No posts yet</span>
                    )}
                  </div>
                  <div className="board-count"><span>Threads: </span>{board.threadCount}</div>
                  <div className="board-count"><span>Posts: </span>{board.postCount}</div>
                </div>
              ))}
            </section>
          )) : (
            <div className="empty-forums">No forum boards found.</div>
          )}
        </div>

        <footer className="footer">© 2026 Competitive Gaming Network</footer>
      </div>

      {showCreatePost && (
        <div className="post-modal-backdrop" onClick={() => setShowCreatePost(false)}>
          <section
            className="post-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-post-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="post-modal-header">
              <span id="new-post-title">Create Forum Post</span>
              <button
                className="post-modal-close"
                type="button"
                aria-label="Close new post"
                onClick={() => setShowCreatePost(false)}
              >
                ×
              </button>
            </div>
            <div className="post-modal-body">
                  <form className="create-form" onSubmit={handleCreatePost}>
                    <label>Subject</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Example: LF Team, LF Duos Partner, Question about Rules"
                    />

                    <div className="form-grid">
                      <div>
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as ForumCategory)}>
                          <option>News & Updates</option>
                          <option>Teams</option>
                          <option>General Info</option>
                          <option>Questions</option>
                          <option>Site Suggestions</option>
                          <option>Top Clips</option>
                        </select>
                      </div>

                      <div>
                        <label>System</label>
                        <select value={system} onChange={(e) => setSystem(e.target.value)}>
                          <option>PlayStation</option>
                          <option>Xbox</option>
                          <option>Nintendo</option>
                          <option>PC</option>
                          <option>All</option>
                        </select>
                      </div>

                      <div>
                        <label>Game</label>
                        <select value={game} onChange={(e) => setGame(e.target.value)}>
                          <option>Fortnite</option>
                          <option>Battlefield 6</option>
                          <option>Call of Duty</option>
                          <option>All</option>
                        </select>
                      </div>

                      <div>
                        <label>Ladder</label>
                        <select value={ladder} onChange={(e) => setLadder(e.target.value)}>
                          <option>Singles</option>
                          <option>Duos</option>
                          <option>Team</option>
                          <option>All</option>
                        </select>
                      </div>

                      <div>
                        <label>Post Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                          <option>LF Team</option>
                          <option>LF Duos Partner</option>
                          <option>LF Singles Match</option>
                          <option>Question</option>
                          <option>Team Recruiting</option>
                          <option>General Post</option>
                          <option>Clip Submission</option>
                        </select>
                      </div>
                    </div>

                    <label>Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your post here..."
                    />

                    <button className="post-button" type="submit">
                      Submit Post
                    </button>

                    {error && <div className="form-error" role="alert">{error}</div>}
                  </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}