import { beforeEach, describe, expect, it } from 'vitest';
import type { Poem } from '../api/types';
import { useAppStore } from './useAppStore';

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ saved: [], theme: 'light', fontScale: 1, field: 'author', query: '' });
});

describe('useAppStore — reading list (SPEC §8)', () => {
  it('toggleSaved adds then removes; isSaved reflects membership', () => {
    const p = { author: 'A', title: 'T', linecount: 5 };
    expect(useAppStore.getState().isSaved(p)).toBe(false);
    useAppStore.getState().toggleSaved(p);
    expect(useAppStore.getState().isSaved(p)).toBe(true);
    expect(useAppStore.getState().saved).toHaveLength(1);
    useAppStore.getState().toggleSaved(p);
    expect(useAppStore.getState().isSaved(p)).toBe(false);
  });

  it('stores metadata only (drops lines) when a full poem is saved', () => {
    const full: Poem = { author: 'A', title: 'T', linecount: 2, lines: ['a', 'b'] };
    useAppStore.getState().toggleSaved(full);
    expect(useAppStore.getState().saved[0]).toEqual({ author: 'A', title: 'T', linecount: 2 });
  });

  it('treats duplicate titles with different line counts as distinct entries', () => {
    useAppStore.getState().toggleSaved({ author: 'A', title: 'Song', linecount: 8 });
    useAppStore.getState().toggleSaved({ author: 'A', title: 'Song', linecount: 20 });
    expect(useAppStore.getState().saved).toHaveLength(2);
  });
});

describe('useAppStore — persistence (SPEC §8, §16 #12, AGENTS rule 8)', () => {
  it('persists ONLY saved, theme, and fontScale — never field/query', () => {
    useAppStore.setState({ field: 'title', query: 'half-typed draft' });
    useAppStore.getState().toggleSaved({ author: 'A', title: 'T', linecount: 1 });
    useAppStore.getState().setTheme('dark');
    useAppStore.getState().setFontScale(1.25);

    const persisted = JSON.parse(localStorage.getItem('poetry-explorer') ?? '{}');
    expect(Object.keys(persisted.state).sort()).toEqual(['fontScale', 'saved', 'theme']);
    expect(persisted.state).not.toHaveProperty('field');
    expect(persisted.state).not.toHaveProperty('query');
    expect(persisted.state.theme).toBe('dark');
    expect(persisted.state.fontScale).toBe(1.25);
    expect(persisted.state.saved).toHaveLength(1);
  });
});
