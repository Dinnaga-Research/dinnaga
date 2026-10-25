// Token contrast test and lint (spec §16)
// Verifies that all design tokens have correct contrast ratios and that
// old tokens have been fully migrated and deleted.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function luminance(r: number, g: number, b: number): number {
  const normalizedValues = [r, g, b].map((c) => {
    const normalized = c / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  const rs = normalizedValues[0] ?? 0;
  const gs = normalizedValues[1] ?? 0;
  const bs = normalizedValues[2] ?? 0;
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function wcagContrast(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const lum1 = luminance(rgb1[0] ?? 0, rgb1[1] ?? 0, rgb1[2] ?? 0);
  const lum2 = luminance(rgb2[0] ?? 0, rgb2[1] ?? 0, rgb2[2] ?? 0);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  const tokenRegex = /--dn-([a-z0-9-]+):\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(css)) !== null) {
    const name = `--dn-${match[1] ?? ''}`;
    const value = (match[2] ?? '').trim();
    // Only keep hex color values
    if (value && value.match(/^#[0-9a-f]{6}$/i)) {
      tokens.set(name, value);
    }
  }
  return tokens;
}

describe('Token contrast (§16)', () => {
  const tokensCss = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf-8');
  const tokens = parseTokens(tokensCss);

  it('should have --dn-text at ≥15.0:1 on --dn-bg', () => {
    const text = tokens.get('--dn-text');
    const bg = tokens.get('--dn-bg');
    expect(text).toBeDefined();
    expect(bg).toBeDefined();
    if (text && bg) {
      const ratio = wcagContrast(text, bg);
      expect(ratio).toBeGreaterThanOrEqual(15.0);
    }
  });

  it('should have --dn-text-2 at ≥9.0:1 on --dn-bg', () => {
    const text2 = tokens.get('--dn-text-2');
    const bg = tokens.get('--dn-bg');
    expect(text2).toBeDefined();
    expect(bg).toBeDefined();
    if (text2 && bg) {
      const ratio = wcagContrast(text2, bg);
      expect(ratio).toBeGreaterThanOrEqual(9.0);
    }
  });

  it('should have --dn-text-label at ≥7.0:1 on --dn-bg', () => {
    const label = tokens.get('--dn-text-label');
    const bg = tokens.get('--dn-bg');
    expect(label).toBeDefined();
    expect(bg).toBeDefined();
    if (label && bg) {
      const ratio = wcagContrast(label, bg);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    }
  });

  it('should have --dn-term-dim at ≥9.0:1 on --dn-term-bg', () => {
    const termDim = tokens.get('--dn-term-dim');
    const termBg = tokens.get('--dn-term-bg');
    expect(termDim).toBeDefined();
    expect(termBg).toBeDefined();
    if (termDim && termBg) {
      const ratio = wcagContrast(termDim, termBg);
      expect(ratio).toBeGreaterThanOrEqual(9.0);
    }
  });

  it('should have --dn-term-dim at ≥8.5:1 on --dn-term-bar', () => {
    const termDim = tokens.get('--dn-term-dim');
    const termBar = tokens.get('--dn-term-bar');
    expect(termDim).toBeDefined();
    expect(termBar).toBeDefined();
    if (termDim && termBar) {
      const ratio = wcagContrast(termDim, termBar);
      expect(ratio).toBeGreaterThanOrEqual(8.5);
    }
  });
});

describe('Token lint (§16)', () => {
  // Gather all CSS files
  const srcDir = join(ROOT, 'src');
  function getAllCssFiles(dir: string, files: string[] = []): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        getAllCssFiles(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.css')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const cssFiles = getAllCssFiles(join(srcDir, 'styles'));
  const allCss = cssFiles.map((f) => readFileSync(f, 'utf-8')).join('\n');

  it('every var(--x) should have a definition', () => {
    const varRegex = /var\(--([a-z0-9-]+)\)/gi;
    const usedVars = new Set<string>();
    const definedVars = new Set<string>();

    // Find all variable uses
    let match;
    while ((match = varRegex.exec(allCss)) !== null) {
      usedVars.add(`--${match[1]}`);
    }

    // Find all variable definitions
    const defRegex = /(--[a-z0-9-]+):\s*[^;]+;/g;
    let defMatch: RegExpExecArray | null;
    while ((defMatch = defRegex.exec(allCss)) !== null) {
      if (defMatch[1]) {
        definedVars.add(defMatch[1]);
      }
    }

    const undefinedVars: string[] = [];
    for (const varName of usedVars) {
      if (!definedVars.has(varName) && !varName.startsWith('--btn-')) {
        undefinedVars.push(varName);
      }
    }

    expect(undefinedVars).toEqual([]);
  });

  it('no old token names from §12 should remain', () => {
    const oldTokens = [
      '--bg-0', '--bg-1', '--bg-2', '--surface', '--surface-hi',
      '--fg-1', '--fg-2', '--fg-3', '--fg-4', '--fg-5',
      '--signal', '--signal-dim', '--signal-glow', '--glow-signal', '--glow-signal-strong',
      '--warn', '--error', '--info',
      '--seam', '--seam-soft', '--seam-strong',
      '--t-detail-sm', '--t-detail', '--t-body', '--t-body-hi', '--t-h1', '--t-h2', '--t-h3', '--t-super',
      '--lh-heading', '--lh-heading3', '--lh-super', '--lh-body', '--lh-mono',
      '--ls-display', '--ls-tight', '--ls-body', '--ls-mono', '--ls-label', '--ls-eyebrow', '--ls-mega',
      '--sp-0', '--sp-1',
      '--border-thin', '--border-strong', '--border-signal',
      '--shadow-card', '--inset-scanline',
      '--term-green', '--term-green-dim', '--term-bg', '--term-edge',
      '--tier-',
    ];

    const remaining: string[] = [];
    for (const oldToken of oldTokens) {
      if (oldToken.endsWith('-')) {
        // Prefix match for --tier-
        const prefixRegex = new RegExp(`\\b${oldToken}[a-z0-9-]*\\b`);
        if (prefixRegex.test(allCss)) {
          remaining.push(oldToken);
        }
      } else {
        const tokenRegex = new RegExp(`\\b${oldToken}\\b`);
        if (tokenRegex.test(allCss)) {
          remaining.push(oldToken);
        }
      }
    }

    expect(remaining).toEqual([]);
  });

  it('no color declarations should use forbidden tokens', () => {
    const forbidden = [
      '--dn-rule',
      '--dn-rule-strong',
      '--dn-ui-muted',
      '--dn-term-frame',
      '#717171',
      '#444',
      '#444444',
      '#5e8a00',
    ];

    // Match 'color:' but not other properties like 'border-color:', 'background-color:', etc
    const colorRegex = /(?:^|\s)color\s*:\s*([^;]+);/gmi;
    const colorLines: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = colorRegex.exec(allCss)) !== null) {
      const value = match[1];
      if (!value) continue;
      for (const forbid of forbidden) {
        if (forbid.startsWith('--')) {
          if (value.includes(`var(${forbid})`)) {
            colorLines.push(match[0].trim());
          }
        } else {
          if (value.includes(forbid)) {
            colorLines.push(match[0].trim());
          }
        }
      }
    }

    expect(colorLines).toEqual([]);
  });
});
