// ABOUTME: Hero terminal boot sequence — placeholder lines from the UI kit.
// ABOUTME: The Terminal component types these in character-by-character on mount.
import type { BootLine } from '../types';

export const BOOT_LINES: BootLine[] = [
  { text: 'DINNAGA-OS  v0.4.1   //   TERMINAL', delay: 60 },
  { text: 'ESTABLISHING UPLINK  ........  OK', delay: 70 },
  { text: 'LOADING ATISHA INDEX ........  OK', delay: 70 },
  { text: 'OPERATOR  : VISITOR', delay: 60 },
  { text: 'ETHOS     : OPEN SOURCE', delay: 60 },
  { text: 'VALIDATION BAR : ENGAGED', delay: 60 },
  { text: '', delay: 30 },
  { text: '▸  WE VALIDATE THINGS, THEN SHARE WHAT IS GENUINELY USEFUL.', delay: 60 },
  { text: '', delay: 30 },
];
