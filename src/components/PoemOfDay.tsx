import { Link } from 'react-router-dom';
import { buildPoemPath } from '../lib/identity';
import { usePoemOfDay } from '../hooks/usePoemOfDay';
import styles from './PoemOfDay.module.css';

const PREVIEW_LINES = 6;

// The featured poem on Home — a deterministic, day-stable pick (SPEC §13). Degrades
// quietly: a failure here never blocks the page, it just hides the feature with a retry.
export function PoemOfDay() {
  const { poem, isLoading, isError, refetch } = usePoemOfDay();

  if (isLoading) {
    return (
      <section className={styles.card} aria-busy="true">
        <p className={styles.kicker}>Poem of the day</p>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
      </section>
    );
  }

  if (isError || !poem) {
    return (
      <section className={styles.card}>
        <p className={styles.kicker}>Poem of the day</p>
        <p className={styles.muted}>Couldn’t load today’s poem.</p>
        <button type="button" className={styles.retry} onClick={refetch}>
          Try again
        </button>
      </section>
    );
  }

  const preview = poem.lines.slice(0, PREVIEW_LINES);
  const truncated = poem.lines.length > PREVIEW_LINES;

  return (
    <section className={styles.card} aria-labelledby="potd-title">
      <p className={styles.kicker}>Poem of the day</p>
      <h2 id="potd-title" className={styles.title}>
        <Link to={buildPoemPath(poem)} className={styles.titleLink}>
          {poem.title}
        </Link>
      </h2>
      <p className={styles.author}>{poem.author}</p>

      <div className={styles.preview} aria-hidden="true">
        {preview.map((line, i) => (
          <div key={i} className={styles.line}>
            {line}
          </div>
        ))}
        {truncated && <div className={styles.ellipsis}>…</div>}
      </div>

      <Link to={buildPoemPath(poem)} className={styles.readLink}>
        Read the poem →
      </Link>
    </section>
  );
}
