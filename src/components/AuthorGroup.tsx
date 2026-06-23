import type { PoemMeta } from '../api/types';
import { poemKey } from '../lib/identity';
import { PoemCard } from './PoemCard';
import styles from './AuthorGroup.module.css';

interface Props {
  author: string;
  poems: PoemMeta[];
}

// Author results are grouped by author with a per-author count ("Robert Browning — 38").
// The author is in the heading, so cards omit it. (SPEC §10)
export function AuthorGroup({ author, poems }: Props) {
  return (
    <section className={styles.group}>
      <h3 className={styles.heading}>
        <span className={styles.author}>{author}</span>
        <span className={styles.count}>{poems.length}</span>
      </h3>
      <ul className={styles.list}>
        {poems.map((poem) => (
          <li key={poemKey(poem)}>
            <PoemCard poem={poem} showAuthor={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}
