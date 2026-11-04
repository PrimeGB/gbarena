import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forums",
  description: "Browse GameBattles discussions, find teammates, and catch up on the latest posts.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
