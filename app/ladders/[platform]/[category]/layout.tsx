import { notFound } from "next/navigation";
import { isCategoryOnPlatform } from "../../../../lib/ladderCatalog";

export default async function LadderCategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ platform: string; category: string }>;
}) {
  const { platform, category } = await params;

  if (!isCategoryOnPlatform(platform, category)) notFound();

  return children;
}
