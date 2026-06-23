import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RouteFocus } from './RouteFocus';

function Page({ to, label }: { to: string; label: string }) {
  return (
    <main id="main" tabIndex={-1}>
      <h1>{label}</h1>
      <Link to={to}>go</Link>
    </main>
  );
}

describe('RouteFocus (SPEC §12 — focus on route change)', () => {
  it('moves focus to the main content region after navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/a']}>
        <RouteFocus />
        <Routes>
          <Route path="/a" element={<Page to="/b" label="Page A" />} />
          <Route path="/b" element={<Page to="/a" label="Page B" />} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'go' }));
    expect(screen.getByRole('heading', { name: 'Page B' })).toBeInTheDocument();
    expect(document.activeElement).toBe(document.getElementById('main'));
  });
});
