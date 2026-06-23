import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Poem } from '../api/types';
import { ReadingMode } from './ReadingMode';

const POEM: Poem = {
  author: 'Ernest Dowson',
  title: 'Vitae Summa Brevis',
  linecount: 3,
  lines: ['  They are not long,', '', 'the weeping and the laughter,'],
};

describe('ReadingMode (DESIGN — reading enhancer)', () => {
  it('renders the poem in a modal overlay, whitespace intact', () => {
    render(<ReadingMode poem={POEM} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: /Vitae Summa Brevis/ })).toBeInTheDocument();
    const lines = screen.getAllByTestId('reading-line');
    expect(lines[0].textContent).toBe('  They are not long,');
    expect(lines[1].textContent).toBe('');
  });

  it('moves focus to Close on open', () => {
    render(<ReadingMode poem={POEM} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /close reading mode/i })).toHaveFocus();
  });

  it('adjusts the reading text size with A− / A+', async () => {
    render(<ReadingMode poem={POEM} onClose={() => {}} initialSize={1.3} />);
    const reader = screen.getByRole('dialog').querySelector('article') as HTMLElement;
    expect(reader.style.fontSize).toBe('1.3rem');
    await userEvent.click(screen.getByRole('button', { name: /increase text size/i }));
    expect(reader.style.fontSize).toBe('1.4rem');
    await userEvent.click(screen.getByRole('button', { name: /decrease text size/i }));
    expect(reader.style.fontSize).toBe('1.3rem');
  });

  it('closes on Escape and via the Close button', async () => {
    const onClose = vi.fn();
    render(<ReadingMode poem={POEM} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: /close reading mode/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
