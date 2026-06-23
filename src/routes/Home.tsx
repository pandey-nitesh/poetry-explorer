import { PoemOfDay } from '../components/PoemOfDay';
import { PoetChips } from '../components/PoetChips';
import { SearchBar } from '../components/SearchBar';
import { SurpriseButton } from '../components/SurpriseButton';
import styles from './Home.module.css';

export function Home() {
  return (
    <main id="main" tabIndex={-1} className={styles.home}>
      <header className={styles.masthead}>
        <p className={styles.folioMark}>PoetryDB · public-domain index</p>
        <h1 className={styles.title}>Poetry Explorer</h1>
        <p className={styles.invitation}>
          Search the index by author or title, then sit and read.
        </p>
      </header>
      <SearchBar />
      <div className={styles.surprise}>
        <SurpriseButton />
      </div>
      <PoetChips />
      <PoemOfDay />
    </main>
  );
}
