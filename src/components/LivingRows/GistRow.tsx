// ABOUTME: One public gist from api/living as a register row (#66): the title linking to the gist
// ABOUTME: (same tab) and `Updated <date>`.
import type { LivingGist } from '../../lib/living/contract';
import { livingDate } from './format';
import './LivingRows.css';

export function GistRow({ gist }: { gist: LivingGist }) {
  return (
    <li className="dn-register__row living-row">
      <p className="dn-register__title living-row__title">
        <a href={gist.url}>{gist.title}</a>
      </p>
      <p className="living-row__meta">Updated {livingDate(gist.updatedAt)}</p>
    </li>
  );
}
