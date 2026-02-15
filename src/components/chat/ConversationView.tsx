import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Menu, ArrowLeft, Pencil, X, Check, Trash2, Paperclip, Search, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { SuggestionCard } from '@/components/SuggestionCard';
import { useAnalyze } from '@/hooks/useAnalyze';
import { AnalysisResult } from '@/types/chat';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useNotifications } from '@/hooks/useNotifications';
import { MessageAttachment } from '@/components/chat/MessageAttachment';
import { SearchMessages } from '@/components/chat/SearchMessages';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  toxicity_score: number | null;
  toxicity_label: string | null;
  created_at: string;
  updated_at?: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  sender_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface TypingUser {
  id: string;
  username: string;
}

interface OnlineUser {
  id: string;
  username: string;
  isOnline: boolean;
}

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
  const [currentUsername, setCurrentUsername] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const onlineChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { analysis, isAnalyzing, analyze, reset } = useAnalyze(800);
  const { uploadFile, isUploading } = useFileUpload();
  const { permission, requestPermission, showNotification, isSupported } = useNotifications();

  // Mark conversation as read
  const markAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  }, [conversationId, user]);

  // Fetch current user's username
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (profile) setCurrentUsername(profile.username);
    };
    fetchUsername();
  }, [user]);

  // Setup typing presence channel
  useEffect(() => {
    if (!user || !conversationId || !currentUsername) return;

    const channel = supabase.channel(`typing-${conversationId}`, {
      config: {
        presence: { key: user.id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing: TypingUser[] = [];

        Object.entries(state).forEach(([userId, presences]) => {
          if (userId !== user.id && Array.isArray(presences) && presences.length > 0) {
            const presence = presences[0] as { username?: string; isTyping?: boolean };
            if (presence.isTyping) {
              typing.push({ id: userId, username: presence.username || 'Someone' });
            }
          }
        });

        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ username: currentUsername, isTyping: false });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [user, conversationId, currentUsername]);

  // Setup online/offline presence channel
  useEffect(() => {
    if (!user || !conversationId || !currentUsername) return;

    const channel = supabase.channel(`online-${conversationId}`, {
      config: {
        presence: { key: user.id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online: OnlineUser[] = [];

        Object.entries(state).forEach(([userId, presences]) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const presence = presences[0] as { username?: string };
            online.push({
              id: userId,
              username: presence.username || 'Unknown',
              isOnline: true
            });
          }
        });

        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ username: currentUsername });
        }
      });

    onlineChannelRef.current = channel;

    return () => {
      if (onlineChannelRef.current) {
        supabase.removeChannel(onlineChannelRef.current);
        onlineChannelRef.current = null;
      }
    };
  }, [user, conversationId, currentUsername]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!presenceChannelRef.current || !currentUsername) return;

    presenceChannelRef.current.track({ username: currentUsername, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({ username: currentUsername, isTyping: false });
      }
    }, 2000);
  }, [currentUsername]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);

      // Get conversation info
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convData) {
        if (convData.is_group) {
          setConversationName(convData.name || 'Group Chat');
        } else {
          // Get other user's name for 1-on-1
          const { data: members } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', user?.id);

          if (members?.length) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', members[0].user_id)
              .single();

            setConversationName(profile?.username || 'Unknown');
          }
        }
      }

      // Fetch messages
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
        return;
      }

      // Get sender profiles
      const senderIds = [...new Set((messagesData || []).map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedMessages = (messagesData || []).map(msg => ({
        ...msg,
        sender_profile: profileMap.get(msg.sender_id),
      }));

      setMessages(enrichedMessages);
      setIsLoading(false);

      // Mark as read when viewing
      markAsRead();
    };

    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages(prev => [...prev, {
            ...newMessage,
            sender_profile: profile || undefined,
          }]);

          // Show notification for messages from others
          if (newMessage.sender_id !== user?.id) {
            showNotification(`New message from ${profile?.username || 'Someone'}`, {
              body: newMessage.content.substring(0, 100),
              tag: `message-${newMessage.id}`
            });
          }

          // Mark as read when new message arrives
          markAsRead();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => prev.map(msg =>
            msg.id === updatedMessage.id
              ? { ...msg, content: updatedMessage.content }
              : msg
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const deletedMessage = payload.old as { id: string };
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, markAsRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Analyze as user types
  useEffect(() => {
    analyze(inputValue);
  }, [inputValue, analyze]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputValue]);

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    handleTyping();
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Check if message is toxic and should show suggestion
    if (analysis?.toxicity.label === 'toxic' && analysis.rephrase) {
      setPendingMessage(inputValue);
      setShowSuggestion(true);
      return;
    }

    sendMessage(inputValue, analysis);
  };

  const sendMessage = async (content: string, messageAnalysis: AnalysisResult | null, attachment?: { url: string; name: string; type: string }) => {
    if (!user) return;

    // Clear typing indicator when sending
    if (presenceChannelRef.current && currentUsername) {
      presenceChannelRef.current.track({ username: currentUsername, isTyping: false });
    }

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || (attachment ? `📎 ${attachment.name}` : ''),
      toxicity_score: messageAnalysis?.toxicity.confidence || null,
      toxicity_label: messageAnalysis?.toxicity.label || 'safe',
      is_flagged: messageAnalysis?.toxicity.label === 'toxic',
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
    });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    setInputValue('');
    setSelectedFile(null);
    reset();
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle send with optional attachment
  const handleSendWithAttachment = async () => {
    if (!inputValue.trim() && !selectedFile) return;

    let attachment: { url: string; name: string; type: string } | undefined;

    if (selectedFile) {
      const result = await uploadFile(selectedFile);
      if (result) {
        attachment = result;
      } else {
        return; // Upload failed
      }
    }

    // Check if message is toxic and should show suggestion
    if (inputValue.trim() && analysis?.toxicity.label === 'toxic' && analysis.rephrase) {
      setPendingMessage(inputValue);
      setShowSuggestion(true);
      return;
    }

    sendMessage(inputValue, analysis, attachment);
  };

  const handleUseSuggestion = (suggestion: string) => {
    setShowSuggestion(false);
    setInputValue(suggestion);
    setPendingMessage('');
  };

  const handleEdit = () => {
    setShowSuggestion(false);
    setPendingMessage('');
    textareaRef.current?.focus();
  };

  const handleSendAnyway = () => {
    setShowSuggestion(false);
    sendMessage(pendingMessage, analysis);
    setPendingMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithAttachment();
    }
  };

  const getButtonVariant = (): 'default' | 'safe' | 'warning' | 'toxic' => {
    if (!analysis || !inputValue.trim()) return 'default';
    return analysis.toxicity.label;
  };

  // Message editing handlers
  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return;

    setIsSavingEdit(true);
    const { error } = await supabase
      .from('messages')
      .update({ content: editingContent.trim() })
      .eq('id', editingMessageId)
      .eq('sender_id', user?.id);

    if (error) {
      console.error('Error updating message:', error);
    } else {
      setMessages(prev => prev.map(msg =>
        msg.id === editingMessageId
          ? { ...msg, content: editingContent.trim() }
          : msg
      ));
    }

    setIsSavingEdit(false);
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Message deletion handler
  const deleteMessage = async () => {
    if (!deleteMessageId || !user) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', deleteMessageId)
      .eq('sender_id', user.id);

    if (error) {
      console.error('Error deleting message:', error);
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== deleteMessageId));
    }

    setIsDeleting(false);
    setDeleteMessageId(null);
  };

  // Check if user is online
  const isUserOnline = (userId: string) => {
    return onlineUsers.some(u => u.id === userId);
  };

  // Get typing indicator text
  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0].username} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`;
  };

  // Get online count text
  const getOnlineText = () => {
    const count = onlineUsers.length;
    if (count <= 1) return 'Tone Protected';
    return `${count} online`;
  };

  return (
    <div className="flex h-full w-full max-h-full overflow-hidden">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm flex-shrink-0 relative">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 hover:bg-muted rounded-lg transition-colors flex-shrink-0 active:bg-muted"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-foreground font-semibold text-sm md:text-base truncate leading-tight">{conversationName}</h1>
              <AnimatePresence mode="wait">
                {typingUsers.length > 0 ? (
                  <motion.p
                    key="typing"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-safe text-xs leading-tight"
                  >
                    {getTypingText()}
                  </motion.p>
                ) : (
                  <motion.div
                    key="protected"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-center gap-2"
                  >
                    {onlineUsers.length > 1 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                        <span className="text-safe text-xs leading-tight">{getOnlineText()}</span>
                      </span>
                    )}
                    {onlineUsers.length <= 1 && (
                      <span className="text-secondary text-xs leading-tight">Tone Protected</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Search button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors ${showSearch ? 'bg-muted' : ''}`}
              title="Search messages"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>

            {/* Notification toggle */}
            {isSupported && (
              <button
                onClick={permission === 'granted' ? undefined : requestPermission}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
                title={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
              >
                {permission === 'granted' ? (
                  <Bell className="w-5 h-5 text-safe" />
                ) : (
                  <BellOff className="w-5 h-5 text-secondary" />
                )}
              </button>
            )}

            <button
              onClick={() => setShowMobilePanel(!showMobilePanel)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors flex-shrink-0 active:bg-muted"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Search Panel */}
          <AnimatePresence>
            {showSearch && (
              <SearchMessages
                conversationId={conversationId}
                onClose={() => setShowSearch(false)}
              />
            )}
          </AnimatePresence>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 scrollbar-thin min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-secondary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center px-4">
              <div>
                <p className="text-secondary mb-2 text-sm md:text-base">No messages yet</p>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Start the conversation by sending a message below
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 md:mb-4 flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-3 md:px-4 py-2 md:py-3 rounded-2xl relative ${message.sender_id === user?.id
                      ? 'bg-[hsl(var(--bubble-user))] rounded-br-sm'
                      : 'bg-[hsl(var(--bubble-ai))] rounded-bl-sm'
                    }`}
                >
                  {message.sender_id !== user?.id && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isUserOnline(message.sender_id) ? 'bg-safe' : 'bg-secondary'}`} />
                      <p className="text-xs text-safe font-medium">
                        {message.sender_profile?.username || 'Unknown'}
                      </p>
                    </div>
                  )}

                  {/* Editing mode */}
                  {editingMessageId === message.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="flex-1 bg-background/50 border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={saveEdit}
                        disabled={isSavingEdit}
                        className="p-1 text-safe hover:text-safe/80 transition-colors"
                      >
                        {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-secondary hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-foreground text-sm md:text-base break-words">{message.content}</p>

                      {/* Attachment display */}
                      {message.attachment_url && message.attachment_name && message.attachment_type && (
                        <MessageAttachment
                          url={message.attachment_url}
                          name={message.attachment_name}
                          type={message.attachment_type}
                        />
                      )}

                      {/* Edit and Delete buttons for own messages */}
                      {message.sender_id === user?.id && (
                        <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(message)}
                            className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                            title="Edit message"
                          >
                            <Pencil className="w-3.5 h-3.5 text-secondary" />
                          </button>
                          <button
                            onClick={() => setDeleteMessageId(message.id)}
                            className="p-1.5 rounded-full bg-muted hover:bg-destructive/20 transition-colors"
                            title="Delete message"
                          >
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
          {/* Selected file preview */}
          {selectedFile && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg max-w-4xl mx-auto">
              <Paperclip className="w-4 h-4 text-secondary flex-shrink-0" />
              <span className="text-sm text-foreground flex-1 truncate">{selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="flex items-center justify-center w-6 h-6 hover:bg-background rounded flex-shrink-0"
              >
                <X className="w-4 h-4 text-secondary" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            {/* File upload button */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors flex-shrink-0"
              title="Attach file"
              disabled={isUploading}
            >
              <Paperclip className="w-5 h-5 text-secondary" />
            </button>

            <div className="flex-1 relative min-w-0">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 pr-10 text-foreground placeholder:text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm md:text-base max-h-24"
              />
              {(isAnalyzing || isUploading) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                </div>
              )}
            </div>
            <motion.div whileTap={{ scale: 0.95 }} className="flex-shrink-0">
              <Button
                onClick={handleSendWithAttachment}
                disabled={(!inputValue.trim() && !selectedFile) || isUploading}
                variant={getButtonVariant()}
                size="icon"
                className="h-10 w-10 rounded-full transition-all duration-300"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 text-foreground animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-foreground" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Analysis Panel - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-72 xl:w-80 border-l border-border bg-card/30 flex-shrink-0 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <AnalysisPanel
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onSelectAlternative={(text) => setInputValue(text)}
          />
        </div>
      </aside>

      {/* Analysis Panel - Mobile */}
      <AnimatePresence>
        {showMobilePanel && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="lg:hidden fixed inset-x-0 bottom-0 h-[50vh] bg-card border-t border-border z-30 rounded-t-2xl shadow-lg"
          >
            <button
              onClick={() => setShowMobilePanel(false)}
              className="w-full py-2 flex justify-center"
            >
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </button>
            <div className="h-[calc(50vh-2rem)] overflow-y-auto">
              <AnalysisPanel
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                onSelectAlternative={(text) => {
                  setInputValue(text);
                  setShowMobilePanel(false);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion Popup */}
      <SuggestionCard
        isOpen={showSuggestion}
        originalMessage={pendingMessage}
        analysis={analysis}
        onUseSuggestion={handleUseSuggestion}
        onEdit={handleEdit}
        onSendAnyway={handleSendAnyway}
        onClose={() => setShowSuggestion(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMessage}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
