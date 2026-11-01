import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import DevelopmentNotice from "./components/DevelopmentNotice";
import HomeButton from "./components/HomeButton";
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
  metadataBase: new URL("https://gbarena.vercel.app"),
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
    images: [{ url: "/homepage.png", alt: "GameBattles" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GameBattles - Where Gaming Finds Its Edge",
    description: siteDescription,
    images: ["/homepage.png"],
  },
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
        {children}
        <HomeButton />
        <DevelopmentNotice />
      </body>
    </html>
  );
}
