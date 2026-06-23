import type { PoemMeta } from '../api/types';

// PoetryDB has no poem ID and titles aren't unique. NEVER build an ID by joining
// fields with a printable delimiter — titles contain '--', em dashes, even ';'.
// Two separate, collision-proof mechanisms instead. (SPEC §6, AGENTS rule 4)

// In-memory key (React keys, Maps): join with the Unit Separator control char,
// which cannot occur in poem text.
export const poemKey = (p: PoemMeta): string =>
  `${p.author}\u001F${p.title}\u001F${p.linecount}`;

export interface PoemUrlParams {
  author: string;
  title: string;
  n?: number;
}

// Detail URL: fully reversible, isolated query params. n (linecount) disambiguates
// duplicate titles and is written only when known (> 0). usePoem reads it back and
// filters by it — the round-trip must stay symmetric. (SPEC §6, §10, AGENTS rule 6)
export const buildPoemPath = (p: PoemMeta): string => {
  const params = new URLSearchParams({ author: p.author, title: p.title });
  if (p.linecount > 0) params.set('n', String(p.linecount));
  return `/poem?${params.toString()}`;
};

// Read detail params back off the URL. Returns null when author/title are missing
// (a malformed deep link); drops a non-positive / non-numeric n. (SPEC §6, §10)
export const parsePoemParams = (search: URLSearchParams): PoemUrlParams | null => {
  const author = search.get('author');
  const title = search.get('title');
  if (!author || !title) return null;

  const nRaw = search.get('n');
  const n = nRaw != null ? Number(nRaw) : NaN;
  return {
    author,
    title,
    n: Number.isFinite(n) && n > 0 ? n : undefined,
  };
};
