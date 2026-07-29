import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { api, setToken, removeToken, getToken, API_BASE } from "@/integrations/api/client";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { username?: string; email?: string; password?: string }) => Promise<{ error: Error | null }>;
  updateAvatar: (file: File) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api.get<AuthUser>("/auth/me")
      .then(setUser)
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const data = await api.post<{ token: string; user: AuthUser }>("/auth/signup", { email, password, username });
      setToken(data.token);
      setUser(data.user);
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post<{ token: string; user: AuthUser }>("/auth/signin", { email, password });
      setToken(data.token);
      setUser(data.user);
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  const signOut = async () => {
    removeToken();
    setUser(null);
  };

  const updateProfile = async (data: { username?: string; email?: string; password?: string }) => {
    try {
      const updated = await api.put<AuthUser>("/auth/profile", data);
      setUser(updated);
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  const updateAvatar = async (file: File) => {
    try {
      const token = getToken();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/auth/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUser(prev => prev ? { ...prev, avatar_url: data.avatar_url } : prev);
      return { error: null };
    } catch (e) { return { error: e as Error }; }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
