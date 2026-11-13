// ABOUTME: PageHead (spec §7.8): the page h1 in the display role in the grid's content column,
// ABOUTME: with an optional lede beneath it. No eyebrow above the h1.
import type { ReactNode } from 'react';

interface PageHeadProps {
  title: ReactNode;
  lede?: ReactNode;
}

export function PageHead({ title, lede }: PageHeadProps) {
  return (
    <header className="page-head dn-grid">
      <div className="dn-grid__body">
        <h1>{title}</h1>
        {lede && <p className="page-head__lede">{lede}</p>}
      </div>
    </header>
  );
}
