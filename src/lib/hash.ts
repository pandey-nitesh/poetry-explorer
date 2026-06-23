// xmur3 (one-shot) — a small avalanche-y string hash → unsigned 32-bit int.
// Good avalanche matters for Poem of the Day: consecutive dates differ by one char,
// and a linear hash (char-sum) would map adjacent days to adjacent indices. (SPEC §13)
export function hash32(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0; // unsigned → safe for % titles.length
}
