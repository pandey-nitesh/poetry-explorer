import { describe, expect, it } from 'vitest';
import { buildPoemPath, parsePoemParams, poemKey } from './identity';

describe('poemKey — control-char join (SPEC §6, AGENTS rule 4)', () => {
  it('joins fields with the US (0x1F) separator', () => {
    expect(poemKey({ author: 'A', title: 'T', linecount: 5 })).toBe('A\u001FT\u001F5');
  });

  it('does not collide for titles that contain the printable "--" delimiter', () => {
    // A naive "field--field" id would make these two equal; the control-char join must not.
    const a = poemKey({ author: 'X', title: 'a--b', linecount: 1 });
    const b = poemKey({ author: 'X--a', title: 'b', linecount: 1 });
    expect(a).not.toBe(b);
  });

  it('distinguishes duplicate titles by linecount', () => {
    expect(poemKey({ author: 'A', title: 'T', linecount: 14 })).not.toBe(
      poemKey({ author: 'A', title: 'T', linecount: 28 }),
    );
  });
});

describe('buildPoemPath (SPEC §6, §10)', () => {
  it('writes &n when linecount is known (> 0)', () => {
    const path = buildPoemPath({ author: 'Robert Browning', title: 'Love', linecount: 12 });
    const params = new URL(`http://x${path}`).searchParams;
    expect(params.get('author')).toBe('Robert Browning');
    expect(params.get('title')).toBe('Love');
    expect(params.get('n')).toBe('12');
  });

  it('omits &n when linecount is 0 (unknown)', () => {
    const path = buildPoemPath({ author: 'A', title: 'T', linecount: 0 });
    expect(path).not.toContain('n=');
  });

  it('encodes special characters safely (no raw &, em dash, slash)', () => {
    const path = buildPoemPath({ author: 'A & B', title: 'x/y — z', linecount: 3 });
    const params = new URL(`http://x${path}`).searchParams;
    expect(params.get('author')).toBe('A & B');
    expect(params.get('title')).toBe('x/y — z');
  });
});

describe('parsePoemParams (SPEC §6, §10)', () => {
  it('round-trips a built path back to its parts', () => {
    const meta = { author: 'Emily Dickinson', title: 'Hope — "the thing"', linecount: 12 };
    const path = buildPoemPath(meta);
    const parsed = parsePoemParams(new URL(`http://x${path}`).searchParams);
    expect(parsed).toEqual({ author: meta.author, title: meta.title, n: 12 });
  });

  it('returns null when author or title is missing', () => {
    expect(parsePoemParams(new URLSearchParams('title=T'))).toBeNull();
    expect(parsePoemParams(new URLSearchParams('author=A'))).toBeNull();
  });

  it('drops a non-positive or non-numeric n', () => {
    expect(parsePoemParams(new URLSearchParams('author=A&title=T&n=0'))?.n).toBeUndefined();
    expect(parsePoemParams(new URLSearchParams('author=A&title=T&n=abc'))?.n).toBeUndefined();
  });

  it('keeps a valid n', () => {
    expect(parsePoemParams(new URLSearchParams('author=A&title=T&n=42'))?.n).toBe(42);
  });
});
