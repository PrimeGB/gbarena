import Link from "next/link";
import { supabase } from "../../lib/supabase";

type ProfileResult = {
  id: string;
  username: string | null;
  gt_xbox: string | null;
  xbox_gt: string | null;
  gt_pc: string | null;
  pc_gt: string | null;
  country?: string | null;
  location?: string | null;
};

type GamingAccountResult = {
  user_id: string;
  platform: string;
  account_id: string;
};

type MembersPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const profileSearchFields = ["username", "gt_xbox", "xbox_gt", "gt_pc", "pc_gt"] as const;

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const searchTerm = search.replace(/[%_]/g, "");

  let results: ProfileResult[] = [];
  const accountsByUser = new Map<string, GamingAccountResult[]>();
  let searchError = "";

  if (searchTerm.length >= 2) {
    const pattern = `%${searchTerm}%`;
    const profileColumns = "id, username, gt_xbox, xbox_gt, gt_pc, pc_gt, country, location";
    const [profileResponses, accountResponse] = await Promise.all([
      Promise.all(
        profileSearchFields.map((field) =>
          supabase
            .from("profiles")
            .select(profileColumns)
            .ilike(field, pattern)
            .limit(20),
        ),
      ),
      supabase
        .from("gaming_accounts")
        .select("user_id, platform, account_id")
        .in("platform", ["ea", "xbox", "pc"])
        .ilike("account_id", pattern)
        .limit(100),
    ]);

    const profileError = profileResponses.find((response) => response.error)?.error;
    if (profileError || accountResponse.error) {
      searchError = profileError?.message || accountResponse.error?.message || "Unknown search error";
    } else {
      const profilesById = new Map<string, ProfileResult>();
      for (const response of profileResponses) {
        for (const profile of response.data || []) {
          profilesById.set(profile.id, profile);
        }
      }

      const matchedAccounts = (accountResponse.data || []) as GamingAccountResult[];
      for (const account of matchedAccounts) {
        if (!accountsByUser.has(account.user_id)) {
          accountsByUser.set(account.user_id, []);
        }
        accountsByUser.get(account.user_id)?.push(account);
      }

      const missingProfileIds = [...accountsByUser.keys()].filter(
        (userId) => !profilesById.has(userId),
      );
      if (missingProfileIds.length > 0) {
        const { data, error } = await supabase
          .from("profiles")
          .select(profileColumns)
          .in("id", missingProfileIds);

        if (error) {
          searchError = error.message;
        } else {
          for (const profile of data || []) {
            profilesById.set(profile.id, profile);
          }
        }
      }

      if (!searchError) {
        results = [...profilesById.values()]
          .sort((first, second) =>
            (first.username || "").localeCompare(second.username || ""),
          )
          .slice(0, 20);
      }
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
        <Link href="/">Home</Link>
        <Link href="/profile">My Profile</Link>
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

            <p>Search by username, EA ID, Xbox gamertag, or PC name.</p>

            <form className="search-box" action="/members" method="get">
              <input name="q" placeholder="Enter a username or gaming ID..." defaultValue={search} />
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
                    {[
                      { platform: "Xbox", name: player.gt_xbox || player.xbox_gt },
                      { platform: "PC", name: player.gt_pc || player.pc_gt },
                      ...(accountsByUser.get(player.id) || []).map((account) => ({
                        platform: account.platform.toUpperCase(),
                        name: account.account_id,
                      })),
                    ]
                      .filter((account) => account.name)
                      .map((account, index) => (
                        <div className="meta" key={`${account.platform}-${index}`}>
                          {account.platform}: {account.name}
                        </div>
                      ))}
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