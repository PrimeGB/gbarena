"use client";

import Link from "next/link";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { gamingCategoryLabel, gamingGameLabel, gamingGames } from "../../../lib/gamingAccounts";
import { rapidRoyalDisplayName } from "../../../lib/rapidRoyal";
import {
  categoriesForPlatform,
  gamesForCategory,
  ladderPlatformLabel,
  ladderPlatforms,
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
  const [category, setCategory] = useState("");
  const [game, setGame] = useState("");
  const [ladder, setLadder] = useState("");
  const categories = categoriesForPlatform(platform);
  const games = gamesForCategory(category);
  const ladders = category && game ? laddersForGame(category, game) : [];
  const hubUrl = `/team-hub?${new URLSearchParams({ platform, category, game, ladder })}`;

  return (
    <main className="choose-team-page">
      <style>{`
        .choose-team-page{min-height:100vh;padding:40px 24px;background:radial-gradient(circle at top,rgba(20,80,130,.36),transparent 42%),#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .choose-team-wrap{max-width:900px;margin:auto;background:#07111b;border:1px solid #2f6f9f;box-shadow:0 0 35px rgba(0,90,160,.5)}
        .choose-team-top{display:flex;justify-content:flex-end;gap:18px;padding:9px 14px;background:linear-gradient(to bottom,#9a0000,#3a0000)}
        .choose-team-top a{color:#fff;font-size:12px;font-weight:bold;text-decoration:none;text-transform:uppercase}
        .choose-team-header{padding:20px 24px;background:linear-gradient(to bottom,#15324b,#07111b);border-bottom:2px solid #2f6f9f}
        .choose-team-logo{color:#f4f8ff;font-size:38px;font-weight:bold;font-style:italic;text-decoration:none;text-transform:uppercase}
        .choose-team-title{padding:24px;background:linear-gradient(to bottom,#205077,#0a1724);border-bottom:1px solid #2f638f}
        .choose-team-title h1{margin:0 0 8px;color:#f2c14e;font-size:28px;text-transform:uppercase}
        .choose-team-title p{margin:0;color:#cfe2f2;font-size:14px;line-height:1.5}
        .choose-team-content{padding:24px}
        .choose-team-panel{padding:24px;border:1px solid #244b70;background:#050c14}
        .choose-team-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .choose-team-field{display:flex;flex-direction:column;gap:8px;color:#f2c14e;font-size:12px;font-weight:bold;text-transform:uppercase}
        .choose-team-field select{width:100%;height:46px;padding:0 12px;border:1px solid #3b7fc2;background:#07111b;color:#fff;font:14px Tahoma,Verdana,Arial,sans-serif}
        .choose-team-field select:disabled{opacity:.55}
        .choose-team-field select:focus-visible,.choose-team-button:focus-visible{outline:2px solid #f2c14e;outline-offset:2px}
        .choose-team-actions{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:24px}
        .choose-team-button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 20px;border:1px solid #ffe08a;background:linear-gradient(to bottom,#f2c14e,#93670d);color:#06111b;font-size:13px;font-weight:900;text-decoration:none;text-transform:uppercase}
        .choose-team-back{color:#8ac6f5;font-size:13px}
        .choose-team-note{margin:16px 0 0;color:#a9c3db;font-size:12px;line-height:1.5}
        @media(max-width:600px){.choose-team-page{padding:10px}.choose-team-logo{font-size:clamp(25px,8vw,38px)}.choose-team-content,.choose-team-panel,.choose-team-title{padding:16px}.choose-team-fields{grid-template-columns:1fr}}
      `}</style>
      <div className="choose-team-wrap">
        <header className="choose-team-header">
          <Link className="choose-team-logo" href="/home">GameBattles</Link>
        </header>
        <section className="choose-team-title">
          <h1>Create a Team</h1>
          <p>Choose your system, game, and ladder to get started.</p>
        </section>
        <section className="choose-team-content">
          <div className="choose-team-panel">
            <div className="choose-team-fields">
              <label className="choose-team-field">
                System
                <select value={platform} onChange={(event) => {
                  setPlatform(event.target.value);
                  setCategory("");
                  setGame("");
                  setLadder("");
                }}>
                  <option value="">Choose a system</option>
                  {ladderPlatforms.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="choose-team-field">
                Game Category
                <select value={category} disabled={!platform} onChange={(event) => {
                  setCategory(event.target.value);
                  setGame("");
                  setLadder("");
                }}>
                  <option value="">Choose a game category</option>
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="choose-team-field">
                Game / Mode
                <select value={game} disabled={!category} onChange={(event) => {
                  setGame(event.target.value);
                  setLadder("");
                }}>
                  <option value="">Choose a game or mode</option>
                  {games.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="choose-team-field">
                Ladder
                <select value={ladder} disabled={!game} onChange={(event) => setLadder(event.target.value)}>
                  <option value="">Choose a ladder</option>
                  {ladders.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
                </select>
              </label>
            </div>
            <p className="choose-team-note">Each team belongs to one system, game and ladder. You can create another team for a different ladder.</p>
            <div className="choose-team-actions">
              {platform && category && game && ladder && <Link className="choose-team-button" href={hubUrl}>Continue to Team Setup</Link>}
              <Link className="choose-team-back" href="/profile">Back to Profile</Link>
            </div>
          </div>
        </section>
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
  const ladderName = cleanName(ladderSlug);
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