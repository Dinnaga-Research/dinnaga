// ABOUTME: Enforces the dir-docs convention: explicit DOC_DIRS each carry a non-empty
// ABOUTME: CLAUDE.md ≤40 lines; repo root carries INDEX.md ≤80 lines.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = join(__dirname, '..', '..');
const DOC_DIRS = ['src/data', 'src/lib', 'docs', 'tests/e2e'];
describe.each(DOC_DIRS)('dir docs: %s', (dir) => {
  it('has a non-empty CLAUDE.md under 40 lines', () => {
    const text = readFileSync(join(ROOT, dir, 'CLAUDE.md'), 'utf8');
    expect(text.trim()).not.toBe('');
    expect(text.split('\n').length).toBeLessThanOrEqual(40);
  });
});
it('root INDEX.md exists, non-empty, ≤80 lines', () => {
  const text = readFileSync(join(ROOT, 'INDEX.md'), 'utf8');
  expect(text.trim()).not.toBe('');
  expect(text.split('\n').length).toBeLessThanOrEqual(80);
});
