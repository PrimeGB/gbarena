import Image from "next/image";
import type { CSSProperties } from "react";
import { ladderGameImage } from "../../lib/ladderCatalog";
import { gameLadderTheme } from "./GameLadderHub";
import styles from "./LadderDetailHeader.module.css";

type Props = {
  category: string;
  game: string;
  gameName: string;
  platformName: string;
  title: string;
  section: "Rankings" | "Rules";
};

export default function LadderDetailHeader({ category, game, gameName, platformName, title, section }: Props) {
  const image = ladderGameImage(category, game);
  const theme = gameLadderTheme(category, game, gameName);
  const style: CSSProperties & { "--game-accent": string } = { "--game-accent": theme.accent };
  return (
    <div className={styles.banner} style={style}>
      {image && <Image className={styles.image} src={image} alt="" fill sizes="(max-width: 700px) 100vw, 980px" unoptimized />}
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.label}>{platformName} · {section}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{theme.label}</p>
      </div>
    </div>
  );
}
