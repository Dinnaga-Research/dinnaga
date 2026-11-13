// ABOUTME: Stamp (spec §7.5): vector, aria-hidden, class "stamp"; ring text DINNAGA RESEARCH · ATISHA,
// ABOUTME: centre TESTED, AGAINST over a blank rule; no validation-bar words; unique ids per instance.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stamp } from './Stamp';

describe('Stamp', () => {
  it('is an aria-hidden svg with the stamp class', () => {
    const { container } = render(<Stamp />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveClass('stamp');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('carries the approved words and no others', () => {
    const { container } = render(<Stamp />);
    const ring = container.querySelector('textPath')!.textContent!;
    expect(ring.startsWith('DINNAGA RESEARCH · ATISHA · ')).toBe(true);
    expect(ring.replace(/(DINNAGA RESEARCH · ATISHA · )+/, '')).toBe('');
    const texts = Array.from(container.querySelectorAll('text:not(.stamp__ring)')).map((t) => t.textContent);
    expect(texts).toEqual(['TESTED', 'AGAINST']);
    expect(container.textContent).not.toMatch(/veracity|real apis|no mocks/i);
    expect(container.querySelector('rect')).not.toBeNull(); // the blank: the stamp never says what
  });

  it('gives each instance its own path and filter ids, and references them', () => {
    const { container } = render(
      <>
        <Stamp />
        <Stamp />
      </>,
    );
    const paths = Array.from(container.querySelectorAll('path')).map((p) => p.id);
    const filters = Array.from(container.querySelectorAll('filter')).map((f) => f.id);
    expect(new Set(paths).size).toBe(2);
    expect(new Set(filters).size).toBe(2);
    for (const id of [...paths, ...filters]) expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    const tps = Array.from(container.querySelectorAll('textPath')).map((t) => t.getAttribute('href'));
    expect(tps).toEqual(paths.map((id) => `#${id}`));
    const gs = Array.from(container.querySelectorAll('g[filter]')).map((g) => g.getAttribute('filter'));
    expect(gs).toEqual(filters.map((id) => `url(#${id})`));
  });

  it('passes className through', () => {
    const { container } = render(<Stamp className="still__stamp" />);
    expect(container.querySelector('svg')).toHaveClass('stamp', 'still__stamp');
  });
});
