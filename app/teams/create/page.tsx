"use client";

import Link from "next/link";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useUser } from "../../../lib/useUser";
import { gamingCategoryLabel, gamingGameLabel, gamingGames } from "../../../lib/gamingAccounts";
import { rapidRoyalDisplayName } from "../../../lib/rapidRoyal";
import {
  categoriesForPlatform,
  gamesForCategory,
  ladderGameImage,
  ladderPlatformLabel,
  ladderPlatforms,
  ladderTitleForGame,
  laddersForGame,
} from "../../../lib/ladderCatalog";

function cleanName(value: string | null) {
  if (!value) return "Team";
  value = rapidRoyalDisplayName(value);

  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const gameNames: Record<string, string> = {
  "modern-warfare-4": "Call of Duty: Modern Warfare (2019)",
  "black-ops-6": "Call of Duty: Black Ops 6",
  "modern-warfare-iii": "Call of Duty: Modern Warfare III (2023)",
  warzone: "Call of Duty: Warzone",
  "modern-warfare-ii": "Call of Duty: Modern Warfare II (2022)",
  vanguard: "Call of Duty: Vanguard",
  "black-ops-cold-war": "Call of Duty: Black Ops Cold War",
  "battlefield-6": "Battlefield 6",
  "battlefield-2042": "Battlefield 2042",
  "battlefield-v": "Battlefield V",
  "battlefield-1": "Battlefield 1",
};

export default function CreateTeamPage() {
  return (
    <Suspense fallback={<div className="create-team-loading">Loading Create Team...</div>}>
      <CreateTeamContent />
    </Suspense>
  );
}

function ChooseTeamLadder() {
  const [platform, setPlatform] = useState("");
  const [gameSelection, setGameSelection] = useState("");
  const [ladderSelection, setLadderSelection] = useState("");
  const [availability, setAvailability] = useState<{ key: string; team?: { id: string; name: string }; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const { user, loading: userLoading } = useUser();
  const groups = categoriesForPlatform(platform).map((category) => ({
    ...category,
    games: gamesForCategory(category.value, platform).map((game) => ({
      value: `${category.value}/${game.value}`,
      category: category.value,
      game: game.value,
      name: gameNames[game.value] || `${category.label}: ${game.label}`,
    })),
  })).filter((group) => group.games.length > 0);
  const selectedGame = groups.flatMap((group) => group.games).find((game) => game.value === gameSelection);
  const ladders = selectedGame ? laddersForGame(selectedGame.category, selectedGame.game) : [];
  const selectedLadder = ladders.find((ladder) => ladder.slug === ladderSelection);
  const ladderTitle = selectedLadder?.slug === "singles" ? "Solos" : selectedLadder?.title;
  const hubUrl = selectedGame && selectedLadder
    ? `/team-hub?${new URLSearchParams({ platform, category: selectedGame.category, game: selectedGame.game, ladder: selectedLadder.slug })}`
    : "";
  const artwork = selectedGame ? ladderGameImage(selectedGame.category, selectedGame.game) : null;
  const category = selectedGame?.category || "";
  const game = selectedGame?.game || "";
  const ladder = selectedLadder?.slug || "";
  const availabilityKey = `${user?.id || ""}/${platform}/${category}/${game}/${ladder}`;

  useEffect(() => {
    if (!user?.id || !platform || !category || !game || !ladder) return;
    let active = true;
    const userId = user.id;

    async function checkExistingTeam() {
      try {
        const [memberships, owned] = await Promise.all([
          supabase.from("team_members").select("team_id").eq("user_id", userId),
          supabase.from("teams").select("id,name").eq("owner_id", userId)
            .eq("platform", platform).eq("category", category).eq("game", game).eq("ladder", ladder).limit(1),
        ]);
        if (memberships.error || owned.error) {
          throw new Error((memberships.error || owned.error)?.message || "Could not check your teams.");
        }
        let team = owned.data?.[0];
        const teamIds = (memberships.data || []).map((membership) => membership.team_id);
        if (!team && teamIds.length > 0) {
          const memberTeams = await supabase.from("teams").select("id,name")
            .in("id", teamIds).eq("platform", platform).eq("category", category)
            .eq("game", game).eq("ladder", ladder).limit(1);
          if (memberTeams.error) throw new Error(memberTeams.error.message);
          team = memberTeams.data?.[0];
        }
        if (active) setAvailability({ key: availabilityKey, team });
      } catch (error) {
        if (active) setAvailability({ key: availabilityKey, error: error instanceof Error ? error.message : "Could not check your teams." });
      }
    }

    void checkExistingTeam();
    return () => { active = false; };
  }, [user?.id, platform, category, game, ladder, availabilityKey, retry]);

  const checking = !!selectedLadder && (userLoading || (!!user && availability?.key !== availabilityKey));
  const existingTeam = availability?.key === availabilityKey ? availability.team : undefined;
  const availabilityError = availability?.key === availabilityKey ? availability.error : undefined;
  const canContinue = !!selectedLadder && !checking && !existingTeam && !availabilityError;

  return (
    <main className="choose-team-page">
      <style>{`
        .choose-team-page{min-height:100vh;padding:30px 20px 54px;background:radial-gradient(ellipse at 50% 0,#102b42 0,#02070d 52%,#000 100%);color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .choose-team-page *{box-sizing:border-box}
        .choose-team-wrap{max-width:1060px;margin:auto;background:#07111b;border:1px solid #315f88;box-shadow:0 12px 40px #000b}
        .choose-team-header{position:relative;overflow:hidden;padding:28px 30px;background:radial-gradient(ellipse at 86% 20%,#26577b 0,transparent 46%),linear-gradient(115deg,#173b58,#07111b 78%);border-bottom:1px solid #3b719d}
        .choose-team-eyebrow{margin:0 0 8px;color:#f2c14e;font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase}
        .choose-team-header h1{margin:0;color:#fff;font-size:32px;font-weight:900;letter-spacing:.3px;text-transform:uppercase}
        .choose-team-header p{margin:8px 0 0;color:#c1d5e4;font-size:13px;line-height:1.5}
        .choose-team-steps{display:flex;gap:24px;padding:13px 30px;background:#0a1a29;border-bottom:1px solid #254b69;color:#829caf;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px}
        .choose-team-steps .current{color:#f2c14e}
        .choose-team-content{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(240px,1fr);gap:24px;padding:28px 30px 30px}
        .choose-team-form{min-width:0}
        .choose-team-section{margin:0;padding:0;border:0}
        .choose-team-section + .choose-team-section{margin-top:28px}
        .choose-team-heading{display:flex;align-items:center;gap:10px;margin:0 0 7px;color:#fff;font-size:15px;font-weight:900}
        .choose-team-number{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;border:1px solid #507fa2;border-radius:50%;background:#102b40;color:#f2c14e;font-size:11px;flex:none}
        .choose-team-help{margin:0 0 14px;color:#a9c3d6;font-size:12px;line-height:1.5}
        .choose-team-systems{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
        .choose-team-system{min-width:0;min-height:50px;padding:9px 5px;border:1px solid #315875;background:#0a1b29;color:#c2d6e5;font:700 12px Tahoma,Verdana,Arial,sans-serif;cursor:pointer}
        .choose-team-system:hover{background:#173852;border-color:#6292b5}
        .choose-team-system[aria-pressed="true"]{background:linear-gradient(#275572,#102a3c);border-color:#72b8e3;color:#fff;box-shadow:inset 0 -3px #f2c14e}
        .choose-team-system:focus-visible,.choose-team-choice:focus-visible,.choose-team-button:focus-visible,.choose-team-back:focus-visible,.choose-team-retry:focus-visible{outline:2px solid #f2c14e;outline-offset:2px}
        .choose-team-game-list{max-height:300px;overflow-y:auto;padding:2px 6px 2px 0;scrollbar-color:#5685a6 #0a1a29;scrollbar-width:thin}
        .choose-team-group + .choose-team-group{margin-top:15px}
        .choose-team-group h3{margin:0 0 7px;color:#91aec2;font-size:10px;font-weight:900;letter-spacing:.7px;text-transform:uppercase}
        .choose-team-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
        .choose-team-choice{min-height:44px;padding:10px 12px;border:1px solid #315875;background:#0a1b29;color:#c2d6e5;text-align:left;font:700 12px Tahoma,Verdana,Arial,sans-serif;line-height:1.35;cursor:pointer}
        .choose-team-choice:hover{background:#173852;border-color:#6292b5}
        .choose-team-choice[aria-pressed="true"]{background:linear-gradient(#275572,#102a3c);border-color:#72b8e3;color:#fff;box-shadow:inset 3px 0 #f2c14e}
        .choose-team-ladders{display:flex;flex-wrap:wrap;gap:7px}
        .choose-team-ladder-options{margin-top:20px}
        .choose-team-ladders .choose-team-choice{min-width:100px;text-align:center}
        .choose-team-status{margin:14px 0 0;color:#c6d9e7;font-size:12px;line-height:1.5}
        .choose-team-status a{color:#9bcff2}
        .choose-team-retry{padding:0;border:0;background:none;color:#9bcff2;font:inherit;text-decoration:underline;cursor:pointer}
        .choose-team-summary{align-self:start;overflow:hidden;border:1px solid #315a79;background:#091724}
        .choose-team-summary-hero{min-height:145px;display:flex;flex-direction:column;justify-content:flex-end;padding:20px;background:radial-gradient(ellipse at 85% 0,#285d7d,transparent 65%),linear-gradient(135deg,#153b56,#091724);background-size:cover;background-position:center}
        .choose-team-summary-label{color:#f2c14e;font-size:10px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase}
        .choose-team-summary-hero strong{display:block;margin-top:7px;color:#fff;font-size:19px;line-height:1.25;text-shadow:0 2px 6px #000}
        .choose-team-summary-body{padding:17px 20px}
        .choose-team-summary-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #1d3b51;color:#9eb8ca;font-size:12px}
        .choose-team-summary-row strong{color:#edf6fb;text-align:right}
        .choose-team-summary-note{margin:13px 0 0;color:#9eb8ca;font-size:12px;line-height:1.55}
        .choose-team-actions{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:24px}
        .choose-team-button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 20px;border:1px solid #ffe08a;background:linear-gradient(#f2c14e,#bc8c25);color:#101820;font-size:12px;font-weight:900;letter-spacing:.3px;text-decoration:none;text-transform:uppercase}
        .choose-team-button:hover{background:linear-gradient(#ffdc79,#d3a13a)}
        .choose-team-button[aria-disabled="true"]{border-color:#36566c;background:#152b3a;color:#7892a2;cursor:not-allowed}
        .choose-team-back{color:#9bcff2;font-size:12px;text-decoration:none}
        .choose-team-back:hover{text-decoration:underline}
        @media(max-width:700px){.choose-team-page{padding:12px 10px 35px}.choose-team-header{padding:22px 18px}.choose-team-header h1{font-size:26px}.choose-team-steps{padding:12px 18px;gap:16px}.choose-team-content{grid-template-columns:1fr;padding:20px 18px;gap:22px}.choose-team-summary{order:2}.choose-team-systems{grid-template-columns:repeat(3,minmax(0,1fr))}}
      `}</style>
      <div className="choose-team-wrap">
        <header className="choose-team-header">
          <div className="choose-team-eyebrow">GameBattles / Teams</div>
          <h1>Create a Team</h1>
          <p>Pick your system and ladder. Then bring your team to life.</p>
        </header>
        <div className="choose-team-steps" aria-label="Team creation progress">
          <span className="current">01 &nbsp; Choose your ladder</span><span>02 &nbsp; Team setup</span>
        </div>
        <div className="choose-team-content">
          <div className="choose-team-form">
            <fieldset className="choose-team-section">
              <legend className="choose-team-heading"><span className="choose-team-number">1</span> Choose your system</legend>
              <p className="choose-team-help">Where will your team compete?</p>
              <div className="choose-team-systems">
                {ladderPlatforms.map((item) => (
                  <button className="choose-team-system" key={item.value} type="button" aria-pressed={platform === item.value} onClick={() => {
                    if (platform !== item.value) {
                      setPlatform(item.value);
                      setGameSelection("");
                      setLadderSelection("");
                      setAvailability(null);
                    }
                  }}>{item.label}</button>
                ))}
              </div>
            </fieldset>
            <section className="choose-team-section" aria-labelledby="choose-ladder-heading">
              <h2 className="choose-team-heading" id="choose-ladder-heading"><span className="choose-team-number">2</span> Choose your ladder</h2>
              <p className="choose-team-help">{platform ? "Pick a game, then choose its ladder." : "Choose a system to see its games and ladders."}</p>
              {platform && (
                <div className="choose-team-game-list" aria-label="Available games">
                  {groups.map((group) => (
                    <div className="choose-team-group" key={group.value}>
                      <h3>{group.label}</h3>
                      <div className="choose-team-choices">
                        {group.games.map((item) => (
                          <button className="choose-team-choice" type="button" key={item.value} aria-pressed={gameSelection === item.value} onClick={() => {
                            if (gameSelection !== item.value) {
                              setGameSelection(item.value);
                              setLadderSelection("");
                              setAvailability(null);
                            }
                          }}>{item.name}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedGame && (
                <div className="choose-team-ladder-options">
                  <h3 className="choose-team-heading">Ladders for {selectedGame.name}</h3>
                  <div className="choose-team-ladders">
                    {ladders.map((item) => (
                      <button className="choose-team-choice" type="button" key={item.slug} aria-pressed={ladderSelection === item.slug} onClick={() => {
                        if (ladderSelection !== item.slug) {
                          setLadderSelection(item.slug);
                          setAvailability(null);
                        }
                      }}>{item.slug === "singles" ? "Solos" : item.title}</button>
                    ))}
                  </div>
                </div>
              )}
              <div aria-live="polite">
                {checking && <p className="choose-team-status">Checking your teams...</p>}
                {existingTeam && <p className="choose-team-status">You already have a team on this system and ladder: <Link href={`/teams/${existingTeam.id}`}>{existingTeam.name}</Link>.</p>}
                {availabilityError && <p className="choose-team-status">Could not check your teams: {availabilityError} <button type="button" className="choose-team-retry" onClick={() => { setAvailability(null); setRetry((value) => value + 1); }}>Try again</button></p>}
              </div>
            </section>
            <div className="choose-team-actions">
              {canContinue
                ? <Link className="choose-team-button" href={hubUrl}>Continue to Team Setup →</Link>
                : <span className="choose-team-button" aria-disabled="true">Continue to Team Setup →</span>}
              <Link className="choose-team-back" href="/profile">Back to Profile</Link>
            </div>
          </div>
          <aside className="choose-team-summary" aria-label="Your selection">
            <div className="choose-team-summary-hero" style={artwork ? { backgroundImage: `linear-gradient(0deg, #091724 0%, #09172499 65%, #09172455 100%), url("${artwork}")` } : undefined}>
              <span className="choose-team-summary-label">Your team starts here</span>
              <strong>{selectedGame ? selectedGame.name : "Find your ladder"}</strong>
            </div>
            <div className="choose-team-summary-body">
              <div className="choose-team-summary-row"><span>System</span><strong>{ladderPlatformLabel(platform) || "Not selected"}</strong></div>
              <div className="choose-team-summary-row"><span>Ladder</span><strong>{ladderTitle || "Not selected"}</strong></div>
              <p className="choose-team-summary-note">Each team competes on one system and ladder. You can create another team for a different ladder.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CreateTeamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const platformSlug = searchParams.get("platform") || "xbox";
  const categorySlug = searchParams.get("category") || "call-of-duty";
  const gameSlug = searchParams.get("game") || "modern-warfare-4";
  const ladderSlug = searchParams.get("ladder") || "team";

  const gameName =
    gameNames[gameSlug] ||
    (gamingGames.some((g) => g.category === categorySlug && g.value === gameSlug)
      ? `${gamingCategoryLabel(categorySlug)}: ${gamingGameLabel(categorySlug, gameSlug)}`
      : cleanName(gameSlug));
  const ladderName = ladderTitleForGame(categorySlug, gameSlug, ladderSlug) || cleanName(ladderSlug);
  const platformName = ladderPlatformLabel(platformSlug) || cleanName(platformSlug);

  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const backUrl = `/team-hub?platform=${platformSlug}&category=${categorySlug}&game=${gameSlug}&ladder=${ladderSlug}`;

  if (!searchParams.get("platform") || !searchParams.get("category") || !searchParams.get("game") || !searchParams.get("ladder")) {
    return <ChooseTeamLadder />;
  }

  async function createTeam() {
    setMessage("");

    const cleanTeamName = teamName.trim();
    const cleanTeamTag = teamTag.trim().toUpperCase();

    if (!cleanTeamName || cleanTeamName.length < 4) {
      setMessage("Team name must be at least 4 characters.");
      return;
    }

    if (!cleanTeamTag || cleanTeamTag.length > 5) {
      setMessage("Team tag is required and must be 5 characters or less.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      setMessage("You must be signed in to create a team.");
      return;
    }

    const { data: existingTeam, error: checkError } = await supabase
      .from("teams")
      .select("id")
      .eq("owner_id", user.id)
      .eq("platform", platformSlug)
      .eq("category", categorySlug)
      .eq("game", gameSlug)
      .eq("ladder", ladderSlug)
      .maybeSingle();

    if (checkError) {
      setSaving(false);
      setMessage("Database check failed. We may need to update the teams table.");
      return;
    }

    if (existingTeam) {
      setSaving(false);
      setMessage("You already have a team for this exact platform, game, and ladder.");
      return;
    }

    const { data: createdTeam, error: insertError } = await supabase
      .from("teams")
      .insert({
        owner_id: user.id,
        name: cleanTeamName,
        tag: cleanTeamTag,
        platform: platformSlug,
        category: categorySlug,
        game: gameSlug,
        ladder: ladderSlug,
      })
      .select("id")
      .single();

    if (insertError || !createdTeam) {
      setSaving(false);
      setMessage("Team could not be created. We may need to fix Supabase next.");
      return;
    }

    router.push(`/team-hub?team=${createdTeam.id}&platform=${platformSlug}&category=${categorySlug}&game=${gameSlug}&ladder=${ladderSlug}`);
  }

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#000;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        a{text-decoration:none;}

        .create-team-loading{
          min-height:100vh;
          background:#000;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        .page{
          min-height:100vh;
          background:radial-gradient(circle at top,rgba(20,80,130,.36),transparent 42%),#000;
          padding:40px 24px;
        }

        .wrap{
          max-width:900px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #2f6f9f;
          box-shadow:0 0 35px rgba(0,90,160,.5);
        }

        .top-strip{
          height:30px;
          background:linear-gradient(to bottom,#9a0000,#3a0000);
          border-bottom:1px solid #b10000;
          display:flex;
          justify-content:flex-end;
          align-items:center;
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
          min-height:96px;
          background:linear-gradient(to bottom,#15324b,#07111b);
          border-bottom:2px solid #2f6f9f;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 24px;
        }

        .logo-link{
          display:block;
        }

        .logo-main{
          color:#f4f8ff;
          font-size:42px;
          font-weight:bold;
          font-style:italic;
          text-transform:uppercase;
          text-shadow:0 2px 4px #000;
          cursor:pointer;
        }

        .logo-sub{
          color:#67bdff;
          font-size:12px;
          font-weight:bold;
          letter-spacing:3px;
          text-transform:uppercase;
          margin-top:7px;
        }

        .badge{
          color:#f2c14e;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#205077,#0a1724);
          padding:12px 18px;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
        }

        .title-bar{
          background:linear-gradient(to bottom,#205077,#0a1724);
          border-bottom:1px solid #2f638f;
          padding:24px;
        }

        .title-bar h1{
          color:#f2c14e;
          font-size:30px;
          text-transform:uppercase;
          margin-bottom:8px;
        }

        .title-bar p{
          color:#cfe2f2;
          font-size:14px;
        }

        .content{
          padding:24px;
        }

        .panel{
          background:#050c14;
          border:1px solid #244b70;
          padding:24px;
        }

        .label{
          color:#f2c14e;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:8px;
        }

        .input{
          width:100%;
          height:46px;
          background:#07111b;
          border:1px solid #244b70;
          color:#fff;
          padding:0 12px;
          font-size:15px;
          margin-bottom:18px;
          outline:none;
        }

        .input:focus{
          border-color:#67bdff;
          box-shadow:0 0 10px rgba(103,189,255,.35);
        }

        .message{
          margin:0 0 18px;
          padding:12px;
          border:1px solid #93670d;
          background:#140f05;
          color:#f2c14e;
          font-size:13px;
          font-weight:bold;
        }

        .btn-row{
          display:flex;
          gap:12px;
          margin-top:8px;
        }

        .btn{
          min-width:170px;
          height:48px;
          border:1px solid #4b95d8;
          background:linear-gradient(to bottom,#205077,#0a1724);
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          cursor:pointer;
        }

        .btn.gold{
          background:linear-gradient(to bottom,#f2c14e,#93670d);
          color:#06111b;
          border-color:#ffe08a;
        }

        .btn.red{
          background:linear-gradient(to bottom,#d60000,#700000);
          border-color:#ff4b4b;
        }

        .btn:disabled{
          opacity:.55;
          cursor:not-allowed;
        }

        .footer{
          height:36px;
          background:#07111b;
          border-top:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:11px;
        }
        @media(max-width:768px){
          .page{padding:10px 0 32px;}
          .wrap{width:calc(100% - 20px);}
          .header{align-items:flex-start;flex-direction:column;gap:12px;padding:18px 14px;}
          .logo-main{font-size:clamp(26px,8vw,38px);overflow-wrap:anywhere;}
          .badge{padding:9px 12px;}
          .title-bar,.content,.panel{padding:16px;}
          .btn-row{flex-wrap:wrap;}
          .btn{flex:1 1 150px;min-width:0;}
        }
      `}</style>

      <main className="page team-create-page">
        <div className="wrap">
          <header className="header">
            <Link className="logo-link" href="/home">
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">Create Team</div>
            </Link>

            <div className="badge">{platformName} · {ladderName} Ladder</div>
          </header>

          <section className="title-bar">
            <h1>Create Team</h1>
            <p>
              {gameName} · {platformName} · {ladderName} Ladder
            </p>
          </section>

          <section className="content">
            <div className="panel">
              {message ? <div className="message">{message}</div> : null}

              <div className="label">Team Name</div>
              <input
                className="input"
                placeholder="Enter your team name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
              />

              <div className="label">Team Tag</div>
              <input
                className="input"
                placeholder="Example: GB"
                maxLength={5}
                value={teamTag}
                onChange={(event) => setTeamTag(event.target.value)}
              />

              <div className="btn-row">
                <button className="btn gold" onClick={createTeam} disabled={saving}>
                  {saving ? "Creating..." : "Create Team"}
                </button>

                <a className="btn red" href={backUrl}>
                  Back
                </a>
              </div>
            </div>
          </section>

          <footer className="footer">
            © 2026 Competitive Gaming Network
          </footer>
        </div>
      </main>
    </>
  );
}