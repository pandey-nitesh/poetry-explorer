import styles from './PoemSkeleton.module.css';

// Loading placeholder shaped like PoemView's folio page (centered measure column: title /
// author / meta, an actions row with a divider, then ragged poem-line bars) so the detail
// view doesn't snap from a card grid to a reading column when the poem arrives. (DESIGN — States)
const LINE_WIDTHS = ['96%', '88%', '93%', '70%', '85%', '90%', '62%', '87%', '94%', '78%', '83%', '66%'];

export function PoemSkeleton() {
  return (
    <div className={styles.view} role="status" aria-busy="true">
      <span className={styles.srOnly}>Loading poem…</span>
      <div className={styles.head} aria-hidden="true">
        <div className={`${styles.title} shimmer`} />
        <div className={`${styles.author} shimmer`} />
        <div className={`${styles.meta} shimmer`} />
      </div>
      <div className={styles.actions} aria-hidden="true">
        <div className={`${styles.action} shimmer`} />
        <div className={`${styles.action} shimmer`} />
        <div className={`${styles.action} shimmer`} />
      </div>
      <div className={styles.body} aria-hidden="true">
        {LINE_WIDTHS.map((width, i) => (
          <div key={i} className={`${styles.line} shimmer`} style={{ width }} />
        ))}
      </div>
    </div>
  );
}
