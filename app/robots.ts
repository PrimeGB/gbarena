import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/staff", "/profile/inbox", "/profile/edit", "/login", "/support/dispute-ticket"],
    },
    sitemap: "https://gamebattles.app/sitemap.xml",
  };
}
