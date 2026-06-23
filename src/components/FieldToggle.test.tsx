import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { SearchField } from '../api/types';
import { FieldToggle } from './FieldToggle';

// Controlled harness, since FieldToggle is driven by field/onChange.
function Harness() {
  const [field, setField] = useState<SearchField>('author');
  return <FieldToggle field={field} onChange={setField} />;
}

describe('FieldToggle (SPEC §12 — radiogroup keyboard contract)', () => {
  it('arrow keys both select and move focus to the newly checked radio', async () => {
    render(<Harness />);
    const author = screen.getByRole('radio', { name: 'Author' });
    const title = screen.getByRole('radio', { name: 'Title' });

    author.focus();
    expect(author).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(title).toHaveAttribute('aria-checked', 'true');
    expect(title).toHaveFocus(); // focus follows selection
    expect(title).toHaveAttribute('tabindex', '0');
    expect(author).toHaveAttribute('tabindex', '-1');

    await userEvent.keyboard('{ArrowLeft}');
    expect(author).toHaveAttribute('aria-checked', 'true');
    expect(author).toHaveFocus();
  });

  it('clicking a segment selects it', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('radio', { name: 'Title' }));
    expect(screen.getByRole('radio', { name: 'Title' })).toHaveAttribute('aria-checked', 'true');
  });
});
