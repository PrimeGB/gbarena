import InfoPage from "../../../../../../components/InfoPage";

export const metadata = { title: "Playoff Bracket - GameBattles" };

export default async function PlayoffBracketPage({
  params,
}: {
  params: Promise<{ game: string; ladder: string }>;
}) {
  const { game, ladder } = await params;

  return (
    <InfoPage
      title="Playoff Bracket"
      eyebrow="Xbox Call of Duty"
      backHref={`/ladders/xbox/call-of-duty/${game}/${ladder}/rankings`}
      backLabel="Back to Rankings"
    >
      <p>
        The playoff bracket for this ladder has not started yet. Brackets are posted here once the
        season ends and the top teams are seeded.
      </p>
      <p>
        Want to compete for prizes now? Check the <a href="/tournaments">Tournaments</a> page.
      </p>
    </InfoPage>
  );
}
