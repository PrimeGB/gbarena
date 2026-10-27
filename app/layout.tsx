import type { Metadata } from "next";
import Link from "next/link";
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
        <header className="site-header" style={{background:'#07111b',borderBottom:'1px solid #123',padding:'10px 18px',zIndex:90}}>
          <div className="site-header-inner" style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <Link href="/home" style={{color:'#eaf5ff',fontWeight:900,textDecoration:'none',fontSize:18}}>GameBattles</Link>
            <nav className="site-nav" style={{display:'flex',gap:14}}>
              <Link href="/home" style={{color:'#cfeefe',textDecoration:'none'}}>Home</Link>
              <Link href="/forums" style={{color:'#cfeefe',textDecoration:'none'}}>Forums</Link>
              <Link href="/teams/top" style={{color:'#cfeefe',textDecoration:'none'}}>Teams</Link>
            </nav>
          </div>
        </header>
        {children}
        <HomeButton />
        <DevelopmentNotice />
      </body>
    </html>
  );
}
