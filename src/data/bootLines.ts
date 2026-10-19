// ABOUTME: Hero terminal boot sequence — generated from the Atisha catalog count.
// ABOUTME: The Terminal component types these in character-by-character on mount.
import type { BootLine } from '../types';
import { ATISHA_CATALOG } from './atishaCatalog';

export function getBootLines(count: number): BootLine[] {
  const docWord = count === 1 ? 'doc' : 'docs';
  return [
    { text: 'dinnaga research — behind the scenes', delay: 60 },
    { text: `atisha: ${count} public ${docWord}`, delay: 70 },
    { text: 'everything else is backstage.', delay: 70 },
    { text: 'know the phrase? type it below.', delay: 60 },
  ];
}

export const BOOT_LINES: BootLine[] = getBootLines(ATISHA_CATALOG.length);
