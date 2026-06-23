import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { useApplyPreferences } from './hooks/useApplyPreferences';
import { useLists } from './hooks/useLists';
import { Home } from './routes/Home';
import { NotFound } from './routes/NotFound';
import { PoemDetail } from './routes/PoemDetail';
import { SavedList } from './routes/SavedList';
import { SearchResults } from './routes/SearchResults';

// PoetryDB data is immutable, so cache forever and never auto-retry: a host-overload
// error just fails again on retry; transient failures are retried via the error UI. (SPEC §5)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60 * 24, // 24h — data never goes stale, so keep it warm
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Warm the autocomplete catalog (author + title lists) once, app-wide, at startup. (SPEC §10)
function AppRoutes() {
  useLists();
  useApplyPreferences();
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/poem" element={<PoemDetail />} />
        <Route path="/saved" element={<SavedList />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
