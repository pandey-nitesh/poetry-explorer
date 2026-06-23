import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as poetry from '../api/poetry';
import { makeTestClient } from '../test/utils';
import { useSearch } from './useSearch';

vi.mock('../api/poetry');

const ROWS = [{ author: 'Robert Browning', title: 'A', linecount: 10 }];

function wrapperFor(route: string) {
  const client = makeTestClient();
  return function Wrap({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('useSearch — drives off URL params (SPEC §5, §7)', () => {
  it('authorContains → searchAuthors (substring)', async () => {
    vi.mocked(poetry.searchAuthors).mockResolvedValue(ROWS);
    const { result } = renderHook(() => useSearch(), {
      wrapper: wrapperFor('/search?authorContains=Browning'),
    });
    await waitFor(() => expect(result.current.results).toEqual(ROWS));
    expect(poetry.searchAuthors).toHaveBeenCalledWith('Browning');
    expect(result.current.request).toEqual({ kind: 'authorContains', term: 'Browning' });
  });

  it('titleContains → searchTitlesContaining (substring)', async () => {
    vi.mocked(poetry.searchTitlesContaining).mockResolvedValue(ROWS);
    const { result } = renderHook(() => useSearch(), {
      wrapper: wrapperFor('/search?titleContains=love'),
    });
    await waitFor(() => expect(result.current.results).toEqual(ROWS));
    expect(poetry.searchTitlesContaining).toHaveBeenCalledWith('love');
  });

  it('title → searchTitleExact (exact)', async () => {
    vi.mocked(poetry.searchTitleExact).mockResolvedValue(ROWS);
    const { result } = renderHook(() => useSearch(), {
      wrapper: wrapperFor('/search?title=Ozymandias'),
    });
    await waitFor(() => expect(result.current.results).toEqual(ROWS));
    expect(poetry.searchTitleExact).toHaveBeenCalledWith('Ozymandias');
  });

  it('fires no request below the 2-char minimum', async () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: wrapperFor('/search?authorContains=B'),
    });
    expect(result.current.tooShort).toBe(true);
    await Promise.resolve();
    expect(poetry.searchAuthors).not.toHaveBeenCalled();
  });

  it('fires no request when no recognized param is present', async () => {
    const { result } = renderHook(() => useSearch(), { wrapper: wrapperFor('/search') });
    expect(result.current.request).toBeNull();
    await Promise.resolve();
    expect(poetry.searchTitlesContaining).not.toHaveBeenCalled();
  });
});
