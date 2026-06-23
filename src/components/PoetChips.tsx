import { Link } from 'react-router-dom';
import { buildSearchPath } from '../lib/searchParams';
import styles from './PoetChips.module.css';

// A small, hand-picked catalogue — not a "popular" ranking. Each chip is a catalogue tab
// that runs an author search. Text-first, no emoji, no pastel pills. (DESIGN — Home / chips)
const CURATED_POETS = [
  'William Shakespeare',
  'Emily Dickinson',
  'Walt Whitman',
  'John Keats',
  'William Wordsworth',
  'Percy Bysshe Shelley',
  'Christina Rossetti',
  'Edgar Allan Poe',
];

export function PoetChips() {
  return (
    <nav className={styles.wrap} aria-label="Browse selected poets">
      <span className={styles.label}>Selected poets</span>
      <ul className={styles.list}>
        {CURATED_POETS.map((poet) => (
          <li key={poet}>
            <Link className={styles.chip} to={buildSearchPath('author', poet)}>
              {poet}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
