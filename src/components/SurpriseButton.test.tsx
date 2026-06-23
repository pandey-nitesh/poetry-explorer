import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as poetry from '../api/poetry';
import { renderWithProviders } from '../test/utils';
import { SurpriseButton } from './SurpriseButton';

vi.mock('../api/poetry');

function Location() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + loc.search}</div>;
}

describe('SurpriseButton (DESIGN — Surprise me)', () => {
  it('fetches a random poem and navigates to its detail page', async () => {
    vi.mocked(poetry.fetchRandomPoem).mockResolvedValue([
      { author: 'Robert Frost', title: 'The Road Not Taken', linecount: 20, lines: ['Two roads'] },
    ]);
    renderWithProviders(
      <>
        <SurpriseButton />
        <Location />
      </>,
      { route: '/' },
    );

    await userEvent.click(screen.getByRole('button', { name: /surprise me/i }));
    await waitFor(() =>
      expect(screen.getByTestId('loc')).toHaveTextContent(
        '/poem?author=Robert+Frost&title=The+Road+Not+Taken&n=20',
      ),
    );
    expect(poetry.fetchRandomPoem).toHaveBeenCalledTimes(1);
  });
});
