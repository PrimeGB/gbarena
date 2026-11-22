import { type CreatorTheme } from "@/lib/creatorProfileStyles";
import CreatorFrameArt from "./CreatorFrameArt";
import "./style-vault.css";

export default function StylePreview({ theme, name = "Example Player", logo, showName = true, showLogo = true, tier = "ambassador" }: {
  theme: CreatorTheme; name?: string; logo?: string | null; showName?: boolean; showLogo?: boolean; tier?: "affiliate" | "ambassador";
}) {
  return <div className={`style-preview style-preview-${theme}${tier === "affiliate" ? " style-preview-affiliate" : ""}`} aria-label={`${tier} style preview`}>
    <div className="style-preview-head"><b>GAMEBATTLES</b><span>CREATOR PROFILE</span></div>
    <div className="style-preview-nav">TOURNAMENTS <span>CREATE A TEAM</span><span>FIND PLAYERS</span></div>
    <div className="style-preview-banner">
      <CreatorFrameArt theme={theme} />
      <div className="style-preview-watermark">{theme !== "classic" && showName && <b>{name}</b>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {theme !== "classic" && showLogo && logo && <img src={logo} alt="" />}</div>
      <div className="style-preview-avatar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo ? <img src={logo} alt="" /> : name.slice(0, 2).toUpperCase()}
      </div>
      <div className="style-preview-person"><strong>{name}</strong><small>★ {tier.toUpperCase()}</small><p>Member Since &nbsp; · &nbsp; Status &nbsp; · &nbsp; Recruits</p></div>
      <div className="style-preview-accounts"><span>XBOX &nbsp; Your ID</span><span>PLAYSTATION &nbsp; Your ID</span><span>PC &nbsp; Your ID</span></div>
    </div>
    <div className="style-preview-content">
      <div className="style-preview-rank"><strong>✦</strong><small>GB RANK</small><b>YOUR RANK</b></div>
      <div className="style-preview-panels"><div><b>Top Awards</b><p>✦ &nbsp; ◆ &nbsp; ★ &nbsp; ✦</p></div><div><b>Top Friends</b><p>● &nbsp; ● &nbsp; ● &nbsp; ●</p></div><div><b>Featured Teams</b><p>Your teams and match history</p></div></div>
    </div>
    <small className="style-preview-caption">Illustrative preview · your existing profile layout and content stay in place</small>
  </div>;
}
