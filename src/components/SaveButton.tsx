import type { PoemMeta } from '../api/types';
import { useAppStore } from '../store/useAppStore';
import styles from './SaveButton.module.css';

interface Props {
  poem: PoemMeta;
}

// Toggles a poem in/out of the persisted reading list. (SPEC §8, §10)
export function SaveButton({ poem }: Props) {
  const saved = useAppStore((s) => s.isSaved(poem));
  const toggleSaved = useAppStore((s) => s.toggleSaved);

  return (
    <button
      type="button"
      className={saved ? `${styles.btn} ${styles.saved}` : styles.btn}
      aria-pressed={saved}
      onClick={() => toggleSaved(poem)}
    >
      {saved ? '★ Saved' : '☆ Save'}
    </button>
  );
}
