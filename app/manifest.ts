import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GameBattles",
    short_name: "GameBattles",
    description: "Competitive gaming ladders for every game and platform.",
    start_url: "/home",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#07111b",
    icons: [{ src: "/logo.jpg", sizes: "any", type: "image/jpeg" }],
  };
}
