import { redirect } from "next/navigation";

export default function TopTeamsPage() {
  redirect("/players/top?kind=teams");
}
