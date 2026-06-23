import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError, byPoemOrder } from '../api/client';
import { fetchRandomPoem, fetchTitleExactPoems } from '../api/poetry';
import { qk } from '../api/queryKeys';
import type { Poem } from '../api/types';
import { hash32 } from '../lib/hash';
import { useLists } from './useLists';

// UTC calendar day → every user worldwide sees the same featured poem at the same instant.
// Rolls over at 00:00 UTC (deliberate; SPEC §13).
export function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Deterministic daily pick (SPEC §13): hash the day into the SORTED title list (sorted so
// it's independent of API return order), fetch that title's full text, and walk to the next
// index on a miss. After a few misses, fall back to /random. When the title list is
// unavailable, /random is the only option — Home still shows a poem, just not the stable one.
export async function resolveDailyPoem(dayKey: string, titles: string[]): Promise<Poem> {
  if (titles.length > 0) {
    const sorted = [...titles].sort();
    const base = hash32(dayKey) % sorted.length;
    for (let step = 0; step < 5; step++) {
      const title = sorted[(base + step) % sorted.length];
      const result = await fetchTitleExactPoems(title);
      if (result.length > 0) {
        const poems = [...result].sort(byPoemOrder); // canonical order, never API order
        return poems[hash32(dayKey + title) % poems.length];
      }
    }
  }

  const fallback = await fetchRandomPoem();
  if (!fallback[0]) throw new ApiError('No fallback poem available');
  return fallback[0];
}

export interface UsePoemOfDayResult {
  poem: Poem | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function usePoemOfDay(): UsePoemOfDayResult {
  const queryClient = useQueryClient();
  const { titles, isLoading: listsLoading } = useLists();
  const dayKey = utcDayKey();

  // Wait until the lists settle (success or failure) so we know whether to use them or
  // fall straight to /random.
  const query = useQuery({
    queryKey: qk.poemOfDay(dayKey),
    queryFn: () => resolveDailyPoem(dayKey, titles),
    enabled: !listsLoading,
  });

  // Pre-seed the detail cache so opening the featured poem is instant — we already hold the
  // full Poem, which a metadata-only search never could. (SPEC §5)
  useEffect(() => {
    const poem = query.data;
    if (poem) {
      queryClient.setQueryData(qk.poem(poem.author, poem.title, poem.linecount), [poem]);
    }
  }, [query.data, queryClient]);

  return {
    poem: query.data ?? null,
    isLoading: listsLoading || query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
