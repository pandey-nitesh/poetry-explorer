import { useRef } from 'react';
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

// Segmented control with radiogroup semantics: roving tabindex (only the checked option is
// tabbable) and arrow-key navigation that BOTH selects and moves focus to the newly checked
// radio — per the radiogroup keyboard contract. (SPEC §10, §12)
export function FieldToggle({ field, onChange }: Props) {
  const refs = useRef<Record<SearchField, HTMLButtonElement | null>>({
    author: null,
    title: null,
  });

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const next: SearchField = field === 'author' ? 'title' : 'author';
      onChange(next);
      refs.current[next]?.focus(); // focus follows selection into the radiogroup
    }
  }

  return (
    <div role="radiogroup" aria-label="Search by" className={styles.toggle} onKeyDown={onKeyDown}>
      {FIELDS.map((f) => {
        const checked = field === f.value;
        return (
          <button
            key={f.value}
            ref={(el) => {
              refs.current[f.value] = el;
            }}
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
