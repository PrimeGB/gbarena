import Link from "next/link";
import { supabase } from "../../lib/supabase";
import PlayerSearchInput from "../components/PlayerSearchInput";

type ProfileResult = {
  id: string;
  username: string | null;
  gt_xbox: string | null;
  xbox_gt: string | null;
  gt_pc: string | null;
  pc_gt: string | null;
  country?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
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
const profileColumns = "id, username, gt_xbox, xbox_gt, gt_pc, pc_gt, country, location, avatar_url, created_at";

function MemberCard({
  player,
  accounts = [],
  recent = false,
}: {
  player: ProfileResult;
  accounts?: GamingAccountResult[];
  recent?: boolean;
}) {
  const username = player.username || "Unnamed Player";
  const gamingIds = [
    { platform: "Xbox", name: player.gt_xbox || player.xbox_gt },
    { platform: "PC", name: player.gt_pc || player.pc_gt },
    ...accounts.map((account) => ({
      platform: account.platform.toUpperCase(),
      name: account.account_id,
    })),
  ].filter((account) => account.name);

  return (
    <Link className="member-card" href={`/profile?userId=${encodeURIComponent(player.id)}`}>
      <span className="member-avatar">
        {player.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.avatar_url} alt="" loading="lazy" decoding="async" />
        ) : (
          username.slice(0, 2).toUpperCase()
        )}
      </span>
      <span className="member-card-content">
        <span className="member-card-top">
          <strong>{username}</strong>
          {recent && <span className="member-new">NEW</span>}
        </span>
        <span className="member-card-meta">
          {gamingIds.length > 0
            ? gamingIds.slice(0, 2).map((account) => `${account.platform}: ${account.name}`).join(" · ")
            : [player.location, player.country].filter(Boolean).join(", ") || "GameBattles member"}
        </span>
        {recent && player.created_at && (
          <span className="member-joined">
            Joined {new Date(player.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            })}
          </span>
        )}
      </span>
      <span className="member-card-arrow" aria-hidden="true">→</span>
    </Link>
  );
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const searchTerm = search.replace(/[%_]/g, "");

  let results: ProfileResult[] = [];
  let recentPlayers: ProfileResult[] = [];
  const accountsByUser = new Map<string, GamingAccountResult[]>();
  let searchError = "";
  let recentError = "";

  if (searchTerm.length >= 2) {
    const pattern = `%${searchTerm}%`;
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
  } else if (!searchTerm) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, location, country, created_at")
      .not("username", "is", null)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      recentError = error.message;
    } else {
      recentPlayers = (data || []) as ProfileResult[];
    }
  }

  return (
    <main className="members-page">
      <style>{`
        .members-page{min-height:100vh;padding:28px 16px 64px;background:radial-gradient(ellipse at 50% -10%,#16344c 0,#091521 45%,#05090e 100%);color:#e6edf4;font-family:Tahoma,Verdana,Arial,sans-serif}
        .members-wrap{width:min(100%,960px);margin:0 auto}
        .members-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
        .members-brand{display:flex;align-items:center;gap:10px;color:#f5f8fb;text-decoration:none}
        .members-brand-mark{display:grid;width:36px;height:36px;place-items:center;border:1px solid #456b88;border-radius:8px;background:linear-gradient(145deg,#173b56,#0a1a28);color:#f2c14e;font-size:15px;font-weight:900}
        .members-brand-name{font-size:14px;font-weight:900;letter-spacing:.07em}
        .members-brand-tagline{display:block;margin-top:3px;color:#8da7ba;font-size:9px;font-weight:normal;letter-spacing:.1em;text-transform:uppercase}
        .members-nav{display:flex;gap:7px}
        .members-nav a{padding:8px 11px;border:1px solid #29465e;border-radius:6px;background:#0a1722;color:#bfd0de;font-size:11px;font-weight:700;text-decoration:none}
        .members-nav a:hover{border-color:#5a82a0;color:#fff}
        .members-panel{overflow:hidden;border:1px solid #2a4962;border-radius:10px;background:linear-gradient(155deg,rgba(13,31,46,.98),rgba(7,15,23,.99));box-shadow:0 20px 55px rgba(0,0,0,.32)}
        .members-hero{padding:26px 28px 22px;border-bottom:1px solid #20384b}
        .members-kicker{display:flex;align-items:center;gap:8px;color:#f2c14e;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
        .members-kicker:before{width:18px;height:2px;background:#f2c14e;content:""}
        .members-hero h1{margin:10px 0 7px;color:#f7fafc;font-size:clamp(25px,4vw,34px);letter-spacing:-.03em;line-height:1.15}
        .members-hero p{margin:0;color:#a8bdcd;font-size:13px;line-height:1.6}
        .search-box{display:flex;gap:9px;margin-top:20px;padding:8px;border:1px solid #355a75;border-radius:8px;background:#050d14;box-shadow:inset 0 1px 5px rgba(0,0,0,.35)}
        .search-box>div{flex:1;min-width:0}
        .search-box input{display:block;width:100%;height:42px;margin:0;padding:0 12px;border:0;outline:0;background:transparent;color:#f4f8fc;font:13px Tahoma,Verdana,Arial,sans-serif}
        .search-box input::placeholder{color:#71889b}
        .search-box:focus-within{border-color:#76a9cd;box-shadow:0 0 0 3px rgba(83,151,199,.13)}
        .search-box button{min-height:42px;padding:0 17px;border:1px solid #e8c35e;border-radius:6px;background:linear-gradient(180deg,#e6c45f,#b58723);color:#101820;font:900 11px Tahoma,Verdana,Arial,sans-serif;cursor:pointer}
        .search-box button:hover{filter:brightness(1.08)}
        .members-section{padding:21px 28px 26px}
        .section-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}
        .section-heading h2{margin:0;color:#edf4f9;font-size:15px;letter-spacing:.01em}
        .section-heading span{color:#8299ab;font-size:10px}
        .member-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
        .member-card{display:flex;min-width:0;align-items:center;gap:12px;padding:12px;border:1px solid #20384b;border-radius:7px;background:linear-gradient(120deg,#0d1d2b,#09131d);color:inherit;text-decoration:none;transition:border-color .15s,background .15s,transform .15s}
        .member-card:hover{transform:translateY(-1px);border-color:#47718f;background:linear-gradient(120deg,#12283a,#0c1925)}
        .member-card:focus-visible{outline:2px solid #f2c14e;outline-offset:2px}
        .member-avatar{display:grid;width:42px;height:42px;flex:none;place-items:center;overflow:hidden;border:1px solid #34546e;border-radius:7px;background:linear-gradient(145deg,#1b3d56,#102031);color:#d7e8f4;font-size:12px;font-weight:900}
        .member-avatar img{width:100%;height:100%;object-fit:cover}
        .member-card-content{display:grid;min-width:0;gap:4px}
        .member-card-top{display:flex;align-items:center;gap:8px;min-width:0}
        .member-card-top strong{overflow:hidden;color:#f2c14e;font-size:12px;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}
        .member-new{padding:2px 5px;border:1px solid #3e765e;border-radius:3px;background:#102b22;color:#8be0b2;font-size:8px;font-weight:900;letter-spacing:.08em}
        .member-card-meta,.member-joined{overflow:hidden;color:#9eb3c3;font-size:10px;line-height:1.4;text-overflow:ellipsis;white-space:nowrap}
        .member-joined{color:#748da0;font-size:9px}
        .member-card-arrow{margin-left:auto;color:#6e899e;font-size:17px}
        .members-note,.members-error,.members-empty{padding:13px 15px;border:1px solid #263f53;border-radius:6px;background:#091621;color:#a8bdcd;font-size:12px;line-height:1.55}
        .members-error{border-color:#713b43;background:#211116;color:#ffb7bd}
        .members-empty{border-style:dashed;color:#a8bdcd}
        .search-context{margin:0 0 13px;color:#9eb3c3;font-size:12px}
        .search-context strong{color:#f2c14e}
        @media(max-width:620px){.members-page{padding:18px 10px 40px}.members-hero{padding:21px 17px 18px}.members-section{padding:18px 17px 22px}.members-nav{gap:5px}.members-nav a{padding:7px 8px;font-size:10px}.members-brand-name{font-size:12px}.search-box{gap:6px}.search-box button{padding:0 10px;font-size:10px}.member-grid{grid-template-columns:1fr}}
        @media(max-width:370px){.members-brand-tagline{font-size:8px}.members-nav a{padding:7px 6px}.search-box button{padding:0 8px}}
      `}</style>

      <div className="members-wrap">
        <div className="members-topbar">
          <Link className="members-brand" href="/home">
            <span className="members-brand-mark" aria-hidden="true">GB</span>
            <span>
              <span className="members-brand-name">GAMEBATTLES</span>
              <span className="members-brand-tagline">Where gaming finds its edge</span>
            </span>
          </Link>
          <nav className="members-nav" aria-label="Member navigation">
            <Link href="/profile">My Profile</Link>
          </nav>
        </div>

        <section className="members-panel">
          <header className="members-hero">
            <div className="members-kicker">Community directory</div>
            <h1>Find your next teammate.</h1>
            <p>Search GameBattles members by username or gaming ID, or meet players who have just joined.</p>
            <form className="search-box" action="/members" method="get">
              <PlayerSearchInput name="q" placeholder="Username, EA ID, Xbox gamertag, or PC name" defaultValue={search} />
              <button type="submit">Search Members</button>
            </form>
          </header>

          <section className="members-section" aria-labelledby={search ? "search-results-heading" : "recent-players-heading"}>
            {search && searchTerm.length < 2 && (
              <div className="members-note">Enter at least 2 characters to search members.</div>
            )}
            {searchError && <div className="members-error" role="alert">Search error: {searchError}</div>}

            {searchTerm.length >= 2 ? (
              <>
                <div className="section-heading">
                  <h2 id="search-results-heading">Search results</h2>
                  <span>{results.length} {results.length === 1 ? "player" : "players"}</span>
                </div>
                {!searchError && <p className="search-context">Matches for <strong>{search}</strong></p>}
                {!searchError && results.length === 0 && (
                  <div className="members-empty">No members found. Try another username or gaming ID.</div>
                )}
                <div className="member-grid">
                  {results.map((player) => (
                    <MemberCard
                      key={player.id}
                      player={player}
                      accounts={accountsByUser.get(player.id) || []}
                    />
                  ))}
                </div>
              </>
            ) : !search ? (
              <>
                <div className="section-heading">
                  <h2 id="recent-players-heading">Recently joined</h2>
                  <span>Meet the newest members</span>
                </div>
                {recentError && <div className="members-error" role="alert">Recently joined players could not be loaded: {recentError}</div>}
                {!recentError && recentPlayers.length === 0 && (
                  <div className="members-empty">New players will appear here as they join GameBattles.</div>
                )}
                {!recentError && (
                  <div className="member-grid">
                    {recentPlayers.map((player) => (
                      <MemberCard key={player.id} player={player} recent />
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
