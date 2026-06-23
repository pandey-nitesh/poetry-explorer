import type { ReactNode } from 'react';
import styles from './FolioRail.module.css';

interface Props {
  rail: ReactNode;
  children: ReactNode;
}

// The recurring archive shape (DESIGN — Layout language): a narrow left rail of quiet
// metadata beside a wider reading field. On mobile the side rail would starve the reading
// column, so it collapses into a "folio strip" — a thin left rule with the same labels
// above the content.
export function FolioRail({ rail, children }: Props) {
  return (
    <div className={styles.layout}>
      <aside className={styles.rail}>{rail}</aside>
      <div className={styles.field}>{children}</div>
    </div>
  );
}
