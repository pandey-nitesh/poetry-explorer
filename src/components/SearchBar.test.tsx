import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';
import { useAppStore } from '../store/useAppStore';

// Lists are local & cached; mock them so the component never touches the network.
vi.mock('../hooks/useLists', () => ({
  useLists: () => ({
    authors: ['Robert Browning', 'Elizabeth Barrett Browning', 'William Wordsworth'],
    titles: ['Ozymandias', 'The Tyger', 'Song', 'A Song'],
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => {},
  }),
}));

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + loc.search}</div>;
}

function setup() {
  useAppStore.setState({ field: 'author', query: '' }); // reset ephemeral state
  return render(
    <MemoryRouter initialEntries={['/']}>
      <SearchBar />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

const path = () => screen.getByTestId('loc').textContent;
const combobox = () => screen.getByRole('combobox');
const searchButton = () => screen.getByRole('button', { name: /^search$/i });

describe('SearchBar (SPEC §9)', () => {
  it('fires zero network requests while typing — autocomplete is local (§16 #1)', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    setup();
    await userEvent.click(screen.getByRole('radio', { name: 'Title' }));
    await userEvent.type(combobox(), 'Ozy');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('option', { name: 'Ozymandias' })).toBeInTheDocument();
  });

  it('does not search below the 2-char minimum (§16 #3)', async () => {
    setup();
    await userEvent.type(combobox(), 'B');
    expect(searchButton()).toBeDisabled();
    await userEvent.keyboard('{Enter}');
    expect(path()).toBe('/');
  });

  it('commits nothing for a whitespace-only query (§16 #17)', async () => {
    setup();
    await userEvent.type(combobox(), '   ');
    expect(searchButton()).toBeDisabled();
  });

  it('author free-text submit → ?authorContains= (substring)', async () => {
    setup();
    await userEvent.type(combobox(), 'Browning');
    await userEvent.click(searchButton());
    expect(path()).toBe('/search?authorContains=Browning');
  });

  it('picking an author suggestion stays substring → ?authorContains=', async () => {
    setup();
    await userEvent.type(combobox(), 'Browning');
    await userEvent.click(screen.getByRole('option', { name: 'Robert Browning' }));
    expect(path()).toBe('/search?authorContains=Robert+Browning');
  });

  it('picking a title suggestion runs an exact search → ?title= (§16 #5)', async () => {
    setup();
    await userEvent.click(screen.getByRole('radio', { name: 'Title' }));
    await userEvent.type(combobox(), 'Ozy');
    await userEvent.click(screen.getByRole('option', { name: 'Ozymandias' }));
    expect(path()).toBe('/search?title=Ozymandias');
  });

  it('title free-text submit → ?titleContains= (substring)', async () => {
    setup();
    await userEvent.click(screen.getByRole('radio', { name: 'Title' }));
    await userEvent.type(combobox(), 'song');
    await userEvent.click(searchButton());
    expect(path()).toBe('/search?titleContains=song');
  });

  it('trims the term on commit: " the " → the (§16 #17)', async () => {
    setup();
    await userEvent.click(screen.getByRole('radio', { name: 'Title' }));
    await userEvent.type(combobox(), '  the  ');
    await userEvent.click(searchButton());
    expect(path()).toBe('/search?titleContains=the');
  });

  it('is fully keyboard operable: arrows highlight, Enter selects (§16 #10)', async () => {
    setup();
    await userEvent.type(combobox(), 'Browning');
    await userEvent.keyboard('{ArrowDown}');
    const active = screen.getByRole('option', { selected: true });
    expect(combobox()).toHaveAttribute('aria-activedescendant', active.id);

    const activeText = active.textContent ?? '';
    await userEvent.keyboard('{Enter}');
    const committed = new URLSearchParams(path()!.split('?')[1]).get('authorContains');
    expect(committed).toBe(activeText);
  });

  it('Escape closes the suggestion list (§16 #10)', async () => {
    setup();
    await userEvent.type(combobox(), 'Browning');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('offers a cross-field switch when only the other list matches (SPEC §9)', async () => {
    setup();
    await userEvent.click(screen.getByRole('radio', { name: 'Title' }));
    await userEvent.type(combobox(), 'Wordsworth');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /search authors instead/i }));
    expect(path()).toBe('/search?authorContains=Wordsworth');
  });
});
