import type { MetadataRoute } from "next";

const BASE = "https://gbarena.vercel.app";

const PAGES = [
  "/home",
  "/about",
  "/getting-started",
  "/general-info",
  "/rules",
  "/latest-news",
  "/forums",
  "/tournaments",
  "/matches/finder",
  "/players/top",
  "/teams/top",
  "/members",
  "/awards",
  "/history",
  "/support",
  "/contact",
  "/join",
  "/ladders/xbox",
  "/ladders/playstation",
  "/ladders/pc",
  "/ladders/nintendo",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: path.startsWith("/ladders") || path.includes("/top") ? "daily" : "weekly",
    priority: path === "/home" ? 1 : 0.7,
  }));
}
