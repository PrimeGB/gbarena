"use client";

import Link from "next/link";
import StatusScreen from "./components/StatusScreen";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusScreen
      code="Oops"
      title="Something went wrong"
      message="We hit an unexpected problem loading this page. Try again, and if it keeps happening let us know."
    >
      <button type="button" className="status-btn" onClick={() => reset()}>Try again</button>
      <Link href="/home" className="status-btn ghost">Back to Home</Link>
    </StatusScreen>
  );
}
