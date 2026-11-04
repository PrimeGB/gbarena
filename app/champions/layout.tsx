import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Champions Hall",
  description: "Top teams and players from every finished GameBattles season.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
