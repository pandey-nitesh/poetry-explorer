import { afterEach, describe, expect, it, vi } from 'vitest';
import { BASE } from './client';
import {
  fetchAuthorList,
  fetchPoem,
  fetchRandomPoem,
  fetchTitleExactPoems,
  fetchTitleList,
  searchAuthors,
  searchTitleExact,
  searchTitlesContaining,
} from './poetry';

// Capture the URL each call hits and return a canned JSON body.
function capture(body: unknown = []) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => body,
  } as unknown as Response);
  vi.stubGlobal('fetch', fn);
  return fn;
}

const calledPath = (fn: ReturnType<typeof capture>) =>
  (fn.mock.calls[0][0] as string).replace(BASE, '');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('search call surface — metadata only (SPEC §4 invariant, §16 #2/#19)', () => {
  it('searchAuthors hits /author/<term>/author,title,linecount (substring)', async () => {
    const fn = capture();
    await searchAuthors('Browning');
    expect(calledPath(fn)).toBe('/author/Browning/author,title,linecount');
  });

  it('searchTitlesContaining hits /title/<term>/author,title,linecount with NO lines', async () => {
    const fn = capture();
    await searchTitlesContaining('the');
    const path = calledPath(fn);
    expect(path).toBe('/title/the/author,title,linecount');
    expect(path).not.toContain('lines');
  });

  it('searchTitleExact appends :abs to the term, still metadata only (no lines)', async () => {
    const fn = capture();
    await searchTitleExact('Ozymandias');
    const path = calledPath(fn);
    expect(path).toBe('/title/Ozymandias:abs/author,title,linecount');
    expect(path).not.toContain('lines');
  });

  it('every search path selects author,title,linecount and never requests lines', async () => {
    for (const run of [
      () => searchAuthors('x'),
      () => searchTitlesContaining('x'),
      () => searchTitleExact('x'),
    ]) {
      const fn = capture();
      await run();
      const path = calledPath(fn);
      expect(path).toContain('author,title,linecount');
      expect(path).not.toMatch(/(^|\/):abs$/); // a bare :abs (full text) is never a search
      vi.unstubAllGlobals();
    }
  });
});

describe('full-text call surface — lines, single poem only (SPEC §4)', () => {
  it('fetchTitleExactPoems hits /title/<title>:abs (full text)', async () => {
    const fn = capture();
    await fetchTitleExactPoems('Song');
    expect(calledPath(fn)).toBe('/title/Song:abs');
  });

  it('fetchPoem uses the literal ; separator and :abs after the encoded term', async () => {
    const fn = capture();
    await fetchPoem('Robert Browning', 'Love Among the Ruins');
    expect(calledPath(fn)).toBe(
      '/author,title/Robert%20Browning;Love%20Among%20the%20Ruins:abs',
    );
  });

  it('fetchRandomPoem hits /random', async () => {
    const fn = capture();
    await fetchRandomPoem();
    expect(calledPath(fn)).toBe('/random');
  });
});

describe('URL-encoding each segment (SPEC §2 rule 8)', () => {
  it('encodes slashes, ampersands, and spaces in the term', async () => {
    const fn = capture();
    await searchTitlesContaining('a/b & c');
    expect(calledPath(fn)).toBe('/title/a%2Fb%20%26%20c/author,title,linecount');
  });
});

describe('list endpoints', () => {
  it('fetchAuthorList hits /author and returns the authors array', async () => {
    const fn = capture({ authors: ['Alan Seeger', 'Amy Levy'] });
    await expect(fetchAuthorList()).resolves.toEqual(['Alan Seeger', 'Amy Levy']);
    expect(calledPath(fn)).toBe('/author');
  });

  it('fetchTitleList hits /title and returns the titles array', async () => {
    const fn = capture({ titles: ['Ozymandias', 'Song'] });
    await expect(fetchTitleList()).resolves.toEqual(['Ozymandias', 'Song']);
    expect(calledPath(fn)).toBe('/title');
  });

  it('throws on a malformed list response (SPEC §16 #16)', async () => {
    capture({ authors: 'not an array' });
    await expect(fetchAuthorList()).rejects.toThrow();
  });
});

describe('linecount coercion at the boundary (SPEC §2 rule 2)', () => {
  it('searches return numeric linecount even when the API sends a string', async () => {
    capture([{ author: 'A', title: 'T', linecount: '24' }]);
    const [row] = await searchTitlesContaining('x');
    expect(row.linecount).toBe(24);
  });
});
