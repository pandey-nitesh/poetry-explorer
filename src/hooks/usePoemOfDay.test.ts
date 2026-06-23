import { describe, expect, it, vi } from 'vitest';
import * as poetry from '../api/poetry';
import { hash32 } from '../lib/hash';
import { resolveDailyPoem } from './usePoemOfDay';

vi.mock('../api/poetry');

const DAY = '2026-06-22';
const TITLES = ['Gamma', 'Alpha', 'Epsilon', 'Beta', 'Delta'];
const SORTED = [...TITLES].sort();
const expectedTitle = (day: string, step = 0) =>
  SORTED[(hash32(day) % SORTED.length + step) % SORTED.length];

function poemFor(title: string, linecount = 4) {
  return { author: 'X', title, linecount, lines: ['a line'] };
}

describe('resolveDailyPoem — deterministic daily selection (SPEC §13)', () => {
  it('is deterministic: same day + titles → same poem', async () => {
    vi.mocked(poetry.fetchTitleExactPoems).mockImplementation(async (t) => [poemFor(t)]);
    const a = await resolveDailyPoem(DAY, TITLES);
    const b = await resolveDailyPoem(DAY, TITLES);
    expect(a).toEqual(b);
    expect(a.title).toBe(expectedTitle(DAY));
  });

  it('indexes the SORTED title list by the day hash', async () => {
    vi.mocked(poetry.fetchTitleExactPoems).mockImplementation(async (t) => [poemFor(t)]);
    const poem = await resolveDailyPoem(DAY, TITLES);
    expect(poem.title).toBe(expectedTitle(DAY, 0));
  });

  it('walks to the next title when the hashed one returns no poems', async () => {
    const skip = expectedTitle(DAY, 0);
    vi.mocked(poetry.fetchTitleExactPoems).mockImplementation(async (t) =>
      t === skip ? [] : [poemFor(t)],
    );
    const poem = await resolveDailyPoem(DAY, TITLES);
    expect(poem.title).toBe(expectedTitle(DAY, 1));
  });

  it('falls back to /random when the title list is empty', async () => {
    vi.mocked(poetry.fetchRandomPoem).mockResolvedValue([poemFor('A Random Poem', 2)]);
    const poem = await resolveDailyPoem(DAY, []);
    expect(poem.title).toBe('A Random Poem');
    expect(poetry.fetchRandomPoem).toHaveBeenCalled();
  });

  it('picks deterministically among multiple poems sharing a title', async () => {
    vi.mocked(poetry.fetchTitleExactPoems).mockImplementation(async (t) => [
      { author: 'B', title: t, linecount: 10, lines: ['b'] },
      { author: 'A', title: t, linecount: 4, lines: ['a'] },
    ]);
    const a = await resolveDailyPoem(DAY, TITLES);
    const b = await resolveDailyPoem(DAY, TITLES);
    expect(a).toEqual(b); // stable choice within the title's poems
  });
});
