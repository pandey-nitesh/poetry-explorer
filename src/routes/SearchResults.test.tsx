import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import * as poetry from '../api/poetry';
import { renderWithProviders } from '../test/utils';
import { SearchResults } from './SearchResults';

vi.mock('../api/poetry');

describe('SearchResults (SPEC §10, §11)', () => {
  it('groups author results by author with per-author counts; both Brownings appear (§16 #4)', async () => {
    vi.mocked(poetry.searchAuthors).mockResolvedValue([
      { author: 'Robert Browning', title: 'A', linecount: 10 },
      { author: 'Robert Browning', title: 'B', linecount: 20 },
      { author: 'Elizabeth Barrett Browning', title: 'C', linecount: 14 },
    ]);
    renderWithProviders(<SearchResults />, { route: '/search?authorContains=Browning' });

    const robert = await screen.findByRole('heading', { name: /Robert Browning/ });
    expect(robert).toBeInTheDocument();
    expect(within(robert).getByText('2')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Elizabeth Barrett Browning/ }),
    ).toBeInTheDocument();
  });

  it('renders title results as a flat list with no author groupings', async () => {
    vi.mocked(poetry.searchTitlesContaining).mockResolvedValue([
      { author: 'X', title: 'Love I', linecount: 4 },
      { author: 'Y', title: 'Love II', linecount: 8 },
    ]);
    renderWithProviders(<SearchResults />, { route: '/search?titleContains=love' });

    expect(await screen.findByRole('link', { name: /Love I by X/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Love II by Y/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('shows the empty state (not an error) when there are no matches (§16 #7)', async () => {
    vi.mocked(poetry.searchTitlesContaining).mockResolvedValue([]);
    renderWithProviders(<SearchResults />, { route: '/search?titleContains=zzzzz' });

    expect(await screen.findByText(/No matches/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a retryable error and does NOT auto-retry (§16 #8)', async () => {
    vi.mocked(poetry.searchTitlesContaining).mockRejectedValue(new ApiError('Non-JSON'));
    renderWithProviders(<SearchResults />, { route: '/search?titleContains=the' });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(poetry.searchTitlesContaining).toHaveBeenCalledTimes(1);
  });

  it('cards link to the detail page with &n (§16 #18)', async () => {
    vi.mocked(poetry.searchTitlesContaining).mockResolvedValue([
      { author: 'Robert Browning', title: 'Love', linecount: 12 },
    ]);
    renderWithProviders(<SearchResults />, { route: '/search?titleContains=love' });

    const link = await screen.findByRole('link', { name: /Love/ });
    expect(link).toHaveAttribute('href', '/poem?author=Robert+Browning&title=Love&n=12');
  });

  it('paginates large result sets and the page is reflected in the URL', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      author: 'A',
      title: `Poem ${i}`,
      linecount: i + 1,
    }));
    vi.mocked(poetry.searchTitlesContaining).mockResolvedValue(many);
    renderWithProviders(<SearchResults />, { route: '/search?titleContains=poem' });

    expect(await screen.findByText(/Page 1 of 2/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByText(/Page 2 of 2/)).toBeInTheDocument();
  });

  it('hints to narrow the search on a large result set (SPEC §11)', async () => {
    const many = Array.from({ length: 70 }, (_, i) => ({
      author: 'A',
      title: `Poem ${i}`,
      linecount: i + 1,
    }));
    vi.mocked(poetry.searchTitlesContaining).mockResolvedValue(many);
    renderWithProviders(<SearchResults />, { route: '/search?titleContains=poem' });
    expect(await screen.findByText(/keep typing to narrow/i)).toBeInTheDocument();
  });
});
