import { describe, expect, it } from 'vitest';
import { hash32 } from './hash';

describe('hash32 — deterministic day-stable selection (SPEC §13)', () => {
  it('is deterministic for the same input', () => {
    expect(hash32('2026-06-22')).toBe(hash32('2026-06-22'));
  });

  it('returns an unsigned 32-bit integer', () => {
    for (const s of ['', 'a', '2026-06-22', 'Ozymandias', '2026-06-22Song']) {
      const h = hash32(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it('avalanches: adjacent day-keys do NOT map to adjacent values', () => {
    // A linear hash would put consecutive dates next to each other; assert they
    // diverge by far more than 1 so `% titles.length` spreads them out.
    const a = hash32('2026-06-22');
    const b = hash32('2026-06-23');
    expect(a).not.toBe(b);
    expect(Math.abs(a - b)).toBeGreaterThan(1000);
  });

  it('spreads distinct titles across a corpus index without obvious clustering', () => {
    const titles = Array.from({ length: 50 }, (_, i) => `Poem number ${i}`);
    const indices = new Set(titles.map((t) => hash32('2026-06-22' + t) % 17));
    // With good distribution we expect most of the 17 buckets to be touched.
    expect(indices.size).toBeGreaterThan(10);
  });
});
