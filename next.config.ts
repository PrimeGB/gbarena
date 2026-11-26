import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { bf6TeamLadders } from "./lib/bf6TeamLadders";

const nextConfig = (phase: string): NextConfig => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER || process.env.VERCEL === "1" ? ".next" : ".next-build",
  async redirects() {
    return Object.keys(bf6TeamLadders).flatMap((slug) => [
      {
        source: `/ladders/:platform/battlefield/battlefield-6/${slug}/:page(rankings|rules)`,
        destination: "/ladders/:platform/battlefield/battlefield-6/team/:page",
        permanent: false,
      },
      ...["/team-hub", "/teams/create", "/matches/create", "/matches/finder"].map((source) => ({
        source,
        has: [
          { type: "query" as const, key: "category", value: "battlefield" },
          { type: "query" as const, key: "game", value: "battlefield-6" },
          { type: "query" as const, key: "ladder", value: slug },
        ],
        destination: `${source}?ladder=team`,
        permanent: false,
      })),
    ]);
  },
});

export default nextConfig;
