import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as poetry from '../api/poetry';
import { makeTestClient } from '../test/utils';
import { usePoem } from './usePoem';

vi.mock('../api/poetry');

function wrapper() {
  const client = makeTestClient();
  return function Wrap({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('usePoem — deterministic detail resolution (SPEC §5, §6)', () => {
  it('fetches by author+title and resolves the poem (cold deep-link, §16 #6)', async () => {
    vi.mocked(poetry.fetchPoem).mockResolvedValue([
      { author: 'A', title: 'T', linecount: 5, lines: ['x'] },
    ]);
    const { result } = renderHook(() => usePoem('A', 'T', 5), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.poem).not.toBeNull());
    expect(result.current.poem?.title).toBe('T');
    expect(poetry.fetchPoem).toHaveBeenCalledWith('A', 'T');
  });

  it('picks the n-matching poem among duplicate titles (§16 #18)', async () => {
    vi.mocked(poetry.fetchPoem).mockResolvedValue([
      { author: 'A', title: 'T', linecount: 20, lines: ['long'] },
      { author: 'A', title: 'T', linecount: 8, lines: ['short'] },
    ]);
    const { result } = renderHook(() => usePoem('A', 'T', 8), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.poem).not.toBeNull());
    expect(result.current.poem?.linecount).toBe(8);
  });

  it('falls back to the first canonically-sorted poem when n matches nothing', async () => {
    vi.mocked(poetry.fetchPoem).mockResolvedValue([
      { author: 'A', title: 'T', linecount: 20, lines: ['b'] },
      { author: 'A', title: 'T', linecount: 8, lines: ['a'] },
    ]);
    const { result } = renderHook(() => usePoem('A', 'T', 999), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.poem).not.toBeNull());
    expect(result.current.poem?.linecount).toBe(8);
  });

  it('reports notFound when the refetch returns nothing', async () => {
    vi.mocked(poetry.fetchPoem).mockResolvedValue([]);
    const { result } = renderHook(() => usePoem('A', 'Nope'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.poem).toBeNull();
  });

  it('does not fetch when author/title are absent', async () => {
    const { result } = renderHook(() => usePoem(undefined, undefined), { wrapper: wrapper() });
    await Promise.resolve();
    expect(poetry.fetchPoem).not.toHaveBeenCalled();
    expect(result.current.poem).toBeNull();
  });
});
