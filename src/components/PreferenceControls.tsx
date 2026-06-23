import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  useAppStore,
} from '../store/useAppStore';
import styles from './PreferenceControls.module.css';

const round = (n: number) => Math.round(n * 1000) / 1000;

// Global, persisted display controls: text size and light/dark theme. (SPEC §8, §12)
export function PreferenceControls() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const fontScale = useAppStore((s) => s.fontScale);
  const setFontScale = useAppStore((s) => s.setFontScale);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const nextThemeName = nextTheme === 'dark' ? 'Nocturne' : 'Folio';

  return (
    <div className={styles.controls}>
      <div className={styles.sizeGroup} role="group" aria-label="Text size">
        <button
          type="button"
          className={styles.sizeBtn}
          onClick={() => setFontScale(Math.max(FONT_SCALE_MIN, round(fontScale - FONT_SCALE_STEP)))}
          disabled={fontScale <= FONT_SCALE_MIN}
          aria-label="Decrease text size"
        >
          A−
        </button>
        <button
          type="button"
          className={styles.sizeBtn}
          onClick={() => setFontScale(Math.min(FONT_SCALE_MAX, round(fontScale + FONT_SCALE_STEP)))}
          disabled={fontScale >= FONT_SCALE_MAX}
          aria-label="Increase text size"
        >
          A+
        </button>
      </div>
      <button
        type="button"
        className={styles.themeBtn}
        onClick={() => setTheme(nextTheme)}
        aria-pressed={theme === 'dark'}
        aria-label={`Switch to ${nextThemeName} (${nextTheme}) theme`}
        title={`Switch to ${nextThemeName} theme`}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
    </div>
  );
}
