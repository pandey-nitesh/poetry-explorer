import { useMemo } from 'react';
import { byPoemOrder } from '../api/client';
import type { PoemMeta } from '../api/types';
import { poemKey } from '../lib/identity';
import type { SearchRequest } from '../lib/searchParams';
import { AuthorGroup } from './AuthorGroup';
import { PoemCard } from './PoemCard';
import { Pagination } from './Pagination';
import styles from './ResultsList.module.css';

const POEMS_PER_PAGE = 24;
const AUTHORS_PER_PAGE = 8;
const LARGE_RESULT_SET = 60;

interface Props {
  request: SearchRequest;
  results: PoemMeta[];
  page: number;
  onPage: (page: number) => void;
}

// Author searches group by author (paginated by group so an author never splits across
// pages); title searches are a flat, paginated list of cards. Ordering is canonical
// (byPoemOrder), never raw API order. (SPEC §10, AGENTS rule 5)
export function ResultsList({ request, results, page, onPage }: Props) {
  const grouped = request.kind === 'authorContains';

  const authorGroups = useMemo(() => {
    if (!grouped) return [];
    const map = new Map<string, PoemMeta[]>();
    for (const p of results) {
      const arr = map.get(p.author);
      if (arr) arr.push(p);
      else map.set(p.author, [p]);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([author, poems]) => ({ author, poems: [...poems].sort(byPoemOrder) }));
  }, [grouped, results]);

  const sortedPoems = useMemo(
    () => (grouped ? [] : [...results].sort(byPoemOrder)),
    [grouped, results],
  );

  const pageSize = grouped ? AUTHORS_PER_PAGE : POEMS_PER_PAGE;
  const totalUnits = grouped ? authorGroups.length : sortedPoems.length;
  const pageCount = Math.max(1, Math.ceil(totalUnits / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;

  return (
    <div className={styles.results}>
      <p className={styles.summary} aria-live="polite">
        {results.length} {results.length === 1 ? 'poem' : 'poems'} {describe(request)}
        {results.length > LARGE_RESULT_SET && (
          <span className={styles.hint}> — keep typing to narrow your search.</span>
        )}
      </p>

      {grouped ? (
        <div className={styles.groups}>
          {authorGroups.slice(start, start + pageSize).map((g) => (
            <AuthorGroup key={g.author} author={g.author} poems={g.poems} />
          ))}
        </div>
      ) : (
        <ul className={styles.cards}>
          {sortedPoems.slice(start, start + pageSize).map((p) => (
            <li key={poemKey(p)}>
              <PoemCard poem={p} />
            </li>
          ))}
        </ul>
      )}

      <Pagination page={safePage} pageCount={pageCount} onPage={onPage} />
    </div>
  );
}

function describe(request: SearchRequest): string {
  switch (request.kind) {
    case 'authorContains':
      return `by authors matching “${request.term}”`;
    case 'titleContains':
      return `with titles containing “${request.term}”`;
    case 'title':
      return `titled “${request.term}”`;
  }
}
