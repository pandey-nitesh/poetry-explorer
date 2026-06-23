import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import { SavedList } from './SavedList';

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ saved: [] });
});

function renderSaved() {
  return render(
    <MemoryRouter>
      <SavedList />
    </MemoryRouter>,
  );
}

describe('SavedList (SPEC §10, §16 #13)', () => {
  it('shows an empty state when nothing is saved', () => {
    renderSaved();
    expect(screen.getByText(/No saved poems yet/)).toBeInTheDocument();
  });

  it('renders saved poems as cards that link back to detail', () => {
    useAppStore.setState({ saved: [{ author: 'Robert Browning', title: 'Love', linecount: 12 }] });
    renderSaved();
    expect(screen.getByRole('link', { name: /Love by Robert Browning/ })).toHaveAttribute(
      'href',
      '/poem?author=Robert+Browning&title=Love&n=12',
    );
  });
});
