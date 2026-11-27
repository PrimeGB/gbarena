import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ChallengeCheckIn from "./components/ChallengeCheckIn";
import DevelopmentNotice from "./components/DevelopmentNotice";
import HomeButton from "./components/HomeButton";
import MobileBottomNav from "./components/MobileBottomNav";
import NotificationBell from "./components/NotificationBell";
import RecoveryRedirect from "./components/RecoveryRedirect";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import TopHomeBar from "./components/TopHomeBar";
import "./globals.css";
import "./staff/staff-responsive.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Competitive gaming ladders for every game and platform. Build a team, play ranked matches, climb the standings, and earn awards.";

export const metadata: Metadata = {
  metadataBase: new URL("https://gamebattles.app"),
  title: {
    default: "GameBattles - Where Gaming Finds Its Edge",
    template: "%s | GameBattles",
  },
  description: siteDescription,
  openGraph: {
    title: "GameBattles - Where Gaming Finds Its Edge",
    description: siteDescription,
    url: "/home",
    siteName: "GameBattles",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameBattles - Where Gaming Finds Its Edge",
    description: siteDescription,
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo.jpg", apple: "/logo.jpg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GameBattles" },
};

export const viewport: Viewport = {
  themeColor: "#07111b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <TopHomeBar />
        {children}
        <MobileBottomNav />
        <RecoveryRedirect />
        <HomeButton />
        <NotificationBell />
        <ChallengeCheckIn />
        <DevelopmentNotice />
      </body>
    </html>
  );
}
