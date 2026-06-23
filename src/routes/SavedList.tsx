import { Link } from 'react-router-dom';
import { FolioRail } from '../components/FolioRail';
import { PoemCard } from '../components/PoemCard';
import { EmptyState } from '../components/states/EmptyState';
import { poemKey } from '../lib/identity';
import { useAppStore } from '../store/useAppStore';
import styles from './SavedList.module.css';

// The reader's drawer — saved poems as the same bibliographic slips as results, each
// linking back to detail. Empty state reads like an unused drawer, not a failed task.
// (SPEC §10, §16 #13; DESIGN — Saved)
export function SavedList() {
  const saved = useAppStore((s) => s.saved);

  const rail = (
    <span className={styles.count}>
      {saved.length} {saved.length === 1 ? 'poem' : 'poems'}
    </span>
  );

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      <h1 className={styles.heading}>Reading list</h1>
      {saved.length === 0 ? (
        <EmptyState
          title="No saved poems yet"
          message="Open a poem and mark it to keep it here in your reading drawer."
        >
          <Link to="/">Find a poem</Link>
        </EmptyState>
      ) : (
        <FolioRail rail={rail}>
          <ul className={styles.cards}>
            {saved.map((poem) => (
              <li key={poemKey(poem)}>
                <PoemCard poem={poem} />
              </li>
            ))}
          </ul>
        </FolioRail>
      )}
    </main>
  );
}
