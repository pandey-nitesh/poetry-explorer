import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PoemMeta, SearchField } from '../api/types';
import { poemKey } from '../lib/identity';

// Client/UI state only — never server-derived data (that lives in TanStack Query). SPEC §8.
interface AppState {
  // Search box (EPHEMERAL — must not persist; a reload shouldn't restore a half-typed query).
  field: SearchField;
  query: string;
  setField: (f: SearchField) => void;
  setQuery: (q: string) => void;

  // Reading list (PERSISTED).
  saved: PoemMeta[];
  toggleSaved: (p: PoemMeta) => void;
  isSaved: (p: PoemMeta) => boolean;

  // Display preferences (PERSISTED).
  theme: 'light' | 'dark';
  fontScale: number;
  setTheme: (t: 'light' | 'dark') => void;
  setFontScale: (n: number) => void;
}

export const FONT_SCALE_MIN = 0.875;
export const FONT_SCALE_MAX: number = 1.5;
export const FONT_SCALE_STEP = 0.125;

// Initial theme follows the OS the first time only; persisted thereafter. Guarded so it
// never crashes in non-browser environments (jsdom has no matchMedia).
function systemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

const samePoem = (a: PoemMeta, b: PoemMeta) => poemKey(a) === poemKey(b);
const toMeta = (p: PoemMeta): PoemMeta => ({
  author: p.author,
  title: p.title,
  linecount: p.linecount,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      field: 'author',
      query: '',
      setField: (field) => set({ field }),
      setQuery: (query) => set({ query }),

      saved: [],
      toggleSaved: (p) =>
        set((s) => {
          const exists = s.saved.some((x) => samePoem(x, p));
          return {
            saved: exists
              ? s.saved.filter((x) => !samePoem(x, p))
              : [...s.saved, toMeta(p)],
          };
        }),
      isSaved: (p) => get().saved.some((x) => samePoem(x, p)),

      theme: systemTheme(),
      fontScale: 1,
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) => set({ fontScale }),
    }),
    {
      name: 'poetry-explorer',
      // Persist ONLY these three — field/query must stay ephemeral. (SPEC §8, AGENTS rule 8)
      partialize: (s) => ({ saved: s.saved, theme: s.theme, fontScale: s.fontScale }),
    },
  ),
);
