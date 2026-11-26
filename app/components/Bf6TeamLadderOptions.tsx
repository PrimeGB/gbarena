import Link from "next/link";
import { bf6TeamLadders } from "../../lib/bf6TeamLadders";

export default function Bf6TeamLadderOptions({ platform }: { platform: "pc" | "xbox" | "playstation" }) {
  return (
    <>
      <div className="ladder-item">
        <div className="ladder-name">Team Ladders</div>
        <Link className="ladder-link" href={`/ladders/${platform}/battlefield/battlefield-6`}>All BF6 ladders</Link>
      </div>
      {Object.entries(bf6TeamLadders).map(([slug, ladder]) => (
        <div className="ladder-item" key={slug}>
          <div className="ladder-name">{ladder.title}</div>
          <Link className="ladder-link" href={`/team-hub?platform=${platform}&category=battlefield&game=battlefield-6&ladder=${slug}`}>View/Create Team</Link>
          <Link className="ladder-link" href={`/ladders/${platform}/battlefield/battlefield-6/${slug}/rankings`}>Rankings</Link>
        </div>
      ))}
    </>
  );
}
