import {
  asStringList,
  getArray,
  getObject,
  seg,
  toMeta,
  toPoem,
} from './client';
import type { Poem, PoemMeta } from './types';

// Raw PoetryDB row before normalization. linecount is unverified (number | string),
// lines is present only on full-text endpoints. Normalized via toMeta / toPoem.
type RawRow = { author: string; title: string; linecount: unknown; lines?: string[] };

// The call surface. INVARIANT: the three search functions return metadata only
// (author,title,linecount) — never `lines`. `lines` is fetched only to READ one
// poem (fetchTitleExactPoems / fetchPoem / fetchRandomPoem). (SPEC §4 invariant, AGENTS rules 1–2)

export const fetchAuthorList = (): Promise<string[]> =>
  getObject('/author').then((r) => asStringList(r, 'authors'));

export const fetchTitleList = (): Promise<string[]> =>
  getObject('/title').then((r) => asStringList(r, 'titles'));

// --- Searches: metadata only, safe at any breadth ---

export const searchAuthors = (term: string): Promise<PoemMeta[]> =>
  getArray<RawRow>(`/author/${seg(term)}/author,title,linecount`).then((a) => a.map(toMeta));

export const searchTitlesContaining = (term: string): Promise<PoemMeta[]> =>
  getArray<RawRow>(`/title/${seg(term)}/author,title,linecount`).then((a) => a.map(toMeta));

// Exact-title SEARCH → metadata only (the ?title= results page).
export const searchTitleExact = (title: string): Promise<PoemMeta[]> =>
  getArray<RawRow>(`/title/${seg(title)}:abs/author,title,linecount`).then((a) => a.map(toMeta));

// --- Full text: lines, only to read ONE poem ---

// Full text by exact title — needed by Poem of the Day, which has a title but no author.
export const fetchTitleExactPoems = (title: string): Promise<Poem[]> =>
  getArray<RawRow>(`/title/${seg(title)}:abs`).then((a) => a.map(toPoem));

// One poem's full text by author + title (detail / deep link). ';' is the literal
// combined-query separator; ':abs' follows the encoded term.
export const fetchPoem = (author: string, title: string): Promise<Poem[]> =>
  getArray<RawRow>(`/author,title/${seg(author)};${seg(title)}:abs`).then((a) => a.map(toPoem));

// Featured fallback (only if the title list failed to load, or daily resolution misses).
export const fetchRandomPoem = (): Promise<Poem[]> =>
  getArray<RawRow>('/random').then((a) => a.map(toPoem));
