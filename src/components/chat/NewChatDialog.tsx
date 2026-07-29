import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Users, Loader2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalPresence } from '@/hooks/useGlobalPresence';
import { api } from '@/integrations/api/client';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const NewChatDialog = ({ isOpen, onClose, onConversationCreated }: NewChatDialogProps) => {
  const { user } = useAuth();
  const { isUserOnline } = useGlobalPresence();
  const [mode, setMode] = useState<'select' | 'direct' | 'group'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim() || mode === 'select') { setUsers([]); return; }
    const debounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.get<Profile[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        setUsers(data);
      } catch { setUsers([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, mode]);

  const handleSelectUser = (profile: Profile) => {
    if (mode === 'direct') {
      // Create 1-on-1 conversation immediately
      createDirectChat(profile);
    } else {
      // Toggle selection for group
      if (selectedUsers.find(u => u.id === profile.id)) {
        setSelectedUsers(prev => prev.filter(u => u.id !== profile.id));
      } else {
        setSelectedUsers(prev => [...prev, profile]);
      }
    }
  };

  const createDirectChat = async (otherUser: Profile) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const conv = await api.post<{ id: string }>('/conversations', { is_group: false, member_ids: [otherUser.id] });
      onConversationCreated(conv.id);
      resetDialog();
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const createGroupChat = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) return;
    setIsLoading(true);
    try {
      const conv = await api.post<{ id: string }>('/conversations', {
        is_group: true,
        name: groupName.trim(),
        member_ids: selectedUsers.map(u => u.id),
      });
      onConversationCreated(conv.id);
      resetDialog();
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const resetDialog = () => {
    setMode('select');
    setSearchQuery('');
    setUsers([]);
    setSelectedUsers([]);
    setGroupName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetDialog}
          className="absolute inset-0 bg-black/60"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl sm:mx-4 max-h-[85vh] flex flex-col"
        >
          {/* Handle for mobile */}
          <div className="sm:hidden w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-3 md:p-4 border-b border-border flex-shrink-0">
            <h2 className="text-base md:text-lg font-semibold text-foreground">
              {mode === 'select' && 'New Chat'}
              {mode === 'direct' && 'Start a Chat'}
              {mode === 'group' && 'Create Group'}
            </h2>
            <button
              onClick={resetDialog}
              className="p-2 hover:bg-muted rounded-lg transition-colors active:bg-muted"
            >
              <X className="w-5 h-5 text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 md:p-4 overflow-y-auto flex-1">
            {mode === 'select' && (
              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={() => setMode('direct')}
                  className="w-full p-3 md:p-4 flex items-center gap-3 md:gap-4 bg-muted rounded-xl hover:bg-muted/80 active:bg-muted/70 transition-colors text-left"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-safe/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-safe" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm md:text-base">Direct Message</p>
                    <p className="text-secondary text-xs md:text-sm">Chat with one person</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('group')}
                  className="w-full p-3 md:p-4 flex items-center gap-3 md:gap-4 bg-muted rounded-xl hover:bg-muted/80 active:bg-muted/70 transition-colors text-left"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-safe/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-safe" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm md:text-base">Group Chat</p>
                    <p className="text-secondary text-xs md:text-sm">Create a group with multiple people</p>
                  </div>
                </button>
              </div>
            )}

            {(mode === 'direct' || mode === 'group') && (
              <div className="space-y-3 md:space-y-4">
                {mode === 'group' && (
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-foreground text-sm">Group Name</Label>
                    <Input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name..."
                      className="h-10 md:h-11 text-sm"
                    />
                  </div>
                )}

                {mode === 'group' && selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {selectedUsers.map(u => (
                      <div
                        key={u.id}
                        className="flex items-center gap-1.5 md:gap-2 bg-safe/10 text-safe px-2 md:px-3 py-1 rounded-full"
                      >
                        <span className="text-xs md:text-sm">{u.username}</span>
                        <button
                          onClick={() => setSelectedUsers(prev => prev.filter(p => p.id !== u.id))}
                          className="hover:text-safe/70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-foreground text-sm">
                    {mode === 'direct' ? 'Search for a user' : 'Add members'}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by username..."
                      className="pl-10 h-10 md:h-11 text-sm"
                    />
                  </div>
                </div>

                {/* Search results */}
                <div className="max-h-48 md:max-h-60 overflow-y-auto scrollbar-thin">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 text-secondary animate-spin" />
                    </div>
                  ) : users.length > 0 ? (
                    <div className="space-y-1.5 md:space-y-2">
                      {users.map(profile => {
                        const isSelected = selectedUsers.find(u => u.id === profile.id);
                        return (
                          <button
                            key={profile.id}
                            onClick={() => handleSelectUser(profile)}
                            disabled={isLoading}
                            className={`w-full p-2.5 md:p-3 flex items-center gap-2.5 md:gap-3 rounded-lg transition-colors text-left active:bg-muted ${
                              isSelected ? 'bg-safe/10' : 'hover:bg-muted'
                            }`}
                          >
                            <div className="relative w-9 h-9 md:w-10 md:h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-foreground font-medium text-sm">
                                {profile.username.charAt(0).toUpperCase()}
                              </span>
                              {/* Online status indicator */}
                              <span 
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                                  isUserOnline(profile.id) ? 'bg-safe' : 'bg-secondary'
                                }`} 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-foreground text-sm md:text-base truncate block">{profile.username}</span>
                              <span className={`text-xs ${isUserOnline(profile.id) ? 'text-safe' : 'text-secondary'}`}>
                                {isUserOnline(profile.id) ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            {mode === 'group' && isSelected && (
                              <Check className="w-4 h-4 md:w-5 md:h-5 text-safe flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : searchQuery && (
                    <p className="text-center text-secondary py-4 text-sm">No users found</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 md:gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setMode('select')}
                    className="flex-1 h-10 md:h-11 text-sm"
                  >
                    Back
                  </Button>
                  {mode === 'group' && (
                    <Button
                      onClick={createGroupChat}
                      disabled={isLoading || !groupName.trim() || selectedUsers.length === 0}
                      className="flex-1 bg-safe text-foreground hover:bg-safe/90 h-10 md:h-11 text-sm"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
