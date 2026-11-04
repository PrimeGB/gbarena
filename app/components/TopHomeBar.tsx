"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const HIDDEN_ON = ["/", "/home"];

// Shows a slim back-to-home bar only when the page has no home link of its own.
export default function TopHomeBar() {
  const pathname = usePathname();
  const [needsBar, setNeedsBar] = useState(false);

  useEffect(() => {
    if (HIDDEN_ON.includes(pathname)) return;
    const check = () => {
      const links = document.querySelectorAll('a[href="/home"]');
      const own = Array.from(links).some(
        (el) => !el.closest("[data-top-home-bar]") && !el.classList.contains("floating-home")
      );
      setNeedsBar(!own);
    };
    const timers = [100, 600, 1500, 3000].map((ms) => window.setTimeout(check, ms));
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      setNeedsBar(false);
    };
  }, [pathname]);

  if (HIDDEN_ON.includes(pathname) || !needsBar) return null;

  return (
    <>
      <div className="top-home-bar" data-top-home-bar>
        <Link href="/home">
          <span aria-hidden="true">←</span> Back to GameBattles Home
        </Link>
      </div>
      <style>{`
        .top-home-bar {
          position: sticky;
          top: 0;
          z-index: 70;
          display: flex;
          align-items: center;
          min-height: 32px;
          padding: 0 16px;
          background: linear-gradient(#173956, #07111b);
          border-bottom: 1px solid #f2c14e;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }
        .top-home-bar a {
          color: #ffe9a8;
          font: 800 12px/1 Tahoma, Verdana, Arial, sans-serif;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          text-decoration: none;
        }
        .top-home-bar a:hover { color: #fff; }
      `}</style>
    </>
  );
}
