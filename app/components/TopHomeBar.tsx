"use client";

import { usePathname } from "next/navigation";
import CompactTopBar from "./CompactTopBar";

const HIDDEN_ON = ["/", "/home"];

export default function TopHomeBar() {
  const pathname = usePathname();
  return HIDDEN_ON.includes(pathname) ? null : <CompactTopBar />;
}
