"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import GameLadderHub from "../../../../components/GameLadderHub";
import {
  ladderCategoryLabel,
  ladderGameLabel,
  ladderPlatformLabel,
} from "../../../../../lib/ladderCatalog";

export default function LadderGamePage() {
  const { platform, category, game } = useParams<{
    platform: string;
    category: string;
    game: string;
  }>();
  const platformName = ladderPlatformLabel(platform);
  const categoryName = ladderCategoryLabel(category);
  const gameName = ladderGameLabel(category, game);

  if (!platformName || !categoryName || !gameName) {
    return (
      <main className="page">
        <h1>Ladder not found</h1>
        <Link href={`/ladders/${platform}`}>Back to ladders</Link>
      </main>
    );
  }

  return <GameLadderHub {...{ platform, platformName, category, categoryName, game, gameName }} />;
}
