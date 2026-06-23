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
  it('renders the deterministic pick as "Poem of the day" with a detail link', () => {
    vi.mocked(usePoemOfDay).mockReturnValue({
      poem: {
        author: 'Percy Bysshe Shelley',
        title: 'Ozymandias',
        linecount: 14,
        lines: ['I met a traveller from an antique land'],
      },
      isRandom: false,
      isLoading: false,
      isError: false,
      refetch: () => {},
    });
    renderPotd();
    expect(screen.getByText('Poem of the day')).toBeInTheDocument();
    expect(screen.queryByText('Random poem')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')[0]).toHaveAttribute(
      'href',
      '/poem?author=Percy+Bysshe+Shelley&title=Ozymandias&n=14',
    );
  });

  it('labels the /random fallback honestly as "Random poem" (§16 #14)', () => {
    vi.mocked(usePoemOfDay).mockReturnValue({
      poem: { author: 'Anon', title: 'A Stray Verse', linecount: 4, lines: ['one'] },
      isRandom: true,
      isLoading: false,
      isError: false,
      refetch: () => {},
    });
    renderPotd();
    expect(screen.getByText('Random poem')).toBeInTheDocument();
    expect(screen.queryByText('Poem of the day')).not.toBeInTheDocument();
  });

  it('shows a non-blocking retry when the daily poem fails to load', () => {
    vi.mocked(usePoemOfDay).mockReturnValue({
      poem: null,
      isRandom: false,
      isLoading: false,
      isError: true,
      refetch: () => {},
    });
    renderPotd();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
