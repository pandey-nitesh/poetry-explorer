import type { PoemMeta } from '../api/types';
import { useAppStore } from '../store/useAppStore';
import styles from './SaveButton.module.css';

interface Props {
  poem: PoemMeta;
}

// A small geometric bookmark that fills when saved — a reader's mark, not a gamified
// badge. (DESIGN — Components / Save control). aria-pressed carries the state for SRs.
export function SaveButton({ poem }: Props) {
  const saved = useAppStore((s) => s.isSaved(poem));
  const toggleSaved = useAppStore((s) => s.toggleSaved);

  return (
    <button
      type="button"
      className={styles.btn}
      aria-pressed={saved}
      onClick={() => toggleSaved(poem)}
    >
      <svg
        className={styles.mark}
        viewBox="0 0 12 16"
        width="12"
        height="16"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M1 1.2h10v13.6l-5-4-5 4z"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
