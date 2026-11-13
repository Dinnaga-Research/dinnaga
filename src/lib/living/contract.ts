// ABOUTME: The api/living response contract (#65): types shared by the function, the hook and the
// ABOUTME: pages, plus isLiving(), the guard every client runs before trusting a body.

export interface LivingRepo {
  owner: string;
  name: string;
  url: string;
  description: string;
  pushedAt: string;
  stars: number;
  // The latest release's tag name, or null when there is none.
  release: string | null;
}

export interface LivingGist {
  title: string;
  url: string;
  updatedAt: string;
}

export interface LivingPost {
  title: string;
  url: string;
  publishedAt: string;
}

/** One upstream source. A failure is `{ ok: false, items: [] }` and leaves the others alone. */
export interface LivingSource<T> {
  ok: boolean;
  items: T[];
}

export interface Living {
  generatedAt: string;
  repos: LivingSource<LivingRepo>;
  gists: LivingSource<LivingGist>;
  posts: LivingSource<LivingPost>;
}

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (o: Rec, k: string) => typeof o[k] === 'string';

const isRepo = (x: unknown) =>
  isRec(x) &&
  ['owner', 'name', 'url', 'description', 'pushedAt'].every((k) => str(x, k)) &&
  typeof x.stars === 'number' &&
  (x.release === null || typeof x.release === 'string');
const isGist = (x: unknown) => isRec(x) && ['title', 'url', 'updatedAt'].every((k) => str(x, k));
const isPost = (x: unknown) => isRec(x) && ['title', 'url', 'publishedAt'].every((k) => str(x, k));

function isSource(x: unknown, item: (i: unknown) => boolean): boolean {
  return isRec(x) && typeof x.ok === 'boolean' && Array.isArray(x.items) && x.items.every(item);
}

export function isLiving(x: unknown): x is Living {
  return (
    isRec(x) &&
    typeof x.generatedAt === 'string' &&
    isSource(x.repos, isRepo) &&
    isSource(x.gists, isGist) &&
    isSource(x.posts, isPost)
  );
}
