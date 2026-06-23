import { useMemo } from 'react';

export const SUGGESTION_CAP = 10;

// Local, case-insensitive substring filter over a cached list. Prefix matches sort
// first, then alphabetical, so the most likely pick is at the top. Pure + synchronous —
// this is what makes autocomplete instant and network-free. (SPEC §9)
export function filterSuggestions(
  list: string[],
  query: string,
  cap: number = SUGGESTION_CAP,
): string[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const matches = list.filter((item) => item.toLowerCase().includes(q));
  matches.sort((a, b) => {
    const aPrefix = a.toLowerCase().startsWith(q) ? 0 : 1;
    const bPrefix = b.toLowerCase().startsWith(q) ? 0 : 1;
    return aPrefix - bPrefix || a.localeCompare(b);
  });
  return matches.slice(0, cap);
}

export function useAutocomplete(
  query: string,
  list: string[],
  cap: number = SUGGESTION_CAP,
): string[] {
  return useMemo(() => filterSuggestions(list, query, cap), [query, list, cap]);
}
