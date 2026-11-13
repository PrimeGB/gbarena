"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { rapidRoyalDisplayName } from "../../lib/rapidRoyal";
import { rankSiteResults, searchFilter, type SiteSearchResult } from "../../lib/searchRanking";
import { siteSearchIndex } from "../../lib/siteSearch";

type Player = { id: string; username: string | null };
type Team = {
  id: string; name: string | null; tag: string | null; platform: string | null;
  game: string | null; ladder: string | null; logo_url: string | null;
  wins: number | null; losses: number | null;
};
type ForumPost = { id: number; subject: string; message: string | null; category: string; author: string };
type Tournament = { id: string; title: string; game: string | null; platform: string | null; status: string };
type Award = { name: string; award_group: string; purpose: string };

function SearchPageInner() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim().slice(0, 120);
  const [dynamicResults, setDynamicResults] = useState<SiteSearchResult[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const loading = !!searchFilter(query, ["username"]) && searchedQuery !== query;
  const results = useMemo(
    () => rankSiteResults(query, [...siteSearchIndex, ...(searchedQuery === query ? dynamicResults : [])]).slice(0, 60),
    [query, searchedQuery, dynamicResults],
  );

  useEffect(() => {
    let active = true;
    const playerFilter = searchFilter(query, ["username"]);
    if (!playerFilter) return;

    async function runSearch() {
      const [players, teams, posts, tournaments, awards] = await Promise.all([
        supabase.from("profiles").select("id,username").or(playerFilter).limit(50),
        supabase.from("teams").select("id,name,tag,platform,game,ladder,logo_url,wins,losses")
          .or(searchFilter(query, ["name", "tag"])).limit(50),
        supabase.from("forum_posts").select("id,subject,message,category,author").eq("hidden", false)
          .or(searchFilter(query, ["subject", "message"])).limit(50),
        supabase.from("tournaments").select("id,title,game,platform,status")
          .in("status", ["upcoming", "live"])
          .or(searchFilter(query, ["title", "game", "platform"])).limit(50),
        supabase.rpc("staff_public_award_catalog"),
      ]);
      if (!active) return;

      const unavailable: string[] = [];
      if (players.error) unavailable.push("players");
      if (teams.error) unavailable.push("teams");
      if (posts.error) unavailable.push("forum posts");
      if (tournaments.error) unavailable.push("tournaments");
      if (awards.error) unavailable.push("awards");

      const found: SiteSearchResult[] = [
        ...((players.data || []) as Player[]).map((player) => ({
          id: `player:${player.id}`, href: `/profile?userId=${encodeURIComponent(player.id)}`,
          title: player.username || "Unknown Player", type: "Player", description: "GameBattles member",
        })),
        ...((teams.data || []) as Team[]).map((team) => ({
          id: `team:${team.id}`, href: `/teams/${encodeURIComponent(team.id)}`,
          title: team.name || "Unknown Team", type: "Team",
          description: [team.tag ? `[${team.tag}]` : "", team.platform, team.game, rapidRoyalDisplayName(team.ladder || ""), `${team.wins || 0}-${team.losses || 0}`].filter(Boolean).join(" · "),
          keywords: team.tag || "", imageUrl: team.logo_url,
        })),
        ...((posts.data || []) as ForumPost[]).map((post) => ({
          id: `forum:${post.id}`, href: `/forums/${post.id}`, title: post.subject,
          description: `${post.category} · ${post.author}`, keywords: post.message || "", type: "Forum",
        })),
        ...((tournaments.data || []) as Tournament[]).map((tournament) => ({
          id: `tournament:${tournament.id}`, href: `/tournaments/${encodeURIComponent(tournament.id)}`,
          title: tournament.title, description: [tournament.platform, tournament.game, tournament.status].filter(Boolean).join(" · "),
          type: "Tournament",
        })),
        ...((awards.data || []) as Award[]).map((award) => ({
          id: `award:${award.name}`, href: "/awards", title: award.name,
          description: award.purpose, keywords: `${award.award_group} trophy achievement`, type: "Award",
        })),
      ];
      setDynamicResults(found);
      setErrors(unavailable);
      setSearchedQuery(query);
    }

    void runSearch();
    return () => { active = false; };
  }, [query]);

  return (
    <main className="search-page">
      <div className="search-wrap">
        <header className="search-header">
          <p>GAMEBATTLES</p>
          <h1>Search the site</h1>
          <span>Find games, ladders, players, teams, forums and more.</span>
        </header>
        <form action="/search" className="search-form" role="search">
          <input name="q" defaultValue={query} key={query} maxLength={120} placeholder="Search GameBattles" aria-label="Search GameBattles" autoComplete="off" />
          <button type="submit">Search</button>
        </form>
        <section aria-live="polite" aria-busy={loading}>
          {!query ? (
            <p className="notice">Enter a name, game, topic or keyword to search.</p>
          ) : !searchFilter(query, ["username"]) ? (
            <p className="notice">Enter a letter or number to search.</p>
          ) : (
            <>
              <div className="results-heading">
                <h2>Results for &ldquo;{query}&rdquo;</h2>
                <span>{loading ? "Searching..." : "Best matches"}</span>
              </div>
              {!loading && errors.length > 0 && (
                <p className="warning" role="alert">Some results could not be loaded: {errors.join(", ")}. Please try again.</p>
              )}
              {results.length === 0 && !loading ? (
                <p className="notice">No matches found. Try a different name or keyword.</p>
              ) : (
                <div className="results">
                  {results.map((result) => (
                    <Link href={result.href} className="result" key={result.id}>
                      {result.imageUrl && <img src={result.imageUrl} alt="" loading="lazy" decoding="async" />}
                      <div className="result-copy">
                        <span className="type">{result.type}</span>
                        <strong>{result.title}</strong>
                        <span className="description">{result.description}</span>
                      </div>
                      <span className="arrow" aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              )}
              {!loading && results.length === 60 && <p className="notice">Showing the best 60 matches. Add more keywords to narrow your search.</p>}
            </>
          )}
        </section>
      </div>
      <style jsx>{`
        .search-page{min-height:100vh;background:#050b12;color:#eaf3fb;padding:40px 20px;font-family:Arial,sans-serif}
        .search-wrap{max-width:900px;margin:0 auto}
        .search-header{border-bottom:3px solid #b61e25;padding-bottom:22px}
        .search-header p{margin:0 0 8px;color:#ea6268;font-weight:800;font-size:11px;letter-spacing:.15em}
        .search-header h1{margin:0;color:#fff;font-size:32px;font-weight:900}
        .search-header span{display:block;color:#aabed0;font-size:14px;margin-top:8px}
        .search-form{display:flex;margin:24px 0;gap:8px}
        .search-form input{flex:1;min-width:0;background:#101e2b;color:#fff;border:1px solid #40586c;padding:13px;font-size:16px}
        .search-form button{border:0;background:#a71920;color:#fff;padding:0 22px;font-weight:800;cursor:pointer}
        .search-form input:focus-visible,.search-form button:focus-visible,.result:focus-visible{outline:2px solid #8cc9ff;outline-offset:2px}
        .results-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #314555}
        .results-heading h2{margin:0;font-size:17px;overflow-wrap:anywhere}
        .results-heading span{color:#9db1c1;font-size:12px;white-space:nowrap}
        .result{display:flex;align-items:center;gap:14px;padding:16px 4px;border-bottom:1px solid #1e3242;color:inherit;text-decoration:none}
        .result:hover{background:#102131}
        .result img{width:46px;height:46px;object-fit:cover}
        .result-copy{min-width:0;flex:1}
        .result-copy span,.result-copy strong{display:block}
        .type{color:#e87c80;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
        .result-copy strong{color:#f5f9fc;font-size:15px;margin-top:4px;overflow-wrap:anywhere}
        .description{color:#a7becf;font-size:12px;margin-top:5px;line-height:1.4;overflow-wrap:anywhere}
        .arrow{color:#8eb8d4;font-size:22px}
        .notice,.warning{padding:18px 0;color:#b8cbd9;font-size:14px;line-height:1.5}
        .warning{color:#ffb5a8}
        @media(max-width:600px){.search-page{padding:25px 16px}.search-header h1{font-size:27px}.search-form button{padding:0 16px}}
      `}</style>
    </main>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div style={{ color: "white", padding: 40 }}>Loading search...</div>}><SearchPageInner /></Suspense>;
}
