import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');

describe('og.png image', () => {
  it('has dimensions 1200×630', () => {
    const pngPath = join(ROOT, 'public', 'og.png');
    const buffer = readFileSync(pngPath);

    // PNG header contains width and height as big-endian 32-bit integers at offset 16 and 20
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    expect(width).toBe(1200);
    expect(height).toBe(630);
  });

  it('template contains no banned claim patterns', () => {
    const templatePath = join(ROOT, 'scripts', 'og-template.html');
    const template = readFileSync(templatePath, 'utf8');

    // Check for banned whole-word patterns using word boundaries
    const bannedPatterns = [
      { pattern: /\banonymous\b/i, name: 'anonymous' },
      { pattern: /\bvalidate\b/i, name: 'validate' },
      { pattern: /\bopenly\b/i, name: 'openly' },
      { pattern: /\bgenuinely\b/i, name: 'genuinely' },
      { pattern: /\blive\b/i, name: 'live' },
      { pattern: /dot-live/, name: 'dot-live' },
    ];

    for (const { pattern, name } of bannedPatterns) {
      const match = template.match(pattern);
      expect(match, `Template should not contain "${name}"`).toBeNull();
    }
  });
});
