import Link from "next/link";
import StatusScreen from "./components/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="Page not found"
      message="That page doesn't exist or was moved. Head back and keep competing."
    >
      <Link href="/home" className="status-btn">Back to Home</Link>
      <Link href="/ladders/xbox" className="status-btn ghost">Browse Ladders</Link>
    </StatusScreen>
  );
}
