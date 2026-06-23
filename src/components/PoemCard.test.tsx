import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { PoemMeta } from '../api/types';
import { PoemCard } from './PoemCard';

function renderCard(poem: PoemMeta) {
  return render(
    <MemoryRouter>
      <PoemCard poem={poem} />
    </MemoryRouter>,
  );
}

describe('PoemCard (SPEC §10, §16 #15/#18)', () => {
  it('links to the detail page with &n when line count is known', () => {
    renderCard({ author: 'Robert Browning', title: 'Love', linecount: 12 });
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/poem?author=Robert+Browning&title=Love&n=12',
    );
    expect(screen.getByText('12 lines')).toBeInTheDocument();
  });

  it('omits &n and the line count when linecount is 0 (unknown)', () => {
    renderCard({ author: 'A', title: 'T', linecount: 0 });
    expect(screen.getByRole('link').getAttribute('href')).toBe('/poem?author=A&title=T');
    expect(screen.queryByText(/lines?$/)).not.toBeInTheDocument();
  });

  it('uses the singular "line" for a one-line poem', () => {
    renderCard({ author: 'A', title: 'T', linecount: 1 });
    expect(screen.getByText('1 line')).toBeInTheDocument();
  });
});
