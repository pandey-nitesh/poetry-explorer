import { SearchBar } from '../components/SearchBar';
import styles from './Home.module.css';

export function Home() {
  return (
    <main className={styles.home}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Poetry Explorer</h1>
        <p className={styles.tagline}>Search and read classic public-domain poetry.</p>
      </header>
      <SearchBar />
    </main>
  );
}
