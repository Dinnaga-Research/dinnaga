// ABOUTME: Tests useLiving: one fetch of /api/living per page load, shared by every caller,
// ABOUTME: and 'error' for a failed fetch, a non-2xx, non-JSON or a body that fails the contract guard.
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import full from '../../tests/fixtures/living/full.json';
import { resetLivingForTests, useLiving } from './useLiving';

const fetchMock = vi.fn();

function respond(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  resetLivingForTests();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useLiving', () => {
  it('starts loading, then returns ok with the data', async () => {
    fetchMock.mockResolvedValue(respond(full));
    const { result } = renderHook(() => useLiving());
    expect(result.current).toEqual({ status: 'loading', data: null });
    await waitFor(() => expect(result.current.status).toBe('ok'));
    expect(result.current.data).toEqual(full);
    expect(fetchMock).toHaveBeenCalledWith('/api/living', expect.anything());
  });

  it('fetches once however many components use it, and a later mount starts settled', async () => {
    fetchMock.mockResolvedValue(respond(full));
    const a = renderHook(() => useLiving());
    const b = renderHook(() => useLiving());
    await waitFor(() => expect(a.result.current.status).toBe('ok'));
    await waitFor(() => expect(b.result.current.status).toBe('ok'));
    const c = renderHook(() => useLiving());
    expect(c.result.current.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('is error when the fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useLiving());
    await waitFor(() => expect(result.current).toEqual({ status: 'error', data: null }));
  });

  it('is error for a non-2xx response', async () => {
    fetchMock.mockResolvedValue(respond(full, { ok: false, status: 500 }));
    const { result } = renderHook(() => useLiving());
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('is error for a non-JSON body', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('<!doctype')) });
    const { result } = renderHook(() => useLiving());
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('is error for JSON that fails the contract guard', async () => {
    fetchMock.mockResolvedValue(respond({ hello: 'world' }));
    const { result } = renderHook(() => useLiving());
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('does not update after unmount', async () => {
    let resolve: (v: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = renderHook(() => useLiving());
    unmount();
    await act(async () => resolve(respond(full)));
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
