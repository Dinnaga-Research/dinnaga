// ABOUTME: Validation tests for the artifact shelf data — field shape, unique slugs,
// ABOUTME: and that every docPath resolves to a real file under public/.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARTIFACTS } from './artifacts';

const PUBLIC_DIR = join(__dirname, '..', '..', 'public');

describe('ARTIFACTS', () => {
  it('ships the SLAMWICH tasting report', () => {
    const report = ARTIFACTS.find((a) => a.slug === 'slamwich-tasting-report');
    expect(report?.title).toBe('SLAMWICH Tasting Report');
    expect(report?.project).toBe('Slamwich');
    expect(report?.published).toBe('2026-08-08');
    expect(report?.docPath).toBe('/artifact-docs/slamwich-tasting-report.html');
    expect(report?.note).toMatch(/localhost:9021/);
  });

  it('every entry has non-empty core fields and an ISO published date', () => {
    for (const a of ARTIFACTS) {
      expect(a.slug).not.toBe('');
      expect(a.title).not.toBe('');
      expect(a.project).not.toBe('');
      expect(a.oneLiner).not.toBe('');
      expect(a.docPath).not.toBe('');
      expect(a.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('slugs are unique', () => {
    const slugs = ARTIFACTS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every docPath is root-relative and resolves to a file under public/', () => {
    for (const a of ARTIFACTS) {
      expect(a.docPath.startsWith('/')).toBe(true);
      expect(existsSync(join(PUBLIC_DIR, a.docPath))).toBe(true);
    }
  });

  it('no docPath lives inside the /artifacts route namespace', () => {
    // Static-host extensionless resolution (e.g. vite preview) would let a doc at
    // /artifacts/<slug>.html shadow the /artifacts/<slug> viewer route.
    for (const a of ARTIFACTS) {
      expect(a.docPath.startsWith('/artifacts/')).toBe(false);
    }
  });
});
