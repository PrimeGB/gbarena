import Link from "next/link";
import { additionalLadderGamesForPlatform, ladderPlatforms } from "../../lib/ladderCatalog";

type Platform = (typeof ladderPlatforms)[number]["value"];

export default function PlatformGameLinks({ platform }: { platform: Platform }) {
  const games = additionalLadderGamesForPlatform(platform);

  return (
    <div className="dropdown-new">
      <div className="dropdown-heading">More Games</div>
      {games.map((game) => (
        <Link key={`${game.category}/${game.value}`} href={`/ladders/${platform}/${game.category}/${game.value}`}>
          <span className="game-icon more-game-icon" aria-hidden="true">
            {game.value === "box-fights" ? "FN" : game.label.split(/\s+/).slice(0, 3).map((word) => word[0]).join("").toUpperCase()}
          </span>
          {game.value === "box-fights" ? "Fortnite Box Fights" : game.label}
        </Link>
      ))}
    </div>
  );
}
