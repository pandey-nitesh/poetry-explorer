import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Poem } from '../api/types';
import styles from './ReadingMode.module.css';

// "Initial reading size" — the host-editable designer knob (DESIGN — options). Medium.
const DEFAULT_READING_SIZE = 1.3;
const SIZE_MIN = 0.9;
const SIZE_MAX = 2;
const SIZE_STEP = 0.1;
const SPACING_MIN = 1.4;
const SPACING_MAX = 2.4;
const SPACING_STEP = 0.15;

const round = (n: number) => Math.round(n * 100) / 100;

interface Props {
  poem: Poem;
  initialSize?: number;
  onClose: () => void;
}

// A fullscreen, distraction-free reading overlay (DESIGN — Reading mode). The poem sits in
// a single column with no surrounding panel; a small, always-visible (never hover-only),
// touch-sized rail holds A−/A+, line-spacing, and Close. Esc closes and returns the reader
// exactly where they were.
export function ReadingMode({ poem, initialSize = DEFAULT_READING_SIZE, onClose }: Props) {
  const [size, setSize] = useState(initialSize);
  const [spacing, setSpacing] = useState(1.8);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', ''); // background out of tab order + a11y tree (true modal)
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // lock background scroll
    closeRef.current?.focus();
    return () => {
      root?.removeAttribute('inert');
      document.body.style.overflow = prevOverflow;
      opener?.focus?.(); // return focus exactly where they were
    };
  }, []);

  // Esc closes; Tab is trapped within the control rail.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      ref={containerRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Reading: ${poem.title} by ${poem.author}`}
      onKeyDown={onKeyDown}
    >
      <div className={styles.rail}>
        <div className={styles.group} role="group" aria-label="Text size">
          <button
            type="button"
            className={styles.ctrl}
            onClick={() => setSize((s) => round(Math.max(SIZE_MIN, s - SIZE_STEP)))}
            disabled={size <= SIZE_MIN}
            aria-label="Decrease text size"
          >
            A−
          </button>
          <button
            type="button"
            className={styles.ctrl}
            onClick={() => setSize((s) => round(Math.min(SIZE_MAX, s + SIZE_STEP)))}
            disabled={size >= SIZE_MAX}
            aria-label="Increase text size"
          >
            A+
          </button>
        </div>
        <div className={styles.group} role="group" aria-label="Line spacing">
          <button
            type="button"
            className={styles.ctrl}
            onClick={() => setSpacing((s) => round(Math.max(SPACING_MIN, s - SPACING_STEP)))}
            disabled={spacing <= SPACING_MIN}
            aria-label="Decrease line spacing"
          >
            ↕−
          </button>
          <button
            type="button"
            className={styles.ctrl}
            onClick={() => setSpacing((s) => round(Math.min(SPACING_MAX, s + SPACING_STEP)))}
            disabled={spacing >= SPACING_MAX}
            aria-label="Increase line spacing"
          >
            ↕+
          </button>
        </div>
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close reading mode"
        >
          Close
        </button>
      </div>

      <article
        className={styles.reader}
        style={{ fontSize: `${size}rem`, lineHeight: spacing }}
      >
        <h1 className={styles.title}>{poem.title}</h1>
        <p className={styles.author}>{poem.author}</p>
        <div className={styles.body}>
          {poem.lines.map((line, i) => (
            <div key={i} data-testid="reading-line" className={styles.line}>
              {line}
            </div>
          ))}
        </div>
      </article>
    </div>,
    document.body,
  );
}
