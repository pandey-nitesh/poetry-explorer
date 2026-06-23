import { skipToken, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { searchAuthors, searchTitleExact, searchTitlesContaining } from '../api/poetry';
import { qk } from '../api/queryKeys';
import type { PoemMeta } from '../api/types';
import { parseSearchParams } from '../lib/searchParams';
import type { SearchRequest } from '../lib/searchParams';

const MIN_QUERY_LENGTH = 2;

// Map a parsed request to its query key + fetcher. The kind (from the URL param name)
// chooses author-substring, title-substring, or title-exact — all metadata only. (SPEC §5, §7)
function queryFor(req: SearchRequest) {
  switch (req.kind) {
    case 'authorContains':
      return { key: qk.searchAuthor(req.term), fn: () => searchAuthors(req.term) };
    case 'titleContains':
      return { key: qk.searchTitle(req.term), fn: () => searchTitlesContaining(req.term) };
    case 'title':
      return { key: qk.titleExact(req.term), fn: () => searchTitleExact(req.term) };
  }
}

export interface UseSearchResult {
  request: SearchRequest | null;
  results: PoemMeta[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  tooShort: boolean;
}

// Drives the results screen entirely off the URL (SPEC §5, §7). The query is gated by a
// 2-char minimum via skipToken, so a too-short or absent term fires no request.
export function useSearch(): UseSearchResult {
  const [params] = useSearchParams();
  const request = parseSearchParams(params);
  const tooShort = !!request && request.term.length < MIN_QUERY_LENGTH;
  const active = request && !tooShort ? queryFor(request) : null;

  const query = useQuery({
    queryKey: active?.key ?? (['search', 'idle'] as const),
    queryFn: active ? active.fn : skipToken,
  });

  return {
    request,
    results: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
    tooShort,
  };
}
