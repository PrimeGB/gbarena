import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recruitment Board",
  description: "Find a team or recruit players for your GameBattles team.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
