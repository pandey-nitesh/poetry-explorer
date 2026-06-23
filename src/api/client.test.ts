import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  asStringList,
  byPoemOrder,
  getArray,
  getObject,
  isNotFound,
  num,
  toMeta,
  toPoem,
} from './client';

// Build a minimal Response-like object for the fetch mock.
function res(
  body: unknown,
  {
    ok = true,
    status = 200,
    contentType = 'application/json',
  }: { ok?: boolean; status?: number; contentType?: string } = {},
): Response {
  return {
    ok,
    status,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) },
    json: async () => body,
  } as unknown as Response;
}

function mockFetch(impl: (url: string) => Response | Promise<Response>) {
  const fn = vi.fn((url: string) => Promise.resolve(impl(url)));
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('num — linecount coercion (SPEC §2 rule 2)', () => {
  it('coerces numeric strings to numbers', () => {
    expect(num('24')).toBe(24);
  });
  it('passes through numbers', () => {
    expect(num(80)).toBe(80);
  });
  it('maps missing / non-numeric / NaN to 0 (unknown)', () => {
    expect(num(undefined)).toBe(0);
    expect(num(null)).toBe(0);
    expect(num('not a number')).toBe(0);
    expect(num(NaN)).toBe(0);
  });
});

describe('toMeta / toPoem normalizers', () => {
  it('toMeta coerces linecount and keeps author/title', () => {
    expect(toMeta({ author: 'A', title: 'T', linecount: '12' })).toEqual({
      author: 'A',
      title: 'T',
      linecount: 12,
    });
  });
  it('toPoem defaults missing lines to []', () => {
    expect(toPoem({ author: 'A', title: 'T', linecount: 3 }).lines).toEqual([]);
  });
  it('toPoem preserves lines verbatim, including blanks and leading spaces (SPEC §2 rule 7)', () => {
    const lines = ['  indented', '', 'next stanza'];
    expect(toPoem({ author: 'A', title: 'T', linecount: 3, lines }).lines).toEqual(lines);
  });
});

describe('isNotFound (SPEC §2 rule 3)', () => {
  it('matches the 404 status object as number or string', () => {
    expect(isNotFound({ status: 404 })).toBe(true);
    expect(isNotFound({ status: '404' })).toBe(true);
  });
  it('does not match arrays or other objects', () => {
    expect(isNotFound([])).toBe(false);
    expect(isNotFound({ status: 500 })).toBe(false);
    expect(isNotFound(null)).toBe(false);
  });
});

describe('byPoemOrder — canonical ordering (AGENTS rule 5)', () => {
  it('orders by author, then title, then linecount', () => {
    const input = [
      { author: 'B', title: 'a', linecount: 1 },
      { author: 'A', title: 'b', linecount: 1 },
      { author: 'A', title: 'a', linecount: 5 },
      { author: 'A', title: 'a', linecount: 2 },
    ];
    expect([...input].sort(byPoemOrder)).toEqual([
      { author: 'A', title: 'a', linecount: 2 },
      { author: 'A', title: 'a', linecount: 5 },
      { author: 'A', title: 'b', linecount: 1 },
      { author: 'B', title: 'a', linecount: 1 },
    ]);
  });
});

describe('asStringList — list shape validation (SPEC §4)', () => {
  it('returns the array for a well-formed list', () => {
    expect(asStringList({ authors: ['X', 'Y'] }, 'authors')).toEqual(['X', 'Y']);
  });
  it('throws ApiError when the key is not an array', () => {
    expect(() => asStringList({ authors: 'nope' }, 'authors')).toThrow(ApiError);
    expect(() => asStringList({}, 'titles')).toThrow(ApiError);
    expect(() => asStringList(null, 'authors')).toThrow(ApiError);
  });
});

describe('getArray — fetch guard (SPEC §4)', () => {
  it('returns a JSON array unchanged', async () => {
    mockFetch(() => res([{ a: 1 }]));
    await expect(getArray('/x')).resolves.toEqual([{ a: 1 }]);
  });

  it('maps the known 404 object to [] (not an error)', async () => {
    mockFetch(() => res({ status: 404, reason: 'Not found' }));
    await expect(getArray('/x')).resolves.toEqual([]);
  });

  it('maps a string-status 404 object to []', async () => {
    mockFetch(() => res({ status: '404' }, { ok: false, status: 404 }));
    await expect(getArray('/x')).resolves.toEqual([]);
  });

  it('throws ApiError on a non-JSON (host 5xx HTML) response — never silently empty', async () => {
    mockFetch(() => res('<html>error</html>', { ok: false, status: 502, contentType: 'text/html' }));
    await expect(getArray('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('throws ApiError on a JSON-bodied non-OK response that is not the 404 object', async () => {
    mockFetch(() => res({ message: 'boom' }, { ok: false, status: 500 }));
    await expect(getArray('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('throws ApiError on an unexpected (non-array, non-404) JSON shape', async () => {
    mockFetch(() => res({ authors: ['a'] }));
    await expect(getArray('/x')).rejects.toThrow(/Unexpected API response shape/);
  });

  it('normalizes a network rejection into ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(getArray('/x')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('getObject — fetch guard for list endpoints', () => {
  it('returns the parsed object', async () => {
    mockFetch(() => res({ authors: ['a', 'b'] }));
    await expect(getObject('/author')).resolves.toEqual({ authors: ['a', 'b'] });
  });
  it('throws ApiError on a non-JSON response', async () => {
    mockFetch(() => res('oops', { contentType: 'text/html' }));
    await expect(getObject('/author')).rejects.toBeInstanceOf(ApiError);
  });
});
