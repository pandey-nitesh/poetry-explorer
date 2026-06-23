import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Poem } from '../api/types';
import { useAppStore } from '../store/useAppStore';
import { renderWithProviders } from '../test/utils';
import { PoemView } from './PoemView';

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ saved: [] });
});

// A poem with indentation and a blank-line stanza break (Dowson-style; SPEC §16 #9).
const POEM: Poem = {
  author: 'Ernest Dowson',
  title: 'Vitae Summa Brevis',
  linecount: 8,
  lines: ['  They are not long,', '', 'the weeping and the laughter,'],
};

function renderView(poem: Poem = POEM) {
  // QueryClient is needed because PoemView hosts the Surprise me control.
  return renderWithProviders(<PoemView poem={poem} />);
}

describe('PoemView (SPEC §10, §12)', () => {
  it('renders the title, author, and line count', () => {
    renderView();
    expect(screen.getByRole('heading', { name: /Vitae Summa Brevis/ })).toBeInTheDocument();
    expect(screen.getByText('Ernest Dowson')).toBeInTheDocument();
    expect(screen.getByText('8 lines')).toBeInTheDocument();
  });

  it('preserves leading spaces and blank-line stanzas verbatim (§16 #9)', () => {
    renderView();
    const lines = screen.getAllByTestId('poem-line');
    expect(lines[0].textContent).toBe('  They are not long,');
    expect(lines[1].textContent).toBe('');
    expect(lines[2].textContent).toBe('the weeping and the laughter,');
  });

  it('omits the line count when it is unknown (0)', () => {
    renderView({ ...POEM, linecount: 0 });
    expect(screen.queryByText(/lines?$/)).not.toBeInTheDocument();
  });

  it('toggles save state when the Save button is clicked', async () => {
    renderView();
    const save = screen.getByRole('button', { name: /save/i });
    expect(save).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(save);
    expect(screen.getByRole('button', { name: /saved/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(useAppStore.getState().saved).toHaveLength(1);
  });

  it('confirms a copy action', async () => {
    renderView();
    await userEvent.click(screen.getByRole('button', { name: /copy poem/i }));
    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument();
  });

  it('opens and closes reading mode', async () => {
    renderView();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /reading mode/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /close reading mode/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
