import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom doesn't implement scrollTo; provide a no-op so RouteFocus's scroll reset stays
// quiet. A direct assignment (not vi.stubGlobal) survives unstubGlobals between tests.
window.scrollTo = (() => {}) as typeof window.scrollTo;

// Vitest runs files in isolation, but React Testing Library mounts into a shared
// jsdom document — unmount between tests so queries don't see stale nodes.
afterEach(() => {
  cleanup();
});
