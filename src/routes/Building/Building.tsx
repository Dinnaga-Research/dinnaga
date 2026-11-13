// ABOUTME: What we're building (/building, #66): the full living README. Three register columns
// ABOUTME: (Repositories, Writing, Gists) from api/living via useLiving, each with its own loading,
// ABOUTME: failed and empty state and a closing link to where its data lives.
import type { ReactNode } from 'react';
import { PageHead } from '../../components/PageHead';
import { GistRow } from '../../components/LivingRows/GistRow';
import { PostRow } from '../../components/LivingRows/PostRow';
import { RepoRow } from '../../components/LivingRows/RepoRow';
import { GISTS_URL, GITHUB_PROFILE_URL, SUBSTACK_URL } from '../../data/links';
import { useLiving } from '../../hooks/useLiving';
import type { LivingSource } from '../../lib/living/contract';
import './Building.css';

const MAX_POSTS = 5;
const MAX_GISTS = 20;

interface ColumnProps<T> {
  id: string;
  heading: string;
  /** null while the fetch is pending; a failed fetch arrives as a failed source. */
  source: LivingSource<T> | null;
  max?: number;
  row: (item: T) => ReactNode;
  link: { text: string; href: string };
}

function LivingColumn<T>({ id, heading, source, max, row, link }: ColumnProps<T>) {
  const items = source?.items.slice(0, max) ?? [];
  return (
    <section className="building__col" aria-labelledby={id} aria-busy={source ? undefined : true}>
      <h2 id={id} className="building__h">
        {heading}
      </h2>
      {source && (
        <>
          {!source.ok && <p className="building__state">Couldn't load right now.</p>}
          {source.ok && items.length === 0 && <p className="building__state">None right now.</p>}
          {items.length > 0 && <ul className="dn-register living-rows">{items.map(row)}</ul>}
          <p className="living-more">
            <a href={link.href}>{link.text}</a>
          </p>
        </>
      )}
    </section>
  );
}

/** The whole fetch failed (or returned something that isn't the contract): every column failed. */
const FAILED: LivingSource<never> = { ok: false, items: [] };

export function Building() {
  const living = useLiving();
  const pick = <K extends 'repos' | 'posts' | 'gists'>(key: K) =>
    living.status === 'loading' ? null : living.status === 'ok' ? living.data[key] : FAILED;

  return (
    <div className="dn-page building">
      <PageHead
        title="What we're building"
        lede="Recent repositories, Substack posts and public gists from Dinnaga Research, pulled from GitHub and the Substack about once an hour."
      />
      <div className="building__cols">
        <LivingColumn
          id="building-repos"
          heading="Repositories"
          source={pick('repos')}
          row={(r) => <RepoRow key={r.url} repo={r} />}
          link={{ text: 'weytani on GitHub →', href: GITHUB_PROFILE_URL }}
        />
        <LivingColumn
          id="building-writing"
          heading="Writing"
          source={pick('posts')}
          max={MAX_POSTS}
          row={(p) => <PostRow key={p.url} post={p} />}
          link={{ text: 'All posts on the Substack →', href: SUBSTACK_URL }}
        />
        <LivingColumn
          id="building-gists"
          heading="Gists"
          source={pick('gists')}
          max={MAX_GISTS}
          row={(g) => <GistRow key={g.url} gist={g} />}
          link={{ text: 'All gists on GitHub →', href: GISTS_URL }}
        />
      </div>
    </div>
  );
}
