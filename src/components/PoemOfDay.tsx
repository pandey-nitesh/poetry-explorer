import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buildPoemPath } from '../lib/identity';
import { usePoemOfDay } from '../hooks/usePoemOfDay';
import { ReadingMode } from './ReadingMode';
import styles from './PoemOfDay.module.css';

const PREVIEW_LINES = 6;
// Ragged widths for the loading preview, one per previewed line.
const SKELETON_LINE_WIDTHS = ['94%', '88%', '91%', '70%', '85%', '60%'];

// The featured poem on Home — a deterministic, day-stable pick (SPEC §13). Degrades
// quietly: a failure here never blocks the page, it just hides the feature with a retry.
export function PoemOfDay() {
  const { poem, isRandom, isLoading, isError, refetch } = usePoemOfDay();
  const [reading, setReading] = useState(false);

  if (isLoading) {
    return (
      <section className={styles.card} role="status" aria-busy="true">
        <p className={styles.kicker}>Poem of the day</p>
        <div className={`${styles.skTitle} shimmer`} aria-hidden="true" />
        <div className={`${styles.skAuthor} shimmer`} aria-hidden="true" />
        <div className={styles.skPreview} aria-hidden="true">
          {SKELETON_LINE_WIDTHS.map((width, i) => (
            <div key={i} className={`${styles.skLine} shimmer`} style={{ width }} />
          ))}
        </div>
        <div className={styles.skActions} aria-hidden="true">
          <div className={`${styles.skAction} shimmer`} />
          <div className={`${styles.skAction} shimmer`} />
        </div>
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
  // Honest label: only the deterministic pick is "Poem of the day". When the title list was
  // unavailable we fell back to /random, which re-randomizes on refresh. (SPEC §16 #14)
  const kicker = isRandom ? 'Random poem' : 'Poem of the day';

  return (
    <section className={styles.card} aria-labelledby="potd-title">
      <p className={styles.kicker}>{kicker}</p>
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

      <div className={styles.actions}>
        <Link to={buildPoemPath(poem)} className={styles.readLink}>
          Read the poem →
        </Link>
        <button type="button" className={styles.readingBtn} onClick={() => setReading(true)}>
          Reading mode
        </button>
      </div>

      {reading && <ReadingMode poem={poem} onClose={() => setReading(false)} />}
    </section>
  );
}
