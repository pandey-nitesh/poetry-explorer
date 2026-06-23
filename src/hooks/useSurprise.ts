import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRandomPoem } from '../api/poetry';
import { qk } from '../api/queryKeys';
import { buildPoemPath } from '../lib/identity';

// "Surprise me" — a genuinely random poem (DESIGN — Components). Fetches a full Poem,
// pre-seeds the detail cache so it opens instantly, then navigates to it. Uses the detail
// URL builder (kept in one place) via the navigate path.
export function useSurprise() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function surprise() {
    setLoading(true);
    setError(false);
    try {
      const [poem] = await fetchRandomPoem();
      if (!poem) {
        setError(true);
        return;
      }
      queryClient.setQueryData(qk.poem(poem.author, poem.title, poem.linecount), [poem]);
      navigate(buildPoemPath(poem));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return { surprise, loading, error };
}
