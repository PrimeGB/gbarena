import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { getPlayerOptions } from "../../lib/matchCreationRoster";
import { getGameRules } from "../../lib/matchRules";
import { ladderGameImage, laddersForGame } from "../../lib/ladderCatalog";
import styles from "./GameLadderHub.module.css";

type Theme = { accent: string; label: string; description: string };

const gameThemes: Record<string, Theme> = {
  "fortnite/box-fights": { accent: "#ad8cff", label: "Build. Edit. Compete.", description: "Step into the box and take on your opponent in Fortnite's 1v1 ladder." },
  "fighting-games/street-fighter-6": { accent: "#ff855a", label: "The fight starts here", description: "Bring your best to the Street Fighter 6 ladder and face your next challenger." },
  "fighting-games/brawlhalla": { accent: "#6ac9ff", label: "Legends meet here", description: "Choose your legend and compete in Brawlhalla singles or duos." },
  "fighting-games/tekken-8": { accent: "#ff705a", label: "Enter the arena", description: "Find your next challenger and compete on the Tekken 8 ladder." },
  "fighting-games/mortal-kombat-1": { accent: "#ffc46e", label: "Enter the fight", description: "Take your place in the Mortal Kombat 1 ladder and face your next opponent." },
  "fighting-games/super-smash-bros-ultimate": { accent: "#f77d73", label: "Ready to battle?", description: "Pick your fighter and meet your next challenger in Super Smash Bros. Ultimate." },
  "sports-games/ea-sports-fc-27": { accent: "#b1f37f", label: "Your pitch. Your competition.", description: "Take the pitch in singles or bring your club to the EA Sports FC 27 ladders." },
  "sports-games/nba-2k27": { accent: "#ffa77c", label: "Own the court", description: "Take your game to the court in NBA 2K27 singles, 3v3 or 5v5." },
  "sports-games/efootball": { accent: "#f2e65f", label: "Play your game", description: "Take the field in eFootball singles or team up for co-op competition." },
  "tactical-shooters/counter-strike-2": { accent: "#ffd179", label: "Precision under pressure", description: "Test your aim or bring your squad to Counter-Strike 2 competition." },
  "tactical-shooters/valorant": { accent: "#ff7d88", label: "Aim. Adapt. Compete.", description: "Meet your rivals in VALORANT duels or 5v5 competition." },
  "hero-shooters/marvel-rivals": { accent: "#ffc976", label: "Assemble your team", description: "Bring your squad together for Marvel Rivals team competition." },
  "hero-shooters/overwatch-2": { accent: "#f7ba6e", label: "Heroes wanted", description: "Build your team and compete in Overwatch 2's team ladders." },
  "strategy-games/chess": { accent: "#e7d198", label: "Make your move", description: "Challenge an opponent and make your mark on the chess ladder." },
};

const categoryThemes: Record<string, Pick<Theme, "accent" | "label">> = {
  "call-of-duty": { accent: "#e4c487", label: "Answer the call" },
  battlefield: { accent: "#f0ac69", label: "Enter the battlefield" },
  apex: { accent: "#ff7c72", label: "Legends compete here" },
  fortnite: { accent: "#ad8cff", label: "Drop in. Compete." },
  "rocket-league": { accent: "#6ecbff", label: "Hit the arena" },
  "rainbow-six": { accent: "#a9c8ee", label: "Every round matters" },
  "old-school": { accent: "#dec387", label: "Classic competition" },
  "clash-of-clans": { accent: "#f3bb6c", label: "Build your legacy" },
  "clash-royale": { accent: "#84b9ff", label: "Enter the arena" },
  "cod-mobile": { accent: "#f0c675", label: "Competition on the move" },
  uno: { accent: "#ff8a7b", label: "Play your cards" },
  "fighting-games": { accent: "#ff855a", label: "Meet your challenger" },
  "sports-games": { accent: "#a5df86", label: "Game on" },
  "tactical-shooters": { accent: "#ff9d79", label: "Precision under pressure" },
  "hero-shooters": { accent: "#ffc976", label: "Bring your squad" },
  "strategy-games": { accent: "#e7d198", label: "Make your move" },
};

export function gameLadderTheme(category: string, game: string, gameName: string): Theme {
  return gameThemes[`${category}/${game}`] || {
    ...(categoryThemes[category] || { accent: "#8cccff", label: "GameBattles competition" }),
    description: `Choose your ${gameName} ladder, find your team and take on the competition.`,
  };
}

type Props = {
  platform: string;
  platformName: string;
  category: string;
  categoryName: string;
  game: string;
  gameName: string;
  showTournaments?: boolean;
};

export default function GameLadderHub({
  platform, platformName, category, categoryName, game, gameName, showTournaments = true,
}: Props) {
  const ladders = laddersForGame(category, game);
  const image = ladderGameImage(category, game);
  const theme = gameLadderTheme(category, game, gameName);
  const style: CSSProperties & { "--game-accent": string } = { "--game-accent": theme.accent };
  const isMode = ["fortnite", "apex", "rocket-league", "rainbow-six", "clash-of-clans", "clash-royale", "cod-mobile", "uno"].includes(category);

  return (
    <main className={styles.page} style={style} data-game-category={category} data-platform={platform}>
      <div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="Ladder navigation">
          <Link href={`/ladders/${platform}/${category}`}>← {platformName} {categoryName}</Link>
          <span className={styles.system}>{platformName}</span>
        </nav>

        <header className={styles.hero}>
          {image && <Image className={styles.heroImage} src={image} alt="" fill sizes="(max-width: 700px) 100vw, 1100px" unoptimized />}
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroContent}>
            <p className={styles.overline}><span /> {theme.label}</p>
            <p className={styles.gameContext}>{isMode ? categoryName : "GameBattles"} / {platformName}</p>
            <h1>{gameName}</h1>
            <p className={styles.description}>{theme.description}</p>
            <a className={styles.heroAction} href="#ladders">Explore ladders <span aria-hidden="true">↓</span></a>
          </div>
          <div className={styles.heroStamp} aria-hidden="true">GB <span>COMPETE</span></div>
        </header>

        <section className={styles.competition} id="ladders" aria-labelledby="ladder-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionKicker}>YOUR NEXT MATCH STARTS HERE</p>
              <h2 id="ladder-heading">Choose your ladder</h2>
              <p>Find your team, check the standings and get ready to play.</p>
            </div>
            {showTournaments && (
              <Link className={styles.tournaments} href={`/tournaments?platform=${platform}&category=${category}&game=${game}`}>
                {gameName} tournaments <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>

          <div className={styles.ladderList}>
            {ladders.map((ladder, index) => {
              const rules = getGameRules(category, game, ladder.slug);
              const sizes = getPlayerOptions(ladder.slug, ladder.slug === "redsec", rules?.teamSizes);
              return (
                <article className={styles.ladder} key={ladder.slug}>
                  <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <div className={styles.ladderInfo}>
                    <span className={styles.ladderKicker}>{platformName} · {gameName}</span>
                    <h3>{ladder.title}</h3>
                    <p>{category === "battlefield" && game === "battlefield-6" && ladder.slug === "team"
                      ? "Choose a game type when posting a match · One shared ladder"
                      : `${sizes.length <= 3 ? sizes.join(" / ") : "Multiple formats"} · Ladder competition`}</p>
                  </div>
                  <div className={styles.actions}>
                    <Link className={styles.primary} href={`/team-hub?platform=${platform}&category=${category}&game=${game}&ladder=${ladder.slug}`}>
                      Find or create a team <span aria-hidden="true">→</span>
                    </Link>
                    <Link className={styles.secondary} href={`/ladders/${platform}/${category}/${game}/${ladder.slug}/rankings`}>Rankings</Link>
                    <Link className={styles.secondary} href={`/ladders/${platform}/${category}/${game}/${ladder.slug}/rules`}>Rules</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
