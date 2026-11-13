// ABOUTME: Primary navigation model (#70): label + target for each top-level link, in on-screen order.
// ABOUTME: Writing is off-site (the Substack); SiteNav marks it with an aria-hidden ↗.
import type { NavLink } from '../types';
import { SUBSTACK_URL } from './links';

export const NAV_LINKS: NavLink[] = [
  { label: 'Atisha', to: '/atisha' },
  { label: 'Building', to: '/building' },
  { label: 'How we test', to: '/method' },
  { label: 'Writing', to: SUBSTACK_URL, external: true },
];
