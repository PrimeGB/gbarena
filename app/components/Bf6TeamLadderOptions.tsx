import Link from "next/link";

export default function Bf6TeamLadderOptions({ platform }: { platform: "pc" | "xbox" | "playstation" }) {
  return (
    <div className="ladder-item">
      <div className="ladder-name">Team Ladder</div>
      <Link className="ladder-link" href={`/team-hub?platform=${platform}&category=battlefield&game=battlefield-6&ladder=team`}>View/Create Team</Link>
      <Link className="ladder-link" href={`/ladders/${platform}/battlefield/battlefield-6/team/rankings`}>Current Ladder Rankings</Link>
    </div>
  );
}
