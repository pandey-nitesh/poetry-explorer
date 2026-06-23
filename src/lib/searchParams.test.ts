import { describe, expect, it } from 'vitest';
import { buildSearchPath, parseSearchParams } from './searchParams';

describe('buildSearchPath — param name encodes the kind (SPEC §7, §9)', () => {
  it('author commit is always substring (authorContains)', () => {
    expect(buildSearchPath('author', 'Browning')).toBe('/search?authorContains=Browning');
    // picking a suggestion in author mode stays substring even with exact=true upstream
    expect(buildSearchPath('author', 'Robert Browning')).toContain('authorContains=');
  });

  it('title free-text submit is substring (titleContains)', () => {
    expect(buildSearchPath('title', 'song', false)).toBe('/search?titleContains=song');
  });

  it('title suggestion pick is exact (title)', () => {
    expect(buildSearchPath('title', 'Ozymandias', true)).toBe('/search?title=Ozymandias');
  });

  it('encodes the term', () => {
    expect(buildSearchPath('title', 'Love & War', true)).toBe(
      '/search?title=Love+%26+War',
    );
  });
});

describe('parseSearchParams — read the active search off the URL (SPEC §7)', () => {
  it('reads each kind back from its param', () => {
    expect(parseSearchParams(new URLSearchParams('authorContains=Browning'))).toEqual({
      kind: 'authorContains',
      term: 'Browning',
    });
    expect(parseSearchParams(new URLSearchParams('titleContains=love'))).toEqual({
      kind: 'titleContains',
      term: 'love',
    });
    expect(parseSearchParams(new URLSearchParams('title=Ozymandias'))).toEqual({
      kind: 'title',
      term: 'Ozymandias',
    });
  });

  it('trims the term and ignores blank params', () => {
    expect(parseSearchParams(new URLSearchParams('titleContains=%20%20'))).toBeNull();
    expect(parseSearchParams(new URLSearchParams('authorContains=+the+'))?.term).toBe('the');
  });

  it('returns null when no recognized param is present', () => {
    expect(parseSearchParams(new URLSearchParams('q=foo'))).toBeNull();
    expect(parseSearchParams(new URLSearchParams(''))).toBeNull();
  });

  it('round-trips a built path', () => {
    const path = buildSearchPath('title', 'A Song', true);
    const search = new URL(`http://x${path}`).searchParams;
    expect(parseSearchParams(search)).toEqual({ kind: 'title', term: 'A Song' });
  });
});
