import { Link } from 'react-router-dom';
import styles from './Header.module.css';

// Shared chrome. The saved-list link + count is added with the reading list. (SPEC §10)
export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        Poetry Explorer
      </Link>
    </header>
  );
}
