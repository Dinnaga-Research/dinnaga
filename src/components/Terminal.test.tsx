// ABOUTME: Tests for the Terminal interactive component.
// ABOUTME: Covers boot reveal, question submission, reset, and the passphrase unlock path.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Terminal } from './Terminal';

const BOOT = [{ text: 'OK', delay: 30 }];

describe('Terminal', () => {
  it('reveals the prompt after boot and records a submitted question', async () => {
    render(
      <MemoryRouter>
        <Terminal bootLines={BOOT} />
      </MemoryRouter>,
    );

    const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, {
      timeout: 3000,
    });
    await userEvent.type(input, 'How do we start?');
    await userEvent.keyboard('{Enter}');

    expect(screen.getByText('> How do we start?')).toBeInTheDocument();
    expect(screen.getByText('nothing was sent. this terminal only listens for one phrase.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '[RESET]' })).toBeInTheDocument();
  });

  it('does not show TRANSMISSION text and only shows the caret and reset button', async () => {
    render(
      <MemoryRouter>
        <Terminal bootLines={BOOT} />
      </MemoryRouter>,
    );

    const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, {
      timeout: 3000,
    });
    await userEvent.type(input, 'hello');
    await userEvent.keyboard('{Enter}');

    expect(screen.queryByText(/TRANSMISSION/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '[RESET]' })).toBeInTheDocument();
  });

  it('clears history when [RESET] is pressed', async () => {
    render(
      <MemoryRouter>
        <Terminal bootLines={BOOT} />
      </MemoryRouter>,
    );
    const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, {
      timeout: 3000,
    });
    await userEvent.type(input, 'ping{Enter}');
    await userEvent.click(screen.getByRole('button', { name: '[RESET]' }));
    await waitFor(() => expect(screen.queryByText('> ping')).not.toBeInTheDocument());
  });

  it('plays the unlock reveal instead of the canned reply on the passphrase', async () => {
    render(
      <MemoryRouter>
        <Terminal bootLines={BOOT} unlockLines={[{ text: 'PASSPHRASE ACCEPTED.', delay: 40 }]} />
      </MemoryRouter>,
    );

    const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, {
      timeout: 3000,
    });
    await userEvent.type(input, 'show me what you got{Enter}');

    expect(screen.getByText('> show me what you got')).toBeInTheDocument();
    expect(await screen.findByText('PASSPHRASE ACCEPTED.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Ask Dinnaga a question')).not.toBeInTheDocument();
    expect(screen.queryByText(/TRANSMISSION RECEIVED/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '[RESET]' })).not.toBeInTheDocument();
  });

  it('navigates to /artifacts after the reveal completes', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={<Terminal bootLines={BOOT} unlockLines={[{ text: 'GRANTED', delay: 40 }]} />}
          />
          <Route path="/artifacts" element={<div>SHELF LANDED</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, {
      timeout: 3000,
    });
    await userEvent.type(input, "SHOW ME WHAT YOU'VE GOT{Enter}");

    expect(await screen.findByText('SHELF LANDED', undefined, { timeout: 4000 })).toBeInTheDocument();
  });

  describe('block cursor and placeholder', () => {
    const cursors = (c: HTMLElement) => c.querySelectorAll('.t-cursor');

    it('renders exactly one aria-hidden cursor at every stage and none after a question is sent', async () => {
      const { container } = render(
        <MemoryRouter>
          <Terminal
            bootLines={[{ text: 'BOOTING THE LAB', delay: 30 }]}
            unlockLines={[{ text: 'PASSPHRASE ACCEPTED.', delay: 400 }]}
          />
        </MemoryRouter>,
      );

      // mid-boot
      expect(cursors(container)).toHaveLength(1);
      expect(cursors(container)[0]).toHaveAttribute('aria-hidden', 'true');
      await waitFor(() => expect(screen.getByText(/^BOOT/)).toBeInTheDocument());
      expect(screen.queryByText('BOOTING THE LAB')).not.toBeInTheDocument();
      expect(cursors(container)).toHaveLength(1);

      // prompt shown
      const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, {
        timeout: 3000,
      });
      expect(cursors(container)).toHaveLength(1);
      expect(cursors(container)[0]).toHaveAttribute('aria-hidden', 'true');

      // after typing
      await userEvent.type(input, 'hello');
      expect(cursors(container)).toHaveLength(1);
      expect(cursors(container)[0]).toHaveAttribute('aria-hidden', 'true');

      // after a non-phrase question is submitted
      await userEvent.keyboard('{Enter}');
      expect(screen.getByRole('button', { name: '[RESET]' })).toBeInTheDocument();
      expect(cursors(container)).toHaveLength(0);
    });

    it('renders exactly one aria-hidden cursor during the unlock reveal', async () => {
      const { container } = render(
        <MemoryRouter>
          <Terminal
            bootLines={BOOT}
            unlockLines={[{ text: 'PASSPHRASE ACCEPTED.', delay: 800 }]}
          />
        </MemoryRouter>,
      );
      const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, {
        timeout: 3000,
      });
      await userEvent.type(input, 'show me what you got{Enter}');
      expect(screen.queryByLabelText('Ask Dinnaga a question')).not.toBeInTheDocument();
      expect(cursors(container)).toHaveLength(1);
      expect(cursors(container)[0]).toHaveAttribute('aria-hidden', 'true');
      await screen.findByText('PASSPHRASE ACCEPTED.');
      expect(cursors(container)).toHaveLength(1);
    });

    it('shows the lowercase placeholder overlay with no placeholder attribute', async () => {
      const { container } = render(
        <MemoryRouter>
          <Terminal bootLines={BOOT} />
        </MemoryRouter>,
      );
      const input = await screen.findByLabelText('Ask Dinnaga a question', undefined, {
        timeout: 3000,
      });
      expect(input).not.toHaveAttribute('placeholder');
      expect(input).toHaveAttribute('aria-label', 'Ask Dinnaga a question');
      const overlay = screen.getByText('ask a question');
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
      expect(container.textContent).not.toContain('▮');
      expect(container.textContent).not.toContain('ASK A QUESTION_');

      await userEvent.type(input, 'x');
      expect(screen.queryByText('ask a question')).not.toBeInTheDocument();
    });
  });

  it('renders the art layer without errors when the 2D context is null (jsdom)', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ctx = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { container } = render(
      <MemoryRouter>
        <Terminal bootLines={BOOT} />
      </MemoryRouter>,
    );
    await screen.findByLabelText('Ask Dinnaga a question', undefined, { timeout: 3000 });
    await waitFor(() => expect(container.querySelector('canvas.cromulon-art')).not.toBeNull());
    expect(container.querySelector('canvas.cromulon-art')).toHaveAttribute('aria-hidden', 'true');
    expect(errors).not.toHaveBeenCalled();
    ctx.mockRestore();
    errors.mockRestore();
  });
});
