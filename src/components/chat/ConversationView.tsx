import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Menu, ArrowLeft, Pencil, X, Check, Trash2, Paperclip, Search, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/integrations/api/client';
import { socket } from '@/integrations/api/socket';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { SuggestionCard } from '@/components/SuggestionCard';
import { useAnalyze } from '@/hooks/useAnalyze';
import { AnalysisResult } from '@/types/chat';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useNotifications } from '@/hooks/useNotifications';
import { MessageAttachment } from '@/components/chat/MessageAttachment';
import { SearchMessages } from '@/components/chat/SearchMessages';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  toxicity_score: number | null;
  toxicity_label: string | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  sender_profile?: { username: string; avatar_url: string | null };
}

interface TypingUser { id: string; username: string; }
interface OnlineUser { id: string; username: string; }

interface ConversationViewProps {
  conversationId: string;
  onClose: () => void;
}

export const ConversationView = ({ conversationId, onClose }: ConversationViewProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [conversationName, setConversationName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const sentMessageIds = useRef<Set<string>>(new Set());

  const { analysis, isAnalyzing, analyze, reset } = useAnalyze(800);
  const { uploadFile, isUploading } = useFileUpload();
  const { permission, requestPermission, showNotification, isSupported } = useNotifications();

  const handleSelectMessage = useCallback((messageId: string) => {
    setShowSearch(false);
    setHighlightedMessageId(messageId);
    const el = messageRefsMap.current.get(messageId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedMessageId(null), 2000);
  }, []);

  const markAsRead = useCallback(async () => {
    await api.post(`/conversations/${conversationId}/read`, {});
  }, [conversationId]);

  // Fetch messages + conversation name
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get<Message[]>(`/messages/conversation/${conversationId}`),
      api.get<Array<{ id: string; name: string | null; is_group: boolean; other_user?: { username: string } }>>('/conversations'),
    ]).then(([msgs, convs]) => {
      setMessages(msgs);
      const conv = convs.find(c => c.id === conversationId);
      if (conv) {
        setConversationName(conv.is_group ? (conv.name || 'Group Chat') : (conv.other_user?.username || 'Unknown'));
      }
    }).catch(console.error)
      .finally(() => { setIsLoading(false); markAsRead(); });
  }, [conversationId, markAsRead]);

  // Socket.IO realtime
  useEffect(() => {
    if (!user) return;

    socket.emit('join', { user_id: user.id, username: user.username, conversation_id: conversationId });

    const onNewMessage = async (msg: Message) => {
      // Skip if sender already appended this message optimistically
      if (sentMessageIds.current.has(msg.id)) {
        sentMessageIds.current.delete(msg.id);
        return;
      }
      setMessages(prev => [...prev, msg]);
      if (msg.sender_id !== user.id) {
        showNotification(`New message from ${msg.sender_profile?.username || 'Someone'}`, {
          body: msg.content.substring(0, 100),
          tag: `message-${msg.id}`,
        });
      }
      markAsRead();
    };

    const onUpdated = (msg: Message) =>
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: msg.content } : m));

    const onDeleted = ({ id }: { id: string }) =>
      setMessages(prev => prev.filter(m => m.id !== id));

    const onTyping = (data: { user_id: string; username: string }) => {
      setTypingUsers(prev => prev.find(u => u.id === data.user_id) ? prev : [...prev, { id: data.user_id, username: data.username }]);
    };

    const onStopTyping = (data: { user_id: string }) =>
      setTypingUsers(prev => prev.filter(u => u.id !== data.user_id));

    const onOnlineUsers = (users: OnlineUser[]) => setOnlineUsers(users);

    socket.on('new_message', onNewMessage);
    socket.on('message_updated', onUpdated);
    socket.on('message_deleted', onDeleted);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);
    socket.on('online_users', onOnlineUsers);

    return () => {
      socket.emit('leave', { conversation_id: conversationId });
      socket.off('new_message', onNewMessage);
      socket.off('message_updated', onUpdated);
      socket.off('message_deleted', onDeleted);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
      socket.off('online_users', onOnlineUsers);
    };
  }, [conversationId, user, markAsRead, showNotification]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { analyze(inputValue); }, [inputValue, analyze]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputValue]);

  const handleTyping = useCallback(() => {
    if (!user) return;
    socket.emit('typing', { conversation_id: conversationId, user_id: user.id, username: user.username });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversation_id: conversationId, user_id: user.id });
    }, 2000);
  }, [conversationId, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    handleTyping();
  };

  const sendMessage = async (content: string, messageAnalysis: AnalysisResult | null, attachment?: { url: string; name: string; type: string }) => {
    if (!user) return;
    socket.emit('stop_typing', { conversation_id: conversationId, user_id: user.id });

    // Optimistic append for sender
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      content: content || (attachment ? `📎 ${attachment.name}` : ''),
      sender_id: user.id,
      toxicity_score: null,
      toxicity_label: messageAnalysis?.toxicity.label || 'safe',
      created_at: new Date().toISOString(),
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      sender_profile: { username: user.username, avatar_url: user.avatar_url || null },
    };
    setMessages(prev => [...prev, optimistic]);
    setInputValue('');
    setSelectedFile(null);
    reset();

    try {
      const saved = await api.post<Message>(`/messages/conversation/${conversationId}`, {
        content: optimistic.content,
        toxicity_score: messageAnalysis?.toxicity.confidence || null,
        toxicity_label: messageAnalysis?.toxicity.label || 'safe',
        is_flagged: messageAnalysis?.toxicity.label === 'toxic',
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null,
      });
      // Track real ID so socket dedup skips it, then replace temp with real
      sentMessageIds.current.add(saved.id);
      setMessages(prev => prev.map(m => m.id === tempId ? saved : m));
    } catch {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleSendWithAttachment = async () => {
    if (!inputValue.trim() && !selectedFile) return;
    let attachment: { url: string; name: string; type: string } | undefined;
    if (selectedFile) {
      const result = await uploadFile(selectedFile);
      if (!result) return;
      attachment = result;
    }
    if (inputValue.trim() && analysis?.toxicity.label === 'toxic' && analysis.rephrase) {
      setPendingMessage(inputValue);
      setShowSuggestion(true);
      return;
    }
    sendMessage(inputValue, analysis, attachment);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendWithAttachment(); }
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return;
    setIsSavingEdit(true);
    await api.put(`/messages/${editingMessageId}`, { content: editingContent.trim() });
    setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, content: editingContent.trim() } : m));
    setIsSavingEdit(false);
    setEditingMessageId(null);
    setEditingContent('');
  };

  const deleteMessage = async () => {
    if (!deleteMessageId) return;
    setIsDeleting(true);
    await api.delete(`/messages/${deleteMessageId}`);
    setMessages(prev => prev.filter(m => m.id !== deleteMessageId));
    setIsDeleting(false);
    setDeleteMessageId(null);
  };

  const getButtonVariant = (): 'default' | 'safe' | 'warning' | 'toxic' => {
    if (!analysis || !inputValue.trim()) return 'default';
    return analysis.toxicity.label as 'safe' | 'warning' | 'toxic';
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0].username} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`;
  };

  const isUserOnline = (userId: string) => onlineUsers.some(u => u.id === userId);

  return (
    <div className="flex h-full w-full max-h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm flex-shrink-0 relative">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button onClick={onClose} className="flex items-center justify-center w-9 h-9 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-foreground font-semibold text-sm md:text-base truncate leading-tight">{conversationName}</h1>
              <AnimatePresence mode="wait">
                {typingUsers.length > 0 ? (
                  <motion.p key="typing" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-safe text-xs leading-tight">
                    {getTypingText()}
                  </motion.p>
                ) : (
                  <motion.div key="protected" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="flex items-center gap-2">
                    {onlineUsers.length > 1 ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                        <span className="text-safe text-xs leading-tight">{onlineUsers.length} online</span>
                      </span>
                    ) : (
                      <span className="text-secondary text-xs leading-tight">Tone Protected</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setShowSearch(!showSearch)} className={`flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors ${showSearch ? 'bg-muted' : ''}`}>
              <Search className="w-5 h-5 text-foreground" />
            </button>
            {isSupported && (
              <button onClick={permission === 'granted' ? undefined : requestPermission} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors">
                {permission === 'granted' ? <Bell className="w-5 h-5 text-safe" /> : <BellOff className="w-5 h-5 text-secondary" />}
              </button>
            )}
            <button onClick={() => setShowMobilePanel(!showMobilePanel)} className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <AnimatePresence>
            {showSearch && <SearchMessages conversationId={conversationId} onSelectMessage={handleSelectMessage} onClose={() => setShowSearch(false)} />}
          </AnimatePresence>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 scrollbar-thin min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-secondary animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center px-4">
              <div>
                <p className="text-secondary mb-2 text-sm">No messages yet</p>
                <p className="text-muted-foreground text-xs">Start the conversation below</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                ref={(el) => { if (el) messageRefsMap.current.set(message.id, el); else messageRefsMap.current.delete(message.id); }}
                className={`mb-3 md:mb-4 flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-3 md:px-4 py-2 md:py-3 rounded-2xl relative transition-colors duration-300 ${
                  highlightedMessageId === message.id ? 'ring-2 ring-ring' : ''
                } ${
                  message.sender_id === user?.id ? 'bg-[hsl(var(--bubble-user))] rounded-br-sm' : 'bg-[hsl(var(--bubble-ai))] rounded-bl-sm'
                }`}>
                  {message.sender_id !== user?.id && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isUserOnline(message.sender_id) ? 'bg-safe' : 'bg-secondary'}`} />
                      <p className="text-xs text-safe font-medium">{message.sender_profile?.username || 'Unknown'}</p>
                    </div>
                  )}
                  {editingMessageId === message.id ? (
                    <div className="flex items-center gap-2">
                      <input ref={editInputRef} type="text" value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditingMessageId(null); setEditingContent(''); } }}
                        className="flex-1 bg-background/50 border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                      <button onClick={saveEdit} disabled={isSavingEdit} className="p-1 text-safe hover:text-safe/80">
                        {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditingMessageId(null); setEditingContent(''); }} className="p-1 text-secondary hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-foreground text-sm md:text-base break-words">{message.content}</p>
                      {message.attachment_url && message.attachment_name && message.attachment_type && (
                        <MessageAttachment url={message.attachment_url} name={message.attachment_name} type={message.attachment_type} />
                      )}
                      {message.sender_id === user?.id && (
                        <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingMessageId(message.id); setEditingContent(message.content); setTimeout(() => editInputRef.current?.focus(), 50); }}
                            className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-secondary" />
                          </button>
                          <button onClick={() => setDeleteMessageId(message.id)} className="p-1.5 rounded-full bg-muted hover:bg-destructive/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  <p className="text-xs text-secondary mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-card/30 flex-shrink-0">
          {selectedFile && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg max-w-4xl mx-auto">
              <Paperclip className="w-4 h-4 text-secondary flex-shrink-0" />
              <span className="text-sm text-foreground flex-1 truncate">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="flex items-center justify-center w-6 h-6 hover:bg-background rounded flex-shrink-0">
                <X className="w-4 h-4 text-secondary" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <input ref={fileInputRef} type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }}
              className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors flex-shrink-0">
              <Paperclip className="w-5 h-5 text-secondary" />
            </button>
            <div className="flex-1 relative min-w-0">
              <textarea ref={textareaRef} value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
                placeholder="Type a message..." rows={1}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 pr-10 text-foreground placeholder:text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm md:text-base max-h-24" />
              {(isAnalyzing || isUploading) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                </div>
              )}
            </div>
            <motion.div whileTap={{ scale: 0.95 }} className="flex-shrink-0">
              <Button onClick={handleSendWithAttachment} disabled={(!inputValue.trim() && !selectedFile) || isUploading}
                variant={getButtonVariant()} size="icon" className="h-10 w-10 rounded-full transition-all duration-300">
                {isUploading ? <Loader2 className="w-4 h-4 text-foreground animate-spin" /> : <Send className="w-4 h-4 text-foreground" />}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Analysis Panel - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-72 xl:w-80 border-l border-border bg-card/30 flex-shrink-0 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <AnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} onSelectAlternative={(text) => setInputValue(text)} />
        </div>
      </aside>

      {/* Analysis Panel - Mobile */}
      <AnimatePresence>
        {showMobilePanel && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="lg:hidden fixed inset-x-0 bottom-0 h-[50vh] bg-card border-t border-border z-30 rounded-t-2xl shadow-lg">
            <button onClick={() => setShowMobilePanel(false)} className="w-full py-2 flex justify-center">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </button>
            <div className="h-[calc(50vh-2rem)] overflow-y-auto">
              <AnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} onSelectAlternative={(text) => { setInputValue(text); setShowMobilePanel(false); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SuggestionCard isOpen={showSuggestion} originalMessage={pendingMessage} analysis={analysis}
        onUseSuggestion={(s) => { setShowSuggestion(false); setInputValue(s); setPendingMessage(''); }}
        onEdit={() => { setShowSuggestion(false); setPendingMessage(''); textareaRef.current?.focus(); }}
        onSendAnyway={() => { setShowSuggestion(false); sendMessage(pendingMessage, analysis); setPendingMessage(''); }}
        onClose={() => setShowSuggestion(false)} />

      <AlertDialog open={!!deleteMessageId} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMessage} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
