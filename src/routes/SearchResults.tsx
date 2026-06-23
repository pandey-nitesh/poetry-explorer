import { useSearchParams } from 'react-router-dom';
import { ResultsList } from '../components/ResultsList';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Skeleton } from '../components/states/Skeleton';
import { useSearch } from '../hooks/useSearch';
import styles from './SearchResults.module.css';

// Reads the search off the URL (useSearch) and renders the right state: loading skeletons,
// a retryable error, an empty state (distinct from error), or the paginated results.
// Page is a URL param too, so a results page is shareable. (SPEC §7, §10, §11)
export function SearchResults() {
  const { request, results, isLoading, isError, refetch, tooShort } = useSearch();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);

  function setPage(next: number) {
    const updated = new URLSearchParams(params);
    if (next <= 1) updated.delete('page');
    else updated.set('page', String(next));
    setParams(updated);
  }

  let body;
  if (!request) {
    body = (
      <EmptyState
        title="Search for a poem"
        message="Use the search box on the home page to look up an author or a title."
      />
    );
  } else if (tooShort) {
    body = <EmptyState title="Keep typing" message="Enter at least 2 characters to search." />;
  } else if (isLoading) {
    body = <Skeleton rows={6} />;
  } else if (isError) {
    body = <ErrorState onRetry={refetch} />;
  } else if (results.length === 0) {
    body = (
      <EmptyState
        title="No matches"
        message={`Nothing found for “${request.term}”. Try a different spelling, or switch the Author/Title toggle.`}
      />
    );
  } else {
    body = <ResultsList request={request} results={results} page={page} onPage={setPage} />;
  }

  return (
    <main id="main" tabIndex={-1} className={styles.page} aria-busy={isLoading}>
      <h1 className={styles.heading}>{request && !tooShort ? 'Search results' : 'Search'}</h1>
      {body}
    </main>
  );
}
