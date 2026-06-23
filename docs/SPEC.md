# Poetry Explorer — Implementation Spec

A single-page web app to search and read classic public-domain poetry from the **PoetryDB** API (`https://poetrydb.org`). Client-only; no backend, no auth.

**Stack:** React + TypeScript + Vite · TanStack Query (server state) · Zustand (client/UI state) · React Router (routing). Direct browser calls to PoetryDB — which depends on CORS. That's a **blocking day-0 check** (§15 step 0): if the browser can't fetch the lists, a search, and `/random` directly, the client-only approach has to change.

---

## 1. The model in one paragraph

On load, fetch the **complete author list and title list** once and cache them; these power **local** autocomplete (zero network per keystroke). A search box has an **Author | Title toggle**. Search calls the API for **metadata only** (`author,title,linecount`) — never `lines` — which is safe for any term. Author search is always substring; title search is **exact** when the user picks a suggestion and **substring** when they submit free text. Full `lines` is fetched only for detail reading or the featured poem. Results are a real, shareable, paginated page; the poem detail is a focused reading view.

---

## 2. PoetryDB contract & hard rules

Base URL `https://poetrydb.org`. No key. JSON.

**Endpoints used:**

| Purpose | Request | Response |
|---|---|---|
| Author list (cache on load) | `/author` | `{ authors: string[] }` |
| Title list (cache on load) | `/title` | `{ titles: string[] }` |
| Author search (always substring) | `/author/<term>/author,title,linecount` | `PoemMeta[]` |
| Title search — free-text submit (substring) | `/title/<term>/author,title,linecount` | `PoemMeta[]` |
| Title search — suggestion pick (exact) | `/title/<title>:abs/author,title,linecount` | `PoemMeta[]` |
| Full text by exact title (daily poem only) | `/title/<title>:abs` | `Poem[]` |
| One poem's full text (detail / deep link) | `/author,title/<author>;<title>:abs` | `Poem[]` |
| Featured fallback (only if the title list failed to load) | `/random` | `Poem[]` |

**Rules an implementer must not get wrong:**

1. **Never request `lines` for a search.** `/title/the` (full poems) overloads the host → **5xx HTML error page** (not JSON). The *same breadth* is fine metadata-only — `/title/the/author,title,linecount` returns ~1,800 tiny rows. So: searches select `author,title,linecount`; `lines` appears only in the two single-poem `:abs` calls.
2. **`linecount` type is inconsistent** (number on some endpoints, string on others) → coerce to `number` at the API boundary.
3. **No-match returns a status object** `{ status: 404, reason: "Not found" }`, *not* an empty array. **Only that known 404 object maps to empty**; any other non-array response is an **error**, not "no results" (see §4).
4. **List endpoints return an object** (`{authors}` / `{titles}`), not an array.
5. **No unique poem ID; titles aren't unique** → identity is built client-side (§6).
6. **No pagination/sort from the API** → paginate/sort client-side.
7. **`lines` preserves leading spaces and blank lines** (stanza breaks) → render them verbatim; never trim/collapse.
8. **URL-encode each path segment.** Append `:abs` *after* the encoded term. Combined query separator is a literal `;`.
9. **Gate searches behind a minimum query length (≥ 2 chars).**
10. Data is static → `staleTime: Infinity`.

---

## 3. Types (`src/api/types.ts`)

```ts
export interface PoemMeta {
  author: string;
  title: string;
  linecount: number; // always coerced to number
}

export interface Poem extends PoemMeta {
  lines: string[];
}

export type SearchField = 'author' | 'title';
```

---

## 4. API client (`src/api/`)

**`client.ts` — one guarded fetcher for everything.** Timeout + non-JSON rejection apply to *all* calls (including the startup lists). Array endpoints map the known no-match object to `[]` and **throw on anything else** (a contract break should surface, not silently become "no results").

```ts
const BASE = 'https://poetrydb.org';
const TIMEOUT_MS = 12_000;

export class ApiError extends Error {}

const seg = (s: string) => encodeURIComponent(s);

// PoetryDB signals no-match with a { status: 404 } body (status may be number or string).
const isNotFound = (b: any) => b?.status === 404 || b?.status === '404';

// THE shared fetch: timeout + reject non-JSON (HTML error page) + reject real HTTP errors.
// The no-match body is passed through regardless of HTTP status, because it's unverified
// whether PoetryDB returns it as 200 or 404 — this stays correct either way.
async function fetchJSON(path: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE + path, { signal: ctrl.signal });
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) throw new ApiError(`Non-JSON response (HTTP ${res.status})`);
    const body = await res.json();
    if (isNotFound(body)) return body;               // pass through → getArray maps to []
    if (!res.ok) throw new ApiError(`HTTP ${res.status}`); // a JSON-bodied 5xx is still an error
    return body;
  } finally {
    clearTimeout(timer);
  }
}

// Array endpoints (searches, poems). Known no-match object -> []; anything unexpected -> throw.
async function getArray<T>(path: string): Promise<T[]> {
  const body: any = await fetchJSON(path);
  if (Array.isArray(body)) return body as T[];
  if (isNotFound(body)) return [];
  throw new ApiError('Unexpected API response shape');
}

// Object endpoints (the two lists) — same timeout/guard via fetchJSON.
async function getObject<T>(path: string): Promise<T> {
  return (await fetchJSON(path)) as T;
}

// linecount comes back as number OR string OR (rarely) missing/garbage.
// Non-finite -> 0, read as "unknown" (display only when > 0; see §12). Kept as `number`
// rather than `number | null` to avoid null-handling everywhere for a near-nonexistent case.
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toMeta = (r: any): PoemMeta => ({ author: r.author, title: r.title, linecount: num(r.linecount) });
const toPoem = (r: any): Poem => ({ ...toMeta(r), lines: r.lines ?? [] });

// Canonical deterministic ordering — used wherever duplicate matches must be resolved
// without trusting API order (detail disambiguation §5, daily poem §13).
export const byPoemOrder = (a: PoemMeta, b: PoemMeta) =>
  a.author.localeCompare(b.author) || a.title.localeCompare(b.title) || a.linecount - b.linecount;

// List endpoints return { authors: [...] } / { titles: [...] }. Validate the shape so a
// malformed/404 object fails cleanly at the boundary instead of crashing a later .sort/.map.
export const asStringList = (r: any, key: 'authors' | 'titles'): string[] => {
  if (!Array.isArray(r?.[key])) throw new ApiError(`Malformed list response (${key})`);
  return r[key] as string[];
};
```

**`poetry.ts` — the call surface.**

```ts
export const fetchAuthorList = () =>
  getObject<any>('/author').then(r => asStringList(r, 'authors'));

export const fetchTitleList = () =>
  getObject<any>('/title').then(r => asStringList(r, 'titles'));

export const searchAuthors = (term: string) =>
  getArray<any>(`/author/${seg(term)}/author,title,linecount`).then(a => a.map(toMeta));

export const searchTitlesContaining = (term: string) =>
  getArray<any>(`/title/${seg(term)}/author,title,linecount`).then(a => a.map(toMeta));

// Exact-title SEARCH → metadata only (the ?title= results page).
export const searchTitleExact = (title: string) =>
  getArray<any>(`/title/${seg(title)}:abs/author,title,linecount`).then(a => a.map(toMeta));

// Full text by exact title — needed by Poem of the Day, which has a title but no author.
export const fetchTitleExactPoems = (title: string) =>
  getArray<any>(`/title/${seg(title)}:abs`).then(a => a.map(toPoem));

export const fetchPoem = (author: string, title: string) =>
  getArray<any>(`/author,title/${seg(author)};${seg(title)}:abs`).then(a => a.map(toPoem));

export const fetchRandomPoem = () =>
  getArray<any>('/random').then(a => a.map(toPoem));
```

> **Invariant:** the three *search* functions (`searchAuthors`, `searchTitlesContaining`, `searchTitleExact`) return **metadata only**. `lines` is fetched only to *read* a specific poem — `fetchTitleExactPoems` (daily poem), `fetchPoem` (detail), `fetchRandomPoem` (fallback). `/search?title=` uses `searchTitleExact`; detail uses `fetchPoem`; a single exact-title match may forward to detail and fetch full text there.

---

## 5. Server state — TanStack Query (`src/api/queryKeys.ts`, hooks)

```ts
export const qk = {
  authorList: ['authorList'] as const,
  titleList: ['titleList'] as const,
  searchAuthor: (t: string) => ['search', 'author', t] as const,
  searchTitle:  (t: string) => ['search', 'title', t] as const,
  titleExact:   (t: string) => ['titleExact', t] as const,
  poem: (author: string, title: string, linecount?: number) => ['poem', author, title, linecount ?? null] as const,
  poemOfDay: (dayKey: string) => ['poemOfDay', dayKey] as const,
};
```

- **`QueryClient` defaults:** `staleTime: Infinity`, `gcTime` large, **`retry: false`** (do not auto-retry — a host-overload error just fails again; transient network can be retried manually via the error UI). All data is immutable.
- **Lists** (`useLists`): two `useQuery` calls, fired once at app start. They are the autocomplete catalog.
- **Search** (`useSearch`): `useQuery({ queryKey, queryFn, enabled: term.trim().length >= 2 })` — author → `searchAuthors`, title-substring → `searchTitlesContaining`, title-exact → `searchTitleExact` (all return `PoemMeta[]`). The `term` is the **trimmed** committed value (§9); the active query key is chosen from the URL params (§7).
- **Poem detail** (`usePoem(author, title, linecount?)`): `useQuery(qk.poem(author, title, linecount), () => fetchPoem(author, title))`. Resolve the array deterministically: `const candidates = linecount ? poems.filter(p => p.linecount === linecount) : poems; return [...candidates].sort(byPoemOrder)[0];` — filter by `n` when present, then the canonical sort so even duplicate author/title/linecount doesn't depend on API order. This one hook serves warm nav, cold reload, and shared links identically. Pre-seeding is possible only when you already hold a full `Poem` (e.g. the daily poem before it's opened): `queryClient.setQueryData(qk.poem(a, t, n), [poem])`. Search/results carry **metadata only**, so they cannot pre-seed.
- **Poem of the Day** (`usePoemOfDay`): **do not** key `/random` by date — that only stabilizes inside the session cache, so a hard refresh re-randomizes. Instead pick **deterministically** from the cached title list (see §13), then fetch that title exact. Stable per calendar day, identical for every user, no backend.

> Cached lists and all results are **server state → TanStack Query only**. Do not copy them into Zustand.

---

## 6. Poem identity & deep linking

PoetryDB has no poem ID and titles aren't unique. **Never build an ID by concatenating fields with a delimiter** (titles contain `--`, em dashes, etc.). Two separate mechanisms:

- **In-memory key** (React `key`, maps) — join with a control char that can't occur in data:
  ```ts
  export const poemKey = (p: PoemMeta) => `${p.author}\u001F${p.title}\u001F${p.linecount}`;
  ```
- **Detail URL** — isolated query params, fully reversible: `/poem?author=<enc>&title=<enc>` (plus `&n=<linecount>` when known). On open, read them and run `usePoem(author, title, n)`.

Titles aren't unique, so the line count is the disambiguator. The **link builder** (`lib/identity`) appends `&n=<linecount>` whenever `linecount > 0`; **`usePoem` reads it** and, if `fetchPoem` returns >1 poem, filters to the one matching `n` — never by array index (the API doesn't guarantee order). Without `n`, take the first. (Links and the hook must agree: if cards don't write `n`, the filter never fires — see §10.)

**Semicolon edge (deferred).** The combined `/author,title/<author>;<title>:abs` refetch uses a literal `;` as the field separator, so a poem whose **author or title contains a literal `;`** can't be represented in it (PoetryDB can't search semicolons). Almost certainly absent from this corpus, so this fallback is **deferred — not part of the initial call surface (§4)**; implement it only if you actually encounter a `;`. If you do: guard it narrowly on `author.includes(';') || title.includes(';')`, skip the combined call, and use

```ts
export const fetchAuthorExactPoems = (author: string) =>   // not in the initial surface
  getArray<any>(`/author/${seg(author)}:abs`).then(a => a.map(toPoem));
```

then client-filter that author's poems by exact title (author names don't contain `;`). It pulls a prolific author's *entire* catalog with full `lines`, so it must **never** become the general path. If it also yields no match, show the "couldn't load — search again" error.

---

## 7. Routing & URLs (React Router)

| Route | Screen | Notes |
|---|---|---|
| `/` | Home | Search box + Poem of the Day |
| `/search?authorContains=<term>` | Results | All poems by authors matching `<term>`, grouped by author |
| `/search?titleContains=<term>` | Results | All poems whose title contains `<term>` |
| `/search?title=<exact>` | Results | The poem(s) with this exact title (from a suggestion pick) |
| `/poem?author=<a>&title=<t>` | Detail | `&n=<linecount>` optional disambiguator |
| `/saved` | Reading list | The saved poems (from the Zustand store); cards link to detail |
| `*` | NotFound | |

The **param name encodes the search kind** (`authorContains` / `titleContains` / `title`). No `mode` or `q` param — direction comes from the toggle, kind from how the user committed (submit vs. pick). Drive everything from `useSearchParams` so back/forward and shareable links work for free.

---

## 8. Client state — Zustand (`src/store/useAppStore.ts`)

```ts
interface AppState {
  field: SearchField;                 // toggle: 'author' | 'title'
  query: string;                      // input text
  setField: (f: SearchField) => void;
  setQuery: (q: string) => void;

  saved: PoemMeta[];                  // reading list (persisted)
  toggleSaved: (p: PoemMeta) => void;
  isSaved: (p: PoemMeta) => boolean;

  theme: 'light' | 'dark';           // persisted
  fontScale: number;                 // persisted (e.g. 0.875–1.5)
  setTheme: (t: 'light' | 'dark') => void;
  setFontScale: (n: number) => void;
}
```

Wrap the store in `zustand/middleware` `persist`, but **`partialize` so only the three persistent fields are written** — a naive whole-store `persist` would also persist `field`/`query`, which must stay ephemeral:

```ts
persist(store, {
  name: 'poetry-explorer',
  partialize: (s) => ({ saved: s.saved, theme: s.theme, fontScale: s.fontScale }),
})
```

Nothing server-derived goes in the store.

> Scope note: Zustand here only carries this small global/persisted slice — it isn't load-bearing architecture. Component state + a thin `localStorage` hook would work equally well; Zustand is a clean, low-cost home for it, not a requirement. (`field`/`query` could even be local to `SearchBar`; they're in the store only for convenience.)

---

## 9. Search behavior (the core interaction)

- **Toggle** (`field`) selects which cached list the autocomplete filters and which endpoint a commit hits.
- **Autocomplete** = local `case-insensitive includes()` over the active list, capped to ~10 suggestions. Instant; no network, no debounce.
- **Commit logic:**
  - **Author** (always substring): submit *or* pick → navigate to `?authorContains=<text>`. Picking a suggestion just fills a fuller name; it stays substring (so "Browning" returns both Brownings).
  - **Title — pick a suggestion** (exact): navigate to `?title=<exact>`.
  - **Title — submit free text** (substring): navigate to `?titleContains=<text>`.
- **Min length:** commit/search disabled below 2 chars.
- **Trim on commit:** `term = query.trim()` *before* the length check, before building the URL param, and before querying — so `" t"` or whitespace can't sneak into routing/queries. Keep the raw input visible while typing (trim only at commit, not on keystroke).
- **Cross-field hint:** if the typed text matches **the other** list (e.g. an author name typed in Title mode), offer a one-tap switch ("No titles match 'Wordsworth' — search authors?") instead of firing an empty search. Both lists are local, so this is free.
- **Why author is pure-substring but a picked title is exact:** author full-names don't nest; titles do (short titles sit inside longer ones), so a picked exact title must stay exact or it drags in every "…term…" title.

---

## 10. Screens & components

```
App                         // Router + QueryClientProvider; kicks off useLists()
├─ Header                   // app title → '/', link to '/saved' (with saved count)
├─ Home
│   ├─ SearchBar            // FieldToggle + input + Suggestions + cross-field hint
│   └─ PoemOfDay
├─ SearchResults           // reads useSearchParams → useSearch(); paginates; states
│   ├─ AuthorGroup[]        // author results grouped by author
│   └─ PoemCard[]           // title results
├─ PoemDetail              // reads author/title params → usePoem(); PoemView; states
│   └─ PoemView            // the reading layout (full text)
├─ SavedList               // store.saved → PoemCard[]; empty state when none
└─ NotFound

shared: <Skeleton/> <EmptyState/> <ErrorState onRetry/> <SaveButton/> <PoemCard/>
```

- **SearchBar:** `FieldToggle` (segmented control, `radiogroup`/`tablist` semantics), text input wired to the ARIA **combobox** pattern, `Suggestions` listbox. Persist the typed text when the toggle flips and re-filter.
- **ResultsList:** `author` search → group by author with per-author counts ("Robert Browning — 38"); `title` searches → flat cards. Each card: title, author, line count. Paginate or virtualize; show total count.
- **PoemCard:** the whole card links to `/poem?author=&title=` built via the `lib/identity` URL helper, which appends `&n=<linecount>` when `linecount > 0`. This is what makes duplicate-title disambiguation actually work (§6) — without it, `usePoem`'s `n` filter never has anything to read. Used by both `ResultsList` and `SavedList`.
- **SavedList:** renders `store.saved` as `PoemCard`s (each links to detail; `SaveButton` removes). Closes the loop — saving is pointless without a way back to it. Empty state when nothing is saved.
- **PoemView:** title + author + line count (shown only when `> 0`), then the poem. Each line in its own element (or `white-space: pre-wrap`) to preserve indentation and blank-line stanzas. Actions: copy, copy/share link, save (reading list), font-scale, light/dark.

---

## 11. Loading / empty / error states

Every async surface (list load, search, poem, poem-of-the-day) has all three.

| Case | Behavior |
|---|---|
| Loading | Skeletons (PoetryDB can be 1–2s) |
| Below min length (search) | No request; suggestions only |
| Matches only the other field | Cross-field switch prompt; no request |
| Search returns no rows / status object | Empty state with hints — not an error |
| Large result set (e.g. "the") | Paginate/virtualize + count; optional "keep typing to narrow" |
| Network error / timeout | Error state + **Retry** |
| Non-JSON (host 5xx HTML) | `ApiError` from the fetcher → error state; **never auto-retry** |
| Startup list load fails | Retry; degrade (Home shows a `/random` poem instead of the daily one); don't hard-block the app |
| Deep-link cold open | `usePoem` refetches by `:abs`; handle 0/2+ matches; graceful "couldn't load" |

---

## 12. UX, typography, accessibility

- **Typography:** literary serif for poem body (EB Garamond / Lora / Source Serif / Spectral); clean sans for UI chrome. Comfortable measure (~60–70ch), generous line-height. **Never justify poem text.** User font-scale control.
- **Preserve poem formatting** (leading spaces, blank lines) — rule 7.
- **Line count display:** show "N lines" only when `linecount > 0`; `0` means unknown (rule 2 / `num()`), so omit it rather than print "0 lines".
- **Responsive:** mobile-first; no horizontal scroll; touch targets ≥ ~44px; search always reachable.
- **Theme:** light/dark, honor `prefers-color-scheme`; honor `prefers-reduced-motion`; WCAG AA contrast.
- **A11y:** combobox pattern for autocomplete (arrow keys, `aria-activedescendant`, Esc); `radiogroup` semantics for the toggle; move focus to the main heading on route change; `aria-live` for result counts and errors; poem text is real selectable text.

---

## 13. Additional feature: Poem of the Day

On Home, one featured poem. **Make it genuinely stable per day, identical for everyone, with no backend** by selecting deterministically from the cached title list — not by caching a `/random` result:

```ts
// xmur3 (one-shot) — small avalanche-y string hash → unsigned 32-bit int.
// Good avalanche matters here: consecutive dates differ by one char, and a
// linear hash (char-sum) would map adjacent days to adjacent indices.
export function hash32(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0; // unsigned → safe for % titles.length
}

// dayKey = new Date().toISOString().slice(0, 10)  → UTC calendar day (note below)
const titles = [...titleList].sort();              // sort → independent of API return order

// Try the hashed title; if its exact fetch returns 0 poems (rare/garbage), walk to the
// next index deterministically; after a few misses, fall back to /random.
async function dailyPoem(): Promise<Poem> {
  const base = hash32(dayKey) % titles.length;
  for (let step = 0; step < 5; step++) {
    const title = titles[(base + step) % titles.length];
    const result = await fetchTitleExactPoems(title);   // full text by exact title
    if (result.length > 0) {
      const poems = [...result].sort(byPoemOrder);     // canonical order — never rely on API order
      return poems[hash32(dayKey + title) % poems.length];
    }
  }
  const fallback = await fetchRandomPoem();
  if (!fallback[0]) throw new ApiError('No fallback poem available');
  return fallback[0]; // last-resort fallback
}
// cache under qk.poemOfDay(dayKey)
```

`Math.imul` does the 32-bit multiply; `>>> 0` keeps it unsigned. Lives in `lib/hash.ts` (or inline in `usePoemOfDay`).

**UTC day, deliberately.** `toISOString` yields the UTC calendar day, so every user worldwide sees the same featured poem at the same instant — that *is* the "identical for everyone" promise. It rolls over at 00:00 UTC, not local midnight. If you'd rather each user get a fresh poem at *their* local midnight, derive `dayKey` from the local date instead — but then two users in different time zones will usually see different poems at the same moment. Pick one promise; don't mix.

If the title list isn't available (startup load failed), fall back to `/random` — Home still shows a poem, just not the stable one.

Alternatives, if you want something simpler: persist `{ date, poem }` from `/random` in localStorage for *per-browser* daily stability; or, if stability doesn't matter, label it **"Random poem"** and use `/random` directly. What not to ship: "Poem of the Day" backed by an unpersisted `/random`, which re-randomizes on every refresh.

---

## 14. Suggested file structure

```
src/
  main.tsx
  App.tsx                       // router, QueryClientProvider, useLists()
  api/
    client.ts                   // BASE, fetchers, guards, normalizers
    poetry.ts                   // call surface (§4)
    queryKeys.ts                // qk (§5)
    types.ts                    // Poem, PoemMeta, SearchField
  hooks/
    useLists.ts
    useAutocomplete.ts          // local filter of the active list
    useSearch.ts                // chooses query from URL params
    usePoem.ts
    usePoemOfDay.ts
  store/
    useAppStore.ts              // Zustand (+ persist)
  lib/
    identity.ts                 // poemKey, poem URL build/parse
    hash.ts                     // hash32 (xmur3) for daily poem selection
  routes/
    Home.tsx  SearchResults.tsx  PoemDetail.tsx  SavedList.tsx  NotFound.tsx
  components/
    Header.tsx
    SearchBar.tsx  FieldToggle.tsx  Suggestions.tsx
    ResultsList.tsx  AuthorGroup.tsx  PoemCard.tsx
    PoemView.tsx  PoemOfDay.tsx
    states/ Skeleton.tsx  EmptyState.tsx  ErrorState.tsx
  styles/
    tokens.css                  // colors, type scale, spacing
```

---

## 15. Build order

0. **Gate — CORS (blocking).** Before any feature work, confirm the browser can `fetch` PoetryDB directly from a local Vite dev server for **`/author`, `/title`, `/random`, and one search endpoint** (e.g. `/title/love/author,title,linecount`). If any is blocked by CORS, the client-only premise fails and the whole approach must change (proxy/serverless) — find out now, not after building.
1. **Scaffold:** `npm create vite@latest -- --template react-ts`; add `@tanstack/react-query`, `zustand`, `react-router-dom`. Wire `QueryClientProvider` + router.
2. **Data layer:** `types.ts`, `client.ts` (shared guarded fetcher + normalizers), `poetry.ts`, `queryKeys.ts`.
3. **Lists + autocomplete + SearchBar:** `useLists`, `useAutocomplete`, `FieldToggle`, `Suggestions`, min-length, cross-field hint.
4. **Search results:** `useSearch` off URL params, `ResultsList` (author grouping + counts; title cards), pagination/virtualization, empty/error/loading.
5. **Poem detail + reading list:** `usePoem`, `PoemView` with preserved formatting, deep-link/cold-open, actions (copy/share/save); `SavedList` at `/saved` + `Header` link.
6. **Featured poem + polish pass:** deterministic Poem of the Day, typography, responsive, dark mode, font-scale, a11y (combobox/radiogroup/focus/aria-live), skeletons.

---

## 16. Acceptance criteria (done = done)

Each is independently checkable; agents should self-verify against these.

1. Typing in the search box fires **zero** network requests (autocomplete is local).
2. Title search "the" (free-text submit) issues a request that selects `author,title,linecount` and **does not** request `lines`.
3. A 1-character query fires no search (min length ≥ 2).
4. Author search "Browning" returns poems by **both** Brownings, grouped by author.
5. Picking the title suggestion "Ozymandias" runs an **exact-title search** (`?title=`) and shows only exact-title matches (a single match may forward straight to the poem).
6. Hard-refreshing `/poem?author=…&title=…` loads the poem **cold** (no prior in-memory state needed).
7. A no-match search shows the **empty** state, not an error.
8. A non-JSON / host-5xx response shows a **retryable error** and is **not** auto-retried.
9. A poem with indentation and blank-line stanzas (e.g. Dowson) renders **leading spaces and blank lines** intact.
10. The autocomplete is fully operable by **keyboard** (arrow keys, Enter, Esc).
11. At **200% browser zoom**, the app remains usable (no clipped/overlapping content, no horizontal scroll on mobile widths).
12. **Saved poems persist** across a reload; theme and font-scale persist too.
13. Saved poems are **viewable** at `/saved` and each links back to its detail page.
14. "Poem of the Day" shows the **same poem on a hard refresh** within the same day (deterministic selection), or is honestly labelled "Random poem."
15. A **missing/non-numeric `linecount`** does not crash (coerced to 0; "N lines" is hidden when 0).
16. A **malformed list response** (e.g. `/author` returns a non-array) surfaces a clean data-layer error, not a downstream crash.
17. A committed search term is **trimmed**: `"  "` triggers nothing; `" the "` searches `the`.
18. Result/saved cards link to `/poem?…&n=<linecount>` when line count is known, and `usePoem` filters by `n`, so a duplicate-title poem opens the **correct** one.
19. Picking a title suggestion issues a **metadata-only** request (`author,title,linecount`) — no `lines` — like every other search.



```
Base https://poetrydb.org · no key · JSON

SEARCH — metadata only (author,title,linecount); safe at any breadth; min length ≥ 2:
  /author/<term>/author,title,linecount         author (always substring)
  /title/<term>/author,title,linecount          title (free-text submit, substring)
  /title/<title>:abs/author,title,linecount     title (suggestion pick, exact)

LINES — full text, only to read ONE poem:
  /author,title/<author>;<title>:abs            detail / deep-link refetch (+ filter by n)
  /title/<title>:abs                            daily poem (has title, no author)
  /random                                        daily-poem fallback

FEATURED (Poem of the Day) — deterministic; /random is fallback only:
  title = sortedTitleList[hash32(utcDay) % len]  (walk to next title if 0 results)
  then LINES by exact title ; if many, pick by hash32(utcDay + title)

NEVER request lines for a search. Coerce linecount -> Number.
Known PoetryDB 404 object => empty; any other non-array shape => error.
Non-JSON body => host error (don't auto-retry).
Encode each segment; ':abs' after the term; ';' literal in combined.
Poem identity: author\u001F title\u001F linecount  (in memory) /
               ?author=&title=  (URL).  No delimiter-built IDs.
staleTime: Infinity.
```