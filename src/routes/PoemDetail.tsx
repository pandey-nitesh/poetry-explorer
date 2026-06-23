import { Link, useSearchParams } from 'react-router-dom';
import { PoemView } from '../components/PoemView';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Skeleton } from '../components/states/Skeleton';
import { usePoem } from '../hooks/usePoem';
import { parsePoemParams } from '../lib/identity';
import styles from './PoemDetail.module.css';

// Detail screen. Reads author/title/n off the URL and resolves via usePoem, so a hard
// refresh / shared link loads cold with no prior in-memory state. (SPEC §6, §11, §16 #6)
export function PoemDetail() {
  const [params] = useSearchParams();
  const parsed = parsePoemParams(params);
  const { poem, isLoading, isError, notFound, refetch } = usePoem(
    parsed?.author,
    parsed?.title,
    parsed?.n,
  );

  let body;
  if (!parsed) {
    body = (
      <ErrorState
        title="Couldn’t load this poem"
        message="The link is missing an author or a title."
      />
    );
  } else if (isLoading) {
    body = <Skeleton rows={3} />;
  } else if (isError) {
    body = <ErrorState onRetry={refetch} />;
  } else if (notFound || !poem) {
    body = (
      <EmptyState
        title="Poem not found"
        message="We couldn’t find that poem. It may have moved, or the link may be off."
      >
        <Link to="/">Back to search</Link>
      </EmptyState>
    );
  } else {
    body = <PoemView poem={poem} />;
  }

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      {body}
    </main>
  );
}
