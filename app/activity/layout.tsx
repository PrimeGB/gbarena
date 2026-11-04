import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Activity",
  description: "Recent matches, new teams and awards across GameBattles.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
