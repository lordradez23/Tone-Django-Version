import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnlineUser {
  id: string;
  username: string;
}

export const useGlobalPresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch current user's username
    const initPresence = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      const username = profile?.username || 'Unknown';

      // Subscribe to global presence channel
      const channel = supabase.channel('global-presence', {
        config: { presence: { key: user.id } }
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
              });
            }
          });

          setOnlineUsers(online);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ username });
          }
        });

      channelRef.current = channel;
    };

    initPresence();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(u => u.id === userId);
  };

  return { onlineUsers, isUserOnline };
};
