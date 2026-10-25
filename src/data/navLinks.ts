// ABOUTME: Primary navigation model — label + route target for each top-level link.
// ABOUTME: Order is the on-screen order.
import type { NavLink } from '../types';

export const NAV_LINKS: NavLink[] = [
  { label: 'Atisha', to: '/atisha' },
  { label: 'How we work', to: '/method' },
  { label: 'Colophon', to: '/colophon' },
  { label: 'Weekly', to: '/weekly' },
];
