// ABOUTME: Tests the Colophon (/colophon, #71): the h1 and four paragraphs verbatim with their two links, no retired
// ABOUTME: claims, and the type sentence's Claim check: the faces it names equal the site's @font-face families.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Colophon } from './Colophon';

const TYPE =
  'Set in Archivo. Documents are set in Atkinson Hyperlegible Next, with Chivo Mono for code. Noto Sans fills in Greek and the dotted IAST letters. Every face is under the SIL Open Font License and served from this site.';
const BUILD =
  'Built with React and Vite, and hosted on Vercel. Merging to the main branch deploys the site. The Building page reads GitHub and the Substack through a small Vercel function.';
const SOURCE =
  "This site's source is public on GitHub. The rest of what we're building is on the Building page.";
const NAME =
  'Dinnaga Research is run by David Ryan, and is named for Dignāga, the Buddhist philosopher of perception and valid cognition (pramāṇa).';

/** Every family the site's @font-face rules declare. */
function fontFaceFamilies(): Set<string> {
  const css = readFileSync(join(__dirname, '..', '..', 'styles', 'fonts.css'), 'utf8');
  const families = new Set<string>();
  for (const rule of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
    const m = /font-family:\s*["']?([^"';]+)["']?\s*;/.exec(rule);
    if (m) families.add(m[1]!.trim());
  }
  return families;
}

// Faces a colophon here could plausibly name: those the site has shipped, and the spec §11 banned list.
// A family counts as named when it appears as a whole phrase that is not part of a longer known name.
const KNOWN_FACES = [
  'Archivo',
  'Archivo Expanded',
  'Atkinson Hyperlegible',
  'Atkinson Hyperlegible Next',
  'Chivo',
  'Chivo Mono',
  'Noto Sans',
  'JetBrains Mono',
  'Departure Mono',
  'Inter',
  'Space Grotesk',
  'Poppins',
  'Montserrat',
  'DM Sans',
  'Manrope',
  'Plus Jakarta Sans',
  'Outfit',
  'Geist',
  'Sora',
  'Bricolage Grotesque',
  'Source Serif 4',
];

function facesNamed(text: string): Set<string> {
  const known = [...new Set([...KNOWN_FACES, ...fontFaceFamilies()])].sort(
    (a, b) => b.length - a.length,
  );
  const named = new Set<string>();
  let rest = text;
  for (const face of known) {
    const re = new RegExp(`\\b${face.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    if (re.test(rest)) {
      named.add(face);
      rest = rest.replace(re, ' ');
    }
  }
  return named;
}

function renderColophon() {
  return render(
    <MemoryRouter>
      <Colophon />
    </MemoryRouter>,
  );
}

describe('Colophon', () => {
  it('renders the h1 and the four paragraphs verbatim, in order', () => {
    const { container } = renderColophon();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Colophon$/);
    const paras = [...container.querySelectorAll('.colophon p')].map((p) => p.textContent);
    expect(paras).toEqual([TYPE, BUILD, SOURCE, NAME]);
  });

  it('links the source to the repository and the Building page to /building', () => {
    renderColophon();
    expect(screen.getByRole('link', { name: 'public on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/Dinnaga-Research/dinnaga',
    );
    expect(screen.getByRole('link', { name: 'Building page' })).toHaveAttribute(
      'href',
      '/building',
    );
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('makes none of the retired claims', () => {
    const { container } = renderColophon();
    expect(container.textContent).not.toMatch(
      /GitHub Pages|Dinnaga design system|anonymous|deployed by hand/i,
    );
    expect(container.textContent).not.toMatch(/Archivo Expanded|JetBrains|Departure|terminal/i);
  });

  it('names exactly the families the @font-face rules declare', () => {
    const families = fontFaceFamilies();
    expect(families.size).toBeGreaterThan(0);
    const { container } = renderColophon();
    const type = container.querySelector('.colophon p')!.textContent!;
    expect(facesNamed(type)).toEqual(families);
  });

  it('counts a face as named only once, and not inside a longer name', () => {
    expect(facesNamed('Set in Archivo Expanded and Chivo Mono.')).toEqual(
      new Set(['Archivo Expanded', 'Chivo Mono']),
    );
  });
});
