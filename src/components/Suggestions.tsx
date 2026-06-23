import styles from './Suggestions.module.css';

interface Props {
  id: string;
  options: string[];
  activeIndex: number;
  optionId: (index: number) => string;
  onPick: (value: string) => void;
}

// The combobox popup (ARIA listbox). The parent input owns focus and keyboard handling;
// each option is addressed by id via aria-activedescendant. (SPEC §10, §12)
export function Suggestions({ id, options, activeIndex, optionId, onPick }: Props) {
  return (
    <ul id={id} role="listbox" className={styles.listbox}>
      {options.map((option, i) => (
        <li
          key={option}
          id={optionId(i)}
          role="option"
          aria-selected={i === activeIndex}
          className={i === activeIndex ? `${styles.option} ${styles.active}` : styles.option}
          // mousedown + preventDefault so the input keeps focus and the pick still fires.
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(option);
          }}
        >
          {option}
        </li>
      ))}
    </ul>
  );
}
