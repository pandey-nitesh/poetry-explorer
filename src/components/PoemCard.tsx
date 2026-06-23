import { Link } from 'react-router-dom';
import type { PoemMeta } from '../api/types';
import { buildPoemPath } from '../lib/identity';
import styles from './PoemCard.module.css';

interface Props {
  poem: PoemMeta;
  showAuthor?: boolean;
}

// The whole card links to the detail page. buildPoemPath appends &n=<linecount> when known,
// which is what makes duplicate-title disambiguation work in usePoem. Line count is shown
// only when > 0 (0 means unknown). (SPEC §10, §12, §16 #15/#18)
export function PoemCard({ poem, showAuthor = true }: Props) {
  const lineLabel =
    poem.linecount > 0
      ? `, ${poem.linecount} ${poem.linecount === 1 ? 'line' : 'lines'}`
      : '';
  return (
    <Link
      to={buildPoemPath(poem)}
      className={styles.card}
      aria-label={`${poem.title} by ${poem.author}${lineLabel}`}
    >
      <span className={styles.title}>{poem.title}</span>
      {showAuthor && <span className={styles.author}>{poem.author}</span>}
      {poem.linecount > 0 && (
        <span className={styles.lines}>
          {poem.linecount} {poem.linecount === 1 ? 'line' : 'lines'}
        </span>
      )}
    </Link>
  );
}
