// Slides that always rotate on the home page. Add any image URL here
// (for example official GTA VI key art) and it joins the rotation.
export const CURATED_SLIDES: string[] = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?q=80&w=1600&auto=format&fit=crop",
  "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg",
  "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2519060/header.jpg",
  "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1240440/header.jpg",
  "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/976730/header.jpg",
];

// Steam app ids that are always featured, e.g. Fable.
export const PINNED_STEAM_APPS: number[] = [2769570];

type SteamItem = { id: number; large_capsule_image?: string };
type SteamFeatured = Record<string, { items?: SteamItem[] } | undefined>;

export async function getHeroSlides(): Promise<string[]> {
  const pinned = PINNED_STEAM_APPS.map(
    (id) => `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`
  );
  let live: string[] = [];

  try {
    const res = await fetch("https://store.steampowered.com/api/featuredcategories?cc=us&l=en", {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as SteamFeatured;
      const items = [
        ...(data.coming_soon?.items ?? []).slice(0, 4),
        ...(data.new_releases?.items ?? []).slice(0, 3),
        ...(data.top_sellers?.items ?? []).slice(0, 3),
      ];
      live = items
        .map((item) => item.large_capsule_image)
        .filter((url): url is string => Boolean(url));
    }
  } catch {
    // Fall back to the curated list when Steam is unreachable.
  }

  return Array.from(new Set([...pinned, ...live, ...CURATED_SLIDES]));
}
