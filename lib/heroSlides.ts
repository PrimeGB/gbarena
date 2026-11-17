// Keep the existing ladder slides and use a single subdued retro gaming scene.
export const CURATED_SLIDES: string[] = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1600&auto=format&fit=crop",
  "/retro-systems/retro-lan-room.png",
  "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?q=80&w=1600&auto=format&fit=crop",
  "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg",
];

export type HeroSlide =
  | { kind: "image"; src: string }
  | { kind: "discord" | "invite" };

export function buildHeroRotation(images: string[]): HeroSlide[] {
  const slides: HeroSlide[] = images.map((src) => ({ kind: "image", src }));
  const discordPosition = Math.min(2, slides.length);
  slides.splice(discordPosition, 0, { kind: "discord" });
  const invitePosition = Math.min(Math.max(discordPosition + 2, Math.floor(images.length * 2 / 3) + 1), slides.length);
  slides.splice(invitePosition, 0, { kind: "invite" });
  return slides;
}

export function nextHeroSlideIndex(slides: HeroSlide[], current: number, loadedImages: ReadonlySet<string>): number {
  for (let offset = 1; offset <= slides.length; offset += 1) {
    const next = (current + offset) % slides.length;
    const slide = slides[next];
    if (slide.kind !== "image" || loadedImages.has(slide.src)) return next;
  }
  return current;
}

export async function getHeroSlides(): Promise<string[]> {
  return CURATED_SLIDES;
}
