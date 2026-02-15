import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  conversation_id: string;
  sender_profile?: {
    username: string;
  };
}

export const useMessageSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMessages = useCallback(async (query: string, conversationId?: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Build the query using textSearch for full-text search
      let queryBuilder = supabase
        .from('messages')
        .select('id, content, created_at, conversation_id, sender_id')
        .textSearch('search_vector', query, { type: 'websearch' })
        .order('created_at', { ascending: false })
        .limit(50);

      if (conversationId) {
        queryBuilder = queryBuilder.eq('conversation_id', conversationId);
      }

      const { data, error: searchError } = await queryBuilder;

      if (searchError) {
        throw searchError;
      }

      // Fetch sender profiles
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedResults = (data || []).map(msg => ({
        ...msg,
        sender_profile: profileMap.get(msg.sender_id)
      }));

      setResults(enrichedResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isSearching,
    error,
    searchMessages,
    clearSearch
  };
};
