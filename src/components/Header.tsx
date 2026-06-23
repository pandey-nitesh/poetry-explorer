import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PreferenceControls } from './PreferenceControls';
import styles from './Header.module.css';

// Shared chrome: brand → home, the reading-list link with a live saved count, and the
// global display preference controls. (SPEC §10)
export function Header() {
  const savedCount = useAppStore((s) => s.saved.length);

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        Poetry Explorer
      </Link>
      <nav className={styles.nav} aria-label="Primary">
        <Link to="/saved" className={styles.savedLink}>
          <span aria-hidden="true">Saved</span>
          {savedCount > 0 && (
            <span className={styles.badge} aria-hidden="true">
              {savedCount}
            </span>
          )}
          <span className={styles.srOnly}>Reading list, {savedCount} saved poems</span>
        </Link>
        <PreferenceControls />
      </nav>
    </header>
  );
}
