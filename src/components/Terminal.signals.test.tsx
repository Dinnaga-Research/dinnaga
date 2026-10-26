// ABOUTME: Tests the signals the Terminal passes to the Cromulon art: a keystroke counter and the unlock flag.
// ABOUTME: The art component is replaced with a probe that exposes its props as data attributes.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Terminal } from './Terminal';

vi.mock('./cromulon/CromulonArt', () => ({
  default: ({ unlocked, keystrokes }: { unlocked: boolean; keystrokes: number }) => (
    <canvas data-testid="art" data-unlocked={String(unlocked)} data-keystrokes={keystrokes} />
  ),
}));

const BOOT = [{ text: 'OK', delay: 30 }];

describe('Terminal signals to the Cromulon art', () => {
  it('increments the keystroke signal on each keydown in the input', async () => {
    render(
      <MemoryRouter>
        <Terminal bootLines={BOOT} />
      </MemoryRouter>,
    );
    const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, { timeout: 3000 });
    const art = await screen.findByTestId('art');
    expect(art).toHaveAttribute('data-keystrokes', '0');
    await userEvent.type(input, 'abc');
    await waitFor(() => expect(art).toHaveAttribute('data-keystrokes', '3'));
  });

  it('passes unlocked true after the unlock phrase', async () => {
    render(
      <MemoryRouter>
        <Terminal bootLines={BOOT} unlockLines={[{ text: 'OK', delay: 5000 }]} />
      </MemoryRouter>,
    );
    const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, { timeout: 3000 });
    const art = await screen.findByTestId('art');
    expect(art).toHaveAttribute('data-unlocked', 'false');
    await userEvent.type(input, 'show me what you got{Enter}');
    await waitFor(() => expect(art).toHaveAttribute('data-unlocked', 'true'));
  });
});
