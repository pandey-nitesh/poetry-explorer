import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

// App warms the author/title lists on mount; stub fetch so the smoke tests stay offline.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: unknown) => {
      const body = String(url).includes('/author') ? { authors: [] } : { titles: [] };
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => body,
      } as unknown as Response);
    }),
  );
});

describe('App', () => {
  it('renders the app title on the home route', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /poetry explorer/i }),
    ).toBeInTheDocument();
  });

  it('renders the not-found screen for an unknown route', () => {
    window.history.pushState({}, '', '/does-not-exist');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument();
    window.history.pushState({}, '', '/');
  });
});
