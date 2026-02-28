import { useState, useCallback, useRef } from 'react';
import type { Location } from '../types';

const SEARCH_DEBOUNCE_MS = 300;

export function useSearch(searchLocations: (query: string) => Promise<Location[]>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[] | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchLocations(query);
      setSearchResults(results);
    }, SEARCH_DEBOUNCE_MS);
  }, [searchLocations]);

  const clearSearch = useCallback(() => {
    setSearchResults(null);
    setSearchQuery('');
  }, []);

  return { searchQuery, searchResults, handleSearch, clearSearch };
}
