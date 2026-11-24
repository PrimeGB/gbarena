"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import GameLadderHub from "../../../../components/GameLadderHub";
import { ladderGameLabel, ladderPlatformLabel } from "../../../../../lib/ladderCatalog";

const platforms = ["xbox", "playstation", "pc"];
const battlefieldGames = ["battlefield-6", "battlefield-2042", "battlefield-v", "battlefield-1"];

export default function BattlefieldGamePage() {
  const { platform, game } = useParams<{ platform: string; game: string }>();
  const platformName = platforms.includes(platform) ? ladderPlatformLabel(platform) : null;
  const gameName = battlefieldGames.includes(game) ? ladderGameLabel("battlefield", game) : null;

  if (!platformName || !gameName) {
    return (
      <main className="page">
        <h1>Battlefield ladder not found</h1>
        <Link href={`/ladders/${platform}/battlefield`}>Back to Battlefield</Link>
      </main>
    );
  }

  return (
    <GameLadderHub
      platform={platform}
      platformName={platformName}
      category="battlefield"
      categoryName="Battlefield"
      game={game}
      gameName={gameName}
      showTournaments={false}
    />
  );
}
