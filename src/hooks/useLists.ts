import { useQuery } from '@tanstack/react-query';
import { fetchAuthorList, fetchTitleList } from '../api/poetry';
import { qk } from '../api/queryKeys';

// The autocomplete catalog: the complete author + title lists, fetched once and cached
// forever (QueryClient defaults: staleTime Infinity, retry false). These power LOCAL
// autocomplete — zero network per keystroke. (SPEC §5, §9)
export function useLists() {
  const authors = useQuery({ queryKey: qk.authorList, queryFn: fetchAuthorList });
  const titles = useQuery({ queryKey: qk.titleList, queryFn: fetchTitleList });

  return {
    authors: authors.data ?? [],
    titles: titles.data ?? [],
    isLoading: authors.isLoading || titles.isLoading,
    isError: authors.isError || titles.isError,
    error: authors.error ?? titles.error ?? null,
    refetch: () => {
      void authors.refetch();
      void titles.refetch();
    },
  };
}
