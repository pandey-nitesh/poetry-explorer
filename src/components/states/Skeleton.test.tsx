import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PoemSkeleton } from './PoemSkeleton';
import { Skeleton } from './Skeleton';

describe('loading skeletons (DESIGN — States)', () => {
  it('PoemSkeleton renders a single-column status placeholder', () => {
    const { container } = render(<PoemSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    // a title bar, an actions row, and several body line bars — not a card grid
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(8);
  });

  it('Skeleton cards variant renders a flat set of slip placeholders', () => {
    const { container } = render(<Skeleton rows={4} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(container.querySelectorAll('section').length).toBe(0);
  });

  it('Skeleton grouped variant renders author-style sections', () => {
    const { container } = render(<Skeleton variant="grouped" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    // sectioned, like author-grouped results
    expect(container.querySelectorAll('section').length).toBeGreaterThan(0);
  });
});
