import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Challenges",
  description: "Daily, weekly and monthly GameBattles challenges, login rewards and community trophies.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
