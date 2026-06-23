import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface Props {
  title: string;
  message?: string;
  children?: ReactNode;
}

// A no-results / no-data state — distinct from an error (SPEC §11, §16 #7).
export function EmptyState({ title, message, children }: Props) {
  return (
    <div className={styles.empty} role="status">
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.message}>{message}</p>}
      {children}
    </div>
  );
}
