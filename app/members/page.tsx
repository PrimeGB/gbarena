import { supabase } from "../../lib/supabase";

type ProfileResult = {
  id: string;
  username: string | null;
  email: string | null;
  country?: string | null;
  location?: string | null;
};

export default async function MembersPage({ searchParams }: any) {
  const params = await searchParams;
  const search = String(params?.q || "").trim();

  let results: ProfileResult[] = [];
  let searchError = "";

  if (search.length >= 2) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email, country, location")
      .or(`username.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(20);

    if (error) {
      searchError = error.message;
    } else {
      results = data || [];
    }
  }

  return (
    <>
      <style>{`
        body{margin:0;background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        a{text-decoration:none;}
        .wrapper{width:1100px;margin:0 auto;}
        .top-strip{height:22px;background:linear-gradient(to bottom,#c40000,#6a0000);border-bottom:1px solid #140000;display:flex;align-items:center;padding:0 12px;}
        .top-strip a{color:#fff;font-size:10px;margin-right:14px;font-weight:bold;}
        .header{height:92px;background:#0a1622;border-left:1px solid #3b7fc2;border-right:1px solid #3b7fc2;border-bottom:2px solid #4f93d6;display:flex;align-items:center;padding:0 16px;}
        .logo-main{font-size:30px;font-weight:bold;color:#eaf5ff;line-height:1;}
        .logo-sub{color:#f2c14e;font-size:10px;text-transform:uppercase;margin-top:5px;}
        .page{margin-top:10px;background:#0a1622;border:1px solid #3b7fc2;}
        .page-title{height:28px;background:#0f2a40;border-bottom:1px solid #3b7fc2;display:flex;align-items:center;padding-left:10px;color:#f2c14e;font-size:12px;font-weight:bold;text-transform:uppercase;}
        .content{padding:20px;line-height:22px;font-size:12px;color:#d7eaff;}
        .content h1{color:#7fc0ff;font-size:28px;margin-bottom:18px;}
        .search-box{background:#07111b;border:1px solid #3b7fc2;padding:14px;margin-top:12px;}
        input{width:100%;height:32px;background:#000;border:1px solid #3b7fc2;color:#fff;padding-left:8px;margin-bottom:10px;}
        button{background:linear-gradient(to bottom,#c40000,#6a0000);border:1px solid #ff4d4d;color:#fff;font-weight:bold;padding:8px 12px;cursor:pointer;}
        .result-wrap{margin-top:16px;}
        .result{background:#07111b;border:1px solid #3b7fc2;padding:14px;margin-bottom:10px;}
        .username{color:#f2c14e;font-size:16px;font-weight:bold;text-transform:uppercase;}
        .meta{color:#d7eaff;font-size:12px;margin-top:5px;}
        .empty{margin-top:16px;background:#07111b;border:1px solid #3b7fc2;padding:14px;color:#ff7777;font-weight:bold;}
        .highlight{color:#f2c14e;font-weight:bold;}
        .error{margin-top:16px;background:#210707;border:1px solid #923131;padding:14px;color:#ff9c9c;font-weight:bold;}
      `}</style>

      <div className="top-strip">
        <a href="/">Home</a>
        <a href="/profile">My Profile</a>
        <a href="/support">Support</a>
      </div>

      <div className="wrapper">
        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Where Gaming Finds Its Edge</div>
          </div>
        </header>

        <div className="page">
          <div className="page-title">Member Search</div>

          <div className="content">
            <h1>Find A Player</h1>

            <p>Search for a player by username or email.</p>

            <form className="search-box" action="/members" method="get">
              <input name="q" placeholder="Enter username or email..." defaultValue={search} />
              <button type="submit">Search Members</button>
            </form>

            {searchError && <div className="error">Search error: {searchError}</div>}

            {search && !searchError && (
              <div className="result-wrap">
                <p>
                  Searching for: <span className="highlight">{search}</span>
                </p>

                {results.length === 0 && (
                  <div className="empty">No members found.</div>
                )}

                {results.map((player) => (
                  <div className="result" key={player.id}>
                    <div className="username">{player.username || "Unnamed Player"}</div>
                    <div className="meta">Email: {player.email || "Hidden"}</div>
                    <div className="meta">
                      Location: {[player.location, player.country].filter(Boolean).join(", ") || "Not Set"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}