import Link from "next/link";
import {
  additionalLadderGamesForPlatform,
  categoryImage,
  ladderGameImage,
  ladderPlatforms,
} from "../../lib/ladderCatalog";
import styles from "./PlatformGameLinks.module.css";

type Platform = (typeof ladderPlatforms)[number]["value"];

const consoleGames = [
  { category: "call-of-duty", label: "Call of Duty" },
  { category: "fortnite", label: "Fortnite" },
  { category: "apex", label: "Apex Legends" },
  { category: "rainbow-six", label: "Rainbow Six Siege" },
  { category: "rocket-league", label: "Rocket League" },
  { category: "battlefield", label: "Battlefield" },
];

const popularGames: Record<Platform, { category: string; label: string }[]> = {
  playstation: consoleGames,
  xbox: consoleGames,
  nintendo: [
    { category: "fortnite", label: "Fortnite" },
    { category: "apex", label: "Apex Legends" },
    { category: "rocket-league", label: "Rocket League" },
  ],
  pc: [
    ...consoleGames,
    { category: "old-school", label: "Old School" },
  ],
  mobile: [
    { category: "clash-of-clans", label: "Clash of Clans" },
    { category: "clash-royale", label: "Clash Royale" },
    { category: "cod-mobile", label: "Call of Duty: Mobile" },
    { category: "uno", label: "UNO" },
  ],
};

const categoryLabels: Record<string, string> = {
  "fighting-games": "Fighting",
  "sports-games": "Sports",
  "tactical-shooters": "Tactical",
  "hero-shooters": "Hero shooter",
  "strategy-games": "Strategy",
};

function GameCard({ href, label, image, category }: {
  href: string;
  label: string;
  image: string | null;
  category: string;
}) {
  return (
    <Link
      className={styles.card}
      href={href}
      aria-label={label}
      data-category={category}
      style={image ? { backgroundImage: `linear-gradient(90deg, #07111c 12%, rgba(7,17,28,.91) 46%, rgba(7,17,28,.25) 100%), url("${image}")` } : undefined}
    >
      <span className={styles.cardContent}>
        <span className={styles.eyebrow}>{categoryLabels[category] || "Ladders"}</span>
        <span className={styles.title}>{label}</span>
      </span>
      <span className={styles.arrow} aria-hidden="true">↗</span>
    </Link>
  );
}

export default function PlatformGameLinks({ platform, includeOldSchool = false }: {
  platform: Platform;
  includeOldSchool?: boolean;
}) {
  const popular = [...popularGames[platform]];
  if (includeOldSchool && (platform === "playstation" || platform === "xbox")) {
    popular.push({ category: "old-school", label: "Old School" });
  }
  const games = additionalLadderGamesForPlatform(platform);

  return (
    <>
      <div className={styles.column}>
        <div className={styles.heading}>Popular Ladders</div>
        {popular.map((game) => (
          <GameCard
            key={game.category}
            href={`/ladders/${platform}/${game.category}`}
            label={game.label}
            image={categoryImage(game.category)}
            category={game.category}
          />
        ))}
      </div>
      <div className={styles.column}>
        <div className={styles.heading}>More Games</div>
        {games.map((game) => (
          <GameCard
            key={`${game.category}/${game.value}`}
            href={`/ladders/${platform}/${game.category}/${game.value}`}
            label={game.value === "box-fights" ? "Fortnite Box Fights" : game.label}
            image={ladderGameImage(game.category, game.value)}
            category={game.category}
          />
        ))}
      </div>
    </>
  );
}
