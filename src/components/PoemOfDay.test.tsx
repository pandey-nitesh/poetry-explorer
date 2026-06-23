import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { usePoemOfDay } from '../hooks/usePoemOfDay';
import { PoemOfDay } from './PoemOfDay';

vi.mock('../hooks/usePoemOfDay');

function renderPotd() {
  return render(
    <MemoryRouter>
      <PoemOfDay />
    </MemoryRouter>,
  );
}

describe('PoemOfDay (SPEC §13)', () => {
  it('renders the featured poem with a link to its detail page', () => {
    vi.mocked(usePoemOfDay).mockReturnValue({
      poem: {
        author: 'Percy Bysshe Shelley',
        title: 'Ozymandias',
        linecount: 14,
        lines: ['I met a traveller from an antique land'],
      },
      isLoading: false,
      isError: false,
      refetch: () => {},
    });
    renderPotd();
    expect(screen.getByText(/Poem of the day/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link')[0]).toHaveAttribute(
      'href',
      '/poem?author=Percy+Bysshe+Shelley&title=Ozymandias&n=14',
    );
  });

  it('shows a non-blocking retry when the daily poem fails to load', () => {
    vi.mocked(usePoemOfDay).mockReturnValue({
      poem: null,
      isLoading: false,
      isError: true,
      refetch: () => {},
    });
    renderPotd();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
