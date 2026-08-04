import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { socket } from "@/integrations/api/socket";

interface OnlineUser { id: string; username: string; status: string; }

export const useGlobalPresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const joined = useRef(false);

  useEffect(() => {
    if (!user || joined.current) return;
    joined.current = true;

    socket.connect();
    socket.emit("join", { user_id: user.id, username: user.username });
    socket.on("online_users", (users: OnlineUser[]) => setOnlineUsers(users));

    return () => {
      socket.off("online_users");
      joined.current = false;
    };
  }, [user]);

  const isUserOnline = (userId: string) => onlineUsers.some((u) => u.id === userId);
  return { onlineUsers, isUserOnline };
};
