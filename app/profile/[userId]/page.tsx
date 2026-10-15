import { redirect } from "next/navigation";

type UserProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;
  redirect(`/profile?userId=${encodeURIComponent(userId)}`);
}
