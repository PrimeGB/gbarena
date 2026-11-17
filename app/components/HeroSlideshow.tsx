"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildHeroRotation, nextHeroSlideIndex } from "../../lib/heroSlides";
import HeroPromo from "./HeroPromo";

export default function HeroSlideshow({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const [loadedImages, setLoadedImages] = useState<ReadonlySet<string>>(() => new Set());
  const [promoFocused, setPromoFocused] = useState(false);
  const loadedImagesRef = useRef<ReadonlySet<string>>(new Set());
  const slides = useMemo(() => buildHeroRotation(images), [images]);

  useEffect(() => {
    let mounted = true;
    const preloads = images.map((src) => {
      const image = new window.Image();
      const markLoaded = () => {
        if (!mounted || image.naturalWidth === 0 || loadedImagesRef.current.has(src)) return;
        const next = new Set(loadedImagesRef.current);
        next.add(src);
        loadedImagesRef.current = next;
        setLoadedImages(next);
      };

      image.onload = markLoaded;
      image.src = src;
      return image;
    });

    return () => {
      mounted = false;
      preloads.forEach((image) => { image.onload = null; });
    };
  }, [images]);

  useEffect(() => {
    if (promoFocused) return;
    const timer = window.setTimeout(() => {
      setActive((current) => nextHeroSlideIndex(slides, current, loadedImagesRef.current));
    }, slides[active]?.kind === "image" ? 7000 : 20000);
    return () => window.clearTimeout(timer);
  }, [slides, active, promoFocused]);

  return (
    <>
      <style>{`
        .hero-expanded .hs-slide{
          position:absolute;
          inset:0;
          background-size:cover;
          background-position:center;
          background-repeat:no-repeat;
          opacity:0;
          transform:scale(1.03);
          transition:opacity 1.35s ease-in-out, transform 8s ease-out;
        }
        .hero-expanded .hs-slide.active{opacity:1;transform:scale(1);}
        .hero-expanded .hs-slide.retro-slide{filter:brightness(.84) saturate(.78);}
        @media (prefers-reduced-motion: reduce){
          .hero-expanded .hs-slide{transition:none;transform:none;}
        }
      `}</style>
      {slides.map((slide, index) => slide.kind === "image" ? (
        <div
          key={`${slide.src}-${index}`}
          className={[
            "hs-slide",
            index === active && loadedImages.has(slide.src) ? "active" : "",
            slide.src === "/retro-systems/retro-lan-room.png" ? "retro-slide" : "",
          ].filter(Boolean).join(" ")}
          style={{
            backgroundImage: `linear-gradient(to bottom,rgba(10,18,26,.08),rgba(0,0,0,.48)), url("${slide.src}")`,
          }}
        />
      ) : index === active ? (
        <HeroPromo key={slide.kind} kind={slide.kind} onFocusChange={setPromoFocused} />
      ) : null)}
    </>
  );
}
