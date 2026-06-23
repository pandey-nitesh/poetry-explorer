import styles from './Skeleton.module.css';

// Loading placeholder — PoetryDB can take 1–2s (SPEC §11). The pulse honors
// prefers-reduced-motion via the global rule in index.css.
export function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={styles.wrap} role="status" aria-busy="true">
      <span className={styles.srOnly}>Loading…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.card} aria-hidden="true">
          <div className={`${styles.bar} ${styles.barTitle}`} />
          <div className={`${styles.bar} ${styles.barAuthor}`} />
        </div>
      ))}
    </div>
  );
}
