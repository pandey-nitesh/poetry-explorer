import { describe, expect, it } from 'vitest';
import { filterSuggestions } from './useAutocomplete';

const LIST = [
  'Robert Browning',
  'Elizabeth Barrett Browning',
  'William Wordsworth',
  'Emily Dickinson',
  'William Blake',
];

describe('filterSuggestions — local autocomplete (SPEC §9)', () => {
  it('returns nothing for an empty or whitespace query', () => {
    expect(filterSuggestions(LIST, '')).toEqual([]);
    expect(filterSuggestions(LIST, '   ')).toEqual([]);
  });

  it('matches case-insensitive substrings anywhere in the item', () => {
    // Neither is a prefix match for "browning", so they fall back to alphabetical order.
    expect(filterSuggestions(LIST, 'browning')).toEqual([
      'Elizabeth Barrett Browning',
      'Robert Browning',
    ]);
  });

  it('orders prefix matches before mid-string matches, then alphabetically', () => {
    // "William..." starts with the query; "Robert Browning" does not contain it.
    expect(filterSuggestions(LIST, 'will')).toEqual(['William Blake', 'William Wordsworth']);
  });

  it('trims the query before matching', () => {
    expect(filterSuggestions(LIST, '  blake  ')).toEqual(['William Blake']);
  });

  it('caps the number of suggestions', () => {
    const many = Array.from({ length: 50 }, (_, i) => `Poem ${i}`);
    expect(filterSuggestions(many, 'poem', 10)).toHaveLength(10);
  });
});
