# AGENTS.md — Poetry Explorer

> Orientation for coding agents. **Read this first, then `./docs/SPEC.md`.**
>
> **`./docs/SPEC.md` is the single source of truth.** This file is a *salience layer*: the rules most often broken and the places things connect. If anything here conflicts with the spec, **the spec wins** — and then fix this file. (`./docs/SPEC.md` is the implementation spec.)

## What you're building

A client-only SPA over the **PoetryDB** API (`https://poetrydb.org`) to search and read public-domain poetry. No backend, no auth. The stack is **fixed** — do not add runtime libraries or swap stack pieces (test-only dev dependencies for Vitest + React Testing Library are fine):

React + TypeScript + Vite · TanStack Query (server state) · Zustand (client state) · React Router.

## Commands

- `npm install`
- `npm run dev` — Vite dev server. Run the CORS gate here first (below).
- `npm run build` — runs `tsc` then bundles. **A clean build is the type gate; keep it green.**
- `npm run lint` — ESLint.
- `npm run preview` — serve the production build.
- Tests: add **Vitest + React Testing Library**, targeting SPEC §16. Once configured, `npm test`.

## Blocking gate — before ANY feature code

PoetryDB must permit direct browser calls (CORS). From `npm run dev`, paste this in the browser console and confirm every response is `ok` and JSON-parses:

```js
await Promise.all([
  fetch('https://poetrydb.org/author'),
  fetch('https://poetrydb.org/title'),
  fetch('https://poetrydb.org/random'),
  fetch('https://poetrydb.org/title/love/author,title,linecount'),
]).then(rs => Promise.all(rs.map(r => r.ok ? r.json() : Promise.reject(new Error(`${r.url} → HTTP ${r.status}`)))));
```

**If any is blocked or rejects, stop and report it** — the no-backend premise is invalid and the whole approach must change (SPEC §15 step 0).

## Hard rules — do not violate

Canonical statements live in **SPEC §2** and the **§4 invariant**. If you change a rule, change it there first, then mirror it here. These are the ones that actually get broken:

1. **Search is metadata-only.** Every search request selects `author,title,linecount` and **never** `lines`. The only search functions are `searchAuthors`, `searchTitlesContaining`, `searchTitleExact`. Putting `lines` (or a bare `:abs`) behind a search is a bug — and it crashes the host on broad terms. (§2, §4)
2. **`lines` is fetched only for reading/detail flows** — detail (`fetchPoem`), daily-poem resolution (`fetchTitleExactPoems`), and fallback (`fetchRandomPoem`). Nothing else returns `lines`. (§4)
3. **Trim + min length.** Commit `query.trim()`, and only when its length is ≥ 2. Keep the raw input visible while typing. (§9)
4. **No delimiter-built identifiers.** Titles contain `--` and em dashes, and may contain `;`. In-memory key = control-char join (`poemKey`); URLs = isolated params `?author=&title=&n=`. Never concatenate fields into an id. (§6)
5. **Never use raw API order.** Sort with `byPoemOrder` before choosing — then first item, hashed index, or filtered result are all fine. Resolve every multi-match (detail disambiguation, daily-poem pick) this way; never index into the unsorted response. (§4, §5, §13)
6. **The `n`/linecount round-trip is symmetric.** Cards write `&n=<linecount>` when `linecount > 0`; `usePoem` reads `n` and filters by it. Touch one side, update the other — or disambiguation silently dies. (§6, §10)
7. **Don't loosen the fetcher.** Keep: timeout; non-JSON → throw; known `{ status: 404 }` body → `[]` (passed through regardless of HTTP status); any other `!res.ok` → throw; `linecount` coerced via `num()`. (§4)
8. **Persist with `partialize`.** Only `saved`, `theme`, `fontScale` persist. Never persist `field`/`query`. (§8)
9. **Poem of the Day is deterministic** — sorted title list indexed by a **UTC-day** hash, then exact-title fetch. **Not** a date-keyed `/random` (that re-randomizes on refresh). `/random` is fallback-only. (§13)
10. **Preserve poem whitespace** — leading spaces and blank-line stanzas render verbatim; never trim or collapse them. (§2, §12)
11. **The data layer owns all PoetryDB knowledge.** Components never touch raw API responses or build query strings/URLs — they call hooks. (§4–§5)

## Architecture

- **Server state → TanStack Query only** (lists, search results, poems): `staleTime: Infinity`, `retry: false`. Do **not** copy server data into Zustand. (§5)
- **Client state → Zustand.** Persist only `saved`, `theme`, `fontScale` (via `partialize`); keep `field`/`query` ephemeral. Not load-bearing — don't grow it. (§8)
- **URLs are the source of truth** for searches (`?authorContains=` / `?titleContains=` / `?title=`) and detail (`?author=&title=&n=`); drive everything from `useSearchParams` so back/forward and shareable links work. (§7)
- **Layout:** `src/api/` (`client`, `poetry`, `queryKeys`, `types` — the *only* PoetryDB-aware code) · `src/lib/identity.ts` (`poemKey` + URL build/parse incl. `n`) · `src/lib/hash.ts` (`hash32`) · `src/store/` · `src/hooks/` · `src/routes/` · `src/components/`. (§14)

## When you change X, also update Y (the seam map)

The recurring failure here is a rule stated in one place and contradicted in another. Before committing a change on the left, update everything on the right:

- **Add/rename an API function** → the §4 invariant note, `queryKeys.ts`, every call site, and the SPEC appendix quick-ref.
- **Change no-match / error handling in the fetcher** → SPEC §2 rule 3 and the appendix.
- **Change `n`/linecount handling** → both the URL builder (`PoemCard` / `identity`) *and* `usePoem`.
- **Change Poem-of-the-Day selection** → SPEC §13 *and* the appendix FEATURED block.
- **Change the search→URL mapping** → the routes table (§7), `useSearch`, and the link-building components.
- **Change a hard rule** → SPEC §2/§4 first, then mirror into the list above.

## Definition of done

Self-verify against **all** of SPEC §16 before claiming a task complete. The non-negotiable subset you will be checked on:

- A broad title search ("the") requests `author,title,linecount` and **no** `lines`; picking a title suggestion is likewise metadata-only.
- Result/saved cards carry `&n=` when line count is known, and a duplicate-title link opens the **correct** poem.
- A hard-refresh of `/poem?...` loads cold; a no-match shows the **empty** state (not an error); a host 5xx shows a **retryable** error.
- Indented / blank-line poems render intact; saved poems are viewable at `/saved`; saves and prefs persist across reload.

## Repo hygiene

Don't commit `dist/`, build output, coverage, or unrelated lockfile churn. Commit lockfile changes only when you intentionally changed dependencies (e.g. adding the test deps above). Otherwise touch only source.

## If the spec and the code disagree

Fix the code to match `./docs/SPEC.md` — or, if the spec is wrong, **flag it explicitly** in your summary and propose the spec change. Never let them silently diverge.