// ABOUTME: Writing on the homepage (#69): the latest 3 Substack posts from api/living, then the link
// ABOUTME: to the Substack. Renders nothing while loading, or when posts failed or are empty.
import { PostRow } from '../../../components/LivingRows/PostRow';
import { SUBSTACK_URL } from '../../../data/links';
import { useLiving } from '../../../hooks/useLiving';
import './HomeLiving.css';

const EXCERPT = 3;

export function HomeWriting() {
  const living = useLiving();
  if (living.status !== 'ok' || !living.data.posts.ok) return null;
  const posts = living.data.posts.items.slice(0, EXCERPT);
  if (posts.length === 0) return null;

  return (
    <section className="dn-page" aria-labelledby="home-writing-h">
      <div className="dn-section dn-grid home-living">
        <div className="dn-grid__label">
          <h2 id="home-writing-h">Writing</h2>
          <p className="home-living__intro">From the Substack.</p>
        </div>
        <div className="dn-grid__body">
          <ul className="dn-register living-rows">
            {posts.map((p) => (
              <PostRow key={p.url} post={p} />
            ))}
          </ul>
          <p className="living-more">
            <a href={SUBSTACK_URL}>All posts on the Substack →</a>
          </p>
        </div>
      </div>
    </section>
  );
}
