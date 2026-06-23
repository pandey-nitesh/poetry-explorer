import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import * as poetry from '../api/poetry';
import { renderWithProviders } from '../test/utils';
import { PoemDetail } from './PoemDetail';

vi.mock('../api/poetry');

describe('PoemDetail (SPEC §6, §11)', () => {
  it('loads a poem cold from the URL params (§16 #6)', async () => {
    vi.mocked(poetry.fetchPoem).mockResolvedValue([
      { author: 'Percy Bysshe Shelley', title: 'Ozymandias', linecount: 14, lines: ['I met a traveller'] },
    ]);
    renderWithProviders(<PoemDetail />, {
      route: '/poem?author=Percy+Bysshe+Shelley&title=Ozymandias&n=14',
    });
    expect(await screen.findByRole('heading', { name: /Ozymandias/ })).toBeInTheDocument();
    expect(poetry.fetchPoem).toHaveBeenCalledWith('Percy Bysshe Shelley', 'Ozymandias');
  });

  it('disambiguates duplicate titles by n (§16 #18)', async () => {
    vi.mocked(poetry.fetchPoem).mockResolvedValue([
      { author: 'A', title: 'Song', linecount: 8, lines: ['short verse'] },
      { author: 'A', title: 'Song', linecount: 20, lines: ['the long verse'] },
    ]);
    renderWithProviders(<PoemDetail />, { route: '/poem?author=A&title=Song&n=20' });
    expect(await screen.findByText('the long verse')).toBeInTheDocument();
    expect(screen.queryByText('short verse')).not.toBeInTheDocument();
  });

  it('shows a not-found state when the poem is missing', async () => {
    vi.mocked(poetry.fetchPoem).mockResolvedValue([]);
    renderWithProviders(<PoemDetail />, { route: '/poem?author=A&title=Nope' });
    expect(await screen.findByText(/Poem not found/)).toBeInTheDocument();
  });

  it('shows a retryable error on failure (§16 #8)', async () => {
    vi.mocked(poetry.fetchPoem).mockRejectedValue(new ApiError('Non-JSON'));
    renderWithProviders(<PoemDetail />, { route: '/poem?author=A&title=T' });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
