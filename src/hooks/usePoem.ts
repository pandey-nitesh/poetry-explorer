import { skipToken, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { byPoemOrder } from '../api/client';
import { fetchPoem } from '../api/poetry';
import { qk } from '../api/queryKeys';
import type { Poem } from '../api/types';

export interface UsePoemResult {
  poem: Poem | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  notFound: boolean;
  refetch: () => void;
}

// One hook for warm nav, cold reload, and shared links alike: refetch by :abs, then resolve
// the array DETERMINISTICALLY — sort canonically, prefer the linecount (n) match when the
// URL carries one, else take the first. Never index into the unsorted response.
// (SPEC §5, §6; AGENTS rules 5–6)
export function usePoem(author?: string, title?: string, n?: number): UsePoemResult {
  const enabled = !!author && !!title;

  const query = useQuery({
    queryKey: qk.poem(author ?? '', title ?? '', n),
    queryFn: enabled ? () => fetchPoem(author, title) : skipToken,
  });

  const poem = useMemo<Poem | null>(() => {
    const sorted = [...(query.data ?? [])].sort(byPoemOrder);
    const match = n ? sorted.find((p) => p.linecount === n) : undefined;
    return match ?? sorted[0] ?? null;
  }, [query.data, n]);

  // Settled with data but nothing resolved → genuine "couldn't find it" (handles 0/2+ matches).
  const notFound =
    enabled && !query.isLoading && !query.isError && query.data != null && poem == null;

  return {
    poem,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    notFound,
    refetch: () => void query.refetch(),
  };
}
