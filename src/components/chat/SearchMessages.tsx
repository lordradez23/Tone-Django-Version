import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessageSearch } from '@/hooks/useMessageSearch';

interface SearchMessagesProps {
  conversationId?: string;
  onSelectMessage?: (messageId: string) => void;
  onClose: () => void;
}

export const SearchMessages = ({ conversationId, onSelectMessage, onClose }: SearchMessagesProps) => {
  const [query, setQuery] = useState('');
  const { results, isSearching, searchMessages, clearSearch } = useMessageSearch();

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        searchMessages(query, conversationId);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, conversationId, searchMessages, clearSearch]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute inset-x-0 top-full z-20 bg-card border border-border rounded-b-lg shadow-lg max-h-80 overflow-hidden"
    >
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-muted border border-border rounded-lg pl-10 pr-10 py-2 text-sm text-foreground placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary animate-spin" />
          ) : query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
            >
              <X className="w-4 h-4 text-secondary" />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {results.length === 0 && query.trim() && !isSearching ? (
          <div className="p-4 text-center text-secondary text-sm">
            No messages found
          </div>
        ) : (
          results.map((result) => (
            <button
              key={result.id}
              onClick={() => onSelectMessage?.(result.id)}
              className="w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-safe font-medium">
                  {result.sender_profile?.username || 'Unknown'}
                </span>
                <span className="text-xs text-secondary">
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-foreground line-clamp-2">{result.content}</p>
            </button>
          ))
        )}
      </div>

      <div className="p-2 border-t border-border">
        <button
          onClick={onClose}
          className="w-full py-1.5 text-sm text-secondary hover:text-foreground transition-colors"
        >
          Close Search
        </button>
      </div>
    </motion.div>
  );
};
