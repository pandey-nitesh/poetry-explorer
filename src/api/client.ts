import type { Poem, PoemMeta } from './types';

// The data layer owns ALL PoetryDB knowledge: every fetch, guard, and normalizer
// lives here so components never touch raw responses or build URLs. (SPEC §4, AGENTS rule 11)

export const BASE = 'https://poetrydb.org';
const TIMEOUT_MS = 12_000;

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// URL-encode a single path segment. Append ':abs' AFTER the encoded term; the
// combined-query separator is a literal ';'. (SPEC §2 rule 8)
export const seg = (s: string): string => encodeURIComponent(s);

// PoetryDB signals "no match" with a { status: 404 } body. status may be number
// or string, and it's unverified whether the HTTP status is 200 or 404 — so this
// is checked on the body and passed through regardless of HTTP status. (SPEC §2 rule 3)
export const isNotFound = (b: unknown): boolean => {
  const status = (b as { status?: unknown } | null | undefined)?.status;
  return status === 404 || status === '404';
};

// THE shared fetch: timeout + reject non-JSON (a host-overload HTML error page) +
// reject real HTTP errors. The no-match body is returned as-is so getArray can map
// it to []. A JSON-bodied 5xx is still an error. (SPEC §4)
async function fetchJSON(path: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE + path, { signal: ctrl.signal });
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      throw new ApiError(`Non-JSON response (HTTP ${res.status})`);
    }
    const body = await res.json();
    if (isNotFound(body)) return body; // pass through → getArray maps to []
    if (!res.ok) throw new ApiError(`HTTP ${res.status}`);
    return body;
  } catch (err) {
    // Normalize aborts/network failures into ApiError so the UI sees one error type.
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${TIMEOUT_MS}ms`);
    }
    throw new ApiError(err instanceof Error ? err.message : 'Network request failed');
  } finally {
    clearTimeout(timer);
  }
}

// Array endpoints (searches, poems). Known no-match object -> []; any other
// non-array shape -> throw (a contract break must surface, not become "no results"). (SPEC §4)
export async function getArray<T>(path: string): Promise<T[]> {
  const body = await fetchJSON(path);
  if (Array.isArray(body)) return body as T[];
  if (isNotFound(body)) return [];
  throw new ApiError('Unexpected API response shape');
}

// Object endpoints (the two lists) — same timeout/guard via fetchJSON.
export async function getObject<T>(path: string): Promise<T> {
  return (await fetchJSON(path)) as T;
}

// linecount comes back as number OR string OR (rarely) missing/garbage.
// Non-finite -> 0, read as "unknown" (displayed only when > 0; SPEC §12). (SPEC §2 rule 2)
export const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const toMeta = (r: {
  author: string;
  title: string;
  linecount: unknown;
}): PoemMeta => ({ author: r.author, title: r.title, linecount: num(r.linecount) });

export const toPoem = (r: {
  author: string;
  title: string;
  linecount: unknown;
  lines?: string[];
}): Poem => ({ ...toMeta(r), lines: r.lines ?? [] });

// Canonical deterministic ordering — used wherever duplicate matches must be resolved
// without trusting API order (detail disambiguation §5, daily poem §13). (AGENTS rule 5)
export const byPoemOrder = (a: PoemMeta, b: PoemMeta): number =>
  a.author.localeCompare(b.author) ||
  a.title.localeCompare(b.title) ||
  a.linecount - b.linecount;

// List endpoints return { authors: [...] } / { titles: [...] }. Validate the shape so a
// malformed/404 object fails cleanly at the boundary instead of crashing a later .sort/.map. (SPEC §4)
export const asStringList = (r: unknown, key: 'authors' | 'titles'): string[] => {
  const list = (r as Record<string, unknown> | null | undefined)?.[key];
  if (!Array.isArray(list)) throw new ApiError(`Malformed list response (${key})`);
  return list as string[];
};
