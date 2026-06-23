# Poetry Explorer

A single-page web app to search and read classic public-domain poetry from the
[PoetryDB](https://poetrydb.org) API. Client-only — no backend, no auth, no API key.

> **Specs:** [`docs/SPEC.md`](docs/SPEC.md) is the single source of truth;
> [`AGENTS.md`](AGENTS.md) is the salience layer for the rules most easily missed.

## Stack

- **React 19 + TypeScript + Vite** — app + build tooling
- **TanStack Query** — server state (lists, search results, poems); `staleTime: Infinity`, `retry: false`
- **Zustand** — client/UI state (reading list, theme, font-scale), persisted with `partialize`
- **React Router** — routing; URLs are the source of truth for searches and detail views
- **Vitest + React Testing Library** — unit/component tests targeting the SPEC §16 acceptance criteria

## Getting started

```bash
npm install
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # tsc -b (type gate) + vite build
npm run preview    # serve the production build
npm run lint       # ESLint
npm test           # Vitest (single run); npm run test:watch for watch mode
```

## CORS gate (blocking premise check)

The client-only design depends on PoetryDB permitting direct browser calls. Verified
on **2026-06-22**: `/author`, `/title`, `/random`, and a metadata search all return
`HTTP 200` with `content-type: application/json` and `access-control-allow-origin: *`.
The premise holds — no proxy or serverless layer is needed. (SPEC §15 step 0.)

To re-check from `npm run dev`, paste the snippet in `AGENTS.md` → _Blocking gate_ into
the browser console and confirm every response is `ok` and JSON-parses.

## Project structure

```
src/
  main.tsx              app entry
  App.tsx               QueryClientProvider + Router
  api/                  PoetryDB data layer (the only PoetryDB-aware code)
  hooks/                useLists, useAutocomplete, useSearch, usePoem, usePoemOfDay
  store/                Zustand store (+ persist)
  lib/                  identity (poemKey + URL build/parse), hash (daily-poem selection)
  routes/               Home, SearchResults, PoemDetail, SavedList, NotFound
  components/           SearchBar, ResultsList, PoemView, … + shared state UI
  styles/tokens.css     design tokens (color, type scale, spacing)
```

## Conventions

- **Search is metadata-only** (`author,title,linecount`); `lines` is fetched only to read one poem.
- **Server state lives in TanStack Query only** — never copied into Zustand.
- **No delimiter-built IDs.** In-memory keys use a control-char join; URLs use isolated params.
- Poem whitespace (leading spaces, blank-line stanzas) renders verbatim.

See `AGENTS.md` for the full hard-rules list and the "when you change X, update Y" seam map.
