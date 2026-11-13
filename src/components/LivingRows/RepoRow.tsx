// ABOUTME: One repository from api/living as a register row (#66): the owner label when it isn't
// ABOUTME: weytani, the name linking to GitHub (same tab), the description and the meta line.
import type { LivingRepo } from '../../lib/living/contract';
import { repoMeta } from './format';

export function RepoRow({ repo }: { repo: LivingRepo }) {
  return (
    <li className="dn-register__row living-row">
      {repo.owner !== 'weytani' && <p className="dn-label living-row__owner">{repo.owner}</p>}
      <p className="dn-register__title living-row__title">
        <a href={repo.url}>{repo.name}</a>
      </p>
      {repo.description && <p className="living-row__summary">{repo.description}</p>}
      <p className="living-row__meta">{repoMeta(repo)}</p>
    </li>
  );
}
