/* eslint-disable @next/next/no-img-element -- ImageResponse renders the social card, not a page. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const socialImageSize = {
  width: 1200,
  height: 630,
};

export const socialImageAlt =
  "GameBattles - competitive gaming ladders, teams, and tournaments";

export async function renderSocialPreview() {
  const logo = await readFile(
    join(process.cwd(), "public", "logo-emblem.png"),
  );
  const logoSource = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 64px",
          color: "#f7fbff",
          background:
            "linear-gradient(125deg, #050d18 0%, #0b1c31 58%, #07111d 100%)",
          border: "1px solid #174b78",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <img
            src={logoSource}
            alt=""
            width={96}
            height={96}
            style={{ objectFit: "contain" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: 1 }}>
              GAMEBATTLES
            </div>
            <div
              style={{
                color: "#59c8ff",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 4,
              }}
            >
              WHERE GAMING FINDS ITS EDGE
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 5,
              background: "#f6bd48",
              borderRadius: 3,
            }}
          />
          <div
            style={{
              maxWidth: 900,
              fontSize: 54,
              fontWeight: 800,
              lineHeight: 1.08,
            }}
          >
            Find your next rivalry.
          </div>
          <div style={{ color: "#b9c9dc", fontSize: 22 }}>
            Competitive ladders, teams, and tournaments.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #24415f",
            paddingTop: 18,
            color: "#91a9c2",
            fontSize: 16,
            letterSpacing: 2,
          }}
        >
          <div>GAMEBATTLES.APP</div>
          <div style={{ color: "#f6bd48" }}>PLAY. COMPETE. CLIMB.</div>
        </div>
      </div>
    ),
    socialImageSize,
  );
}
