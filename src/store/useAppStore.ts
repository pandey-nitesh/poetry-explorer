import { create } from 'zustand';
import type { SearchField } from '../api/types';

// Client/UI state only — never server-derived data (that lives in TanStack Query). SPEC §8.
// field/query are deliberately EPHEMERAL: they drive the search box but must not persist
// (a reload should not restore a half-typed query). The persisted slice (saved / theme /
// fontScale) is added in a later wave with `partialize`. (SPEC §8, AGENTS rule 8)
interface AppState {
  field: SearchField; // toggle: 'author' | 'title'
  query: string; // raw input text (trimmed only at commit, never on keystroke)
  setField: (f: SearchField) => void;
  setQuery: (q: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  field: 'author',
  query: '',
  setField: (field) => set({ field }),
  setQuery: (query) => set({ query }),
}));
