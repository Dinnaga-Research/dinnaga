// ABOUTME: Tests the hexagon-D brand mark: sized by prop, decorative, and drawn in currentColor only
// ABOUTME: (the counter is cut with fill-rule evenodd, so no black literal remains).
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandMark } from './BrandMark';

describe('BrandMark', () => {
  it('renders an aria-hidden svg at the requested size', () => {
    const { container } = render(<BrandMark size={32} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses currentColor only, with an evenodd counter', () => {
    const { container } = render(<BrandMark />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/#000|black/i);
    for (const el of Array.from(container.querySelectorAll('[fill]'))) {
      expect(['none', 'currentColor']).toContain(el.getAttribute('fill'));
    }
    expect(container.querySelector('[fill-rule="evenodd"]')).not.toBeNull();
  });
});
