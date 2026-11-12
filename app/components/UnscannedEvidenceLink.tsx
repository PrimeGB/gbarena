"use client";

import type { CSSProperties, ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  style?: CSSProperties;
};

export function UnscannedEvidenceLink({ href, children, style }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      onClick={(event) => {
        if (!window.confirm("This evidence has not been scanned for malware and may be unsafe. Open it anyway?")) {
          event.preventDefault();
        }
      }}
    >
      {children} (unscanned)
    </a>
  );
}
