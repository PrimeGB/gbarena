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
        .hero-expanded .hs-credits{
          position:absolute;
          right:14px;
          bottom:10px;
          z-index:5;
          color:rgba(255,255,255,.82);
          font:11px/1.2 Arial,sans-serif;
          text-shadow:0 1px 3px #000;
        }
        .hero-expanded .hs-credits:hover{color:#fff;text-decoration:underline;}
      `}</style>
      {images.map((src, index) => (
        <div
          key={src}
          className={index === active ? "hs-slide active" : "hs-slide"}
          style={{
            backgroundImage: `linear-gradient(to bottom,rgba(10,18,26,.08),rgba(0,0,0,.48)), url("${src}")`,
          }}
        />
      ))}
      <a className="hs-credits" href="/retro-systems/ATTRIBUTION.txt" target="_blank" rel="noreferrer">
        Image credits
      </a>
    </>
  );
}
