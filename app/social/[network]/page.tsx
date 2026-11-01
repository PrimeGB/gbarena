import { redirect } from "next/navigation";
import InfoPage from "../../components/InfoPage";

// Fill in the official channel URLs; a network with a URL redirects straight to it.
const SOCIALS: Record<string, { name: string; url: string }> = {
  discord: { name: "Discord", url: "" },
  x: { name: "X / Twitter", url: "" },
  youtube: { name: "YouTube", url: "" },
  facebook: { name: "Facebook", url: "" },
  tiktok: { name: "TikTok", url: "https://www.tiktok.com/@gamebattlescommunity?lang=en" },
};

export default async function SocialPage({ params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const social = SOCIALS[network];

  if (social?.url) redirect(social.url);

  return (
    <InfoPage title={social ? social.name : "Social"} eyebrow="Community">
      <p>
        {social
          ? `Our ${social.name} channel is coming soon.`
          : "That social channel does not exist."}{" "}
        In the meantime, find us and chat with the community in the <a href="/forums">forums</a>.
      </p>
    </InfoPage>
  );
}
