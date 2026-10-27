"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_ON = ["/", "/home"];

export default function HomeButton() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <>
      <Link href="/home" className="floating-home" aria-label="Back to GameBattles home">
        <span aria-hidden="true">⌂</span> Home
      </Link>
      <style>{`
        .floating-home {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 80;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border: 1px solid #f2c14e;
          border-radius: 999px;
          background: linear-gradient(#173956, #07111b);
          color: #ffe9a8;
          font: 800 12px/1 Tahoma, Verdana, Arial, sans-serif;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(242, 193, 78, 0.25);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .floating-home span { font-size: 15px; }
        .floating-home:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7), 0 0 16px rgba(242, 193, 78, 0.5);
        }
      `}</style>
    </>
  );
}
