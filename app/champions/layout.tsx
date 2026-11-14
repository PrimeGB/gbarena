import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hall of Fame",
  description: "GameBattles season champions, Top 10 honours, exclusive badges and rare achievements.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
