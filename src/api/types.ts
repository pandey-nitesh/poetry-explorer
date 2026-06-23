// Shared PoetryDB shapes. linecount is always coerced to a number at the API
// boundary (PoetryDB returns it as number on some endpoints, string on others). SPEC §3.

export interface PoemMeta {
  author: string;
  title: string;
  linecount: number;
}

export interface Poem extends PoemMeta {
  lines: string[];
}

export type SearchField = 'author' | 'title';
