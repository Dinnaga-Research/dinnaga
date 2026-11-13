// ABOUTME: TestedMark: the miniature stamp (a red ring and dot) that keys tested content (spec §7.4).
// ABOUTME: TestedLine: the mark plus the sentence saying what the doc was checked against.
import type { ReactNode } from 'react';

export function TestedMark() {
  return <span className="tested-mark" aria-hidden="true" />;
}

export function TestedLine({ children }: { children: ReactNode }) {
  return (
    <p className="tested-line">
      <TestedMark />
      {children}
    </p>
  );
}
