import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Users, LogOut, Search, Loader2, PanelLeftClose, PanelLeft, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalPresence } from '@/hooks/useGlobalPresence';
import { supabase } from '@/integrations/supabase/client';
import { ConversationView } from '@/components/chat/ConversationView';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { Helmet } from 'react-helmet-async';

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  has_unread?: boolean;
  other_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

const Tone = () => {
  const { user, loading, signOut } = useAuth();
  const { onlineUsers } = useGlobalPresence();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-show sidebar on desktop, auto-hide on mobile when conversation selected
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setIsLoadingConversations(true);

      const { data: memberData, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (memberError || !memberData?.length) {
        setIsLoadingConversations(false);
        return;
      }

      const conversationIds = memberData.map(m => m.conversation_id);

      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convError) {
        console.error('Error fetching conversations:', convError);
        setIsLoadingConversations(false);
        return;
      }

      // Fetch last message and last_read_at for each conversation
      const lastMessages = await Promise.all(
        conversationIds.map(async (convId) => {
          const { data } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          return { convId, lastMessage: data?.content || null, lastMessageAt: data?.created_at || null };
        })
      );
      const lastMessageMap = new Map(lastMessages.map(lm => [lm.convId, { content: lm.lastMessage, at: lm.lastMessageAt }]));

      // Get last_read_at for unread indicators
      const { data: membershipData } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      const lastReadMap = new Map(membershipData?.map(m => [m.conversation_id, m.last_read_at]) || []);

      // For 1-on-1 chats, get the other user's info
      const enhancedConversations = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const lastMsg = lastMessageMap.get(conv.id);
          const lastReadAt = lastReadMap.get(conv.id);
          const hasUnread = lastMsg?.at && lastReadAt ? new Date(lastMsg.at) > new Date(lastReadAt) : false;

          if (!conv.is_group) {
            const { data: members } = await supabase
              .from('conversation_members')
              .select('user_id')
              .eq('conversation_id', conv.id)
              .neq('user_id', user.id);

            if (members?.length) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .eq('id', members[0].user_id)
                .single();

              return {
                ...conv,
                other_user: profile || undefined,
                last_message: lastMsg?.content || null,
                has_unread: hasUnread,
              };
            }
          }
          return { ...conv, last_message: lastMsg?.content || null, has_unread: hasUnread };
        })
      );

      setConversations(enhancedConversations);
      setIsLoadingConversations(false);
    };

    fetchConversations();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const refreshConversations = async () => {
    if (!user) return;

    const { data: memberData } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!memberData?.length) return;

    const conversationIds = memberData.map(m => m.conversation_id);

    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (!conversationsData) return;

    // Fetch last message for each conversation
    const lastMessages = await Promise.all(
      conversationIds.map(async (convId) => {
        const { data } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return { convId, lastMessage: data?.content || null, lastMessageAt: data?.created_at || null };
      })
    );
    const lastMessageMap = new Map(lastMessages.map(lm => [lm.convId, { content: lm.lastMessage, at: lm.lastMessageAt }]));

    // Get last_read_at for unread indicators
    const { data: membershipData } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    const lastReadMap = new Map(membershipData?.map(m => [m.conversation_id, m.last_read_at]) || []);

    // For 1-on-1 chats, get the other user's info
    const enhancedConversations = await Promise.all(
      conversationsData.map(async (conv) => {
        const lastMsg = lastMessageMap.get(conv.id);
        const lastReadAt = lastReadMap.get(conv.id);
        const hasUnread = lastMsg?.at && lastReadAt ? new Date(lastMsg.at) > new Date(lastReadAt) : false;

        if (!conv.is_group) {
          const { data: members } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id);

          if (members?.length) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', members[0].user_id)
              .single();

            return {
              ...conv,
              other_user: profile || undefined,
              last_message: lastMsg?.content || null,
              has_unread: hasUnread,
            };
          }
        }
        return { ...conv, last_message: lastMsg?.content || null, has_unread: hasUnread };
      })
    );

    setConversations(enhancedConversations);
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setIsNewChatOpen(false);
    if (isMobile) setIsSidebarOpen(false);
    refreshConversations();
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleBackToConversations = () => {
    if (isMobile) {
      setIsSidebarOpen(true);
      setSelectedConversation(null);
    } else {
      setSelectedConversation(null);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.is_group ? conv.name : conv.other_user?.username;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-safe animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Chat - Tone</title>
        <meta name="description" content="Chat safely with your friends on Tone" />
      </Helmet>

      <div className="h-dvh bg-background flex relative overflow-hidden">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && selectedConversation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/50 z-20 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: isMobile ? -320 : 0, opacity: isMobile ? 1 : 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? -320 : 0, opacity: isMobile ? 1 : 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`${isMobile
                  ? 'absolute left-0 top-0 bottom-0 z-30 w-[85vw] max-w-[320px]'
                  : 'relative w-80 lg:w-[320px]'
                } border-r border-border flex flex-col bg-card/95 backdrop-blur-sm`}
            >
              {/* Sidebar Header */}
              <div className="h-14 md:h-16 border-b border-border flex items-center justify-between px-3 md:px-4 flex-shrink-0">
                <h1 className="text-base md:text-lg font-semibold text-foreground">Tone</h1>
                <div className="flex items-center gap-1">
                  {!isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSidebarOpen(false)}
                      className="text-secondary hover:text-foreground h-9 w-9"
                      title="Collapse sidebar"
                    >
                      <PanelLeftClose className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="text-secondary hover:text-foreground h-9 w-9"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="p-3 md:p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 md:h-11 text-sm"
                  />
                </div>
              </div>

              {/* New Chat Button */}
              <div className="px-3 md:px-4 mb-2">
                <Button
                  onClick={() => setIsNewChatOpen(true)}
                  className="w-full bg-safe text-foreground hover:bg-safe/90 h-10 md:h-11 text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Online Users / Conversations Toggle */}
              <div className="px-3 md:px-4 mb-2">
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <button
                    onClick={() => setShowOnlineUsers(false)}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${!showOnlineUsers ? 'bg-card text-foreground shadow-sm' : 'text-secondary hover:text-foreground'
                      }`}
                  >
                    Chats
                  </button>
                  <button
                    onClick={() => setShowOnlineUsers(true)}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${showOnlineUsers ? 'bg-card text-foreground shadow-sm' : 'text-secondary hover:text-foreground'
                      }`}
                  >
                    <Circle className="w-2 h-2 fill-safe text-safe" />
                    Online ({onlineUsers.filter(u => u.id !== user?.id).length})
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {showOnlineUsers ? (
                  // Online Users List
                  <div className="px-1">
                    {onlineUsers.filter(u => u.id !== user?.id).length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <Circle className="w-10 h-10 md:w-12 md:h-12 text-muted mx-auto mb-3" />
                        <p className="text-secondary text-sm">No one else online</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          You're the only one here right now
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {onlineUsers
                          .filter(u => u.id !== user?.id)
                          .map((onlineUser) => (
                            <motion.button
                              key={onlineUser.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              onClick={() => setIsNewChatOpen(true)}
                              className="w-full p-3 md:p-4 flex items-center gap-3 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                            >
                              <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <span className="text-foreground font-medium text-sm md:text-base">
                                  {onlineUser.username.charAt(0).toUpperCase()}
                                </span>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-safe rounded-full border-2 border-card animate-pulse" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground font-medium text-sm md:text-base truncate">
                                  {onlineUser.username}
                                </p>
                                <p className="text-safe text-xs">Online now</p>
                              </div>
                            </motion.button>
                          ))}
                      </AnimatePresence>
                    )}
                  </div>
                ) : (
                  // Conversations List
                  <>
                    {isLoadingConversations ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-secondary animate-spin" />
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <MessageSquare className="w-10 h-10 md:w-12 md:h-12 text-muted mx-auto mb-3" />
                        <p className="text-secondary text-sm">No conversations yet</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Start a new chat to get going!
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {filteredConversations.map((conv) => {
                          const isOtherUserOnline = conv.other_user && onlineUsers.some(u => u.id === conv.other_user?.id);
                          return (
                            <motion.button
                              key={conv.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              onClick={() => handleSelectConversation(conv.id)}
                              className={`w-full p-3 md:p-4 flex items-center gap-3 hover:bg-muted/50 active:bg-muted transition-colors text-left ${selectedConversation === conv.id ? 'bg-muted' : ''
                                }`}
                            >
                              <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                {conv.is_group ? (
                                  <Users className="w-5 h-5 text-secondary" />
                                ) : (
                                  <span className="text-foreground font-medium text-sm md:text-base">
                                    {conv.other_user?.username?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                )}
                                {/* Online/Unread indicator */}
                                {conv.has_unread ? (
                                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-safe rounded-full border-2 border-card" />
                                ) : !conv.is_group && isOtherUserOnline ? (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-safe rounded-full border-2 border-card" />
                                ) : null}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`truncate text-sm md:text-base ${conv.has_unread ? 'text-foreground font-semibold' : 'text-foreground font-medium'}`}>
                                    {conv.is_group ? conv.name : conv.other_user?.username || 'Unknown'}
                                  </p>
                                  {!conv.is_group && isOtherUserOnline && (
                                    <span className="text-safe text-xs flex-shrink-0">●</span>
                                  )}
                                </div>
                                <p className={`text-xs md:text-sm truncate ${conv.has_unread ? 'text-foreground font-medium' : 'text-secondary'}`}>
                                  {conv.last_message || 'No messages yet'}
                                </p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <main className={`flex-1 flex flex-col min-w-0 ${isMobile && isSidebarOpen && !selectedConversation ? 'hidden' : ''}`}>
          {/* Header when sidebar is collapsed on desktop */}
          {!isMobile && !isSidebarOpen && (
            <div className="h-14 md:h-16 border-b border-border flex items-center px-4 bg-card/30 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-secondary hover:text-foreground h-9 w-9"
                title="Expand sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground ml-3">Tone</h1>
            </div>
          )}

          {/* Mobile header when no conversation selected */}
          {isMobile && !selectedConversation && !isSidebarOpen && (
            <div className="h-14 border-b border-border flex items-center px-4 bg-card/30 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-secondary hover:text-foreground h-9 w-9"
                title="Show conversations"
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-base font-semibold text-foreground ml-3">Tone</h1>
            </div>
          )}

          {selectedConversation ? (
            <ConversationView
              conversationId={selectedConversation}
              onClose={handleBackToConversations}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 md:w-16 md:h-16 text-muted mx-auto mb-4" />
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                  Select a conversation
                </h2>
                <p className="text-secondary text-sm md:text-base">
                  Choose a chat or start a new one
                </p>
                {isMobile && (
                  <Button
                    onClick={() => setIsSidebarOpen(true)}
                    className="mt-4 bg-safe text-foreground hover:bg-safe/90"
                  >
                    View Conversations
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* New Chat Dialog */}
        <NewChatDialog
          isOpen={isNewChatOpen}
          onClose={() => setIsNewChatOpen(false)}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </>
  );
};

export default Tone;
