import type { KeyboardEvent } from 'react';
import type { SearchField } from '../api/types';
import styles from './FieldToggle.module.css';

const FIELDS: { value: SearchField; label: string }[] = [
  { value: 'author', label: 'Author' },
  { value: 'title', label: 'Title' },
];

interface Props {
  field: SearchField;
  onChange: (field: SearchField) => void;
}

// Segmented control with radiogroup semantics: roving tabindex (only the checked option
// is tabbable) and arrow-key navigation between the two fields. (SPEC §10, §12)
export function FieldToggle({ field, onChange }: Props) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      onChange(field === 'author' ? 'title' : 'author');
    }
  }

  return (
    <div role="radiogroup" aria-label="Search by" className={styles.toggle} onKeyDown={onKeyDown}>
      {FIELDS.map((f) => {
        const checked = field === f.value;
        return (
          <button
            key={f.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={checked ? `${styles.option} ${styles.checked}` : styles.option}
            onClick={() => onChange(f.value)}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
