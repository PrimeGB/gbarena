"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroSlideshow({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const [loadedImages, setLoadedImages] = useState<ReadonlySet<string>>(() => new Set());
  const loadedImagesRef = useRef<ReadonlySet<string>>(new Set());

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
    if (images.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => {
        for (let offset = 1; offset <= images.length; offset += 1) {
          const next = (current + offset) % images.length;
          if (loadedImagesRef.current.has(images[next])) return next;
        }
        return current;
      });
    }, 7000);
    return () => window.clearInterval(timer);
  }, [images]);

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
      {images.map((src, index) => (
        <div
          key={src}
          className={[
            "hs-slide",
            index === active && loadedImages.has(src) ? "active" : "",
            src === "/retro-systems/retro-lan-room.png" ? "retro-slide" : "",
          ].filter(Boolean).join(" ")}
          style={{
            backgroundImage: `linear-gradient(to bottom,rgba(10,18,26,.08),rgba(0,0,0,.48)), url("${src}")`,
          }}
        />
      ))}
    </>
  );
}
