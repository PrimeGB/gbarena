import { notFound } from "next/navigation";
import MemberDirectory from "./MemberDirectory";

export default async function MembersPage({ params }: { params: Promise<{ tier: string }> }) {
  const { tier } = await params;
  if (tier !== "affiliate" && tier !== "ambassador") notFound();
  return <MemberDirectory tier={tier} />;
}
