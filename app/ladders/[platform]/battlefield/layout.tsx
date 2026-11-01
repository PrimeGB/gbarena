import { notFound } from "next/navigation";
import { isCategoryOnPlatform } from "../../../../lib/ladderCatalog";

export default async function BattlefieldLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;

  if (!isCategoryOnPlatform(platform, "battlefield")) notFound();

  return children;
}
