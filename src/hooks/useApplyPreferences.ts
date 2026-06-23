import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

// Reflect the persisted display preferences onto the document: data-theme drives the
// token palette, --font-scale drives the whole type system off the root em. (SPEC §8, §12)
export function useApplyPreferences() {
  const theme = useAppStore((s) => s.theme);
  const fontScale = useAppStore((s) => s.fontScale);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [fontScale]);
}
