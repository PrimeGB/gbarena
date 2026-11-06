// Keep every existing ladder-focused slide while introducing retro hardware throughout the rotation.
export const CURATED_SLIDES: string[] = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1600&auto=format&fit=crop",
  "/retro-systems/gamecube.jpg",
  "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=1600&auto=format&fit=crop",
  "/retro-systems/playstation-1.jpg",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop",
  "/retro-systems/playstation-2.jpg",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop",
  "/retro-systems/xbox-original.jpg",
  "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=1600&auto=format&fit=crop",
  "/retro-systems/xbox-360.jpg",
  "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?q=80&w=1600&auto=format&fit=crop",
  "/retro-systems/xbox-one.jpg",
  "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg",
  "/retro-systems/xbox-one-x.jpg",
  "/retro-systems/switch-2.jpg",
];

export async function getHeroSlides(): Promise<string[]> {
  return CURATED_SLIDES;
}
