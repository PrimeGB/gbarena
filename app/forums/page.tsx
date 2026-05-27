"use client";

import { useMemo, useState } from "react";

type ForumCategory =
  | "All"
  | "News & Updates"
  | "Teams"
  | "General Info"
  | "Questions"
  | "Site Suggestions"
  | "Top Clips";

type ForumPost = {
  subject: string;
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
  const [lastPostTime, setLastPostTime] = useState<number>(0);

  const [posts, setPosts] = useState<ForumPost[]>([
    {
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

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => activeCategory === "All" || post.category === activeCategory)
      .sort((a, b) => {
        const recentSort = b.createdAt - a.createdAt;
        if (Math.abs(recentSort) < 1000 * 60 * 30) {
          return b.replies - a.replies;
        }
        return recentSort;
      });
  }, [posts, activeCategory]);

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
      subject: subject.trim(),
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

    setPosts([newPost, ...posts]);
    setLastPostTime(now);
    setSubject("");
    setMessage("");
    setError("");
    setActiveCategory(category);
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        a{text-decoration:none;}

        .wrapper{width:1180px;margin:0 auto;}

        .top-strip{
          height:22px;
          background:linear-gradient(to bottom,#c40000,#6a0000);
          border-bottom:1px solid #140000;
          display:flex;
          align-items:center;
          padding:0 12px;
        }

        .top-strip a{
          color:#fff;
          font-size:10px;
          margin-right:14px;
          font-weight:bold;
        }

        .header{
          height:92px;
          background:#0a1622;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:2px solid #4f93d6;
          display:flex;
          align-items:center;
          padding:0 16px;
        }

        .logo-main{font-size:30px;font-weight:bold;color:#eaf5ff;line-height:1;}
        .logo-sub{color:#f2c14e;font-size:10px;text-transform:uppercase;margin-top:5px;}

        .forum-page{
          margin-top:10px;
          background:#0a1622;
          border:1px solid #3b7fc2;
        }

        .forum-title{
          height:30px;
          background:#0f2a40;
          border-bottom:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          padding-left:10px;
          color:#f2c14e;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .forum-layout{
          display:grid;
          grid-template-columns:260px 1fr;
          gap:10px;
          padding:10px;
        }

        .box{
          background:#07111b;
          border:1px solid #3b7fc2;
          margin-bottom:10px;
        }

        .box-title{
          height:24px;
          background:linear-gradient(to bottom,#1f4c73,#0b2438);
          border-bottom:1px solid #3b7fc2;
          color:#f2c14e;
          font-size:10px;
          font-weight:bold;
          text-transform:uppercase;
          display:flex;
          align-items:center;
          padding-left:8px;
        }

        .box-body{padding:8px;font-size:11px;line-height:18px;}

        .forum-link{
          display:block;
          width:100%;
          text-align:left;
          color:#d7eaff;
          padding:7px 5px;
          border:none;
          border-bottom:1px solid #13293d;
          background:transparent;
          font-size:10px;
          cursor:pointer;
          font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        .forum-link:hover,
        .forum-link.active{
          background:#12324b;
          color:#fff;
        }

        .notice{
          color:#f2c14e;
          font-weight:bold;
        }

        .post-table{
          width:100%;
          border-collapse:collapse;
          font-size:10px;
        }

        .post-table th{
          background:#0f2a40;
          color:#f2c14e;
          border-bottom:1px solid #3b7fc2;
          padding:7px;
          text-align:left;
          text-transform:uppercase;
        }

        .post-table td{
          border-bottom:1px solid #13293d;
          padding:7px;
          color:#d7eaff;
        }

        .post-subject{
          color:#7fc0ff;
          font-weight:bold;
        }

        .tag{
          display:inline-block;
          border:1px solid #3b7fc2;
          background:#0a1622;
          color:#f2c14e;
          padding:2px 5px;
          margin-right:4px;
          font-size:9px;
        }

        .create-form label{
          display:block;
          color:#f2c14e;
          font-size:10px;
          font-weight:bold;
          margin-top:5px;
          margin-bottom:3px;
          text-transform:uppercase;
        }

        .create-form input,
        .create-form select,
        .create-form textarea{
          width:100%;
          background:#000;
          border:1px solid #3b7fc2;
          color:#fff;
          padding:5px;
          font-size:10px;
        }

        .create-form textarea{
          min-height:52px;
          resize:vertical;
        }

        .form-grid{
          display:grid;
          grid-template-columns:1fr 1fr 1fr 1fr 1fr;
          gap:6px;
        }

        .post-button{
          margin-top:8px;
          background:linear-gradient(to bottom,#c40000,#6a0000);
          border:1px solid #ff4d4d;
          color:#fff;
          font-size:10px;
          font-weight:bold;
          padding:7px 12px;
          cursor:pointer;
          text-transform:uppercase;
        }

        .error{
          margin-top:8px;
          background:#2a0000;
          border:1px solid #ff4d4d;
          color:#ffb3b3;
          padding:7px;
          font-size:10px;
        }

        .safety-list li{
          margin-left:18px;
          margin-bottom:6px;
        }

        .clip-card{
          background:#0a1622;
          border:1px solid #1f4c73;
          padding:7px;
          margin-bottom:7px;
        }

        .clip-title{
          color:#7fc0ff;
          font-weight:bold;
          font-size:10px;
        }

        .clip-meta{
          color:#a9c3db;
          font-size:9px;
          margin-top:3px;
        }

        .footer{
          margin-top:8px;
          height:26px;
          background:#0a1622;
          border:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:10px;
        }
      `}</style>

      <div className="top-strip">
        <a href="/">Home</a>
        <a href="/rules">Rules</a>
        <a href="/support">Support</a>
        <a href="/profile">My Profile</a>
      </div>

      <div className="wrapper">
        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Where Gaming Finds Its Edge</div>
          </div>
        </header>

        <div className="forum-page">
          <div className="forum-title">Forums Frontpage</div>

          <div className="forum-layout">
            <aside>
              <div className="box">
                <div className="box-title">Forum Navigation</div>
                <div className="box-body">
                  <button className={`forum-link ${activeCategory === "All" ? "active" : ""}`} onClick={() => setActiveCategory("All")}>All Posts</button>
                  <a className="forum-link" href="/rules">Forum Rules</a>
                  <button className={`forum-link ${activeCategory === "News & Updates" ? "active" : ""}`} onClick={() => setActiveCategory("News & Updates")}>News & Updates</button>
                  <button className={`forum-link ${activeCategory === "Teams" ? "active" : ""}`} onClick={() => setActiveCategory("Teams")}>Teams</button>
                  <button className={`forum-link ${activeCategory === "General Info" ? "active" : ""}`} onClick={() => setActiveCategory("General Info")}>General Info</button>
                  <button className={`forum-link ${activeCategory === "Questions" ? "active" : ""}`} onClick={() => setActiveCategory("Questions")}>Questions</button>
                  <button className={`forum-link ${activeCategory === "Site Suggestions" ? "active" : ""}`} onClick={() => setActiveCategory("Site Suggestions")}>Site Suggestions</button>
                  <button className={`forum-link ${activeCategory === "Top Clips" ? "active" : ""}`} onClick={() => setActiveCategory("Top Clips")}>Top Clips</button>
                  <a className="forum-link" href="#">New Users Lounge</a>
                  <a className="forum-link" href="#">View Today's Posts</a>
                </div>
              </div>

              <div className="box">
                <div className="box-title">Top Clips</div>
                <div className="box-body">
                  <div className="clip-card">
                    <div className="clip-title">Clip Review Coming Soon</div>
                    <div className="clip-meta">Submit clips later for review</div>
                  </div>
                  <div className="clip-card">
                    <div className="clip-title">Best plays will be featured</div>
                    <div className="clip-meta">Community highlights area</div>
                  </div>
                </div>
              </div>

              <div className="box">
                <div className="box-title">Safety Rules</div>
                <div className="box-body">
                  <p className="notice">Allowed:</p>
                  <ul className="safety-list">
                    <li>Swearing</li>
                    <li>Trash talk</li>
                    <li>Competitive banter</li>
                    <li>Drug discussion without selling</li>
                  </ul>

                  <p className="notice">Never allowed:</p>
                  <ul className="safety-list">
                    <li>Illegal sexual content</li>
                    <li>Minor exploitation content</li>
                    <li>Threats or doxxing</li>
                    <li>Account selling or trading</li>
                    <li>Cheat selling or hacking guides</li>
                  </ul>
                </div>
              </div>
            </aside>

            <main>
              <div className="box">
                <div className="box-title">
                  Latest Forum Posts — {activeCategory}
                </div>
                <div className="box-body">
                  <table className="post-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>System</th>
                        <th>Game</th>
                        <th>Ladder</th>
                        <th>Category</th>
                        <th>Author</th>
                        <th>Replies</th>
                        <th>Views</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPosts.map((post, index) => (
                        <tr key={index}>
                          <td>
                            <div className="post-subject">{post.subject}</div>
                            <span className="tag">{post.type}</span>
                          </td>
                          <td>{post.system}</td>
                          <td>{post.game}</td>
                          <td>{post.ladder}</td>
                          <td>{post.category}</td>
                          <td>{post.author}</td>
                          <td>{post.replies}</td>
                          <td>{post.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="box">
                <div className="box-title">Create Forum Post</div>
                <div className="box-body">
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

                    {error && <div className="error">{error}</div>}
                  </form>
                </div>
              </div>

              <div className="box">
                <div className="box-title">News & Updates</div>
                <div className="box-body">
                  This section will be used for official site updates, ladder changes,
                  new features, tournament announcements, maintenance notices, and community news.
                </div>
              </div>
            </main>
          </div>
        </div>

        <footer className="footer">
          © 2026 Competitive Gaming Network
        </footer>
      </div>
    </>
  );
}