import { getHeroSlides } from "../../lib/heroSlides";
import HeroSlideshow from "./HeroSlideshow";

export default async function HeroSlides() {
  const images = await getHeroSlides();
  return <HeroSlideshow images={images} />;
}
