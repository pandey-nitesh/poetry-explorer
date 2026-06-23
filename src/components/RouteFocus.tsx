import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// On route change, move focus to the main content region and reset scroll, so keyboard
// and screen-reader users land at the new page rather than where the old one left them.
// Keyed on pathname only — pagination/param changes within a page don't steal focus. (SPEC §12)
export function RouteFocus() {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.getElementById('main');
    main?.focus({ preventScroll: true });
    try {
      window.scrollTo(0, 0);
    } catch {
      /* jsdom and some environments don't implement scrollTo — non-essential */
    }
  }, [pathname]);

  return null;
}
