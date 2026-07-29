import { useState, useCallback } from "react";
import { api } from "@/integrations/api/client";

interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  conversation_id: string;
  sender_profile?: { username: string };
}

export const useMessageSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMessages = useCallback(async (query: string, conversationId?: string) => {
    if (!query.trim()) { setResults([]); return; }
    setIsSearching(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query });
      if (conversationId) params.set("conversation_id", conversationId);
      const data = await api.get<SearchResult[]>(`/messages/search?${params}`);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => { setResults([]); setError(null); }, []);

  return { results, isSearching, error, searchMessages, clearSearch };
};
