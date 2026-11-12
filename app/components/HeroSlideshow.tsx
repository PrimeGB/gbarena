"use client";

import { useEffect, useState } from "react";

export default function HeroSlideshow({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [images.length]);

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
          transition:opacity 1.2s ease, transform 8s ease-out;
        }
        .hero-expanded .hs-slide.active{opacity:1;transform:scale(1);}
        .hero-expanded .hs-slide.retro-slide{filter:brightness(.84) saturate(.78);}
      `}</style>
      {images.map((src, index) => (
        <div
          key={src}
          className={[
            "hs-slide",
            index === active ? "active" : "",
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
