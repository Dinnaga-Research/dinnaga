// ABOUTME: Claims guard: fails when a banned false-claim pattern appears in site or docs.
// ABOUTME: Each pattern has a regex, scope (site/site+docs), and a Honesty bug id.
// ABOUTME: Entries are never weakened or deleted — later Honesty tickets add their own.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');

interface ClaimEntry {
  pattern: RegExp;
  scope: 'site' | 'site+docs';
  bugId: string;
}

const BANNED_CLAIMS: ClaimEntry[] = [
  { pattern: /analytics/i, scope: 'site', bugId: 'H1' },
  { pattern: /TRANSMISSION ADVISORY/, scope: 'site', bugId: 'H1' },
  { pattern: /loadout|ripperdoc/i, scope: 'site+docs', bugId: 'H2' },
  { pattern: /megazord|\bzords?\b|implants?\b/i, scope: 'site', bugId: 'H2' },
  { pattern: /TESTS GREEN|PAPERS REPRODUCED/, scope: 'site', bugId: 'H11' },
  { pattern: /PING 42/, scope: 'site', bugId: 'H4' },
  { pattern: /FIDELITY/, scope: 'site', bugId: 'H4' },
  { pattern: /SIGNAL \/\/ 042/, scope: 'site', bugId: 'H10' },
  { pattern: /v0\.4\.1/, scope: 'site', bugId: 'H10' },
  { pattern: /18:42Z/, scope: 'site', bugId: 'H10' },
  { pattern: /UPLINK/, scope: 'site', bugId: 'H10' },
  { pattern: /DINNAGA-OS/, scope: 'site', bugId: 'H10' },
  { pattern: /ENCRYPTED/, scope: 'site', bugId: 'H10' },
  { pattern: /TRANSMISSION (RECEIVED|CLOSED)/, scope: 'site', bugId: 'H10' },
  { pattern: /VALIDATION BAR/, scope: 'site', bugId: 'H10' },
  { pattern: /ONLINE/, scope: 'site', bugId: 'H7' },
  { pattern: /Initiative is open/i, scope: 'site', bugId: 'H7' },
  { pattern: /grows as we validate/i, scope: 'site', bugId: 'H7' },
  { pattern: /Initiatives live/i, scope: 'site', bugId: 'H7' },
];

function getSiteFiles(): string[] {
  const srcFiles = readdirSync(join(ROOT, 'src'), { recursive: true })
    .filter((f) => {
      const str = f.toString();
      // Exclude test files and the guard itself
      if (str.endsWith('.test.ts') || str.endsWith('.test.tsx') || str === 'test/claims.test.ts')
        return false;
      return true;
    })
    .map((f) => join(ROOT, 'src', f.toString()));

  // Add index.html and top-level HTML files from public/
  const indexPath = join(ROOT, 'index.html');
  const publicHtmlFiles = readdirSync(join(ROOT, 'public'))
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .map((f) => join(ROOT, 'public', f));

  return [...srcFiles, indexPath, ...publicHtmlFiles];
}

function getDocFiles(): string[] {
  const docFiles: string[] = [];

  // Root docs
  [join(ROOT, 'README.md'), join(ROOT, 'INDEX.md'), join(ROOT, 'docs', 'STATUS.md')].forEach(
    (f) => {
      try {
        readFileSync(f, 'utf8');
        docFiles.push(f);
      } catch {
        // File doesn't exist, skip
      }
    },
  );

  // Every CLAUDE.md outside node_modules and docs/superpowers
  const findClaudeMds = (dir: string): string[] => {
    const results: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      // Skip node_modules and docs/superpowers
      if (entry.name === 'node_modules' || fullPath.includes('docs/superpowers')) {
        continue;
      }

      if (entry.isDirectory()) {
        results.push(...findClaudeMds(fullPath));
      } else if (entry.name === 'CLAUDE.md') {
        results.push(fullPath);
      }
    }

    return results;
  };

  docFiles.push(...findClaudeMds(ROOT));
  return docFiles;
}

function checkFiles(files: string[], entries: ClaimEntry[]): Array<{
  file: string;
  matched: string;
  bugId: string;
}> {
  const failures: Array<{ file: string; matched: string; bugId: string }> = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');

      for (const entry of entries) {
        const match = content.match(entry.pattern);
        if (match) {
          failures.push({
            file: file.replace(ROOT, '.'),
            matched: match[0],
            bugId: entry.bugId,
          });
        }
      }
    } catch {
      // File doesn't exist or can't be read, skip
    }
  }

  return failures;
}

describe('Claims guard', () => {
  it('site files have no banned patterns', () => {
    const siteEntries = BANNED_CLAIMS.filter((e) => e.scope === 'site' || e.scope === 'site+docs');
    const failures = checkFiles(getSiteFiles(), siteEntries);

    if (failures.length > 0) {
      const msg = failures
        .map((f) => `  ${f.file}: "${f.matched}" (bug ${f.bugId})`)
        .join('\n');
      expect.fail(`Banned claim found in site files:\n${msg}`);
    }
  });

  it('docs files have no banned patterns', () => {
    const docEntries = BANNED_CLAIMS.filter((e) => e.scope === 'site+docs');
    const failures = checkFiles(getDocFiles(), docEntries);

    if (failures.length > 0) {
      const msg = failures
        .map((f) => `  ${f.file}: "${f.matched}" (bug ${f.bugId})`)
        .join('\n');
      expect.fail(`Banned claim found in docs files:\n${msg}`);
    }
  });

  it('self-test: matcher detects a sample claim', () => {
    const sample = 'This site uses lightweight analytics to understand you.';
    const h1Entries = BANNED_CLAIMS.filter((e) => e.bugId === 'H1');

    for (const entry of h1Entries) {
      const match = sample.match(entry.pattern);
      if (match) {
        // If we find a match, we're good
        expect(match).toBeTruthy();
        return;
      }
    }

    // If we get here, none of the H1 patterns matched
    expect.fail(`H1 patterns did not match sample claim: "${sample}"`);
  });
});
