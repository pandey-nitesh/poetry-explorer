import { Link } from 'react-router-dom';
import { PoemCard } from '../components/PoemCard';
import { EmptyState } from '../components/states/EmptyState';
import { poemKey } from '../lib/identity';
import { useAppStore } from '../store/useAppStore';
import styles from './SavedList.module.css';

// The reading list — closes the loop: saved poems are viewable here and each links back
// to its detail page. Empty state when nothing is saved. (SPEC §10, §16 #13)
export function SavedList() {
  const saved = useAppStore((s) => s.saved);

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      <h1 className={styles.heading}>Reading list</h1>
      {saved.length === 0 ? (
        <EmptyState
          title="No saved poems yet"
          message="Open a poem and tap Save to add it to your reading list."
        >
          <Link to="/">Find a poem</Link>
        </EmptyState>
      ) : (
        <ul className={styles.cards}>
          {saved.map((poem) => (
            <li key={poemKey(poem)}>
              <PoemCard poem={poem} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
