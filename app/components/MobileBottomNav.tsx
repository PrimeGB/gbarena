"use client";

import { usePathname } from "next/navigation";
import styles from "./MobileBottomNav.module.css";

const links = [
  { label: "Home", href: "/home", icon: "home" },
  { label: "Ladders", href: "/ladders", icon: "ladder" },
  { label: "Find", href: "/matches/finder", icon: "search" },
  { label: "Community", href: "/forums", icon: "community" },
  { label: "Profile", href: "/profile", icon: "profile" },
] as const;

function isActive(pathname: string, href: (typeof links)[number]["href"]) {
  if (href === "/home") return pathname === "/" || pathname === "/home";
  if (href === "/ladders") {
    return ["/ladders", "/players", "/teams", "/ranks", "/champions"].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
  }
  if (href === "/matches/finder") {
    return pathname === "/matches" || pathname.startsWith("/matches/");
  }
  if (href === "/forums") {
    return ["/forums", "/tournaments", "/latest-news", "/ambassadors", "/members", "/staff"].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Icon({ name }: { name: (typeof links)[number]["icon"] }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  switch (name) {
    case "home":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="m3.5 10 8.5-7 8.5 7" /><path d="M5.5 9v11h13V9M9.5 20v-6h5v6" /></svg>;
    case "ladder":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M6 3v18M18 3v18M6 7h12M6 12h12M6 17h12" /></svg>;
    case "search":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5M8 10.8h5.6M10.8 8v5.6" /></svg>;
    case "community":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><circle cx="9" cy="8" r="3.2" /><path d="M3 20v-1.6A5.4 5.4 0 0 1 8.4 13h1.2a5.4 5.4 0 0 1 5.4 5.4V20zM16 5.3a3.2 3.2 0 0 1 0 6.2M17 14h.6a3.4 3.4 0 0 1 3.4 3.4V20h-3" /></svg>;
    case "profile":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>;
  }
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {links.map(({ label, href, icon }) => {
        const active = isActive(pathname, href);
        return (
          <a
            key={href}
            className={active ? `${styles.link} ${styles.active}` : styles.link}
            href={href}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
