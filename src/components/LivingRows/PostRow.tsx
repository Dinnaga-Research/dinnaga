// ABOUTME: One Substack post from api/living as a register row (#66): the title linking to the post
// ABOUTME: (same tab) and its date.
import type { LivingPost } from '../../lib/living/contract';
import { livingDate } from './format';
import './LivingRows.css';

export function PostRow({ post }: { post: LivingPost }) {
  return (
    <li className="dn-register__row living-row">
      <p className="dn-register__title living-row__title">
        <a href={post.url}>{post.title}</a>
      </p>
      <p className="living-row__meta">{livingDate(post.publishedAt)}</p>
    </li>
  );
}
