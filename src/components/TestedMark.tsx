// ABOUTME: TestedMark — the lime square that marks tested content (spec §9).
// ABOUTME: Rendered inline in text, or as part of a TestedLine block.

export function TestedMark() {
  return <span className="tested-mark" aria-hidden="true" />;
}

export function TestedLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="tested-line">
      <TestedMark />
      {children}
    </p>
  );
}
