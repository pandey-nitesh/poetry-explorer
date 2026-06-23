import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchField } from '../api/types';
import { useAppStore } from '../store/useAppStore';
import { useLists } from '../hooks/useLists';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { buildSearchPath } from '../lib/searchParams';
import { FieldToggle } from './FieldToggle';
import { Suggestions } from './Suggestions';
import styles from './SearchBar.module.css';

const MIN_QUERY_LENGTH = 2;
const FIELD_LABEL: Record<SearchField, string> = { author: 'author', title: 'title' };

// The core interaction (SPEC §9): toggle + input + local autocomplete + cross-field hint.
// Autocomplete is a local filter of the cached lists — zero network per keystroke. A commit
// navigates to the results URL; the param name encodes the kind (author always substring;
// a picked title is exact; free-text title is substring).
export function SearchBar() {
  const navigate = useNavigate();
  const field = useAppStore((s) => s.field);
  const query = useAppStore((s) => s.query);
  const setField = useAppStore((s) => s.setField);
  const setQuery = useAppStore((s) => s.setQuery);

  const { authors, titles, isLoading } = useLists();
  const activeList = field === 'author' ? authors : titles;
  const otherList = field === 'author' ? titles : authors;
  const suggestions = useAutocomplete(query, activeList);
  const otherHasMatch = useAutocomplete(query, otherList, 1).length > 0;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const trimmed = query.trim();
  const canCommit = trimmed.length >= MIN_QUERY_LENGTH;
  const listOpen = open && suggestions.length > 0;
  const otherField: SearchField = field === 'author' ? 'title' : 'author';
  const showCrossFieldHint = canCommit && suggestions.length === 0 && otherHasMatch;

  function go(targetField: SearchField, term: string, exact: boolean) {
    const t = term.trim(); // trim at commit only — never on keystroke (SPEC §9)
    if (t.length < MIN_QUERY_LENGTH) return;
    setOpen(false);
    setActiveIndex(-1);
    navigate(buildSearchPath(targetField, t, exact));
  }

  // Pick a suggestion: author stays substring; a picked title is EXACT. (SPEC §9)
  function pickSuggestion(value: string) {
    setQuery(value);
    go(field, value, field === 'title');
  }

  function submitFreeText() {
    go(field, query, false); // free-text submit is always substring
  }

  function onSubmit() {
    if (listOpen && activeIndex >= 0) pickSuggestion(suggestions[activeIndex]);
    else if (canCommit) submitFreeText();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        if (suggestions.length > 0) {
          e.preventDefault();
          setOpen(true);
          setActiveIndex((i) => (i + 1) % suggestions.length);
        }
        break;
      case 'ArrowUp':
        if (suggestions.length > 0) {
          e.preventDefault();
          setOpen(true);
          setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        }
        break;
      case 'Enter':
        e.preventDefault();
        onSubmit();
        break;
      case 'Escape':
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  function changeField(next: SearchField) {
    setField(next); // keep the typed text; it re-filters against the new list (SPEC §10)
    setActiveIndex(-1);
    setOpen(true);
    inputRef.current?.focus();
  }

  function takeCrossFieldHint() {
    setField(otherField);
    setActiveIndex(-1);
    setOpen(false);
    navigate(buildSearchPath(otherField, trimmed, false));
  }

  return (
    <div className={styles.wrap}>
      <form
        role="search"
        className={styles.bar}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <FieldToggle field={field} onChange={changeField} />
        <div className={styles.inputWrap}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            role="combobox"
            aria-expanded={listOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              listOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined
            }
            aria-label={`Search by ${FIELD_LABEL[field]}`}
            placeholder={field === 'author' ? 'Search authors…' : 'Search titles…'}
            value={query}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
          />
          {listOpen && (
            <Suggestions
              id={listboxId}
              options={suggestions}
              activeIndex={activeIndex}
              optionId={optionId}
              onPick={pickSuggestion}
            />
          )}
        </div>
        <button type="submit" className={styles.submit} disabled={!canCommit}>
          Search
        </button>
      </form>

      <div className={styles.status} aria-live="polite">
        {isLoading && <span className={styles.hint}>Loading the poem catalog…</span>}
        {!isLoading && showCrossFieldHint && (
          <button type="button" className={styles.crossHint} onClick={takeCrossFieldHint}>
            No {FIELD_LABEL[field]}s match “{trimmed}”. Search {FIELD_LABEL[otherField]}s
            instead?
          </button>
        )}
      </div>
    </div>
  );
}
