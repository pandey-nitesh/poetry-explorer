import styles from './ErrorState.module.css';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

// A retryable error (network/timeout/host-5xx). Retry is manual — we never auto-retry,
// since a host-overload error just fails again. (SPEC §11, §16 #8)
export function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn’t reach PoetryDB. Check your connection and try again.',
  onRetry,
}: Props) {
  return (
    <div className={styles.error} role="alert">
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
