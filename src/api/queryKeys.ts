// Centralized TanStack Query keys. Searches are keyed by kind + trimmed term;
// poem detail includes linecount so duplicate titles cache separately. (SPEC §5)

export const qk = {
  authorList: ['authorList'] as const,
  titleList: ['titleList'] as const,
  searchAuthor: (t: string) => ['search', 'author', t] as const,
  searchTitle: (t: string) => ['search', 'title', t] as const,
  titleExact: (t: string) => ['titleExact', t] as const,
  poem: (author: string, title: string, linecount?: number) =>
    ['poem', author, title, linecount ?? null] as const,
  poemOfDay: (dayKey: string) => ['poemOfDay', dayKey] as const,
};
