import styles from './Skeleton.module.css';

interface Props {
  rows?: number;
  // 'cards' = flat slip grid (title searches); 'grouped' = author sections with headings.
  variant?: 'cards' | 'grouped';
}

function CardBars() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.bar} ${styles.barTitle} shimmer`} />
      <div className={`${styles.bar} ${styles.barAuthor} shimmer`} />
    </div>
  );
}

// Loading placeholder — PoetryDB can take 1–2s (SPEC §11). The pulse honors
// prefers-reduced-motion via the global rule in index.css. The grouped variant mirrors the
// author-grouped results (heading + nested slip grid) so author searches don't reflow on load.
export function Skeleton({ rows = 6, variant = 'cards' }: Props) {
  if (variant === 'grouped') {
    return (
      <div role="status" aria-busy="true">
        <span className={styles.srOnly}>Loading…</span>
        {Array.from({ length: 2 }, (_, g) => (
          <section key={g} className={styles.group} aria-hidden="true">
            <div className={styles.groupHeading}>
              <div className={`${styles.headingAuthor} shimmer`} />
              <div className={`${styles.headingCount} shimmer`} />
            </div>
            <div className={styles.grid}>
              {Array.from({ length: 3 }, (_, c) => (
                <CardBars key={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.wrap} role="status" aria-busy="true">
      <span className={styles.srOnly}>Loading…</span>
      {Array.from({ length: rows }, (_, i) => (
        <CardBars key={i} />
      ))}
    </div>
  );
}
