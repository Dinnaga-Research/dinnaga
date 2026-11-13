// ABOUTME: ChapterRail (spec §7.6): a nav of five real buttons, numbers derived from order, aria-current="step"
// ABOUTME: on the current stage, past and future states, and a jump callback per button.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { METHOD_STAGES } from '../../data/method';
import { ChapterRail } from './ChapterRail';

describe('ChapterRail', () => {
  it('is a nav named "Jump to a method stage" with one button per stage, in order', () => {
    render(<ChapterRail stages={METHOD_STAGES} current={-1} onJump={() => {}} />);
    const nav = screen.getByRole('navigation', { name: 'Jump to a method stage' });
    const buttons = within(nav).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['01Read', '02Digest', '03Ideate', '04Experiment', '05Ship']);
    expect(buttons.map((b) => b.getAttribute('type'))).toEqual(Array(5).fill('button'));
  });

  it('names each button by its stage (the number is decoration)', () => {
    render(<ChapterRail stages={METHOD_STAGES} current={-1} onJump={() => {}} />);
    for (const s of METHOD_STAGES) expect(screen.getByRole('button', { name: s.name })).toBeInTheDocument();
  });

  it('marks the current stage with aria-current="step", earlier ones as past', () => {
    render(<ChapterRail stages={METHOD_STAGES} current={2} onJump={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-current'))).toEqual([null, null, 'step', null, null]);
    expect(buttons.map((b) => b.className)).toEqual(['is-past', 'is-past', 'is-on', '', '']);
  });

  it('places each stage at its mark', () => {
    const { container } = render(<ChapterRail stages={METHOD_STAGES} current={-1} onJump={() => {}} />);
    const ats = Array.from(container.querySelectorAll('li')).map((li) => li.style.getPropertyValue('--at'));
    expect(ats).toEqual(['0.06', '0.22', '0.4', '0.585', '0.78']);
  });

  it('calls onJump with the stage index', () => {
    const onJump = vi.fn();
    render(<ChapterRail stages={METHOD_STAGES} current={-1} onJump={onJump} />);
    fireEvent.click(screen.getByRole('button', { name: 'Experiment' }));
    expect(onJump).toHaveBeenCalledWith(3);
  });
});
