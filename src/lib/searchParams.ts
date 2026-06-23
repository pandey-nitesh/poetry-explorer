import type { SearchField } from '../api/types';

// The results-page URL is the source of truth for a search. The PARAM NAME encodes the
// kind — no `mode`/`q` param. Direction comes from the toggle, kind from how the user
// committed (submit vs. pick). SPEC §7. This module is the single place that mapping
// lives; SearchBar builds the path, useSearch parses it (AGENTS seam map).

export type SearchKind = 'authorContains' | 'titleContains' | 'title';

export interface SearchRequest {
  kind: SearchKind;
  term: string;
}

export function buildSearchPath(
  field: SearchField,
  term: string,
  exact = false,
): string {
  const kind: SearchKind =
    field === 'author' ? 'authorContains' : exact ? 'title' : 'titleContains';
  return `/search?${new URLSearchParams({ [kind]: term }).toString()}`;
}

// Read the active search off URL params. Returns null when no recognized, non-blank
// param is present. Precedence is fixed and deterministic.
export function parseSearchParams(params: URLSearchParams): SearchRequest | null {
  const order: SearchKind[] = ['title', 'authorContains', 'titleContains'];
  for (const kind of order) {
    const raw = params.get(kind);
    if (raw != null) {
      const term = raw.trim();
      if (term.length > 0) return { kind, term };
    }
  }
  return null;
}
