import styles from './Pagination.module.css';

interface Props {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, pageCount, onPage }: Props) {
  if (pageCount <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Results pages">
      <button
        type="button"
        className={styles.btn}
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <span className={styles.status}>
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
      >
        Next
      </button>
    </nav>
  );
}
