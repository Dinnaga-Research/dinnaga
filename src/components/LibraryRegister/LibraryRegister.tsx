// ABOUTME: The library register (spec §7.3, #63): published Docs as a dated, printed register, not cards.
// ABOUTME: Used by /atisha (row titles h2) and the homepage library (h3); renders nothing for no Docs.
import { Link } from 'react-router-dom';
import { formatPausedSince } from '../../lib/dateFormat';
import type { PublishedDoc } from '../../types';
import { TestedLine } from '../TestedMark';
import './LibraryRegister.css';

interface LibraryRegisterProps {
  docs: PublishedDoc[];
  headingLevel: 2 | 3;
}

export function LibraryRegister({ docs, headingLevel }: LibraryRegisterProps) {
  if (docs.length === 0) return null;
  const Title = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <ol className="library-register dn-register">
      {docs.map((doc) => (
        <li className="library-register__row dn-register__row" key={doc.slug}>
          {/* One line on a phone (date · kind); from 760 px the date and kind take the outer columns. */}
          <p className="library-register__meta">
            <time className="library-register__date dn-label dn-label--caps" dateTime={doc.published}>
              {formatPausedSince(doc.published)}
            </time>
            <span className="library-register__sep dn-label" aria-hidden="true">
              ·
            </span>
            <span className="library-register__kind dn-label dn-label--caps">{doc.kind}</span>
          </p>
          <div className="library-register__main">
            <Title className="dn-register__title">
              <Link to={`/atisha/${doc.slug}`}>{doc.title}</Link>
            </Title>
            <p className="dn-register__summary">{doc.summary}</p>
            <TestedLine>{doc.tested}</TestedLine>
          </div>
        </li>
      ))}
    </ol>
  );
}
