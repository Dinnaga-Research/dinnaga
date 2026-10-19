// ABOUTME: Tests for the Terminal interactive component.
// ABOUTME: Covers boot reveal, question submission, reset, and the passphrase unlock path.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
});
